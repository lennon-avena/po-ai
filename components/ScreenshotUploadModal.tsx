import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import UploadArea from './UploadArea';

interface ScreenshotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pomName: string;
  onUploadComplete: (url: string) => void;
}

const ScreenshotUploadModal: React.FC<ScreenshotUploadModalProps> = ({
  isOpen,
  onClose,
  pomName,
  onUploadComplete
}) => {
  const handleImageUpload = (res: any[]) => {
    if (res && res[0] && res[0].url) {
      onUploadComplete(res[0].url);
      toast({
        title: "Screenshot enviado com sucesso",
        description: `O screenshot para o POM "${pomName}" foi enviado.`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Screenshot para {pomName}</DialogTitle>
        </DialogHeader>
        <UploadArea
          endpoint="imageUploader"
          onClientUploadComplete={handleImageUpload}
          onUploadError={(error: Error) => {
            console.error("Erro ao fazer upload da imagem:", error);
            toast({
              title: "Erro no upload",
              description: "Ocorreu um erro ao enviar o screenshot.",
              variant: "destructive",
            });
          }}
          acceptedFileTypes="PNG, JPG ou GIF até 5MB"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ScreenshotUploadModal;
