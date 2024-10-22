'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';

interface HtmlPreviewProps {
  htmlContent: string | null;
  onVerifyElement: (verifyFn: (selector: string) => Promise<boolean>) => void;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ htmlContent, onVerifyElement }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Função auxiliar para converter caminhos relativos em absolutos
  const convertToAbsolutePath = (path: string): string => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Remover './' do início do caminho, se presente
    const cleanPath = path.replace(/^\.\//, '');
    // Lidar com caminhos que começam com '../'
    const upDirCount = (cleanPath.match(/\.\.\//g) || []).length;
    const pathParts = cleanPath.split('/').filter(part => part !== '..');
    const currentPathParts = window.location.pathname.split('/').filter(Boolean);
    const newPathParts = [...currentPathParts.slice(0, -upDirCount), ...pathParts];
    return `${window.location.origin}/${newPathParts.join('/')}`;
  };

  const sanitizeHtml = (html: string): { sanitizedHtml: string; extractedCss: string } => {
    // Remove todos os scripts
    const withoutScripts = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Extrai e sanitiza o CSS
    const cssLinks = withoutScripts.match(/<link[^>]+rel="stylesheet"[^>]*>/g) || [];
    const extractedCss = cssLinks.map(link => {
      const hrefMatch = link.match(/href="([^"]+)"/);
      if (hrefMatch) {
        const absolutePath = convertToAbsolutePath(hrefMatch[1]);
        return `@import url('${absolutePath}');`;
      }
      return '';
    }).join('\n');

    // Configuração personalizada do DOMPurify
    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.attrName.startsWith('ng-') || data.attrName === 'onblur') {
        data.allowedAttributes[data.attrName] = true;
      }
    });

    // Use DOMPurify para limpar o HTML
    const clean = DOMPurify.sanitize(withoutScripts, {
      FORBID_TAGS: ['script'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ADD_TAGS: ['link'],
      ADD_ATTR: ['href', 'rel', 'type', 'class', 'id', 'style', 'ng-*', 'onblur'],
      ALLOW_DATA_ATTR: true,
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ALLOW_ARIA_ATTR: true,
      WHOLE_DOCUMENT: true,
      KEEP_CONTENT: true,
      RETURN_DOM: true,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
    });

    // Converter o DOM limpo de volta para string, preservando a ordem dos atributos
    const serializer = new XMLSerializer();
    let cleanHtml = serializer.serializeToString(clean);

    // Substitui os caminhos das imagens por caminhos absolutos
    cleanHtml = cleanHtml.replace(/<img[^>]+src="([^"]+)"[^>]*>/g, (match, src) => {
      const absoluteSrc = convertToAbsolutePath(src);
      return match.replace(src, absoluteSrc);
    });

    // Remove o hook personalizado para evitar efeitos colaterais em futuras chamadas
    DOMPurify.removeHook('uponSanitizeAttribute');

    return { sanitizedHtml: cleanHtml, extractedCss };
  };

  const verifyElement = useCallback(async (selector: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('Timeout: elemento não encontrado');
        resolve(false);
      }, 5000); // 5 segundos de timeout

      if (iframeRef.current && iframeRef.current.contentDocument) {
        try {
          console.log('Verificando seletor:', selector);
          const element = iframeRef.current.contentDocument.querySelector(selector);
          console.log('Elemento encontrado:', element);
          clearTimeout(timeoutId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 1500);
          }
          resolve(!!element);
        } catch (error) {
          console.error('Error verifying element:', error);
          clearTimeout(timeoutId);
          resolve(false);
        }
      } else {
        console.log('iframe ou contentDocument não disponível');
        clearTimeout(timeoutId);
        resolve(false);
      }
    });
  }, []);

  useEffect(() => {
    onVerifyElement(verifyElement);
  }, [onVerifyElement, verifyElement]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      if (!htmlContent || !isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        const { sanitizedHtml, extractedCss } = sanitizeHtml(htmlContent);
        if (iframeRef.current && iframeRef.current.contentDocument && isMounted) {
          const iframeDoc = iframeRef.current.contentDocument;
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  ${extractedCss}
                  .highlight {
                    background-color: yellow !important;
                    transition: background-color 0.3s;
                  }
                  body {
                    transform-origin: top left;
                    overflow: hidden;
                  }
                </style>
              </head>
              <body>
                ${sanitizedHtml}
              </body>
            </html>
          `);
          iframeDoc.close();

          // Ajustar o zoom do conteúdo do iframe
          const containerWidth = containerRef.current?.clientWidth || 0;
          const containerHeight = containerRef.current?.clientHeight || 0;
          const contentWidth = iframeDoc.body.scrollWidth;
          const contentHeight = iframeDoc.body.scrollHeight;
          const scaleX = containerWidth / contentWidth;
          const scaleY = containerHeight / contentHeight;
          const scale = Math.min(scaleX, scaleY, 1);

          iframeDoc.body.style.transform = `scale(${scale})`;
          iframeDoc.body.style.width = `${contentWidth}px`;
          iframeDoc.body.style.height = `${contentHeight}px`;
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading HTML content:', err);
          setError('Erro ao carregar o conteúdo HTML');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [htmlContent]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden border border-gray-300">
      <iframe
        ref={iframeRef}
        title="HTML Preview"
        className="w-full h-full"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
};

export default HtmlPreview;
