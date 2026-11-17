---
name: coco-ficha
description: Formulario declarativo en un drawer con pestañas (derecha en tablet y escritorio, abajo en el celular); devuelve los valores al guardar.
---

# `<coco-ficha>`

Pinta los campos que recibe con los controles del kit, agrupados por pestaña, valida los obligatorios y emite los valores. Quien la usa decide qué hacer con ellos.

## Anatomía

```
<coco-ficha>
  #shadow-root
    <iswc-drawer part="dialogo" placement="end|bottom">
      <form class="ficha">  <iswc-tab-group> · <div class="campos"> controles · <iswc-callout data-error>
      <iswc-button slot="footer"> Eliminar · Cancelar · Guardar
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `titulo` | `string` | `"Crear cliente"` | Título del drawer. |
| `campos` | `Campo[]` | `[{"nombre":"nit","etiqueta":"Documento","tipo":"texto","pestana":"Datos básicos","requerido":true,"soloAlta":true},{"nombre":"nombre","etiqueta":"Nombre","tipo":"texto","pestana":"Datos básicos","requerido":true,"soloAlta":false},{"nombre":"ciudad","etiqueta":"Ciudad","tipo":"texto","pestana":"Ubicación","requerido":false,"soloAlta":false}]` | Campos: nombre, etiqueta, tipo, pestaña, requerido, opciones o fuente. |
| `valores` | `Fila` | `{}` | Valores del registro que se edita. |
| `alta` | `boolean` | `true` | Es un registro nuevo (los campos `soloAlta` se pueden escribir). |
| `abierta` | `boolean` | `true` | Muestra el drawer. |
| `guardando` | `boolean` | `false` | Pone el botón Guardar en espera. |
| `error` | `string` | `""` | Mensaje de error bajo los campos. |
| `eliminable` | `boolean` | `false` | Muestra el botón Eliminar. |

## Eventos

| Evento | Detalle | Cuándo |
| --- | --- | --- |
| `coco-guardar` | `{ valores }` | Al pulsar Guardar con los obligatorios llenos. |
| `coco-eliminar` | `{}` | Al pulsar Eliminar. |
| `coco-cerrar` | `{}` | Al cancelar o cerrar el drawer. |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-ficha></coco-ficha>
```
