// @contexto AGENTS.md · specs/iswc/nuevo-componente.md
/**
 * controles.ts — fábricas de controles del kit ya cableados (selector con opciones, campo con valor y aviso de cambio)
 * y lectura segura del `detail` de un evento. Evita repetir en cada vista el mismo armado de `<iswc-select>`.
 */
import type { Fila, Opcion } from '../consts/schemas/api.schemas.js';

/** `detail` de un CustomEvent como objeto plano (vacío si no lo es). */
export function detalle(e: Event): Fila {
  const d: unknown = e instanceof CustomEvent ? e.detail : null;
  return d && typeof d === 'object' && !Array.isArray(d) ? Object.fromEntries(Object.entries(d)) : {};
}

/** Valor actual (texto) del control que originó un evento. */
export function valorEvento(e: Event): string {
  const t = e.currentTarget ?? e.target;
  return t && typeof t === 'object' && 'value' in t ? String(t.value ?? '') : '';
}

/** `<iswc-select>` con sus opciones, su valor y aviso de cambio. `atributos` extra van tal cual (clearable, class…). */
export function selector(etiqueta: string, opciones: Opcion[], valor: string, alCambiar: (valor: string) => void, atributos: Record<string, string> = {}): HTMLElement {
  const select = document.createElement('iswc-select');
  if (etiqueta) select.setAttribute('label', etiqueta);
  select.setAttribute('full-width', '');
  for (const [k, v] of Object.entries(atributos)) select.setAttribute(k, v);
  select.replaceChildren(...opciones.map((o) => Object.assign(document.createElement('iswc-option'), { value: o.valor, textContent: o.texto })));
  Object.assign(select, { value: valor });
  select.addEventListener('iswc-change', () => {
    const nuevo = 'value' in select ? String(select.value ?? '') : '';
    if (nuevo !== valor) alCambiar(nuevo);
  });
  return select;
}

/** `<iswc-input>` con etiqueta, tipo, valor y aviso al terminar de escribir o al cambiar. */
export function campo(etiqueta: string, tipo: string, valor: string | number, alCambiar: (valor: string) => void, atributos: Record<string, string> = {}): HTMLElement {
  const input = document.createElement('iswc-input');
  if (etiqueta) input.setAttribute('label', etiqueta);
  input.setAttribute('type', tipo);
  for (const [k, v] of Object.entries(atributos)) input.setAttribute(k, v);
  Object.assign(input, { value: String(valor ?? '') });
  const avisar = () => alCambiar('value' in input ? String(input.value ?? '') : '');
  input.addEventListener('iswc-change', avisar);
  return input;
}

/** Opciones a partir de pares `[valor, texto]`. */
export const opciones = (...pares: [string, string][]): Opcion[] => pares.map(([valor, texto]) => ({ valor, texto }));
