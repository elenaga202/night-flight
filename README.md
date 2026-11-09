# Night Flight 🦉

Minijuego arcade de búhos, hecho con HTML, CSS y JavaScript puro. Está preparado para publicarse en **GitHub Pages**: no necesita compilación, dependencias ni servidor.

## Probar en local

Abre `index.html` en un navegador moderno. Para probarlo como sitio web también puedes usar la extensión Live Server de VS Code, aunque no es necesario.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `night-flight`.
2. Descomprime este proyecto y sube **todo el contenido** del directorio (incluidos `index.html`, `style.css`, `game.js` y `assets/`) a la raíz del repositorio.
3. En GitHub, entra en **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`, y pulsa **Save**.
6. Espera a que termine el despliegue. GitHub mostrará la URL pública en esa misma sección.

## Controles

- Ordenador: `Espacio`, `↑` o `W` para aletear.
- Móvil/tablet: toca la zona de juego para aletear.
- Botón ♫: activa o desactiva los efectos sonoros.

## Objetivo

Sobrevive durante 60 segundos, esquiva las ramas y recoge luciérnagas. Tienes tres vidas. Las luciérnagas dan 10 puntos y pasar entre obstáculos da 5 puntos.

## Recursos

Los gráficos se dibujan directamente en Canvas (búho, luna, cielo, estrellas, nubes, ramas, luciérnagas y partículas). Los efectos sonoros se sintetizan con Web Audio API. No hay recursos externos obligatorios ni archivos con licencias de terceros.

## Personalización rápida

- Duración de la partida: cambia `timeLeft=60` en `game.js` (en `reset()`).
- Velocidad de obstáculos: cambia `250` en `o.x-=250*dt`.
- Colores y tipografía: edita las variables CSS al principio de `style.css`.
