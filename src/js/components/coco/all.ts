// @contexto AGENTS.md · skills/iswc-foundation/references/03-registro-y-carga.md
/**
 * all.ts — barrel de los componentes de la app (para hosts que no usan el registrador). El arranque normal carga cada
 * tag por `cocoLoader.min.mjs` desde `kit-tags.ts`; al registrar un componente nuevo se añade también aquí.
 */
import './coco-app.js';
import './coco-acceso.js';
import './coco-tabla.js';
import './coco-ficha.js';
import './coco-catalogo.js';
import '../../../../view/inicio/components/coco-inicio.js';
import '../../../../view/ventas/components/coco-factura.js';
import '../../../../view/ventas/components/coco-documentos.js';
import '../../../../view/cartera/components/coco-cartera.js';
import '../../../../view/cartera/components/coco-caja.js';
import '../../../../view/informes/components/coco-informes.js';
import '../../../../view/contabilidad/components/coco-comprobantes.js';
import '../../../../view/ajustes/components/coco-ajustes.js';
