'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import POMCreationForm from './POMCreationForm';
import { POM } from '@/lib/schemas';
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { Button } from "@/components/ui/button";
import ScreenshotPreview from './ScreenshotPreview';
import HtmlPreview from './HtmlPreview';
import { toast } from '@/hooks/use-toast';

interface POMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pomData: POM) => void;
  initialData?: POM;
}

const POMModal: React.FC<POMModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(initialData?.screenshotUrl || null);
  const [htmlContent, setHtmlContent] = useState<string | null>(initialData?.htmlContent || null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setScreenshotUrl(initialData?.screenshotUrl || null);
      setHtmlContent(initialData?.htmlContent || null);
      setSelectedCoordinates(initialData?.elements.map(e => e.coordinates).filter(Boolean) as string[] || []);
    }
  }, [isOpen, initialData]);

  const handleImageUpload = (res: any[]) => {
    console.log("Image upload response:", res);
    if (res && res[0] && res[0].url) {
      console.log("Image uploaded, setting screenshotUrl to:", res[0].url);
      setScreenshotUrl(res[0].url);
    }
  };

  const handleHtmlUpload = async (res: any[]) => {
    console.log("HTML upload response:", res);
    if (res && res[0] && res[0].url) {
      try {
        console.log("HTML file uploaded:", res[0].url);
        const response = await fetch(res[0].url);
        const text = await response.text();
        setHtmlContent(text);
      } catch (error) {
        console.error('Error fetching HTML content:', error);
      }
    }
  };

  const handleCoordinateSelect = (coordinates: string) => {
    setSelectedCoordinates(prev => {
      const newCoordinates = [...prev];
      const index = newCoordinates.findIndex(coord => coord === coordinates);
      if (index === -1) {
        newCoordinates.push(coordinates);
      } else {
        newCoordinates[index] = coordinates; // Atualiza as coordenadas existentes
      }
      return newCoordinates;
    });
  };

  const handleSave = (data: POM) => {
    onSave({
      ...data,
      screenshotUrl,
      htmlContent,
    });
  };

  const [verifyElementFunction, setVerifyElementFunction] = useState<(selector: string) => Promise<boolean>>(() => async () => false);

  const handleVerifyElement = useCallback((verifyFn: (selector: string) => Promise<boolean>) => {
    setVerifyElementFunction(() => verifyFn);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80%] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar' : 'Criar'} POM</DialogTitle>
          <DialogDescription>
            {initialData ? 'Edite os detalhes do POM existente.' : 'Crie um novo POM preenchendo os detalhes abaixo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload de Arquivos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                <UploadButton<OurFileRouter>
                  endpoint="imageUploader"
                  onClientUploadComplete={handleImageUpload}
                  onUploadError={(error: Error) => {
                    console.error("Erro ao fazer upload da imagem:", error);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arquivo HTML</label>
                <UploadButton<OurFileRouter>
                  endpoint="htmlUploader"
                  onClientUploadComplete={handleHtmlUpload}
                  onUploadError={(error: Error) => {
                    console.error("Erro ao fazer upload do HTML:", error);
                  }}
                />
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Preview do Screenshot</h3>
                <ScreenshotPreview 
                  screenshotUrl={screenshotUrl} 
                  onCoordinateSelect={handleCoordinateSelect}
                  selectedCoordinates={selectedCoordinates}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Preview do HTML</h3>
                <HtmlPreview 
                  htmlContent={htmlContent} 
                  onVerifyElement={handleVerifyElement}
                />
              </div>
            </div>
          </div>
          <div>
            <POMCreationForm
              onSave={handleSave}
              initialData={initialData}
              screenshotUrl={screenshotUrl}
              htmlContent={htmlContent}
              selectedCoordinates={selectedCoordinates}
              onCoordinateSelect={handleCoordinateSelect}
              onVerifyElement={verifyElementFunction}
            />
          </div>
        </div>
        <Button onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
};

export default POMModal;
