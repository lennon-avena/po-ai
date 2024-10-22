'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ScreenshotPreviewProps {
  screenshotUrl: string | null;
  onCoordinateSelect?: (coordinates: string) => void;
  selectedCoordinates?: string[];
  onLocatorUpdate?: (locator: string) => void;
}

const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({ 
  screenshotUrl, 
  onCoordinateSelect,
  selectedCoordinates = [],
  onLocatorUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
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
        setError('Failed to load image');
      };
      img.src = screenshotUrl;
    } else {
      setIsLoading(false);
      setError(null);
    }
  }, [screenshotUrl]);

  const getRelativeCoordinates = (event: React.MouseEvent<HTMLDivElement>) => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      return {
        x: Math.round(event.clientX - rect.left - imagePosition.x),
        y: Math.round(event.clientY - rect.top - imagePosition.y)
      };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) { // Botão esquerdo
      const { x, y } = getRelativeCoordinates(event);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      setIsSelecting(true);
    } else if (event.button === 1) { // Botão do meio
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX - imagePosition.x, y: event.clientY - imagePosition.y });
    }
  }, [imagePosition]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isSelecting && selectionStart) {
      const { x, y } = getRelativeCoordinates(event);
      setSelectionEnd({ x, y });
    } else if (isDragging) {
      const newX = event.clientX - dragStart.x;
      const newY = event.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  }, [isSelecting, isDragging, dragStart, selectionStart]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isSelecting && selectionStart && selectionEnd) {
      const { x, y } = getRelativeCoordinates(event);
      setSelectionEnd({ x, y });
      setIsSelecting(false);

      const coordinates = `${Math.min(selectionStart.x, x)},${Math.min(selectionStart.y, y)},${Math.max(selectionStart.x, x)},${Math.max(selectionStart.y, y)}`;
      onCoordinateSelect?.(coordinates);
      
      // Atualizar o localizador
      const locator = `[style*="position: absolute; left: ${Math.min(selectionStart.x, x)}px; top: ${Math.min(selectionStart.y, y)}px;"]`;
      onLocatorUpdate?.(locator);
    }
    setIsDragging(false);
    setIsSelecting(false);
  }, [isSelecting, selectionStart, selectionEnd, onCoordinateSelect, onLocatorUpdate]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsSelecting(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const renderSelection = () => {
    if (selectionStart && selectionEnd) {
      const left = Math.min(selectionStart.x, selectionEnd.x);
      const top = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      return (
        <div
          className="absolute border-2 border-blue-500 bg-blue-200 opacity-30"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`
          }}
        />
      );
    }
    return null;
  };

  const renderCoordinates = () => {
    return selectedCoordinates.map((coord, index) => {
      const [x1, y1, x2, y2] = coord.split(',').map(Number);
      return (
        <div
          key={index}
          className="absolute border-2 border-red-500 rounded-md opacity-50"
          style={{ 
            left: `${x1}px`, 
            top: `${y1}px`,
            width: `${x2 - x1}px`,
            height: `${y2 - y1}px`
          }}
        />
      );
    });
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
          cursor: isDragging ? 'grabbing' : isSelecting ? 'crosshair' : 'grab'
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
          className="cursor-crosshair"
          onError={() => setError('Error rendering image')}
        />
        {renderCoordinates()}
        {renderSelection()}
      </div>
    </div>
  );
};

export default ScreenshotPreview;
