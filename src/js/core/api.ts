// @contexto AGENTS.md · specs/foundation/10-plataforma.md
/**
 * api.ts — cliente del API de CoContable y estado de la sesión (sin DOM de componentes).
 *
 * - Base del API: `<meta name="cocontable-api">`; en `localhost`/`127.0.0.1` usa el API local (`deno task dev` del API).
 * - Sesión: token Bearer y empresa activa en `localStorage`. Sin sesión la empresa activa es `demo` (solo lectura).
 * - Cada cambio de sesión o de empresa emite `coco:sesion` en `window`: el shell y las vistas se repintan.
 * - Los datos externos se validan con Zod en `consts/schemas/api.schemas.ts`; aquí nunca se castea con `as` un cuerpo.
 */
import { PerfilSchema } from '../consts/schemas/api.schemas.js';
import type { Perfil } from '../consts/schemas/api.schemas.js';

const LLAVE_TOKEN = 'coco:token';
const LLAVE_EMPRESA = 'coco:empresa';
export const DEMO = 'demo';

/** Error del API con su estado HTTP y un mensaje para la persona. */
export class ErrorApi extends Error {
  constructor(readonly estado: number, mensaje: string) {
    super(mensaje);
  }
}

const leer = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const guardar = (k: string, v: string | null): void => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { /* sin almacenamiento: la sesión dura lo que la pestaña */ }
};

/** URL base del API (sin barra final). */
export function baseApi(): string {
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${local ? 'cocontable-api-local' : 'cocontable-api'}"]`);
  return (meta?.content ?? '').replace(/\/+$/, '');
}

let perfilActual: Perfil | null = null;

export const sesion = {
  get token(): string | null {
    return leer(LLAVE_TOKEN);
  },
  get empresa(): string {
    return leer(LLAVE_EMPRESA) ?? DEMO;
  },
  get perfil(): Perfil | null {
    return perfilActual;
  },
  /** Rol en la empresa activa (PUBLICO en la demo). */
  get rol(): string {
    return perfilActual?.empresas.find((e) => e.iempresa === this.empresa)?.rol ?? 'PUBLICO';
  },
  /** ¿Puede escribir en la empresa activa? (la demo y el rol CONSULTA solo leen). */
  get puedeEscribir(): boolean {
    return !['PUBLICO', 'CONSULTA'].includes(this.rol);
  },
  cambiarEmpresa(iempresa: string): void {
    guardar(LLAVE_EMPRESA, iempresa);
    avisarCambio();
  },
};

function avisarCambio(): void {
  window.dispatchEvent(new CustomEvent('coco:sesion'));
}

/** Llama al API. Un cuerpo de error `{ error }` se lanza como `ErrorApi`. */
export async function pedir(metodo: string, ruta: string, cuerpo?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'x-empresa': sesion.empresa };
  if (cuerpo !== undefined) headers['content-type'] = 'application/json';
  if (sesion.token) headers['authorization'] = `Bearer ${sesion.token}`;
  const llamar = () => fetch(`${baseApi()}/${ruta}`, { method: metodo, headers, ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }) });
  let res: Response;
  try {
    res = await llamar();
    // Una lectura que cae en un arranque en frío del Worker (503) se reintenta una vez; una escritura nunca se repite sola.
    if (res.status === 503 && metodo === 'GET') {
      await new Promise((r) => setTimeout(r, 900));
      res = await llamar();
    }
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
  }
  if (res.status === 204) return null;
  const texto = await res.text();
  let datos: unknown = texto;
  try {
    datos = JSON.parse(texto);
  } catch { /* respuesta de texto (csv) */ }
  if (!res.ok) {
    const mensaje = datos && typeof datos === 'object' && 'error' in datos ? String(datos.error) : `El servidor respondió ${res.status}`;
    if (res.status === 401 && sesion.token && /sesi[oó]n/i.test(mensaje)) cerrarSesionLocal();
    throw new ErrorApi(res.status, mensaje);
  }
  return datos;
}

