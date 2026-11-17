# CLAUDE.md — front-cocontable

Contrato completo en [`AGENTS.md`](AGENTS.md). Recetas en [`skills/front-cocontable/SKILL.md`](skills/front-cocontable/SKILL.md). Estándar: skill `iswc-foundation`.

- Sin barra superior: todo en el panel izquierdo de `<coco-app>`. Paleta Delfín y tema claro por defecto.
- Pantalla nueva = una línea en `src/js/core/menu.ts`; catálogo o campo nuevo = `src/js/core/catalogos.ts`.
- Componente = 4 archivos + `kit-tags.ts` + `all.ts` + `scripts/gen/fichas.json` (`deno task fichas`).
- Las vistas usan `api` de `core/api.ts`; los valores definitivos los calcula el API.
- Hecho = build, check y gate en verde, y probado en el navegador. Push a `main` publica.
