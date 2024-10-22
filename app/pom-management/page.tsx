'use client';

import React, { useState, useEffect, useRef } from 'react';
import { POM, POMElement } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScreenshotPreview from '@/components/ScreenshotPreview';
import HtmlPreview from '@/components/HtmlPreview';
import { Crosshair } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PlayCircle, Loader2 } from 'lucide-react';

export default function POMManagementPage() {
  const [poms, setPoms] = useState<POM[]>([]);
  const [activePOM, setActivePOM] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'screenshot' | 'html'>('screenshot');
  const [verifyElementFn, setVerifyElementFn] = useState<((selector: string) => Promise<boolean>) | null>(null);
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  const pendingVerificationRef = useRef<POMElement | null>(null);
  const [isBatchValidating, setIsBatchValidating] = useState(false);

  useEffect(() => {
    // Carregar os POMs do servidor
    fetch('/api/pom')
      .then(response => response.json())
      .then(data => setPoms(data))
      .catch(error => console.error('Erro ao carregar POMs:', error));
  }, []);

  const selectedPOM = poms.find(pom => pom.id === activePOM);

  const handleElementSelect = (elementId: string) => {
    setActiveElement(activeElement === elementId ? null : elementId);
  };

  const handleCoordinateSelect = (coordinates: string) => {
    // Aqui você pode implementar a lógica para atualizar as coordenadas do elemento selecionado
    console.log('Coordenadas selecionadas:', coordinates);
  };

  const handleLocatorUpdate = (locator: string) => {
    // Aqui você pode implementar a lógica para atualizar o localizador do elemento selecionado
    console.log('Localizador atualizado:', locator);
  };

  const handleVerifyElement = (verifyFn: (selector: string) => Promise<boolean>) => {
    setVerifyElementFn(() => verifyFn);
    setIsHtmlLoaded(true);
    if (pendingVerificationRef.current) {
      verifyElementInHtml(pendingVerificationRef.current);
      pendingVerificationRef.current = null;
    }
  };

  const generateSelector = (locator: string, value: string) => {
    if (!locator || !value) return '';
    
    switch (locator) {
      case 'Id':
        return value.startsWith('#') ? value : `#${value}`;
      case 'Class':
        return value.startsWith('.') ? value : `.${value}`;
      case 'Name':
        return `[name='${value}']`;
      case 'Css-selector':
        return value;
      case 'Xpath':
        return value.startsWith('/') ? value : `//${value}`;
      default:
        return value;
    }
  };

  const verifyElementInHtml = async (element: POMElement) => {
    if (verifyElementFn) {
      try {
        const selector = generateSelector(element.locator, element.value);
        const found = await verifyElementFn(selector);
        toast({
          title: found ? "Elemento encontrado" : "Elemento não encontrado",
          description: `O elemento "${element.name}" ${found ? 'foi' : 'não foi'} encontrado no HTML.`,
          variant: found ? "default" : "destructive",
        });
      } catch (error) {
        console.error('Erro ao verificar elemento:', error);
        toast({
          title: "Erro ao verificar elemento",
          description: "Ocorreu um erro ao tentar verificar o elemento no HTML.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFindElement = (element: POMElement) => {
    if (activeTab !== 'html') {
      setActiveTab('html');
      pendingVerificationRef.current = element;
    } else if (!isHtmlLoaded) {
      pendingVerificationRef.current = element;
    } else {
      verifyElementInHtml(element);
    }
  };

  const handleBatchValidation = async () => {
    if (!selectedPOM || !verifyElementFn) return;

    setIsBatchValidating(true);
    setActiveTab('html');
    
    for (const element of selectedPOM.elements) {
      const selector = generateSelector(element.locator, element.value);
      if (selector) {
        await verifyElementInHtml(element);
      }
    }

    setIsBatchValidating(false);
    toast({
      title: "Validação em lote concluída",
      description: "Todos os elementos foram verificados.",
      variant: "default",
    });
  };

  return (
    <div className="flex h-screen">
      {/* Seção 1: Lista de POMs */}
      <div className="w-64 flex-shrink-0 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Lista de POMs</h2>
        <ul>
          {poms.map(pom => (
            <li
              key={pom.id}
              className={`cursor-pointer p-2 mb-2 rounded ${
                activePOM === pom.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setActivePOM(pom.id)}
            >
              {pom.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Seção 2: Lista de Elementos */}
      <div className="w-80 flex-shrink-0 bg-white p-4 overflow-y-auto border-l border-gray-200">
        <h2 className="text-xl font-bold mb-4">Elementos do POM</h2>
        {selectedPOM ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedPOM.name}</h3>
              <Button
                onClick={handleBatchValidation}
                className="flex items-center"
                title="Validar todos os elementos"
                disabled={isBatchValidating || !isHtmlLoaded}
              >
                {isBatchValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {isBatchValidating ? 'Validando...' : 'Validar Todos'}
              </Button>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={activeElement}
              onValueChange={setActiveElement}
            >
              {selectedPOM.elements.map((element) => (
                <AccordionItem key={element.id} value={element.id}>
                  <AccordionTrigger
                    className={`${
                      activeElement === element.id ? 'bg-blue-100 text-blue-700' : ''
                    } hover:bg-blue-50 flex justify-between items-center`}
                  >
                    <span>{element.name}</span>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFindElement(element);
                      }}
                    >
                      <Crosshair className="h-4 w-4" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-2">
                      <p><strong>Tipo:</strong> {element.type}</p>
                      <p><strong>Localizador:</strong> {element.locator}</p>
                      <p><strong>Valor:</strong> {element.value || 'N/A'}</p>
                      <p><strong>Coordenadas:</strong> {element.coordinates || 'N/A'}</p>
                      <p><strong>Ação:</strong> {element.action || 'N/A'}</p>
                      <p><strong>Obrigatório:</strong> {element.isRequired ? 'Sim' : 'Não'}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <p>Selecione um POM para ver seus elementos.</p>
        )}
      </div>

      {/* Seção 3: Área de Pré-visualização */}
      <div className="flex-grow bg-white overflow-hidden border-l border-gray-200 flex flex-col">
        <h2 className="text-xl font-bold p-4">Pré-visualização</h2>
        {selectedPOM ? (
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value as 'screenshot' | 'html');
              if (value === 'screenshot') {
                setIsHtmlLoaded(false);
              }
            }} 
            className="flex flex-col h-full"
          >
            <TabsList className="px-4">
              <TabsTrigger value="screenshot">Preview do Screenshot</TabsTrigger>
              <TabsTrigger value="html">Preview do HTML</TabsTrigger>
            </TabsList>
            <TabsContent value="screenshot" className="flex-grow overflow-hidden">
              <div className="w-full h-full overflow-hidden">
                <ScreenshotPreview
                  screenshotUrl={selectedPOM.screenshotUrl}
                  onCoordinateSelect={handleCoordinateSelect}
                  selectedCoordinates={selectedPOM.elements.map(e => e.coordinates).filter(Boolean) as string[]}
                  onLocatorUpdate={handleLocatorUpdate}
                />
              </div>
            </TabsContent>
            <TabsContent value="html" className="flex-grow overflow-hidden">
              <div className="w-full h-full">
                <HtmlPreview
                  htmlContent={selectedPOM.htmlContent}
                  onVerifyElement={handleVerifyElement}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="p-4">Selecione um POM para ver a pré-visualização.</p>
        )}
      </div>
    </div>
  );
}
