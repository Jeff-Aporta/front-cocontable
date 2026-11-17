// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * menu.ts — el menú lateral: cada entrada abre una vista (su tag) con sus props. Mismo orden de módulos que un software
 * contable colombiano de referencia. Agregar una pantalla = una línea aquí (y su componente registrado en `kit-tags.ts`).
 */
import { ModuloSchema } from '../consts/schemas/api.schemas.js';
import type { Modulo, ModuloEntrada } from '../consts/schemas/api.schemas.js';

const cat = (id: string, titulo: string, icono: string, grupo: string): ModuloEntrada => ({ id, titulo, icono, grupo, tag: 'coco-catalogo', props: { catalogo: id } });
const doc = (id: string, titulo: string, icono: string, grupo: string, clases: string, nuevo: string): ModuloEntrada => ({ id, titulo, icono, grupo, tag: 'coco-documentos', props: { clases, nuevo } });

const ENTRADAS: ModuloEntrada[] = [
  { id: 'inicio', titulo: 'Inicio', icono: 'mdi:home', grupo: '', tag: 'coco-inicio' },
  cat('clientes', 'Clientes', 'mdi:account-group', 'Terceros'),
  cat('proveedores', 'Proveedores', 'mdi:truck-delivery', 'Terceros'),
  cat('empleados', 'Empleados', 'mdi:badge-account', 'Terceros'),
  cat('vendedores', 'Vendedores', 'mdi:account-tie', 'Terceros'),
  cat('productos', 'Productos', 'mdi:package-variant', 'Inventario'),
  cat('categorias', 'Categorías', 'mdi:shape', 'Inventario'),
  cat('bodegas', 'Bodegas', 'mdi:warehouse', 'Inventario'),
  doc('ajustes-inventario', 'Ajustes de inventario', 'mdi:clipboard-edit', 'Inventario', 'AI', 'AI'),
  doc('facturas', 'Facturas', 'mdi:receipt-text', 'Ventas', 'FV,POS', 'FV'),
  { id: 'pos', titulo: 'Punto de venta', icono: 'mdi:cash-register', grupo: 'Ventas', tag: 'coco-factura', props: { clase: 'POS' } },
  doc('cotizaciones', 'Cotizaciones', 'mdi:file-document-edit', 'Ventas', 'COT', 'COT'),
  doc('remisiones', 'Remisiones', 'mdi:truck-check', 'Ventas', 'REM', 'REM'),
  doc('notas-credito', 'Notas crédito', 'mdi:file-undo', 'Ventas', 'NCV', ''),
  doc('compras', 'Facturas de compra', 'mdi:cart', 'Compras', 'FC', 'FC'),
  { id: 'cxc', titulo: 'Cartera por cobrar', icono: 'mdi:hand-coin', grupo: 'Cartera', tag: 'coco-cartera', props: { tipo: 'CxC' } },
  { id: 'cxp', titulo: 'Cartera por pagar', icono: 'mdi:credit-card-clock', grupo: 'Cartera', tag: 'coco-cartera', props: { tipo: 'CxP' } },
  doc('ingresos', 'Recibos de caja', 'mdi:cash-plus', 'Ingresos y gastos', 'RC', 'RC'),
  doc('egresos', 'Comprobantes de egreso', 'mdi:cash-minus', 'Ingresos y gastos', 'CE', 'CE'),
  { id: 'caja', titulo: 'Cierre de caja', icono: 'mdi:safe', grupo: 'Ingresos y gastos', tag: 'coco-caja' },
  { id: 'informes', titulo: 'Informes', icono: 'mdi:chart-box', grupo: '', tag: 'coco-informes' },
  cat('cuentas', 'Catálogo de cuentas', 'mdi:file-tree', 'Contabilidad'),
  cat('tipos', 'Tipos de comprobante', 'mdi:file-cog', 'Contabilidad'),
  cat('centros', 'Centros de costo', 'mdi:sitemap', 'Contabilidad'),
  { id: 'comprobantes', titulo: 'Comprobantes', icono: 'mdi:book-open-variant', grupo: 'Contabilidad', tag: 'coco-comprobantes' },
  cat('impuestos', 'Impuestos', 'mdi:percent', 'Configuración'),
  cat('resoluciones', 'Numeraciones', 'mdi:numeric', 'Configuración'),
  cat('formas', 'Formas de pago', 'mdi:cash-multiple', 'Configuración'),
  { id: 'empresas', titulo: 'Empresas y equipo', icono: 'mdi:domain', grupo: 'Configuración', tag: 'coco-ajustes', props: { seccion: 'empresas' } },
  { id: 'agentes', titulo: 'Agentes de IA', icono: 'mdi:robot-happy', grupo: 'Configuración', tag: 'coco-ajustes', props: { seccion: 'agentes' } },
  { id: 'apariencia', titulo: 'Apariencia', icono: 'mdi:palette', grupo: 'Configuración', tag: 'coco-ajustes', props: { seccion: 'apariencia' } },
];

/** Módulos del menú, validados. */
export const MODULOS: Modulo[] = ENTRADAS.map((e) => ModuloSchema.parse(e));

/** Grupos en el orden en que aparecen (el grupo vacío son entradas sueltas). */
export const GRUPOS: string[] = [...new Set(MODULOS.map((m) => m.grupo))];

/** El módulo de un id (o el de inicio). */
export const modulo = (id: string): Modulo => MODULOS.find((m) => m.id === id) ?? MODULOS[0]!;
