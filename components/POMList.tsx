import React from 'react';
import { POM } from '@/lib/schemas';
import { Button } from '@/components/ui/button';

interface POMListProps {
  poms: POM[];
  onEdit: (pom: POM) => void;
  onDelete: (pomId: string) => void;
  onShowCoordinates: (pomId: string, elementId: string) => void;
  onVerifyElement: (pomId: string, elementId: string) => void;
}

const POMList: React.FC<POMListProps> = ({ poms, onEdit, onDelete, onShowCoordinates, onVerifyElement }) => {
  return (
    <div>
      {poms.length === 0 ? (
        <p>Nenhum POM salvo ainda.</p>
      ) : (
        <ul className="space-y-8">
          {poms.map((pom) => (
            <li key={pom.id} className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{pom.name}</h3>
                <div>
                  <Button onClick={() => onEdit(pom)} className="mr-2">Editar</Button>
                  <Button onClick={() => onDelete(pom.id)} variant="destructive">Excluir</Button>
                </div>
              </div>
              <p className="mb-4">Elementos: {pom.elements.length}</p>
              <ul className="space-y-4">
                {pom.elements.map((element) => (
                  <li key={element.id} className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-2">{element.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Tipo:</strong> {element.type}</p>
                      <p><strong>Localizador:</strong> {element.locator}</p>
                      <p><strong>Valor:</strong> {element.value || 'N/A'}</p>
                      <p><strong>Coordenadas:</strong> {element.coordinates || 'N/A'}</p>
                      <p><strong>Ação:</strong> {element.action || 'N/A'}</p>
                      <p><strong>Obrigatório:</strong> {element.isRequired ? 'Sim' : 'Não'}</p>
                    </div>
                    <div className="mt-2 space-x-2">
                      <Button 
                        onClick={() => onShowCoordinates(pom.id, element.id)}
                        disabled={!element.coordinates}
                      >
                        Mostrar Coordenadas
                      </Button>
                      <Button 
                        onClick={() => onVerifyElement(pom.id, element.id)}
                      >
                        Verificar Elemento
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default POMList;