export const api = {
  get: (ruta: string) => pedir('GET', ruta),
  post: (ruta: string, cuerpo: unknown = {}) => pedir('POST', ruta, cuerpo),
  put: (ruta: string, cuerpo: unknown = {}) => pedir('PUT', ruta, cuerpo),
  del: (ruta: string) => pedir('DELETE', ruta),
  /** Lista (arreglo de filas) de una ruta; si la respuesta no es un arreglo, lista vacía. */
  async lista(ruta: string): Promise<Record<string, unknown>[]> {
    const r = await pedir('GET', ruta);
    return Array.isArray(r) ? r.filter((f): f is Record<string, unknown> => !!f && typeof f === 'object') : [];
  },
  /** Objeto de una ruta (informes, tablero, documento). */
  async objeto(metodo: string, ruta: string, cuerpo?: unknown): Promise<Record<string, unknown>> {
    const r = await pedir(metodo, ruta, cuerpo);
    return r && typeof r === 'object' && !Array.isArray(r) ? Object.fromEntries(Object.entries(r)) : {};
  },
};

/** Carga el perfil (usuario, empresas, preferencias) y corrige la empresa activa si ya no es visible. */
export async function cargarPerfil(): Promise<Perfil> {
  const r = PerfilSchema.safeParse(await pedir('GET', 'perfil'));
  perfilActual = r.success ? r.data : { autenticado: false, usuario: null, nombre: null, email: null, empresas: [], preferencias: {} };
  if (!perfilActual.empresas.some((e) => e.iempresa === sesion.empresa)) {
    const propia = perfilActual.empresas.find((e) => e.iempresa !== DEMO);
    guardar(LLAVE_EMPRESA, propia?.iempresa ?? DEMO);
  }
  return perfilActual;
}

function tokenDe(datos: unknown): string {
  const token = datos && typeof datos === 'object' && 'token' in datos ? datos.token : null;
  if (typeof token !== 'string' || !token) throw new ErrorApi(500, 'El servidor no devolvió la sesión');
  return token;
}

/** Inicia sesión y deja activa la primera empresa propia. */
export async function entrar(usuario: string, password: string): Promise<void> {
  guardar(LLAVE_TOKEN, tokenDe(await pedir('POST', 'usuarios/login', { usuario, password })));
  guardar(LLAVE_EMPRESA, null);
  await cargarPerfil();
  avisarCambio();
}

/** Crea la cuenta y abre la sesión. */
export async function registrarse(datos: { iusuario: string; nombre: string; email: string; password: string }): Promise<void> {
  guardar(LLAVE_TOKEN, tokenDe(await pedir('POST', 'registro', datos)));
  guardar(LLAVE_EMPRESA, null);
  await cargarPerfil();
  avisarCambio();
}

function cerrarSesionLocal(): void {
  guardar(LLAVE_TOKEN, null);
  guardar(LLAVE_EMPRESA, null);
  perfilActual = null;
}

/** Cierra la sesión en el servidor (si responde) y vuelve a la demo. */
export async function salir(): Promise<void> {
  await pedir('DELETE', 'usuario/logout').catch(() => null);
  cerrarSesionLocal();
  await cargarPerfil().catch(() => null);
  avisarCambio();
}

/** Guarda las preferencias de interfaz: en el servidor con sesión, siempre en este navegador. */
export async function guardarPreferencias(cambios: Record<string, unknown>): Promise<Record<string, unknown>> {
  const actuales = { ...(perfilActual?.preferencias ?? {}), ...preferenciasLocales(), ...cambios };
  guardar('coco:preferencias', JSON.stringify(actuales));
  if (perfilActual) perfilActual.preferencias = actuales;
  if (sesion.token) await pedir('PUT', 'preferencias', actuales).catch(() => null);
  return actuales;
}

/** Preferencias guardadas en este navegador (sirven sin sesión y antes de que responda el servidor). */
export function preferenciasLocales(): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(leer('coco:preferencias') ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v)) : {};
  } catch {
    return {};
  }
}
