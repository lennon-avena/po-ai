'use client';

import React, { useState, useEffect, useRef } from 'react';
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
                </style>
              </head>
              <body>
                ${sanitizedHtml}
              </body>
            </html>
          `);
          iframeDoc.close();
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

  const verifyElement = async (selector: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        try {
          console.log('Verificando seletor:', selector); // Log para depuração
          const element = iframeRef.current.contentDocument.querySelector(selector);
          console.log('Elemento encontrado:', element); // Log para depuração
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 1500);
          }
          resolve(!!element);
        } catch (error) {
          console.error('Error verifying element:', error);
          resolve(false);
        }
      } else {
        console.log('iframe ou contentDocument não disponível'); // Log para depuração
        resolve(false);
      }
    });
  };

  useEffect(() => {
    onVerifyElement(verifyElement);
  }, [onVerifyElement]);

  return (
    <div className="h-64 overflow-hidden border border-gray-300">
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
