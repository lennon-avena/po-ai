'use client';

import React, { useState, useEffect, useRef } from 'react';
import { POMElement } from '@/lib/schemas';

interface ScreenshotPreviewProps {
  screenshotUrl: string | null;
  elements: POMElement[];
  activeElementId: string | null;
}

const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({ 
  screenshotUrl, 
  elements = [],
  activeElementId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screenshotUrl) {
      setIsLoading(true);
      setError(null);
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setImageSize({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        setIsLoading(false);
        setError('Falha ao carregar a imagem');
      };
      img.src = screenshotUrl;
    } else {
      setIsLoading(false);
      setError(null);
    }
  }, [screenshotUrl]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1) { // Botão do meio
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX - imagePosition.x, y: event.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = event.clientX - dragStart.x;
      const newY = event.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const renderElements = () => {
    return elements.map((element, index) => {
      if (!element.coordinates) {
        console.warn(`Elemento sem coordenadas no índice ${index}`);
        return null;
      }

      const [x1, y1, x2, y2] = element.coordinates.split(',').map(Number);

      if ([x1, y1, x2, y2].some(isNaN)) {
        console.warn(`Coordenadas inválidas no elemento ${element.name}: ${element.coordinates}`);
        return null;
      }

      const isActive = element.id === activeElementId;

      return (
        <div
          key={element.id || index}
          className={`absolute border-2 rounded-md transition-all duration-300 ${
            isActive ? 'border-red-600 opacity-90 z-10' : 'border-red-500 opacity-50'
          }`}
          style={{ 
            left: `${x1}px`, 
            top: `${y1}px`,
            width: `${Math.max(x2 - x1, 0)}px`,
            height: `${Math.max(y2 - y1, 0)}px`,
            borderWidth: isActive ? '4px' : '2px',
            boxShadow: isActive ? '0 0 0 2px rgba(220, 38, 38, 0.5)' : 'none'
          }}
        >
          <div
            className={`absolute top-0 left-0 text-white rounded-tl-sm rounded-br-sm transition-all duration-300 ${
              isActive ? 'bg-red-600' : 'bg-red-500'
            }`}
            style={{
              fontSize: isActive ? '0.85rem' : '0.6rem',
              lineHeight: '1',
              padding: isActive ? '3px 6px' : '1px 2px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 'bold' : 'normal'
            }}
          >
            {element.name}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 h-64 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!screenshotUrl) {
    return (
      <div className="bg-gray-200 h-64 flex items-center justify-center text-gray-500">
        Nenhuma imagem carregada
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full overflow-auto border border-gray-300">
      <div 
        style={{ 
          width: imageSize.width, 
          height: imageSize.height, 
          position: 'relative',
          transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img 
          ref={imageRef}
          src={screenshotUrl} 
          alt="Screenshot Preview" 
          onError={() => setError('Erro ao renderizar a imagem')}
        />
        {renderElements()}
      </div>
    </div>
  );
};

export default ScreenshotPreview;
