"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import InteractivePreview from '@/components/InteractivePreview';
import ImageEditor from '@/components/ImageEditor';
import HtmlEditor from '@/components/HtmlEditor';
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "../api/uploadthing/core";
import { ErrorBoundary } from 'react-error-boundary';
import { POM } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import POMList from '@/components/POMList';
import POMModal from '@/components/POMModal';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

export default function POMPage() {
  const { toast } = useToast();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [poms, setPoms] = useState<POM[]>([]);
  const [selectedPOM, setSelectedPOM] = useState<POM | null>(null);
  const [selectedElement, setSelectedElement] = useState<POMElement | null>(null);
  const [editingPOM, setEditingPOM] = useState<POM | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPOMs();
  }, []);

  const handleImageUpload = (res: any[]) => {
    if (res && res[0] && res[0].url) {
      setScreenshotUrl(res[0].url);
    }
  };

  const handleHtmlUpload = async (res: any[]) => {
    if (res && res[0] && res[0].url) {
      const response = await fetch(res[0].url);
      const text = await response.text();
      setHtmlContent(text);
    }
  };

  const handleImageSave = (editedImageUrl: string) => {
    setScreenshotUrl(editedImageUrl);
    setIsEditingImage(false);
  };

  const handleHtmlSave = (editedHtml: string) => {
    setHtmlContent(editedHtml);
    setIsEditingHtml(false);
  };

  const handleEditPOM = (pom: POM) => {
    setEditingPOM(pom);
    // Rola a página para o formulário de edição
    const formElement = document.getElementById('pom-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeletePOM = async (pomId: string) => {
    if (confirm("Tem certeza que deseja excluir este POM?")) {
      try {
        const response = await fetch(`/api/pom/${pomId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "POM excluído com sucesso",
            description: "O POM foi removido do sistema.",
          });
          fetchPOMs(); // Atualiza a lista de POMs
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete POM');
        }
      } catch (error) {
        console.error('Error deleting POM:', error);
        toast({
          title: "Erro ao excluir POM",
          description: "Ocorreu um erro ao tentar excluir o POM. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenModal = (pom?: POM) => {
    setEditingPOM(pom || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingPOM(null);
    setIsModalOpen(false);
  };

  const handleSavePOM = async (pomData: POM) => {
    try {
      const url = pomData.id ? `/api/pom/${pomData.id}` : '/api/pom';
      const method = pomData.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pomData),
      });

      if (response.ok) {
        const savedPOM = await response.json();
        toast({
          title: `POM ${pomData.id ? 'atualizado' : 'salvo'} com sucesso`,
          description: `POM "${savedPOM.name}" foi ${pomData.id ? 'atualizado' : 'salvo'} com ${savedPOM.elements.length} elementos.`,
        });
        fetchPOMs(); // Atualiza a lista de POMs
        handleCloseModal();
      } else {
        throw new Error(`Failed to ${pomData.id ? 'update' : 'save'} POM`);
      }
    } catch (error) {
      console.error(`Error ${pomData.id ? 'updating' : 'saving'} POM:`, error);
      toast({
        title: `Erro ao ${pomData.id ? 'atualizar' : 'salvar'} POM`,
        description: `Ocorreu um erro ao tentar ${pomData.id ? 'atualizar' : 'salvar'} o POM. Por favor, tente novamente.`,
        variant: "destructive",
      });
    }
  };

  const handleCoordinateSelect = (coordinates: string) => {
    if (selectedElementIndex !== null) {
      // Aqui você atualizaria o estado do formulário POM com as novas coordenadas
      // Como estamos usando react-hook-form no POMCreationForm, você precisará
      // passar uma função para atualizar o campo específico
      // Isso dependerá de como você está gerenciando o estado do formulário POM
    }
    setSelectedElementIndex(null);
  };

  const fetchPOMs = async () => {
    try {
      const response = await fetch('/api/pom');
      if (response.ok) {
        const data = await response.json();
        setPoms(data);
      } else {
        console.error('Failed to fetch POMs');
      }
    } catch (error) {
      console.error('Error fetching POMs:', error);
    }
  };

  const handleShowCoordinates = (pomId: string, elementId: string) => {
    const pom = poms.find(p => p.id === pomId);
    if (pom) {
      const element = pom.elements.find(e => e.id === elementId);
      if (element && element.coordinates) {
        setSelectedPOM(pom);
        setSelectedElement(element);
        // Aqui você pode implementar a lógica para mostrar as coordenadas no InteractivePreview
      }
    }
  };

  const handleVerifyElement = (pomId: string, elementId: string) => {
    const pom = poms.find(p => p.id === pomId);
    if (pom) {
      const element = pom.elements.find(e => e.id === elementId);
      if (element && htmlContent) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          const foundElement = doc.querySelector(element.locator);
          toast({
            title: foundElement ? "Elemento encontrado" : "Elemento não encontrado",
            description: `O elemento "${element.name}" ${foundElement ? 'foi' : 'não foi'} encontrado no HTML.`,
            variant: foundElement ? "default" : "destructive",
          });
        } catch (error) {
          console.error('Error verifying element:', error);
          toast({
            title: "Erro ao verificar elemento",
            description: "Ocorreu um erro ao tentar verificar o elemento no HTML.",
            variant: "destructive",
          });
        }
      }
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">POM Mapping System</h1>
          <Link href="/">
            <Button variant="outline">Voltar para a Página Inicial</Button>
          </Link>
        </div>
        
        <Button onClick={() => handleOpenModal()} className="mb-4">Criar Novo POM</Button>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>POMs Salvos</CardTitle>
          </CardHeader>
          <CardContent>
            <POMList 
              poms={poms} 
              onEdit={handleOpenModal}
              onDelete={handleDeletePOM}
              onShowCoordinates={handleShowCoordinates}
              onVerifyElement={handleVerifyElement}
            />
          </CardContent>
        </Card>

        <POMModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSavePOM}
          initialData={editingPOM}
        />
      </div>
    </ErrorBoundary>
  );
}
