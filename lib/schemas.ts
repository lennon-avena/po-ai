import { z } from 'zod';

export const POMElementSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  locator: z.string().min(1, "Localizador é obrigatório"),
  value: z.string().optional(),
  coordinates: z.string().optional(),
  action: z.string().optional(),
  isRequired: z.boolean(),
});

export const POMSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do POM é obrigatório"),
  elements: z.array(POMElementSchema).min(1, "Pelo menos um elemento é obrigatório"),
  screenshotUrl: z.string().nullable(),
  htmlContent: z.string().nullable(),
  agrupadorDePOMId: z.string().nullable(),
});

export const AgrupadorDePOMSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome do Agrupador é obrigatório"),
  paiId: z.string().nullable(),
  filhos: z.lazy(() => z.array(AgrupadorDePOMSchema)),
  poms: z.array(POMSchema),
  pai: z.lazy(() => AgrupadorDePOMSchema.nullable()).optional(),
});

export type POMElement = z.infer<typeof POMElementSchema>;
export type POM = z.infer<typeof POMSchema>;
export type AgrupadorDePOM = z.infer<typeof AgrupadorDePOMSchema>;
