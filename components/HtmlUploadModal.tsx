import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import UploadArea from './UploadArea';

interface HtmlUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pomName: string;
  onUploadComplete: (content: string) => void;
}

const HtmlUploadModal: React.FC<HtmlUploadModalProps> = ({
  isOpen,
  onClose,
  pomName,
  onUploadComplete
}) => {
  const handleHtmlUpload = async (res: any[]) => {
    if (res && res[0] && res[0].url) {
      try {
        const response = await fetch(res[0].url);
        const text = await response.text();
        onUploadComplete(text);
        toast({
          title: "HTML enviado com sucesso",
          description: `O arquivo HTML para o POM "${pomName}" foi enviado.`,
        });
        onClose();
      } catch (error) {
        console.error('Erro ao buscar conteúdo HTML:', error);
        toast({
          title: "Erro no upload",
          description: "Ocorreu um erro ao processar o arquivo HTML.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de HTML para {pomName}</DialogTitle>
        </DialogHeader>
        <UploadArea
          endpoint="htmlUploader"
          onClientUploadComplete={handleHtmlUpload}
          onUploadError={(error: Error) => {
            console.error("Erro ao fazer upload do HTML:", error);
            toast({
              title: "Erro no upload",
              description: "Ocorreu um erro ao enviar o arquivo HTML.",
              variant: "destructive",
            });
          }}
          acceptedFileTypes="Arquivos HTML até 5MB"
        />
      </DialogContent>
    </Dialog>
  );
};

export default HtmlUploadModal;
