# 2D Cozy RPG Life

Primera maqueta jugable 2D top-down basada en las referencias entregadas.

## Estado

- Mundo exterior transitable a escala 16×16.
- Costa, muelle, aldea, plaza, santuario en ruinas, gran conjunto de ruinas y entrada de cueva.
- Cueva interior transitable con río, puentes, cristales, iluminación y salida.
- Dos interiores de edificio.
- Colisiones.
- Interacción con puertas, cueva y NPC placeholder.
- Agua y antorchas animadas.
- Assets organizados en atlas con celdas raster de **16×16 px**.
- Props y personajes con **transparencia real**.
- Sin librerías externas.

## Controles

- WASD / flechas: mover.
- Shift: correr.
- E: interactuar / entrar / salir.

## Revisión de assets

- `assets/tiles_atlas.svg`
- `assets/props_atlas.svg`
- `assets/characters_atlas.svg`
- `assets/atlas.json` contiene las coordenadas exactas de cada celda 16×16.
- `assets/review.html` muestra los tres atlas ampliados x8 sin filtrado suave para revisión visual.
