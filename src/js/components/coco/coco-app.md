---
name: coco-app
description: Shell de CoContable sin barra superior: panel izquierdo con marca, módulos y usuario, y un área de trabajo divisible en dos vistas.
---

# `<coco-app>`

Arma toda la app. El panel izquierdo lleva arriba la marca y el botón hamburguesa (lo colapsa a íconos), en el centro la navegación por módulos y abajo la empresa activa y el usuario. El área de trabajo muestra una vista o dos (lado a lado o una sobre otra). Recuerda ancho, colapso, vistas y orientación en las preferencias del usuario.

## Anatomía

```
<coco-app>
  #shadow-root
    <iswc-split-panel class="marco">            (o <div class="marco colapsado">)
      <aside part="lateral">  marca · <nav> módulos · acciones · <footer part="pie"> empresa y usuario
      <main part="trabajo">   <section part="panel"> vista   (1 o 2, en <iswc-split-panel>)
    <coco-acceso>
```

## Atributos observados

<!-- exclude: Atributos observados -->

## Props

| Prop | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `paneles` | `string[]` | `["inicio"]` | Ids de los módulos abiertos (1 o 2), de `core/menu.ts`. |
| `activo` | `number` | `0` | Cuál de las vistas recibe los clics del menú. |
| `colapsado` | `boolean` | `false` | Panel izquierdo reducido a íconos. |
| `orientacion` | `string` | `"horizontal"` | Cómo se reparten dos vistas. |
| `ancho` | `number` | `20` | Ancho del panel izquierdo en porcentaje. |

## Eventos

<!-- exclude: Eventos -->

## Slots

<!-- exclude: Slots -->

## Ejemplos

```html
<coco-app></coco-app>
```
