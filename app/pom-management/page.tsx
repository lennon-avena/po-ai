'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Crosshair, CheckCircle2, XCircle, PlayCircle, Loader2, Loader, Plus, Check, X, Image, Code, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import ScreenshotUploadModal from '@/components/ScreenshotUploadModal';
import HtmlUploadModal from '@/components/HtmlUploadModal';

export default function POMManagementPage() {
  const [poms, setPoms] = useState<POM[]>([]);
  const [activePOM, setActivePOM] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'screenshot' | 'html'>('screenshot');
  const [verifyElementFn, setVerifyElementFn] = useState<((selector: string) => Promise<boolean>) | null>(null);
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  const pendingVerificationRef = useRef<POMElement | null>(null);
  const [isBatchValidating, setIsBatchValidating] = useState(false);
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);
  const [isHtmlVisible, setIsHtmlVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const verifyElementFnRef = useRef<((selector: string) => Promise<boolean>) | null>(null);
  const [elementValidationStatus, setElementValidationStatus] = useState<Record<string, boolean | null>>({});
  const [shouldReloadHtml, setShouldReloadHtml] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isHtmlLoadedForCurrentPOM, setIsHtmlLoadedForCurrentPOM] = useState(false);
  const [isHtmlReadyForValidation, setIsHtmlReadyForValidation] = useState(false);
  const [isAddingPOM, setIsAddingPOM] = useState(false);
  const [newPOMName, setNewPOMName] = useState('');
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [selectedPOMForUpload, setSelectedPOMForUpload] = useState<POM | null>(null);

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

  const handleVerifyElement = useCallback((verifyFn: (selector: string) => Promise<boolean>) => {
    console.log('Função de verificação definida');
    verifyElementFnRef.current = verifyFn;
    setIsHtmlLoaded(true);
    if (pendingVerificationRef.current) {
      verifyElementInHtml(pendingVerificationRef.current);
      pendingVerificationRef.current = null;
    }
  }, []);

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
    if (verifyElementFnRef.current) {
      try {
        const selector = generateSelector(element.locator, element.value);
        const found = await verifyElementFnRef.current(selector);
        setElementValidationStatus(prev => ({ ...prev, [element.id]: found }));
        toast({
          title: found ? "Elemento encontrado" : "Elemento não encontrado",
          description: `O elemento "${element.name}" ${found ? 'foi' : 'não foi'} encontrado no HTML.`,
          variant: found ? "default" : "destructive",
        });
      } catch (error) {
        console.error('Erro ao verificar elemento:', error);
        setElementValidationStatus(prev => ({ ...prev, [element.id]: null }));
        toast({
          title: "Erro ao verificar elemento",
          description: "Ocorreu um erro ao tentar verificar o elemento no HTML.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFindElement = (element: POMElement) => {
    setIsValidating(true);
    if (activeTab !== 'html') {
      setActiveTab('html');
      pendingVerificationRef.current = element;
    } else if (!isHtmlLoaded) {
      pendingVerificationRef.current = element;
    } else {
      verifyElementInHtml(element).finally(() => setIsValidating(false));
    }
  };

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'screenshot' | 'html');

  }, []);

  const handlePOMSelect = useCallback((pom: POM) => {
    setActivePOM(pom.id);
    setActiveTab('html');
    setIsHtmlLoadedForCurrentPOM(false);
    setIsHtmlLoaded(false); // Adicione esta linha
    setElementValidationStatus({}); // Limpa os status de validação anteriores
    setIsHtmlReadyForValidation(false); // Reseta o estado de prontidão para validação
    loadHtmlContent(pom);
  }, []);

  const loadHtmlContent = useCallback(async (pom: POM) => {
    if (isHtmlLoadedForCurrentPOM) return;

    setIsLoadingHtml(true);
    try {
      // Limpa o estado atual do HTML
      if (verifyElementFnRef.current) {
        verifyElementFnRef.current = null;
      }
      
      // Simula o carregamento do HTML (substitua isso pela lógica real de carregamento)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsHtmlLoaded(true);
      setIsHtmlLoadedForCurrentPOM(true);
      setIsHtmlReadyForValidation(true);
    } catch (error) {
      console.error('Erro ao carregar o HTML:', error);
      toast({
        title: "Erro ao carregar o HTML",
        description: "Não foi possível carregar o conteúdo HTML. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHtml(false);
    }
  }, [isHtmlLoadedForCurrentPOM]);

  const handleHtmlLoaded = useCallback(() => {
    setIsHtmlLoaded(true);
    setIsHtmlLoadedForCurrentPOM(true);
    setIsHtmlReadyForValidation(true);
  }, []);

  const checkHtmlVisibility = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const body = iframeRef.current.contentDocument.body;
      if (body && body.innerHTML.trim().length > 0) {
        setIsHtmlVisible(true);
        return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    // Reset isHtmlLoadedForCurrentPOM when activePOM changes
    setIsHtmlLoadedForCurrentPOM(false);
  }, [activePOM]);

  const waitForHtmlVisibility = useCallback(() => {
    return new Promise<void>((resolve) => {
      const maxAttempts = 20;
      let attempts = 0;

      const checkVisibility = () => {
        if (checkHtmlVisibility() || attempts >= maxAttempts) {
          resolve();
        } else {
          attempts++;
          setTimeout(checkVisibility, 250);
        }
      };

      checkVisibility();
    });
  }, [checkHtmlVisibility]);

  const waitForVerifyFunction = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const maxAttempts = 40; // Aumentado para 40 tentativas
      let attempts = 0;

      const checkVerifyFunction = () => {
        console.log(`Tentativa ${attempts + 1} de verificar a função de verificação`);
        if (verifyElementFnRef.current) {
          console.log('Função de verificação disponível');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error('Timeout: Função de verificação não disponível');
          reject(new Error('Função de verificação não disponível após várias tentativas'));
        } else {
          attempts++;
          setTimeout(checkVerifyFunction, 250);
        }
      };

      checkVerifyFunction();
    });
  }, []);

  const handleBatchValidation = async () => {
    if (!selectedPOM) {
      toast({
        title: "Nenhum POM selecionado",
        description: "Por favor, selecione um POM antes de validar os elementos.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setIsBatchValidating(true);
    setActiveTab('html');

    try {
      console.log('Iniciando validação em lote');
      
      if (!isHtmlLoadedForCurrentPOM) {
        console.log('Carregando HTML');
        await loadHtmlContent(selectedPOM);
        await waitForHtmlVisibility();
      } else {
        console.log('HTML já carregado, prosseguindo com a validação');
        setIsHtmlReadyForValidation(true);
      }

      console.log('HTML visvel, aguardando 1 segundo antes de iniciar a validação');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aguarda a função de verificação estar disponível
      console.log('Aguardando função de verificação ficar disponível');
      await waitForVerifyFunction();

      // Verifica se a função de verificação está disponível
      if (!verifyElementFnRef.current) {
        throw new Error("Função de verificação não disponível");
      }

      let validatedCount = 0;
      let failedCount = 0;
      let newValidationStatus: Record<string, boolean> = {};

      // Valida todos os elementos
      for (const element of selectedPOM.elements) {
        const selector = generateSelector(element.locator, element.value);
        if (selector) {
          try {
            console.log(`Validando elemento: ${element.name}`);
            const found = await verifyElementFnRef.current(selector);
            newValidationStatus[element.id] = found;
            if (found) {
              validatedCount++;
            } else {
              failedCount++;
            }
            console.log(`Elemento "${element.name}": ${found ? 'Encontrado' : 'Não encontrado'}`);
          } catch (error) {
            console.error(`Erro ao verificar elemento "${element.name}":`, error);
            newValidationStatus[element.id] = false;
            failedCount++;
          }
        }
      }

      setElementValidationStatus(newValidationStatus);

      console.log('Validação em lote concluída');
      toast({
        title: "Validação em lote concluída",
        description: `${validatedCount} elementos encontrados, ${failedCount} não encontrados.`,
        variant: validatedCount > failedCount ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Erro durante a validação em lote:', error);
      toast({
        title: "Erro na validação em lote",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado durante a validação.",
        variant: "destructive",
      });
    } finally {
      setIsBatchValidating(false);
      setIsValidating(false);
    }
  };

  // Adicione esta função junto com as outras funções
  const handleCreatePOM = async () => {
    if (!newPOMName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome para o POM.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/pom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPOMName,
          elements: [],
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar POM');

      const newPOM = await response.json();
      setPoms(prev => [...prev, newPOM]);
      setNewPOMName('');
      setIsAddingPOM(false);
      
      toast({
        title: "POM criado com sucesso",
        description: `O POM "${newPOMName}" foi criado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar POM:', error);
      toast({
        title: "Erro ao criar POM",
        description: "Ocorreu um erro ao tentar criar o novo POM.",
        variant: "destructive",
      });
    }
  };

  const handleScreenshotUpload = (pomId: string) => {
    const pom = poms.find(p => p.id === pomId);
    if (pom) {
      console.log('POM selecionado para upload:', pom);
      setSelectedPOMForUpload(pom);
      setIsScreenshotModalOpen(true);
    } else {
      console.error('POM não encontrado:', pomId);
    }
  };

  const handleHtmlUpload = (pomId: string) => {
    const pom = poms.find(p => p.id === pomId);
    if (pom) {
      setSelectedPOMForUpload(pom);
      setIsHtmlModalOpen(true);
    }
  };

  const handleScreenshotUploadComplete = async (url: string) => {
    if (selectedPOMForUpload) {
      try {
        console.log('Iniciando atualização do POM com novo screenshot:', url);
        const response = await fetch(`/api/pom/${selectedPOMForUpload.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ screenshotUrl: url }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const updatedPOM = await response.json();
        console.log('POM atualizado com sucesso:', updatedPOM);

        setPoms(prevPoms => prevPoms.map(pom => 
          pom.id === selectedPOMForUpload.id ? { ...pom, screenshotUrl: url } : pom
        ));
        toast({
          title: "Screenshot atualizado com sucesso",
          description: `O screenshot para o POM "${selectedPOMForUpload.name}" foi atualizado.`,
        });
      } catch (error) {
        console.error('Erro detalhado ao atualizar POM:', error);
        toast({
          title: "Erro ao atualizar POM",
          description: `Ocorreu um erro ao atualizar o POM com o novo screenshot: ${error.message}`,
          variant: "destructive",
        });
      }
    } else {
      console.error('Nenhum POM selecionado para upload');
      toast({
        title: "Erro ao atualizar POM",
        description: "Nenhum POM selecionado para atualização.",
        variant: "destructive",
      });
    }
    setIsScreenshotModalOpen(false);
  };

  const handleHtmlUploadComplete = async (content: string) => {
    if (selectedPOMForUpload) {
      try {
        const response = await fetch(`/api/pom/${selectedPOMForUpload.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ htmlContent: content }),
        });

        if (response.ok) {
          setPoms(prevPoms => prevPoms.map(pom => 
            pom.id === selectedPOMForUpload.id ? { ...pom, htmlContent: content } : pom
          ));
          toast({
            title: "HTML atualizado com sucesso",
            description: `O HTML para o POM "${selectedPOMForUpload.name}" foi atualizado.`,
          });
          setIsHtmlLoadedForCurrentPOM(false); // Força o recarregamento do HTML
          setIsHtmlReadyForValidation(false);
        } else {
          throw new Error('Failed to update POM');
        }
      } catch (error) {
        console.error('Error updating POM:', error);
        toast({
          title: "Erro ao atualizar POM",
          description: "Ocorreu um erro ao atualizar o POM com o novo conteúdo HTML.",
          variant: "destructive",
        });
      }
    }
    setIsHtmlModalOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Seção 1: Lista de POMs */}
      <div className="w-64 flex-shrink-0 bg-gray-100 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Lista de POMs</h2>
          {!isAddingPOM && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddingPOM(true)}
              className="h-8 w-8"
              title="Adicionar novo POM"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isAddingPOM && (
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Nome do POM"
              value={newPOMName}
              onChange={(e) => setNewPOMName(e.target.value)}
              className="h-8"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreatePOM}
              className="h-8 w-8"
              title="Confirmar"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAddingPOM(false);
                setNewPOMName('');
              }}
              className="h-8 w-8"
              title="Cancelar"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}

        <ul>
          {poms.map(pom => (
            <li
              key={pom.id}
              className="flex items-center justify-between cursor-pointer p-2 mb-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              <span
                className={`flex-grow ${
                  activePOM === pom.id ? 'font-bold text-blue-600' : ''
                }`}
                onClick={() => handlePOMSelect(pom)}
              >
                {pom.name}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleScreenshotUpload(pom.id)}
                  disabled={!!pom.screenshotUrl}
                  className="h-8 w-8"
                  title={pom.screenshotUrl ? "Screenshot já enviado" : "Enviar screenshot"}
                >
                  {pom.screenshotUrl ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleHtmlUpload(pom.id)}
                  disabled={!!pom.htmlContent}
                  className="h-8 w-8"
                  title={pom.htmlContent ? "HTML já enviado" : "Enviar HTML"}
                >
                  {pom.htmlContent ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
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
                title="Carregar HTML (se necessário) e validar todos os elementos"
                disabled={isBatchValidating || isLoadingHtml}
              >
                {isBatchValidating || isLoadingHtml ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {isBatchValidating ? 'Validando...' : isLoadingHtml ? 'Carregando HTML...' : 'Validar Todos'}
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
                    <div className="flex items-center space-x-2">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFindElement(element);
                        }}
                      >
                        <Crosshair className="h-4 w-4" />
                      </div>
                      {elementValidationStatus[element.id] === true && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {elementValidationStatus[element.id] === false && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
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
            onValueChange={handleTabChange}
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
                  elements={selectedPOM.elements}
                  activeElementId={activeElement} // Passando o activeElement
                />
              </div>
            </TabsContent>
            <TabsContent value="html" className="flex-grow overflow-hidden relative">
              <div className="w-full h-full">
                {isValidating && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <Loader className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-blue-500 font-semibold">Validando...</span>
                  </div>
                )}
                <HtmlPreview
                  htmlContent={selectedPOM?.htmlContent || null}
                  onVerifyElement={handleVerifyElement}
                  onHtmlLoaded={handleHtmlLoaded}
                  shouldReload={!isHtmlLoadedForCurrentPOM || !isHtmlLoaded} // Modificado
                  key={selectedPOM?.id} // Adicione esta linha para forçar a recriação do componente
                  onReloadComplete={() => {
                    setIsHtmlLoadedForCurrentPOM(true);
                    setIsHtmlReadyForValidation(true);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="p-4">Selecione um POM para ver a pré-visualização.</p>
        )}
      </div>

      <ScreenshotUploadModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        pomName={selectedPOMForUpload?.name || ''}
        onUploadComplete={handleScreenshotUploadComplete}
      />

      <HtmlUploadModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        pomName={selectedPOMForUpload?.name || ''}
        onUploadComplete={handleHtmlUploadComplete}
      />
    </div>
  );
}
