'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { POM, POMElement, AgrupadorDePOM } from '@/lib/schemas';
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
import { Crosshair, CheckCircle2, XCircle, PlayCircle, Loader2, Loader, Plus, Check, X, Image, Code, Upload, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import ScreenshotUploadModal from '@/components/ScreenshotUploadModal';
import HtmlUploadModal from '@/components/HtmlUploadModal';
import POMFullList from '@/components/POMFullList';
import ElementModal from '@/components/ElementModal';

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
  const [agrupadores, setAgrupadores] = useState<AgrupadorDePOM[]>([]);
  const [selectedPOM, setSelectedPOM] = useState<POM | null>(null);
  const [isElementModalOpen, setIsElementModalOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<POMElement | null>(null);

  useEffect(() => {
    // Carregar os POMs e Agrupadores do servidor
    Promise.all([
      fetch('/api/pom').then(async response => {
        const data = await response.json();
        console.log('POMs carregados:', data);
        return data;
      }),
      fetch('/api/agrupador-pom').then(async response => {
        const data = await response.json();
        console.log('Agrupadores carregados:', data);
        return data;
      })
    ])
      .then(([pomsData, agrupadoresData]) => {
        setPoms(pomsData);
        setAgrupadores(Array.isArray(agrupadoresData) ? agrupadoresData : []);
      })
      .catch(error => {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os POMs e Agrupadores.",
          variant: "destructive",
        });
        setAgrupadores([]);
      });
  }, []);

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
  }, [isHtmlLoadedForCurrentPOM, setIsHtmlLoaded, setIsHtmlLoadedForCurrentPOM, setIsHtmlReadyForValidation, setIsLoadingHtml, toast]);

  const handlePOMSelect = useCallback(async (pom: POM) => {
    try {
      // Buscar o POM completo com elementos do servidor
      const response = await fetch(`/api/pom/${pom.id}`);
      if (!response.ok) throw new Error('Falha ao carregar POM');
      
      const pomCompleto = await response.json();
      console.log('POM selecionado:', pomCompleto);

      setSelectedPOM(pomCompleto);
      setActivePOM(pomCompleto.id);
      setActiveTab('html');
      setIsHtmlLoadedForCurrentPOM(false);
      setIsHtmlLoaded(false);
      setElementValidationStatus({});
      setIsHtmlReadyForValidation(false);
      
      if (pomCompleto.htmlContent) {
        loadHtmlContent(pomCompleto);
      }
    } catch (error) {
      console.error('Erro ao selecionar POM:', error);
      toast({
        title: "Erro ao carregar POM",
        description: "Não foi possível carregar os detalhes do POM selecionado.",
        variant: "destructive",
      });
    }
  }, [loadHtmlContent]);

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
        title: "Nome invlido",
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
          method: 'PUT', // Mudando de PATCH para PUT
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...selectedPOMForUpload,
            screenshotUrl: url
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedPOM = await response.json();
        console.log('POM atualizado com sucesso:', updatedPOM);

        // Atualiza tanto o estado dos POMs quanto o POM selecionado
        setPoms(prevPoms => prevPoms.map(pom => 
          pom.id === selectedPOMForUpload.id ? updatedPOM : pom
        ));
        
        if (selectedPOM?.id === selectedPOMForUpload.id) {
          setSelectedPOM(updatedPOM);
        }

        toast({
          title: "Screenshot atualizado com sucesso",
          description: `O screenshot para o POM "${selectedPOMForUpload.name}" foi atualizado.`,
        });
      } catch (error) {
        console.error('Erro ao atualizar POM:', error);
        toast({
          title: "Erro ao atualizar POM",
          description: "Ocorreu um erro ao atualizar o POM com o novo screenshot.",
          variant: "destructive",
        });
      }
    }
    setIsScreenshotModalOpen(false);
  };

  const handleHtmlUploadComplete = async (content: string) => {
    if (selectedPOMForUpload) {
      try {
        const response = await fetch(`/api/pom/${selectedPOMForUpload.id}`, {
          method: 'PUT', // Mudando de PATCH para PUT
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...selectedPOMForUpload,
            htmlContent: content
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedPOM = await response.json();
        
        // Atualiza tanto o estado dos POMs quanto o POM selecionado
        setPoms(prevPoms => prevPoms.map(pom => 
          pom.id === selectedPOMForUpload.id ? updatedPOM : pom
        ));
        
        if (selectedPOM?.id === selectedPOMForUpload.id) {
          setSelectedPOM(updatedPOM);
          setIsHtmlLoadedForCurrentPOM(false);
          setIsHtmlLoaded(false);
          setIsHtmlReadyForValidation(false);
          loadHtmlContent(updatedPOM);
        }

        toast({
          title: "HTML atualizado com sucesso",
          description: `O HTML para o POM "${selectedPOMForUpload.name}" foi atualizado.`,
        });
      } catch (error) {
        console.error('Erro ao atualizar POM:', error);
        toast({
          title: "Erro ao atualizar POM",
          description: "Ocorreu um erro ao atualizar o POM com o novo conteúdo HTML.",
          variant: "destructive",
        });
      }
    }
    setIsHtmlModalOpen(false);
  };

  const handleAddPOM = async (nome: string) => {
    try {
      const response = await fetch('/api/pom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, elements: [] }),
      });
      if (response.ok) {
        const newPOM = await response.json();
        setPoms(prevPoms => [...prevPoms, newPOM]);
      }
    } catch (error) {
      console.error('Erro ao adicionar POM:', error);
    }
  };

  const handleAddAgrupador = async (nome: string) => {
    try {
      const response = await fetch('/api/agrupador-pom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      });
      if (response.ok) {
        const novoAgrupador = await response.json();
        setAgrupadores(prevAgrupadores => [...prevAgrupadores, novoAgrupador]);
      }
    } catch (error) {
      console.error('Erro ao adicionar agrupador:', error);
    }
  };

  const handleDragStart = (event: React.DragEvent, item: POM | AgrupadorDePOM, type: 'pom' | 'agrupador') => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, type }));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent, targetId: string | null, targetType: 'pom' | 'agrupador') => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    const { id: draggedId, type: draggedType } = data;

    // Evita soltar um item sobre ele mesmo
    if (draggedId === targetId) return;

    // Evita ciclos na hierarquia
    if (draggedType === 'agrupador' && targetId) {
      const isDescendant = (parentId: string | null, childId: string): boolean => {
        const parent = agrupadores.find(a => a.id === parentId);
        if (!parent) return false;
        if (parent.id === childId) return true;
        return parent.filhos.some(filho => isDescendant(filho.id, childId));
      };

      if (isDescendant(draggedId, targetId)) {
        toast({
          title: "Operação inválida",
          description: "Não é possível mover um agrupador para dentro de seus descendentes",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const endpoint = draggedType === 'pom' ? '/api/pom' : '/api/agrupador-pom';
      const response = await fetch(`${endpoint}/${draggedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agrupadorDePOMId: targetType === 'agrupador' ? targetId : null,
          paiId: targetType === 'agrupador' ? targetId : null
        }),
      });

      if (!response.ok) throw new Error('Falha na requisição');
      
      const updatedItem = await response.json();

        if (draggedType === 'pom') {
        setPoms(prevPoms => 
          prevPoms.map(pom => pom.id === draggedId ? updatedItem : pom)
        );
        } else {
          setAgrupadores(prevAgrupadores => {
          // Remove o agrupador da sua posição atual
          const removeFromHierarchy = (agrupadores: AgrupadorDePOM[]): AgrupadorDePOM[] => {
            return agrupadores.map(ag => ({
              ...ag,
              filhos: ag.filhos.filter(f => f.id !== draggedId)
                .map(f => ({ ...f, filhos: removeFromHierarchy(f.filhos) }))
            }));
          };

          // Adiciona o agrupador na nova posição
          const addToHierarchy = (agrupadores: AgrupadorDePOM[]): AgrupadorDePOM[] => {
            return agrupadores.map(ag => {
              if (ag.id === targetId) {
                  return {
                  ...ag,
                  filhos: [...ag.filhos, updatedItem]
                };
              }
              return {
                ...ag,
                filhos: addToHierarchy(ag.filhos)
              };
              });
            };

          let newAgrupadores = removeFromHierarchy(prevAgrupadores)
                  .filter(a => a.id !== draggedId);
                
          if (targetId) {
            newAgrupadores = addToHierarchy(newAgrupadores);
            } else {
            newAgrupadores.push(updatedItem);
            }

            return newAgrupadores;
          });
        }

        toast({
          title: "Sucesso",
        description: `${draggedType === 'pom' ? 'POM' : 'Agrupador'} movido com sucesso`,
        });
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o item",
        variant: "destructive",
      });
    }
  };

  const handleEditPOM = (pom: POM) => {
    // Implemente a lógica para editar um POM
  };

  const handleDeletePOM = async (pomId: string) => {
    // Implemente a lógica para deletar um POM
  };

  const handleUploadScreenshot = (pomId: string) => {
    setSelectedPOMForUpload(poms.find(pom => pom.id === pomId) || null);
    setIsScreenshotModalOpen(true);
  };

  const handleUploadHtml = (pomId: string) => {
    setSelectedPOMForUpload(poms.find(pom => pom.id === pomId) || null);
    setIsHtmlModalOpen(true);
  };

  const handleShowCoordinates = useCallback((pomId: string, elementId: string) => {
    const pom = poms.find(p => p.id === pomId);
    if (pom) {
      const element = pom.elements.find(e => e.id === elementId);
      if (element && element.coordinates) {
        // Aqui você pode implementar a lógica para mostrar as coordenadas
        // Por exemplo, você pode atualizar o estado para mostrar as coordenadas em um modal ou em uma área específica da página
        console.log(`Coordenadas do elemento ${element.name}: ${element.coordinates}`);
        // Exemplo de como você poderia atualizar um estado para mostrar as coordenadas:
        // setSelectedCoordinates({ pomId, elementId, coordinates: element.coordinates });
      }
    }
  }, [poms]);

  const handleAddElement = () => {
    setEditingElement(null);
    setIsElementModalOpen(true);
  };

  const handleEditElement = (element: POMElement) => {
    setEditingElement({
      id: element.id,
      type: element.type,
      name: element.name,
      locator: element.locator,
      value: element.value || '',
      coordinates: element.coordinates || '',
      action: element.action || '',
      isRequired: element.isRequired,
    });
    setIsElementModalOpen(true);
  };

  const handleSaveElement = async (element: POMElement) => {
    if (!selectedPOM) return;

    try {
      const updatedElements = editingElement
        ? selectedPOM.elements.map(e => (e.id === editingElement.id ? element : e))
        : [...selectedPOM.elements, { ...element, id: crypto.randomUUID() }];

      const response = await fetch(`/api/pom/${selectedPOM.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedPOM,
          elements: updatedElements,
        }),
      });

      if (!response.ok) throw new Error('Falha ao salvar elemento');

      const updatedPOM = await response.json();
      setPoms(prevPoms => prevPoms.map(p => p.id === updatedPOM.id ? updatedPOM : p));
      setSelectedPOM(updatedPOM);
      setIsElementModalOpen(false);
      
      toast({
        title: `Elemento ${editingElement ? 'atualizado' : 'adicionado'} com sucesso`,
        description: `O elemento foi ${editingElement ? 'atualizado' : 'adicionado'} ao POM "${selectedPOM.name}".`,
      });
    } catch (error) {
      console.error('Erro ao salvar elemento:', error);
      toast({
        title: "Erro ao salvar elemento",
        description: "Ocorreu um erro ao tentar salvar o elemento. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!selectedPOM) return;

    try {
      const updatedElements = selectedPOM.elements.filter(e => e.id !== elementId);
      const response = await fetch(`/api/pom/${selectedPOM.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedPOM,
          elements: updatedElements,
        }),
      });

      if (!response.ok) throw new Error('Falha ao excluir elemento');

      const updatedPOM = await response.json();
      setPoms(prevPoms => prevPoms.map(p => p.id === updatedPOM.id ? updatedPOM : p));
      setSelectedPOM(updatedPOM);

      toast({
        title: "Elemento excluído com sucesso",
        description: `O elemento foi removido do POM "${selectedPOM.name}".`,
      });
    } catch (error) {
      console.error('Erro ao excluir elemento:', error);
      toast({
        title: "Erro ao excluir elemento",
        description: "Ocorreu um erro ao tentar excluir o elemento. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleValidateElement = async (element: POMElement) => {
    if (!verifyElementFnRef.current) {
      toast({
        title: "HTML não carregado",
        description: "Aguarde o carregamento do HTML para validar o elemento.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selector = generateSelector(element.locator, element.value);
      const found = await verifyElementFnRef.current(selector);
      setElementValidationStatus(prev => ({ ...prev, [element.id!]: found }));
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
  };

  const handleUpdatePOMAgrupador = async (pomId: string, agrupadorId: string | null) => {
    try {
      const response = await fetch(`/api/pom/${pomId}/agrupador`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agrupadorId }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar associação do POM');
      }

      const updatedPom = await response.json();

      // Atualiza o estado local incluindo todas as relações
      setPoms(prevPoms => prevPoms.map(pom => 
        pom.id === pomId ? updatedPom : pom
      ));

      // Atualiza os agrupadores para refletir a mudança
      setAgrupadores(prevAgrupadores => {
        return prevAgrupadores.map(agrupador => ({
          ...agrupador,
          poms: agrupador.id === agrupadorId
            ? [...(agrupador.poms || []), updatedPom]
            : (agrupador.poms || []).filter(p => p.id !== pomId)
        }));
      });

    } catch (error) {
      console.error('Erro ao atualizar associação:', error);
      toast({
        title: "Erro ao atualizar associação",
        description: "Não foi possível atualizar a associação do POM com o agrupador.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAgrupadorPai = async (agrupadorId: string, paiId: string | null) => {
    try {
      const response = await fetch(`/api/agrupador-pom/${agrupadorId}/pai`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paiId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar pai do agrupador');
      }

      // Atualiza o estado local com a estrutura completa atualizada
      setAgrupadores(prevAgrupadores => {
        // Remove o agrupador da sua posição atual
        const removeFromHierarchy = (agrupadores: AgrupadorDePOM[]): AgrupadorDePOM[] => {
          return agrupadores.map(ag => ({
            ...ag,
            filhos: ag.filhos
              .filter(f => f.id !== agrupadorId)
              .map(f => ({ ...f, filhos: removeFromHierarchy(f.filhos) }))
          }));
        };

        // Adiciona o agrupador na nova posição
        const addToHierarchy = (agrupadores: AgrupadorDePOM[]): AgrupadorDePOM[] => {
          return agrupadores.map(ag => {
            if (ag.id === paiId) {
              return {
                ...ag,
                filhos: [...ag.filhos, data]
              };
            }
            return {
              ...ag,
              filhos: addToHierarchy(ag.filhos)
            };
          });
        };

        let newAgrupadores = removeFromHierarchy(prevAgrupadores)
          .filter(a => a.id !== agrupadorId);

        if (paiId) {
          newAgrupadores = addToHierarchy(newAgrupadores);
        } else {
          newAgrupadores.push(data);
        }

        return newAgrupadores;
      });

      toast({
        title: "Sucesso",
        description: "Hierarquia atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar pai:', error);
      toast({
        title: "Erro ao atualizar hierarquia",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a hierarquia do agrupador.",
        variant: "destructive",
      });
    }
  };

  const handleEditAgrupador = async (agrupador: AgrupadorDePOM) => {
    // Implemente a lógica de edição do agrupador
  };

  const handleDeleteAgrupador = async (agrupadorId: string) => {
    // Implemente a lógica de exclusão do agrupador
  };

  return (
    <div className="flex h-screen">
      <POMFullList
        poms={poms}
        agrupadores={agrupadores}
        onAddPOM={handleAddPOM}
        onAddAgrupador={handleAddAgrupador}
        onEditPOM={handleEditPOM}
        onDeletePOM={handleDeletePOM}
        onUploadScreenshot={handleUploadScreenshot}
        onUploadHtml={handleUploadHtml}
        onShowCoordinates={handleShowCoordinates}
        onVerifyElement={handleVerifyElement}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPOMSelect={handlePOMSelect}
        onUpdatePOMAgrupador={handleUpdatePOMAgrupador}
        onUpdateAgrupadorPai={handleUpdateAgrupadorPai}
        onEditAgrupador={handleEditAgrupador}
        onDeleteAgrupador={handleDeleteAgrupador}
      />
      
      {/* Seção 1: Lista de POMs - Desabilitada */}
      {/* <div className="w-64 flex-shrink-0 bg-gray-100 p-4 overflow-y-auto">
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
      </div> */}

      {/* Seção 2: Lista de Elementos */}
      <div className="w-80 flex-shrink-0 bg-white p-4 overflow-y-auto border-l border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Elementos do POM</h2>
          <div className="flex gap-2">
            {selectedPOM && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBatchValidation}
                  disabled={isBatchValidating || !isHtmlReadyForValidation}
                  title="Validar todos os elementos"
                >
                  {isBatchValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddElement}
                  title="Adicionar novo elemento"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedPOM ? (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={activeElement}
            onValueChange={setActiveElement}
          >
            {selectedPOM.elements && selectedPOM.elements.length > 0 ? (
              selectedPOM.elements.map((element) => (
                <AccordionItem key={element.id} value={element.id}>
                  <AccordionTrigger className="flex justify-between items-center">
                    <span>{element.name}</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateElement(element);
                        }}
                        disabled={!isHtmlReadyForValidation}
                        title="Validar elemento"
                      >
                        {elementValidationStatus[element.id!] === undefined ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : elementValidationStatus[element.id!] ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditElement(element);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(element.id!);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p><strong>Tipo:</strong> {element.type}</p>
                      <p><strong>Localizador:</strong> {element.locator}</p>
                      <p><strong>Valor:</strong> {element.value || 'N/A'}</p>
                      <p><strong>Coordenadas:</strong> {element.coordinates || 'N/A'}</p>
                      <p><strong>Ação:</strong> {element.action || 'N/A'}</p>
                      <p><strong>Obrigatório:</strong> {element.isRequired ? 'Sim' : 'Não'}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhum elemento cadastrado para este POM.
              </p>
            )}
          </Accordion>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Selecione um POM para ver seus elementos.
          </p>
        )}
      </div>

      <ElementModal
        isOpen={isElementModalOpen}
        onClose={() => {
          setIsElementModalOpen(false);
          setEditingElement(null); // Limpa o elemento em edição ao fechar
        }}
        onSave={handleSaveElement}
        initialData={editingElement}
      />

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
