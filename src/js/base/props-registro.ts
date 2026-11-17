// @contexto AGENTS.md · skills/iswc-foundation/SKILL.md
/**
 * props-registro.ts — qué claves de `.props` reconoce cada tag. Lo que no está aquí se avisa.
 *
 * Al crear un componente con `props`: su schema va en `consts/schemas/componentes.schemas.ts` y se
 * registra AQUÍ con una línea. Todo setter de `props` pasa por `revisarProps`.
 */
import { avisarPropsNoIdentificadas, clavesDe, instalarVigilanciaAtributos } from './zod.js';
import * as S from '../consts/schemas/componentes.schemas.js';

const MAPA = new Map<string, ReadonlySet<string>>();

export function registrarClaves(tag: string, esquema: { shape: object }): void {
  MAPA.set(tag, clavesDe(esquema));
}

registrarClaves('coco-app', S.CocoAppPropsSchema);
registrarClaves('coco-acceso', S.CocoAccesoPropsSchema);
registrarClaves('coco-tabla', S.CocoTablaPropsSchema);
registrarClaves('coco-ficha', S.CocoFichaPropsSchema);
registrarClaves('coco-catalogo', S.CocoCatalogoPropsSchema);
registrarClaves('coco-inicio', S.SinPropsSchema);
registrarClaves('coco-documentos', S.CocoDocumentosPropsSchema);
registrarClaves('coco-factura', S.CocoFacturaPropsSchema);
registrarClaves('coco-cartera', S.CocoCarteraPropsSchema);
registrarClaves('coco-caja', S.SinPropsSchema);
registrarClaves('coco-informes', S.SinPropsSchema);
registrarClaves('coco-comprobantes', S.SinPropsSchema);
registrarClaves('coco-ajustes', S.CocoAjustesPropsSchema);

export function revisarProps(tag: string, valor: unknown): void {
  if (!valor || typeof valor !== 'object') return;
  const claves = MAPA.get(tag);
  if (claves) avisarPropsNoIdentificadas(tag, claves, valor);
}

if (typeof document !== 'undefined') instalarVigilanciaAtributos('coco');
