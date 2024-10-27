'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POMElement } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { POMElementSchema } from '@/lib/schemas';

const locatorOptions = [
  { value: 'Id', label: 'Id' },
  { value: 'Name', label: 'Name' },
  { value: 'Class', label: 'Class' },
  { value: 'Css-selector', label: 'CSS Selector' },
  { value: 'Xpath', label: 'XPath' },
];

interface ElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (element: POMElement) => void;
  initialData?: POMElement;
}

const ElementModal: React.FC<ElementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const form = useForm<POMElement>({
    resolver: zodResolver(POMElementSchema),
    defaultValues: {
      type: '',
      name: '',
      locator: '',
      value: '',
      coordinates: '',
      action: '',
      isRequired: false,
    },
  });

  // Adicionar este useEffect para atualizar o formulário quando initialData mudar
  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        type: initialData.type,
        name: initialData.name,
        locator: initialData.locator,
        value: initialData.value || '',
        coordinates: initialData.coordinates || '',
        action: initialData.action || '',
        isRequired: initialData.isRequired,
      });
    } else {
      form.reset({
        type: '',
        name: '',
        locator: '',
        value: '',
        coordinates: '',
        action: '',
        isRequired: false,
      });
    }
  }, [initialData, form]);

  // Usar form ao invés de register, handleSubmit, etc.
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  const onSubmit = (data: POMElement) => {
    onSave(data);
    reset();
    onClose();
  };

  const watchedLocator = watch('locator');
  const watchedValue = watch('value');

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

  const currentSelector = generateSelector(watchedLocator, watchedValue);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar' : 'Adicionar'} Elemento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {currentSelector && (
            <div className="bg-gray-100 p-2 rounded">
              <Label className="text-sm font-medium text-gray-500">
                Seletor atual: {currentSelector}
              </Label>
            </div>
          )}

          <div>
            <Label>Tipo</Label>
            <Input {...register('type')} placeholder="Tipo do elemento" />
            {errors.type && <span className="text-red-500 text-sm">{errors.type.message}</span>}
          </div>

          <div>
            <Label>Nome</Label>
            <Input {...register('name')} placeholder="Nome do elemento" />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>

          <div>
            <Label>Localizador</Label>
            <Select
              onValueChange={(value) => setValue('locator', value)}
              defaultValue={initialData?.locator}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de localizador" />
              </SelectTrigger>
              <SelectContent>
                {locatorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.locator && <span className="text-red-500 text-sm">{errors.locator.message}</span>}
          </div>

          <div>
            <Label>Valor</Label>
            <Input {...register('value')} placeholder="Valor do localizador" />
          </div>

          <div>
            <Label>Coordenadas</Label>
            <Input {...register('coordinates')} placeholder="x1,y1,x2,y2" />
          </div>

          <div>
            <Label>Ação</Label>
            <Input {...register('action')} placeholder="Ação do elemento" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              {...register('isRequired')}
              defaultChecked={initialData?.isRequired}
            />
            <Label htmlFor="isRequired">Obrigatório</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit">{initialData ? 'Atualizar' : 'Adicionar'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ElementModal;
