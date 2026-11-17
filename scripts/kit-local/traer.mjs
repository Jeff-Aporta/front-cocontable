// @contexto src/kit-local/README.md
// traer.mjs — copia un componente del kit (fuente en D:/VPS/transversales/iswc-base/src) a src/kit-local/ con TODO su
// cierre de imports relativos, y reescribe los alias `@jeff-aporta/iswc-base/...`:
//   · módulos internos del mismo componente (utils, schemas) → copia local (relativa)
//   · componentes y core publicados en el pin → `@jeff-aporta/iswc-base/<carpeta>/<x>.min.mjs` (CDN del pin)
// Uso: node scripts/kit-local/traer.mjs components/data/ag-grid.ts [--kit=D:/VPS/transversales/iswc-base]
// Al terminar el ajuste, se lleva de vuelta con scripts/kit-local/devolver.mjs y se borra la copia.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const kit = (args.find((a) => a.startsWith('--kit='))?.slice(6) ?? 'D:/VPS/transversales/iswc-base').replace(/\\/g, '/');
const SRC = path.join(kit, 'src');
const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const DEST = path.join(RAIZ, 'src', 'kit-local');
const deps = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src', 'vendor', 'iswc-base', 'deps.json'), 'utf8'));
const publicados = new Set(Object.values(deps.tags).flat().concat(Object.values(deps.core ?? {}).flat()));
const enCdn = (rel) => publicados.has(`${rel}.min.mjs`);

/** src/components/data/x.ts → kit-local/data/x.ts ; src/core/x.ts → kit-local/core/x.ts */
const destino = (abs) => path.join(DEST, path.relative(SRC, abs).replace(/^components[\\/]/, ''));
const cdnDe = (rel) => rel.replace(/^components\//, '').replace(/\.js$/, '');

const pendientes = args.filter((a) => !a.startsWith('--')).map((a) => path.join(SRC, a));
const hechos = new Set();
const resolver = (desde, esp) => {
  let t = path.resolve(path.dirname(desde), esp).replace(/\.js$/, '.ts');
  if (!fs.existsSync(t)) t = t.replace(/\.ts$/, '.js');
  return fs.existsSync(t) ? t : null;
};
while (pendientes.length) {
  const f = pendientes.pop();
  if (hechos.has(f)) continue;
  hechos.add(f);
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/(from\s*|import\s*\(?\s*)(['"])([^'"]+)\2/g, (todo, pre, q, esp) => {
    if (esp.startsWith('.')) {
      const t = resolver(f, esp);
      if (t) pendientes.push(t);
      return todo;
    }
    const m = esp.match(/^@jeff-aporta\/iswc-base\/(.+)$/);
    if (!m) return todo;
    const rel = m[1];
    const cdn = cdnDe(rel);
    // del mismo componente (utils/schemas de data) o no publicado suelto: copia local
    const interno = rel.startsWith('components/data/utils/') || rel.startsWith('components/data/schemas/') || !enCdn(cdn);
    if (interno) {
      const abs = resolver(path.join(SRC, 'x.ts'), `./${rel}`);
      if (!abs) throw new Error(`no existe en el kit: ${esp} (desde ${f})`);
      pendientes.push(abs);
      let r = path.relative(path.dirname(destino(f)), destino(abs)).replace(/\\/g, '/').replace(/\.ts$/, '.js');
      if (!r.startsWith('.')) r = `./${r}`;
      return `${pre}${q}${r}${q}`;
    }
    return `${pre}${q}@jeff-aporta/iswc-base/${cdn}.min.mjs${q}`;
  });
  const out = destino(f);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, s);
  // hojas: la .scss hermana y sus parciales
  const scss = f.replace(/\.ts$/, '.scss');
  if (fs.existsSync(scss)) {
    fs.copyFileSync(scss, destino(scss));
    for (const u of fs.readFileSync(scss, 'utf8').matchAll(/@use\s+['"]([^'"]+)['"]/g)) {
      const p = path.join(path.dirname(scss), path.dirname(u[1]), `_${path.basename(u[1])}.scss`);
      if (fs.existsSync(p)) { fs.mkdirSync(path.dirname(destino(p)), { recursive: true }); fs.copyFileSync(p, destino(p)); }
    }
  }
}
console.log(`[kit-local] ${hechos.size} módulos copiados a src/kit-local/ desde ${kit}`);
