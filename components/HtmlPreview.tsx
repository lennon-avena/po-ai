'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface HtmlPreviewProps {
  htmlContent: string | null;
  onVerifyElement: (verifyFn: (selector: string) => Promise<boolean>) => void;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ htmlContent, onVerifyElement }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (htmlContent) {
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } else {
      setIsLoading(false);
      setError(null);
    }
  }, [htmlContent]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'VERIFY_ELEMENT_RESULT') {
        const { selector, found, error } = event.data;
        if (error) {
          toast({
            title: "Erro de sintaxe",
            description: `Erro ao verificar o seletor "${selector}": ${error}`,
            variant: "destructive",
          });
        } else if (found && iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'HIGHLIGHT_ELEMENT', selector }, '*');
          
          const toastInstance = toast({
            title: "Elemento encontrado",
            description: `O seletor "${selector}" foi localizado no HTML.`,
            duration: 5000,
          });

          // Remove o destaque quando o toast for fechado
          const removeHighlight = () => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'REMOVE_HIGHLIGHT', selector }, '*');
            }
          };

          // Configura um timer para remover o destaque após 5 segundos
          const timer = setTimeout(removeHighlight, 5000);

          // Se o toast for fechado manualmente, remove o destaque imediatamente
          toastInstance.dismiss = () => {
            clearTimeout(timer);
            removeHighlight();
            toast.dismiss(toastInstance.id);
          };
        } else {
          toast({
            title: "Elemento não encontrado",
            description: `O seletor "${selector}" não foi localizado no HTML.`,
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  const verifyElement = async (selector: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const handleVerifyResult = (event: MessageEvent) => {
          if (event.data.type === 'VERIFY_ELEMENT_RESULT' && event.data.selector === selector) {
            window.removeEventListener('message', handleVerifyResult);
            resolve(event.data.found);
          }
        };
        window.addEventListener('message', handleVerifyResult);
        iframeRef.current.contentWindow.postMessage({ type: 'VERIFY_ELEMENT', selector }, '*');
      } else {
        resolve(false);
      }
    });
  };

  useEffect(() => {
    onVerifyElement(verifyElement);
  }, [onVerifyElement]);

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .highlight {
            background-color: yellow !important;
            transition: background-color 0.3s;
          }
        </style>
      </head>
      <body>
        ${htmlContent || ''}
        <script>
          window.addEventListener('message', function(event) {
            if (event.data.type === 'VERIFY_ELEMENT') {
              try {
                const element = document.querySelector(event.data.selector);
                window.parent.postMessage({
                  type: 'VERIFY_ELEMENT_RESULT',
                  selector: event.data.selector,
                  found: !!element
                }, '*');
              } catch (error) {
                window.parent.postMessage({
                  type: 'VERIFY_ELEMENT_RESULT',
                  selector: event.data.selector,
                  error: error.message
                }, '*');
              }
            } else if (event.data.type === 'HIGHLIGHT_ELEMENT') {
              try {
                const element = document.querySelector(event.data.selector);
                if (element) {
                  element.classList.add('highlight');
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } catch (error) {
                console.error('Error highlighting element:', error);
              }
            } else if (event.data.type === 'REMOVE_HIGHLIGHT') {
              try {
                const element = document.querySelector(event.data.selector);
                if (element) {
                  element.classList.remove('highlight');
                }
              } catch (error) {
                console.error('Error removing highlight:', error);
              }
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <div className="h-64 overflow-hidden border border-gray-300">
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        title="HTML Preview"
        className="w-full h-full"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default HtmlPreview;
