# 2D Cozy RPG Life

Maqueta jugable 2D top-down basada en la guía visual entregada y reinterpretada en pixel art propio.

## Estado

- Mundo exterior transitable a escala 16×16.
- Costa, muelle, aldea, plaza, santuario en ruinas, conjunto de ruinas y entrada de cueva.
- Cueva interior transitable con río, puentes, cristales, iluminación y salida.
- Dos interiores de edificio.
- Colisiones e interacción con puertas, cueva y NPC placeholder.
- Agua y antorchas animadas.
- Assets raster organizados en atlas con celdas exactas de **16×16 px**.
- Props y personajes con **transparencia real**.
- Sin librerías externas.

## Controles

- WASD / flechas: mover.
- Shift: correr.
- E: interactuar / entrar / salir.

## Assets para revisar

- `assets/tiles_atlas.png`
- `assets/props_atlas.png`
- `assets/characters_atlas.png`
- `assets/atlas.json` contiene las coordenadas de cada celda 16×16.
- `assets/review.html` muestra los atlas ampliados sin filtrado suave.

Los `.svg` del mismo nombre se mantienen únicamente como wrappers de compatibilidad para la maqueta actual; contienen exactamente los nuevos raster PNG.
