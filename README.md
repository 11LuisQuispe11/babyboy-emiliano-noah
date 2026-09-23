# Invitaci?n de Emiliano Noah

Invitaci?n interactiva con React, Vite y Three.js.

## Desarrollo

Requiere Node.js 22. Ejecuta `npm ci`, copia `.env.example` a `.env.local` y ejecuta `npm run dev`.

## Publicaci?n

GitHub Actions compila y publica `dist` en GitHub Pages con cada push a `main`.
En Settings > Pages, la fuente debe ser GitHub Actions.
Las URLs p?blicas de Apps Script est?n en `.env.example`; no son credenciales.
Los proyectos de Apps Script se despliegan por separado; consulta `apps-script/`.

URL: https://11LuisQuispe11.github.io/babyboy-emiliano-noah/

Personalizaci?n: a?ade `?nombre=Juliana%20Inquil`. Sin nombre, el formulario lo solicita.

## Recursos m?viles

Los tel?fonos, tabletas y equipos con poca memoria usan `public/models/mobile/`. Se cargan escenario, Barbara y Luis por etapas. El perfil se fija al abrir la p?gina para evitar descargar ambos juegos de modelos al girar el tel?fono.

Despu?s de sustituir un modelo original, ejecuta `npm run optimize:mobile`, revisa la vista m?vil y ejecuta `node --test src/*.test.mjs` y `npm run build`. Incluye los GLB m?viles, `src/mobileAssets.json` y `scripts/mobile-assets-report.json` al publicar. El script conserva las animaciones, limita las texturas a 512 px para el escenario y 1024 px para los personajes, y actualiza las referencias de cach?.

El informe estima memoria de texturas RGBA con mipmaps; no representa la memoria total del navegador. La emulaci?n de escritorio no sustituye una prueba en el tel?fono afectado.
