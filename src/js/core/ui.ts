// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * ui.ts — utilidades de presentación sin estructura propia: formato de valores de celda, fecha contable de hoy, lectura
 * de valores de los controles del kit y caché corta de las listas que alimentan los selectores.
 */
import { api } from './api.js';
import type { Fila, Opcion } from '../consts/schemas/api.schemas.js';

const PESOS = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const NUMERO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** Pantalla angosta (celular, ≤ 720 px): menú en íconos, edición en drawer inferior, sin arte decorativo. */
export const angosto = (): boolean => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;

/** Número desde un valor del API (los decimales pueden llegar como texto). */
export const num = (v: unknown): number => (v == null || v === '' ? 0 : Number(v) || 0);

/** Pesos colombianos sin decimales: `$ 21.420`. */
export const dinero = (v: unknown): string => PESOS.format(num(v));

/** Texto de una celda según el tipo de su columna. */
export function celda(valor: unknown, tipo: string): string {
  if (tipo === 'dinero') return dinero(valor);
  if (tipo === 'numero') return NUMERO.format(num(valor));
  if (tipo === 'si-no') return valor === true || valor === 1 || valor === '1' ? 'Sí' : 'No';
  if (valor == null) return '';
  return String(valor);
}

/** Hoy (AAAA-MM-DD) en la hora de Colombia. */
export function hoy(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Primer día del año en curso. */
export const inicioAnio = (): string => `${hoy().slice(0, 4)}-01-01`;

/** Valor de un control del kit o nativo (`value`; `checked` en interruptores). */
export function valorDe(control: Element | null): unknown {
  if (!control) return undefined;
  if ('checked' in control && (control.localName === 'iswc-switch' || control.localName === 'iswc-checkbox')) return control.checked === true;
  return 'value' in control ? control.value : undefined;
}

/** Texto recortado de un control (cadena vacía si no hay). */
export const textoDe = (control: Element | null): string => String(valorDe(control) ?? '').trim();

const cache = new Map<string, { hasta: number; datos: Promise<Fila[]> }>();

/** Lista de un catálogo del API con caché de 30 s por empresa (alimenta selectores sin repetir viajes). */
export function listaCacheada(ruta: string, empresa: string): Promise<Fila[]> {
  const clave = `${empresa}|${ruta}`;
  const previo = cache.get(clave);
  if (previo && previo.hasta > Date.now()) return previo.datos;
  const datos = api.lista(ruta).catch(() => []);
  cache.set(clave, { hasta: Date.now() + 30_000, datos });
  return datos;
}

/** Olvida la caché (tras crear o editar en un catálogo). */
export function limpiarCache(): void {
  cache.clear();
}

/** Opciones `{ valor, texto }` a partir de una lista del API. */
export function opcionesDe(lista: Fila[], valor: string, texto: string): Opcion[] {
  return lista.map((f) => ({ valor: String(f[valor] ?? ''), texto: `${f[valor] ?? ''} · ${f[texto] ?? ''}` }));
}

/** Descarga un texto como archivo (exportaciones CSV). */
export function descargar(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV (separador punto y coma, con BOM: lo abre Excel en español) de unas filas y sus columnas. */
export function aCsv(filas: Fila[], columnas: { campo: string; titulo: string }[]): string {
  const limpio = (v: unknown) => {
    const t = v == null ? '' : String(v);
    return /[";\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
  };
  return '﻿' + [columnas.map((c) => limpio(c.titulo)).join(';'), ...filas.map((f) => columnas.map((c) => limpio(f[c.campo])).join(';'))].join('\r\n');
}
