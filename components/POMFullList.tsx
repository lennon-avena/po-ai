import React, { useState, useEffect } from 'react';
import { POM, AgrupadorDePOM } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Edit, Trash2, Image, Code, Crosshair, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";

interface POMFullListProps {
  poms: POM[];
  agrupadores: AgrupadorDePOM[];
  onAddPOM: (nome: string) => void;
  onAddAgrupador: (nome: string) => void;
  onEditPOM: (pom: POM) => void;
  onDeletePOM: (pomId: string) => void;
  onUploadScreenshot: (pomId: string) => void;
  onUploadHtml: (pomId: string) => void;
  onShowCoordinates: (pomId: string, elementId: string) => void;
  onVerifyElement: (pomId: string, elementId: string) => void;
  onDragStart: (event: React.DragEvent, item: POM | AgrupadorDePOM, type: 'pom' | 'agrupador') => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent, targetId: string | null, type: 'pom' | 'agrupador') => void;
  onPOMSelect: (pom: POM) => void;
  onUpdatePOMAgrupador: (pomId: string, agrupadorId: string | null) => void;
  onUpdateAgrupadorPai: (agrupadorId: string, paiId: string | null) => void;
  onEditAgrupador: (agrupador: AgrupadorDePOM) => void;
  onDeleteAgrupador: (agrupadorId: string) => void;
}

