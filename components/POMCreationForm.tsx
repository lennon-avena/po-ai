import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { POMSchema, POMElement, POM } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface POMCreationFormProps {
  onSave: (pomData: POM) => void;
  initialData?: POM;
  screenshotUrl: string | null;
  htmlContent: string | null;
  selectedCoordinates: string[];
  onCoordinateSelect: (coordinates: string) => void;
  onVerifyElement: (selector: string) => Promise<boolean>;
}

const locatorOptions = [
  { value: 'Id', label: 'Id' },
  { value: 'Name', label: 'Name' },
  { value: 'Class', label: 'Class' },
  { value: 'Css-selector', label: 'CSS Selector' },
  { value: 'Xpath', label: 'XPath' },
];

const POMCreationForm: React.FC<POMCreationFormProps> = ({ 
  onSave, 
  initialData, 
  screenshotUrl, 
  htmlContent,
  selectedCoordinates,
  onCoordinateSelect,
  onVerifyElement
}) => {
  const { register, control, handleSubmit, formState: { errors }, getValues, setValue, reset, watch } = useForm<POM>({
    resolver: zodResolver(POMSchema),
    defaultValues: initialData || {
      name: '',
      elements: [],
      screenshotUrl: null,
      htmlContent: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'elements',
  });

  const [verificationResults, setVerificationResults] = useState<{ [key: number]: boolean }>({});

  const watchedElements = useWatch({
    control,
    name: 'elements',
  });

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

  const handleVerifyElement = async (index: number) => {
    const element = getValues(`elements.${index}`);
    const selector = generateSelector(element.locator, element.value);
    try {
      const result = await onVerifyElement(selector);
      setVerificationResults(prev => ({ ...prev, [index]: result }));
      toast({
        title: result ? "Elemento encontrado" : "Elemento não encontrado",
        description: `O seletor "${selector}" ${result ? 'foi' : 'não foi'} localizado no HTML.`,
        variant: result ? "default" : "destructive",
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

  const onSubmit = (data: POM) => {
    onSave({
      ...data,
      screenshotUrl,
      htmlContent,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do POM</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Nome do POM"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      {fields.map((field, index) => {
        const selector = generateSelector(watchedElements[index]?.locator, watchedElements[index]?.value);
        return (
          <div key={field.id} className="border p-4 rounded-md">
            <Label className="text-sm font-medium text-gray-500">
              Seletor atual: {selector}
            </Label>
            <h3 className="text-lg font-semibold mb-2">Elemento {index + 1}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`elements.${index}.type`}>Tipo</Label>
                <Input
                  {...register(`elements.${index}.type`)}
                  placeholder="Tipo do elemento"
                />
                {errors.elements?.[index]?.type && <p className="text-red-500">{errors.elements[index]?.type?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`elements.${index}.name`}>Nome</Label>
                <Input
                  {...register(`elements.${index}.name`)}
                  placeholder="Nome do elemento"
                />
                {errors.elements?.[index]?.name && <p className="text-red-500">{errors.elements[index]?.name?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`elements.${index}.locator`}>Localizador</Label>
                <Select
                  onValueChange={(value) => setValue(`elements.${index}.locator`, value)}
                  defaultValue={watchedElements[index]?.locator}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um localizador" />
                  </SelectTrigger>
                  <SelectContent>
                    {locatorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`elements.${index}.value`}>Valor</Label>
                <Input
                  {...register(`elements.${index}.value`)}
                  placeholder="Valor do elemento"
                />
              </div>
              <div>
                <Label htmlFor={`elements.${index}.coordinates`}>Coordenadas</Label>
                <Input
                  {...register(`elements.${index}.coordinates`)}
                  placeholder="Coordenadas do elemento (x1,y1,x2,y2)"
                />
              </div>
              <div>
                <Label htmlFor={`elements.${index}.action`}>Ação</Label>
                <Input
                  {...register(`elements.${index}.action`)}
                  placeholder="Ação do elemento"
                />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  {...register(`elements.${index}.isRequired`)}
                  id={`elements.${index}.isRequired`}
                />
                <Label htmlFor={`elements.${index}.isRequired`}>Elemento obrigatório</Label>
              </div>
            </div>
            <div className="mt-2 space-x-2">
              <Button type="button" onClick={() => remove(index)}>Remover Elemento</Button>
              <Button type="button" onClick={() => handleVerifyElement(index)} disabled={!htmlContent}>
                Verificar Elemento
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        onClick={() => append({ type: '', name: '', locator: '', value: '', coordinates: '', action: '', isRequired: false })}
      >
        Adicionar Elemento
      </Button>

      <Button type="submit" className="mt-4 w-full">
        {initialData ? 'Atualizar' : 'Criar'} POM
      </Button>
    </form>
  );
};

export default POMCreationForm;
