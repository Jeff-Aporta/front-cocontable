// @contexto AGENTS.md · specs/foundation/20-componentes-y-vistas.md
/**
 * catalogos.ts — definición declarativa de los catálogos (tabla + ficha por pestañas). `<coco-catalogo>` pinta cualquiera
 * de ellos: para agregar un catálogo o un campo se toca SOLO este archivo. Las rutas son las del CRUD de DER del API.
 */
import { CatalogoSchema } from '../consts/schemas/api.schemas.js';
import type { CampoEntrada, Catalogo, ColumnaEntrada } from '../consts/schemas/api.schemas.js';

const siNo = (nombre: string, etiqueta: string, pestana: string, defecto = false): CampoEntrada => ({ nombre, etiqueta, tipo: 'si-no', pestana, defecto });
const op = (...pares: [string, string][]) => pares.map(([valor, texto]) => ({ valor, texto }));
const cuenta = (nombre: string, etiqueta: string, pestana = 'Contabilidad'): CampoEntrada => ({ nombre, etiqueta, tipo: 'opcion', pestana, fuente: { ruta: 'cuentas', valor: 'codigo', texto: 'nombre' } });

const TIPOS_DOCUMENTO = op(['13', '13 · Cédula de ciudadanía'], ['31', '31 · NIT'], ['22', '22 · Cédula de extranjería'], ['41', '41 · Pasaporte'], ['12', '12 · Tarjeta de identidad'], ['42', '42 · Documento extranjero'], ['50', '50 · NIT de otro país'], ['91', '91 · NUIP']);
const CONTRIBUYENTE = op(['responsable_iva', 'Responsable de IVA'], ['no_responsable_iva', 'No responsable de IVA'], ['regimen_simple', 'Régimen simple de tributación'], ['gran_contribuyente', 'Gran contribuyente'], ['exterior', 'Del exterior']);

