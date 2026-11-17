// @contexto AGENTS.md · skills/iswc-foundation/references/05-zod-y-tipos.md
/**
 * api.schemas.ts — forma de lo que llega del API de CoContable y de las definiciones declarativas del front (catálogos,
 * campos, menú). Los tipos salen de `z.infer<>`; lo que viene del servidor se parsea, nunca se castea.
 */
import { z } from '../../base/zod.js';

export const EmpresaSchema = z.object({ iempresa: z.string(), nombre: z.string(), rol: z.string().default('PUBLICO'), nit: z.string().nullish(), dv: z.string().nullish(), ciudad: z.string().nullish(), color: z.string().nullish() });
export type Empresa = z.infer<typeof EmpresaSchema>;

export const PerfilSchema = z.object({ autenticado: z.boolean().default(false), usuario: z.string().nullable().default(null), nombre: z.string().nullish(), email: z.string().nullish(), empresas: z.array(EmpresaSchema).default([]), preferencias: z.record(z.string(), z.unknown()).default({}) });
export type Perfil = z.infer<typeof PerfilSchema>;

/** Fila genérica de una tabla del API. */
export type Fila = Record<string, unknown>;

/** Opción de un campo de selección. */
export const OpcionSchema = z.object({ valor: z.string(), texto: z.string() });
export type Opcion = z.infer<typeof OpcionSchema>;

/** Campo de una ficha: `opciones` fijas o `fuente` (catálogo del API: ruta, columna valor y columna texto). */
export const CampoSchema = z.object({
  nombre: z.string(),
  etiqueta: z.string(),
  tipo: z.enum(['texto', 'numero', 'dinero', 'fecha', 'correo', 'si-no', 'opcion', 'area']).default('texto'),
  pestana: z.string().default('Datos básicos'),
  requerido: z.boolean().default(false),
  soloAlta: z.boolean().default(false),
  ayuda: z.string().optional(),
  defecto: z.union([z.string(), z.number(), z.boolean()]).optional(),
  opciones: z.array(OpcionSchema).optional(),
  fuente: z.object({ ruta: z.string(), valor: z.string(), texto: z.string() }).optional(),
});
export type Campo = z.infer<typeof CampoSchema>;
export type CampoEntrada = z.input<typeof CampoSchema>;

/** Columna de una tabla. */
export const ColumnaSchema = z.object({ campo: z.string(), titulo: z.string(), tipo: z.enum(['texto', 'dinero', 'numero', 'fecha', 'si-no', 'estado']).default('texto'), ancho: z.number().optional() });
export type Columna = z.infer<typeof ColumnaSchema>;
export type ColumnaEntrada = z.input<typeof ColumnaSchema>;

/** Catálogo administrable por CRUD: rutas del API, llave, columnas de la tabla y campos de la ficha. */
export const CatalogoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  singular: z.string(),
  icono: z.string(),
  rutaLista: z.string(),
  rutaUno: z.string(),
  llave: z.string(),
  filtro: z.record(z.string(), z.unknown()).optional(),
  fijos: z.record(z.string(), z.unknown()).optional(),
  columnas: z.array(ColumnaSchema),
  campos: z.array(CampoSchema),
  arbol: z.boolean().default(false),
});
export type Catalogo = z.infer<typeof CatalogoSchema>;

/** Entrada del menú lateral: abre una vista (tag) con sus props. */
export const ModuloSchema = z.object({ id: z.string(), titulo: z.string(), icono: z.string(), grupo: z.string(), tag: z.string(), props: z.record(z.string(), z.unknown()).default({}) });
export type Modulo = z.infer<typeof ModuloSchema>;
export type ModuloEntrada = z.input<typeof ModuloSchema>;
