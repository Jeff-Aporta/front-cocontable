// @contexto AGENTS.md · skills/iswc-foundation/references/05-zod-y-tipos.md
/**
 * componentes.schemas.ts — forma de las `props` de cada componente y tipos auxiliares de la base.
 *
 * Regla: los tipos salen de `z.infer<>`; no hay `type`/`interface` sueltos fuera de `*.schemas.ts`.
 * Cada schema se registra en `base/props-registro.ts` con una línea.
 */
import { z } from '../../base/zod.js';
import { CampoSchema, ColumnaSchema } from './api.schemas.js';

const fila = z.record(z.string(), z.unknown());

/** `<coco-app>`: el shell. Vistas abiertas (1 o 2), cuál recibe el menú, panel colapsado, orientación de la división y ancho del panel (%). */
export const CocoAppPropsSchema = z.object({ paneles: z.array(z.string()).min(1).max(2), activo: z.number().int().min(0).max(1), colapsado: z.boolean(), orientacion: z.enum(['horizontal', 'vertical']), ancho: z.number() });
export type CocoAppProps = z.infer<typeof CocoAppPropsSchema>;

export const CocoAccesoPropsSchema = z.object({ abierto: z.boolean(), modo: z.enum(['entrar', 'crear']) });
export type CocoAccesoProps = z.infer<typeof CocoAccesoPropsSchema>;

export const CocoTablaPropsSchema = z.object({ columnas: z.array(ColumnaSchema), filas: z.array(fila), vacio: z.string() });
export type CocoTablaProps = z.infer<typeof CocoTablaPropsSchema>;

export const CocoFichaPropsSchema = z.object({ titulo: z.string(), campos: z.array(CampoSchema), valores: fila, alta: z.boolean(), abierta: z.boolean(), guardando: z.boolean(), error: z.string(), eliminable: z.boolean() });
export type CocoFichaProps = z.infer<typeof CocoFichaPropsSchema>;

export const CocoCatalogoPropsSchema = z.object({ catalogo: z.string() });
export type CocoCatalogoProps = z.infer<typeof CocoCatalogoPropsSchema>;

/** Vistas sin configuración. */
export const SinPropsSchema = z.object({});
export type SinProps = z.infer<typeof SinPropsSchema>;

/** `<coco-documentos>`: clases que lista (separadas por coma) y la clase que crea el botón «Nuevo» (vacío = sin botón). */
export const CocoDocumentosPropsSchema = z.object({ clases: z.string(), nuevo: z.string() });
export type CocoDocumentosProps = z.infer<typeof CocoDocumentosPropsSchema>;

/** `<coco-factura>`: clase de documento que digita (FV, POS, COT, REM, FC). */
export const CocoFacturaPropsSchema = z.object({ clase: z.string() });
export type CocoFacturaProps = z.infer<typeof CocoFacturaPropsSchema>;

/** `<coco-cartera>`: por cobrar (CxC) o por pagar (CxP). */
export const CocoCarteraPropsSchema = z.object({ tipo: z.enum(['CxC', 'CxP']) });
export type CocoCarteraProps = z.infer<typeof CocoCarteraPropsSchema>;

/** `<coco-ajustes>`: sección que muestra. */
export const CocoAjustesPropsSchema = z.object({ seccion: z.enum(['empresas', 'agentes', 'apariencia']) });
export type CocoAjustesProps = z.infer<typeof CocoAjustesPropsSchema>;

/** Base (`componente.ts`): atributos e hijos del helper `el()`. */
export type Atributos = Record<string, unknown>;
export type Hijos = Array<Node | string | null | undefined> | Node | string | null | undefined;