const POMFullList: React.FC<POMFullListProps> = ({
  poms,
  agrupadores,
  onAddPOM,
  onAddAgrupador,
  onEditPOM,
  onDeletePOM,
  onUploadScreenshot,
  onUploadHtml,
  onShowCoordinates,
  onVerifyElement,
  onDragStart,
  onDragOver,
  onDrop,
  onPOMSelect,
  onUpdatePOMAgrupador,
  onUpdateAgrupadorPai,
  onEditAgrupador,
  onDeleteAgrupador,
}) => {
  const [isAddingPOM, setIsAddingPOM] = useState(false);
  const [isAddingAgrupador, setIsAddingAgrupador] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [localAgrupadores, setLocalAgrupadores] = useState(agrupadores);
  const [draggedItem, setDraggedItem] = useState<{
    type: 'pom' | 'agrupador';
    name: string;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string | null;
    type: 'before' | 'after' | 'inside';
  } | null>(null);
  const [localPoms, setLocalPoms] = useState(poms);
  const [isContainerDropTarget, setIsContainerDropTarget] = useState(false);

  useEffect(() => {
    setLocalAgrupadores(agrupadores);
  }, [agrupadores]);

  // Adicione este useEffect para sincronizar o estado local com as props
  useEffect(() => {
    setLocalPoms(poms);
  }, [poms]);

  const handleAddItem = (type: 'pom' | 'agrupador') => {
    if (newItemName.trim()) {
      if (type === 'pom') {
        onAddPOM(newItemName);
      } else {
        onAddAgrupador(newItemName);
      }
      setNewItemName('');
      setIsAddingPOM(false);
      setIsAddingAgrupador(false);
    }
  };

  const handleDragStart = (
    event: React.DragEvent, 
    item: POM | AgrupadorDePOM, 
    type: 'pom' | 'agrupador'
  ) => {
    // Cria um elemento fantasma personalizado
    const ghostElement = document.createElement('div');
    ghostElement.classList.add(
      'fixed', 
      'pointer-events-none', 
      'bg-white', 
      'border', 
      'border-primary', 
      'rounded-md', 
      'p-2', 
      'shadow-lg',
      'z-50'
    );
    ghostElement.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${type === 'pom' ? '📄' : '📁'}</span>
        <span>${item.name || item.nome}</span>
      </div>
    `;
    
    document.body.appendChild(ghostElement);

    // Define a imagem de arrastar
    event.dataTransfer.setDragImage(ghostElement, 20, 20);

    // Armazena informações sobre o item sendo arrastado
    setDraggedItem({
      type,
      name: item.name || item.nome
    });

    // Adiciona os dados do item sendo arrastado ao dataTransfer
    event.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      type: type,
      name: item.name || item.nome
    }));

    // Remove o elemento fantasma após um curto delay
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);

    // Chama a função original de onDragStart
    onDragStart(event, item, type);
  };

  const handleDragOver = (
    event: React.DragEvent,
    targetId: string | null,
    isAgrupador: boolean
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedItem) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;

    // Define zonas de drop: superior (25%), meio (50%) e inferior (25%)
    if (y < height * 0.25) {
      setDropTarget({ id: targetId, type: 'before' });
    } else if (y > height * 0.75) {
      setDropTarget({ id: targetId, type: 'after' });
    } else if (isAgrupador) {
      setDropTarget({ id: targetId, type: 'inside' });
    }

    onDragOver(event);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = async (
    event: React.DragEvent,
    targetId: string | null,
    targetType: 'pom' | 'agrupador'
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const dragData = event.dataTransfer.getData('text/plain');
    if (!dragData) return;

    try {
      const { id: draggedId, type: draggedType } = JSON.parse(dragData);

      // Evita soltar um item sobre ele mesmo
      if (draggedId === targetId) return;

      // Se estiver arrastando um POM
      if (draggedType === 'pom') {
        // Atualiza o estado local imediatamente
        const updatedPoms = localPoms.map(pom => 
          pom.id === draggedId 
            ? { ...pom, agrupadorDePOMId: targetId }
            : pom
        );
        setLocalPoms(updatedPoms);

        // Chama a função de atualização do pai
        await onUpdatePOMAgrupador(draggedId, targetId);
      }
      
      // Se estiver arrastando um agrupador
      else if (draggedType === 'agrupador') {
        // Atualiza o estado local imediatamente
        const updatedAgrupadores = localAgrupadores.map(agrupador => 
          agrupador.id === draggedId 
            ? { ...agrupador, paiId: targetId }
            : agrupador
        );
        setLocalAgrupadores(updatedAgrupadores);

        // Chama a função de atualização do pai
        await onUpdateAgrupadorPai(draggedId, targetId);
      }

      // Limpa os estados de drag & drop
      setDropTarget(null);
      setDraggedItem(null);
      setIsContainerDropTarget(false);
    } catch (error) {
      console.error('Erro ao processar drop:', error);
    }
  };

  const renderPOM = (pom: POM) => (
    <div
      key={pom.id}
      className={cn(
        "relative p-2 rounded cursor-pointer transition-colors duration-200",
        draggedItem?.type === 'pom' && draggedItem?.name === pom.name
          ? 'opacity-50 bg-primary/10'
          : 'hover:bg-gray-100',
        dropTarget?.id === pom.id && 'outline outline-2 outline-primary'
      )}
      draggable
      onDragStart={(e) => handleDragStart(e, pom, 'pom')}
      onDragEnd={() => {
        setDraggedItem(null);
        setDropTarget(null);
      }}
      onDragOver={(e) => handleDragOver(e, pom.id, false)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, pom.id, 'pom')}
      onClick={() => onPOMSelect(pom)}
      data-agrupador-id={pom.agrupadorDePOMId} // Adiciona o ID do agrupador como atributo de dados
    >
      {/* Indicadores de drop */}
      {dropTarget?.id === pom.id && (
        <>
          {dropTarget.type === 'before' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-md" />
          )}
          {dropTarget.type === 'after' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-b-md" />
          )}
        </>
      )}
      {/* Conteúdo existente do POM */}
      <div className="flex justify-between items-center">
        <span>{pom.name}</span>
        <div className="space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEditPOM(pom)} title="Editar POM">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeletePOM(pom.id)} title="Excluir POM">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onUploadScreenshot(pom.id)} title="Upload Screenshot">
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onUploadHtml(pom.id)} title="Upload HTML">
            <Code className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {pom.elements && pom.elements.length > 0 && (
        <div className="mt-2 pl-4">
          <h4 className="text-sm font-semibold mb-1">Elementos:</h4>
          {pom.elements.map((element) => (
            <div key={element.id} className="flex justify-between items-center text-sm">
              <span>{element.name}</span>
              <div className="space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onShowCoordinates(pom.id, element.id)} 
                  title="Mostrar Coordenadas"
                >
                  <Crosshair className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onVerifyElement(pom.id, element.id)} title="Verificar Elemento">
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Função para filtrar apenas agrupadores raiz (sem pai)
  const getRootAgrupadores = (agrupadores: AgrupadorDePOM[]) => {
    return agrupadores.filter(agrupador => !agrupador.paiId);
  };

  // Função recursiva para renderizar agrupador e seus filhos
  const renderAgrupador = (agrupador: AgrupadorDePOM) => (
    <AccordionItem
      key={agrupador.id}
      value={agrupador.id}
      className={cn(
        "relative border rounded-lg mb-2 p-2",
        draggedItem?.type === 'agrupador' && draggedItem?.name === agrupador.nome
          ? 'opacity-50 bg-primary/10'
          : '',
        dropTarget?.id === agrupador.id && 'outline outline-2 outline-primary'
      )}
      onDragOver={(e) => handleDragOver(e, agrupador.id, true)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, agrupador.id, 'agrupador')}
    >
      {/* Indicadores de drop */}
      {dropTarget?.id === agrupador.id && (
        <>
          {dropTarget.type === 'before' && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-t-md" />
          )}
          {dropTarget.type === 'after' && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-b-md" />
          )}
          {dropTarget.type === 'inside' && (
            <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
          )}
        </>
      )}
      
      {/* Modificação aqui: Removendo os botões de dentro do AccordionTrigger */}
      <div className="flex items-center justify-between w-full">
        <AccordionTrigger
          className="hover:bg-gray-100 rounded p-2 flex-grow"
          draggable
          onDragStart={(e) => handleDragStart(e, agrupador, 'agrupador')}
          onDragEnd={() => {
            setDraggedItem(null);
            setDropTarget(null);
          }}
        >
          <span>{agrupador.nome}</span>
        </AccordionTrigger>
        
        {/* Movendo os botões para fora do AccordionTrigger */}
        <div className="flex space-x-2 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditAgrupador(agrupador)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteAgrupador(agrupador.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AccordionContent>
        <div className="pl-4">
          {agrupador.poms?.map(pom => renderPOM(pom))}
          {agrupador.filhos?.map(filho => renderAgrupador(filho))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  const handleContainerDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Verifica se o drag está sobre algum item específico
    const isOverSpecificItem = dropTarget !== null;
    
    // Obtém o item sendo arrastado
    const dragData = event.dataTransfer.getData('text/plain');
    if (!dragData) return;

    try {
      const { id: draggedId, type: draggedType } = JSON.parse(dragData);
      
      // Verifica se o item já está na raiz
      let isAlreadyInRoot = false;
      if (draggedType === 'pom') {
        const draggedPom = localPoms.find(p => p.id === draggedId);
        isAlreadyInRoot = draggedPom ? !draggedPom.agrupadorDePOMId : false;
      } else if (draggedType === 'agrupador') {
        const draggedAgrupador = localAgrupadores.find(a => a.id === draggedId);
        isAlreadyInRoot = draggedAgrupador ? !draggedAgrupador.paiId : false;
      }

      // Só mostra o indicador se o item não estiver na raiz e não estiver sobre um item específico
      if (!isOverSpecificItem && !isAlreadyInRoot) {
        setIsContainerDropTarget(true);
      } else {
        setIsContainerDropTarget(false);
      }
    } catch (error) {
      console.error('Erro ao processar dragover:', error);
    }
    
    onDragOver(event);
  };

  const handleContainerDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Verifica se realmente saiu do container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (
      x < rect.left ||
      x >= rect.right ||
      y < rect.top ||
      y >= rect.bottom
    ) {
      setIsContainerDropTarget(false);
    }
  };

  const handleContainerDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    handleDrop(event, null, 'agrupador');
    setIsContainerDropTarget(false);
  };

  return (
    <div 
      className={cn(
        "w-64 bg-white p-4 border-r border-gray-200 relative",
        isContainerDropTarget && "ring-2 ring-primary ring-inset"
      )}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      {/* Indicador visual quando arrastando sobre o container */}
      {isContainerDropTarget && (
        <div className="absolute inset-2 border-2 border-primary border-dashed rounded-lg pointer-events-none" />
      )}

      {/* Conteúdo existente */}
      <div className="relative z-10"> {/* z-10 para ficar acima do indicador */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Lista Completa de POMs</h2>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddingPOM(true)}
              title="Adicionar novo POM"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddingAgrupador(true)}
              title="Adicionar novo Agrupador de POM"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {(isAddingPOM || isAddingAgrupador) && (
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder={isAddingPOM ? "Nome do POM" : "Nome do Agrupador"}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-8"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleAddItem(isAddingPOM ? 'pom' : 'agrupador')}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Accordion type="multiple" className="w-full">
          {Array.isArray(localAgrupadores) && 
            getRootAgrupadores(localAgrupadores).map(agrupador => renderAgrupador(agrupador))}
          {Array.isArray(localPoms) && 
            localPoms.filter(pom => !pom.agrupadorDePOMId).map(pom => renderPOM(pom))}
        </Accordion>
      </div>
    </div>
  );
};

export default POMFullList;
