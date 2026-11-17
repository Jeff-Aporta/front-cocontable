---
name: coco-catalogo
description: Pantalla de cualquier catálogo: barra con búsqueda, exportar y crear, tabla y ficha por pestañas.
---

# `<coco-catalogo>`

Lee la definición del catálogo por su id (`core/catalogos.ts`), lista sus registros de la empresa activa y permite crear, editar y eliminar. Sin permiso de escritura abre la ficha en solo lectura.

## Anatomía

```
<coco-catalogo>
  #shadow-root
    <header part="barra">  título · <iswc-input class="buscar"> · Exportar · Crear
    <coco-tabla part="tabla">
    <coco-ficha>
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `catalogo` | `string` | `"productos"` | Id del catálogo. |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-catalogo></coco-catalogo>
```
