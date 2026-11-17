---
name: coco-ajustes
description: Configuración de la cuenta: empresas y equipo, agentes de IA con su bitácora, y apariencia (tema y paleta).
---

# `<coco-ajustes>`

Configuración de la cuenta: empresas y equipo, agentes de IA con su bitácora, y apariencia (tema y paleta).

## Anatomía

```
<coco-ajustes>
  #shadow-root
    <header class="barra">  título de la sección
    <section class="bloque"> × n   (según la sección)
    <coco-ficha>             (crear o editar empresa)
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `seccion` | `string` | `"apariencia"` | Sección que muestra. |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-ajustes></coco-ajustes>
```