/** Ficha de un tercero: las pestañas del software de referencia (datos básicos, ubicación, tributaria, banco, comercial). */
const camposTercero = (): CampoEntrada[] => [
  { nombre: 'tipo_persona', etiqueta: 'Tipo de persona', tipo: 'opcion', requerido: true, defecto: 'PN', opciones: op(['PN', 'PN · Persona natural'], ['PJ', 'PJ · Persona jurídica']) },
  { nombre: 'tipo_documento', etiqueta: 'Tipo de documento', tipo: 'opcion', requerido: true, defecto: '13', opciones: TIPOS_DOCUMENTO },
  { nombre: 'nit', etiqueta: 'Número de documento', requerido: true, soloAlta: true, ayuda: 'Sin dígito de verificación: se calcula solo.' },
  { nombre: 'nombres', etiqueta: 'Nombres' },
  { nombre: 'primer_apellido', etiqueta: 'Primer apellido' },
  { nombre: 'segundo_apellido', etiqueta: 'Segundo apellido' },
  { nombre: 'nombre', etiqueta: 'Razón social', ayuda: 'Si se deja vacío se arma con nombres y apellidos.' },
  { nombre: 'nombre_comercial', etiqueta: 'Nombre comercial' },
  { nombre: 'matricula_mercantil', etiqueta: 'Matrícula mercantil' },
  { nombre: 'genero', etiqueta: 'Género', tipo: 'opcion', opciones: op(['F', 'Femenino'], ['M', 'Masculino'], ['O', 'Otro']) },
  { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
  siNo('es_cliente', 'Es cliente', 'Datos básicos'),
  siNo('es_proveedor', 'Es proveedor', 'Datos básicos'),
  siNo('es_empleado', 'Es empleado', 'Datos básicos'),
  siNo('es_vendedor', 'Es vendedor', 'Datos básicos'),
  { nombre: 'departamento', etiqueta: 'Departamento', pestana: 'Ubicación' },
  { nombre: 'ciudad', etiqueta: 'Ciudad', pestana: 'Ubicación' },
  { nombre: 'direccion', etiqueta: 'Dirección', pestana: 'Ubicación' },
  { nombre: 'telefono', etiqueta: 'Teléfono', pestana: 'Ubicación' },
  { nombre: 'celular', etiqueta: 'Celular', pestana: 'Ubicación' },
  { nombre: 'email', etiqueta: 'Correo', tipo: 'correo', pestana: 'Ubicación' },
  { nombre: 'tipo_contribuyente', etiqueta: 'Tipo de contribuyente', tipo: 'opcion', pestana: 'Clasificación tributaria', defecto: 'no_responsable_iva', opciones: CONTRIBUYENTE },
  { nombre: 'actividad_economica', etiqueta: 'Actividad económica (CIIU)', pestana: 'Clasificación tributaria' },
  siNo('bautorretenedor', 'Autorretenedor', 'Clasificación tributaria'),
  siNo('bagente_retencion', 'Agente de retención', 'Clasificación tributaria'),
  { nombre: 'banco', etiqueta: 'Banco', pestana: 'Cuenta bancaria' },
  { nombre: 'tipo_cuenta', etiqueta: 'Tipo de cuenta', tipo: 'opcion', pestana: 'Cuenta bancaria', opciones: op(['ahorros', 'Ahorros'], ['corriente', 'Corriente']) },
  { nombre: 'numero_cuenta', etiqueta: 'Número de cuenta', pestana: 'Cuenta bancaria' },
  { nombre: 'plazo_dias', etiqueta: 'Plazo de pago (días)', tipo: 'numero', pestana: 'Descuentos y crédito', defecto: 0 },
  { nombre: 'cupo_credito', etiqueta: 'Cupo de crédito', tipo: 'dinero', pestana: 'Descuentos y crédito', defecto: 0 },
  { nombre: 'descuento_pct', etiqueta: 'Descuento habitual (%)', tipo: 'numero', pestana: 'Descuentos y crédito', defecto: 0 },
  { nombre: 'foto', etiqueta: 'Logo o foto (URL)', pestana: 'Logo o foto' },
  siNo('activo', 'Activo', 'Datos básicos', true),
];

const columnasTercero: ColumnaEntrada[] = [{ campo: 'nit', titulo: 'Documento', ancho: 130 }, { campo: 'dv', titulo: 'DV', ancho: 60 }, { campo: 'nombre', titulo: 'Nombre o razón social' }, { campo: 'ciudad', titulo: 'Ciudad', ancho: 140 }, { campo: 'telefono', titulo: 'Teléfono', ancho: 130 }, { campo: 'email', titulo: 'Correo' }, { campo: 'activo', titulo: 'Activo', tipo: 'si-no', ancho: 90 }];

/** Variante de terceros por rol: filtra la lista y marca el rol al crear. */
const terceros = (id: string, titulo: string, singular: string, icono: string, rol?: string) => ({ id, titulo, singular, icono, rutaLista: 'terceros', rutaUno: 'tercero', llave: 'nit', ...(rol ? { filtro: { [rol]: true }, fijos: { [rol]: true } } : {}), columnas: columnasTercero, campos: camposTercero() });

const simple = (id: string, titulo: string, singular: string, icono: string, rutaLista: string, rutaUno: string, extra: CampoEntrada[] = [], columnas: ColumnaEntrada[] = []) => ({
  id, titulo, singular, icono, rutaLista, rutaUno, llave: 'codigo',
  columnas: [{ campo: 'codigo', titulo: 'Código', ancho: 140 }, { campo: 'nombre', titulo: 'Nombre' }, ...columnas, { campo: 'activo', titulo: 'Activo', tipo: 'si-no' as const, ancho: 90 }],
  campos: [{ nombre: 'codigo', etiqueta: 'Código', requerido: true, soloAlta: true }, { nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, ...extra, siNo('activo', 'Activo', 'Datos básicos', true)],
});

const DEFINICIONES = [
  terceros('clientes', 'Clientes', 'cliente', 'mdi:account-group', 'es_cliente'),
  terceros('proveedores', 'Proveedores', 'proveedor', 'mdi:truck-delivery', 'es_proveedor'),
  terceros('empleados', 'Empleados', 'empleado', 'mdi:badge-account', 'es_empleado'),
  terceros('vendedores', 'Vendedores', 'vendedor', 'mdi:account-tie', 'es_vendedor'),
  terceros('terceros', 'Todos los terceros', 'tercero', 'mdi:account-multiple'),
  {
    id: 'productos', titulo: 'Productos y servicios', singular: 'producto', icono: 'mdi:package-variant', rutaLista: 'productos', rutaUno: 'producto', llave: 'codigo',
    columnas: [{ campo: 'codigo', titulo: 'Referencia', ancho: 140 }, { campo: 'codigo_barras', titulo: 'Código de barras', ancho: 160 }, { campo: 'nombre', titulo: 'Nombre' }, { campo: 'categoria', titulo: 'Categoría', ancho: 140 }, { campo: 'costo', titulo: 'Costo', tipo: 'dinero', ancho: 130 }, { campo: 'precio_venta', titulo: 'Precio de venta', tipo: 'dinero', ancho: 150 }, { campo: 'activo', titulo: 'Activo', tipo: 'si-no', ancho: 90 }],
    campos: [
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', requerido: true, defecto: 'producto', opciones: op(['producto', 'Físico (maneja inventario)'], ['servicio', 'Servicio']) },
      { nombre: 'codigo', etiqueta: 'Referencia', requerido: true, soloAlta: true, ayuda: 'Prefijo y número, por ejemplo PSC000140.' },
      { nombre: 'codigo_barras', etiqueta: 'Código de barras' },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'categoria', etiqueta: 'Categoría', tipo: 'opcion', fuente: { ruta: 'categorias', valor: 'codigo', texto: 'nombre' } },
      { nombre: 'unidad', etiqueta: 'Unidad de medida', defecto: 'und' },
      { nombre: 'costo', etiqueta: 'Costo (sin IVA)', tipo: 'dinero', pestana: 'Precios e impuestos', defecto: 0 },
      { nombre: 'impuesto', etiqueta: 'Impuesto cargo (IVA)', tipo: 'opcion', pestana: 'Precios e impuestos', defecto: 'IVA19', fuente: { ruta: 'impuestos', valor: 'codigo', texto: 'nombre' } },
      { nombre: 'impuesto_consumo', etiqueta: 'Impuesto al consumo', tipo: 'opcion', pestana: 'Precios e impuestos', fuente: { ruta: 'impuestos', valor: 'codigo', texto: 'nombre' } },
      { nombre: 'precio_venta', etiqueta: 'Precio de venta', tipo: 'dinero', pestana: 'Precios e impuestos', defecto: 0 },
      siNo('bprecio_incluye_iva', 'El precio de venta ya incluye IVA', 'Precios e impuestos'),
      siNo('binventario', 'Controla existencias', 'Inventario', true),
      { nombre: 'stock_minimo', etiqueta: 'Existencia mínima', tipo: 'numero', pestana: 'Inventario', defecto: 0 },
      siNo('activo', 'Activo', 'Datos básicos', true),
    ],
  },
  simple('categorias', 'Categorías', 'categoría', 'mdi:shape', 'categorias', 'categoria', [cuenta('cta_inventario', 'Cuenta de inventario'), cuenta('cta_ingreso', 'Cuenta de ingreso'), cuenta('cta_costo', 'Cuenta de costo'), cuenta('cta_gasto', 'Cuenta de gasto')]),
  simple('bodegas', 'Bodegas', 'bodega', 'mdi:warehouse', 'bodegas', 'bodega', [{ nombre: 'direccion', etiqueta: 'Dirección' }]),
  simple('centros', 'Centros de costo', 'centro de costo', 'mdi:sitemap', 'centros-costo', 'centro-costo'),
  {
    id: 'cuentas', titulo: 'Catálogo de cuentas', singular: 'cuenta', icono: 'mdi:file-tree', rutaLista: 'cuentas', rutaUno: 'cuenta', llave: 'codigo', arbol: true,
    columnas: [{ campo: 'codigo', titulo: 'Código', ancho: 140 }, { campo: 'nombre', titulo: 'Cuenta contable' }, { campo: 'naturaleza', titulo: 'Naturaleza', ancho: 110 }, { campo: 'auxiliar', titulo: 'Auxiliar', tipo: 'si-no', ancho: 100 }, { campo: 'exige_tercero', titulo: 'Exige tercero', tipo: 'si-no', ancho: 130 }],
    campos: [
      { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloAlta: true, ayuda: 'Debe empezar por el código de una cuenta que ya exista (su cuenta padre).' },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'naturaleza', etiqueta: 'Naturaleza', tipo: 'opcion', requerido: true, defecto: 'D', opciones: op(['D', 'Débito'], ['C', 'Crédito']) },
      siNo('exige_tercero', 'Exige tercero en cada movimiento', 'Datos básicos'),
      siNo('exige_cc', 'Exige centro de costo', 'Datos básicos'),
      siNo('activo', 'Activa', 'Datos básicos', true),
    ],
  },
  {
    id: 'tipos', titulo: 'Tipos de comprobante', singular: 'tipo de comprobante', icono: 'mdi:file-cog', rutaLista: 'tipos-comprobante', rutaUno: 'tipo-comprobante', llave: 'codigo',
    columnas: [{ campo: 'codigo', titulo: 'Código', ancho: 110 }, { campo: 'nombre', titulo: 'Título' }, { campo: 'clase', titulo: 'Clase', ancho: 130 }, { campo: 'consecutivo', titulo: 'Consecutivo', tipo: 'numero', ancho: 130 }, { campo: 'activo', titulo: 'Activo', tipo: 'si-no', ancho: 90 }],
    campos: [
      { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloAlta: true },
      { nombre: 'nombre', etiqueta: 'Título', requerido: true },
      { nombre: 'clase', etiqueta: 'Clase', tipo: 'opcion', defecto: 'nota', opciones: op(['nota', 'Nota contable'], ['nomina', 'Nómina'], ['cierre', 'Cierre']) },
      { nombre: 'consecutivo', etiqueta: 'Último consecutivo usado', tipo: 'numero', defecto: 0 },
      siNo('bmanual', 'Se digita a mano', 'Datos básicos', true),
      siNo('activo', 'Activo', 'Datos básicos', true),
    ],
  },
  {
    id: 'impuestos', titulo: 'Impuestos y retenciones', singular: 'impuesto', icono: 'mdi:percent', rutaLista: 'impuestos', rutaUno: 'impuesto', llave: 'codigo',
    columnas: [{ campo: 'codigo', titulo: 'Código', ancho: 110 }, { campo: 'nombre', titulo: 'Nombre' }, { campo: 'tipo', titulo: 'Tipo', ancho: 130 }, { campo: 'tarifa', titulo: 'Tarifa %', tipo: 'numero', ancho: 110 }, { campo: 'base_minima', titulo: 'Base mínima', tipo: 'dinero', ancho: 140 }],
    campos: [
      { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloAlta: true },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', requerido: true, defecto: 'IVA', opciones: op(['IVA', 'IVA'], ['INC', 'Impuesto al consumo'], ['RETEFUENTE', 'Retención en la fuente'], ['RETEIVA', 'Retención de IVA'], ['RETEICA', 'Retención de ICA']) },
      { nombre: 'tarifa', etiqueta: 'Tarifa (%)', tipo: 'numero', requerido: true, defecto: 0 },
      { nombre: 'base_minima', etiqueta: 'Base mínima', tipo: 'dinero', defecto: 0 },
      cuenta('cta_ventas', 'Cuenta cuando vendemos', 'Datos básicos'),
      cuenta('cta_compras', 'Cuenta cuando compramos', 'Datos básicos'),
      siNo('activo', 'Activo', 'Datos básicos', true),
    ],
  },
  {
    id: 'resoluciones', titulo: 'Numeraciones y resoluciones', singular: 'numeración', icono: 'mdi:numeric', rutaLista: 'resoluciones', rutaUno: 'resolucion', llave: 'iresolucion',
    columnas: [{ campo: 'iresolucion', titulo: 'Código', ancho: 110 }, { campo: 'nombre', titulo: 'Nombre' }, { campo: 'clase', titulo: 'Clase', ancho: 100 }, { campo: 'prefijo', titulo: 'Prefijo', ancho: 100 }, { campo: 'consecutivo', titulo: 'Último número', tipo: 'numero', ancho: 140 }, { campo: 'hasta', titulo: 'Hasta', tipo: 'numero', ancho: 130 }],
    campos: [
      { nombre: 'iresolucion', etiqueta: 'Código', requerido: true, soloAlta: true },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'clase', etiqueta: 'Clase de documento', tipo: 'opcion', requerido: true, opciones: op(['FV', 'Factura de venta'], ['POS', 'Tirilla POS'], ['COT', 'Cotización'], ['REM', 'Remisión'], ['NCV', 'Nota crédito'], ['FC', 'Factura de compra'], ['RC', 'Recibo de caja'], ['CE', 'Comprobante de egreso'], ['AI', 'Ajuste de inventario']) },
      { nombre: 'prefijo', etiqueta: 'Prefijo' },
      { nombre: 'numero_resolucion', etiqueta: 'Número de resolución DIAN' },
      { nombre: 'desde', etiqueta: 'Desde', tipo: 'numero', defecto: 1 },
      { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'numero', defecto: 999999999 },
      { nombre: 'vence', etiqueta: 'Vigente hasta', tipo: 'fecha' },
      siNo('activo', 'Activa', 'Datos básicos', true),
    ],
  },
  {
    id: 'formas', titulo: 'Formas de pago', singular: 'forma de pago', icono: 'mdi:cash-multiple', rutaLista: 'formas-pago', rutaUno: 'forma-pago', llave: 'codigo',
    columnas: [{ campo: 'codigo', titulo: 'Código', ancho: 160 }, { campo: 'nombre', titulo: 'Nombre' }, { campo: 'tipo', titulo: 'Tipo', ancho: 130 }, { campo: 'cuenta', titulo: 'Cuenta contable', ancho: 160 }],
    campos: [
      { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloAlta: true },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', defecto: 'efectivo', opciones: op(['efectivo', 'Efectivo'], ['banco', 'Banco'], ['tarjeta', 'Tarjeta'], ['credito', 'Crédito (crea cartera)']) },
      cuenta('cuenta', 'Cuenta contable', 'Datos básicos'),
      siNo('activo', 'Activa', 'Datos básicos', true),
    ],
  },
];

/** Catálogos validados, por id. */
export const CATALOGOS: Record<string, Catalogo> = Object.fromEntries(DEFINICIONES.map((d) => [d.id, CatalogoSchema.parse(d)]));

/** El catálogo de un id (o `undefined`). */
export const catalogo = (id: string): Catalogo | undefined => CATALOGOS[id];
