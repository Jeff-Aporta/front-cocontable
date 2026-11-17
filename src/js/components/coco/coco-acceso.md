---
name: coco-acceso
description: Diálogo para iniciar sesión o crear la cuenta contra el API de CoContable.
---

# `<coco-acceso>`

Pide usuario y contraseña (y nombre y correo al crear la cuenta), llama al API y avisa a toda la app con el evento de ventana `coco:sesion`. La contraseña nunca se guarda.

## Anatomía

```
<coco-acceso>
  #shadow-root
    <iswc-dialog>
      <form class="acceso">  <iswc-input> × 2-4 · <iswc-callout data-error>
      <iswc-button slot="footer"> × 2
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `abierto` | `boolean` | `true` | Muestra el diálogo. |
| `modo` | `string` | `"entrar"` | Iniciar sesión o crear la cuenta. |

## Eventos

| Evento | Detalle | Cuándo |
| --- | --- | --- |
| `coco-cerrar` | `{}` | Al entrar con éxito o al cerrar el diálogo. |

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-acceso></coco-acceso>
```
