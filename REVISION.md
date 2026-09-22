# Revisión del proyecto

Revisión del 22 de septiembre de 2026. Alcance: todo el código de src, index.html, package.json, vite.config.js e inventario de recursos públicos. No incluye inspección visual de archivos Blender/FBX ni medición de FPS en un dispositivo real.

## Transición de bienvenida a información

El recorrido anterior mezclaba una órbita completa alrededor del origen con personajes que avanzaban desde Z=17 hasta Z=0. Al llegar, fijaba de golpe la cámara en otra posición y cambiaba el campo de visión de 34 a 24 grados. OrbitControls mantenía además su objetivo en Z=16.5, incluso al llegar al destino, y podía sobrescribir la cámara programada.

Cambios aplicados:

- Seguimiento frontal continuo del recorrido, con posición, punto de mirada y zoom interpolados. Se conserva la distancia final de 8.2 solicitada previamente.
- Un solo controlador de cámara durante la invitación. Se retiró el giro manual por arrastre que competía con el recorrido; la exploración sigue usando el joystick.
- Desvanecimiento de la bienvenida y entrada escalonada de las tarjetas sin sobrescribir su escala de escritorio.
- Avance guardado en una referencia: deja de renderizar todo App en cada fotograma. La llegada depende de que el recorrido termine y se cancela el último requestAnimationFrame al desmontar.
- Límite de saltos temporales al volver de una pestaña en segundo plano.
- Densidad de renderizado limitada a 1.5 para reducir trabajo de GPU en pantallas densas. Puede perder algo de nitidez frente a una densidad de 2.
- La cámara automática deja de actuar durante la exploración; se oculta el panel de regalos y el joystick solo responde al arrastrar.
- Altura dinámica para móviles y reducción de animaciones CSS cuando el usuario solicita menos movimiento.

La duración nominal de giros y caminata sigue siendo 10.4 segundos. No se añadieron dependencias ni efectos de posprocesado.

## Recomendaciones por prioridad

1. **Reducir el peso de los modelos.** Los tres GLB usados pesan 65.76 MB: Luis 43.29 MB, Barbara 21.05 MB y escenario 1.42 MB. Revisar texturas, geometría y animaciones utilizadas, y exportar copias optimizadas para web. Medir calidad y tiempos en móvil antes de reemplazar originales. Esto probablemente tendrá más impacto en la descarga que dividir el JavaScript; no se midió el tiempo real de carga.
2. **Completar los enlaces antes de publicar.** La lista de regalos contiene REEMPLAZAR_CON_ID_DEL_SHEET y la confirmación apunta a una página genérica de Google Forms. Los regalos muestran “Disponible” desde una lista fija, sin consultar reservas reales.
3. **Añadir recuperación ante fallos.** El contenido 3D utiliza Suspense con fallback nulo y no tiene una pantalla de error/reintento. Conviene ofrecer una invitación HTML legible si falla WebGL o un modelo. La introducción agrega 3.6 segundos después de la carga y desaparece sin transición de salida.
4. **Completar navegación y accesibilidad.** Añadir regreso entre secciones, salida de exploración y opción de omitir la bienvenida. La exploración carece de teclado y colisiones. La preferencia de movimiento reducido ya afecta CSS, pero falta una alternativa al recorrido 3D. Revisar foco al cambiar de escena y evitar anunciar cada carácter del efecto de escritura.
5. **Validar el encuadre en móviles.** Las tarjetas superiores ocupan bastante altura y pueden cubrir rostros en pantallas pequeñas. Probar al menos un móvil angosto, uno horizontal y escritorio. Confirmar también que la cámara no atraviesa elementos del escenario y que las animaciones de giro se alinean con la rotación programada de los personajes.
6. **Ordenar código y recursos.** Barbara y Luis duplican lógica de animación y movimiento; conviene extraer un componente común. styles.css conserva reglas de interfaces anteriores como invitation-cover, dialogue-box y hud. public contiene unos 87.32 MB: además de los recursos usados, hay otros GLB que Vite copia a dist aunque App no los solicite. Excluir del despliegue los que se confirme que no se necesitan.
7. **Hacer reproducibles las dependencias.** Varias versiones de package.json usan latest. Fijar versiones comprobadas y conservar el lockfile; no se actualizaron dependencias en esta revisión. El JS compilado queda en unos 1.22 MB, 340 KB gzip, y Vite sigue avisando del tamaño. Evaluar carga diferida del visor junto con una portada HTML, sin asumir que dividir archivos reduce por sí solo la descarga total.

## Validación

- node --test src/sceneMotion.test.mjs: 3 pruebas correctas. Comprueban continuidad entre fases, recorrido sin órbitas ni cruces con los personajes y convergencia equivalente a 30, 60 y 120 FPS para un objetivo fijo.
- npm run build: correcto; permanece la advertencia de tamaño del bundle.
- Sin verificación visual en navegador ni perfil de rendimiento. Las pruebas matemáticas y la compilación no certifican el encuadre, las animaciones GLB ni los FPS reales.
## Actualización: escena dos preparada para validación

Se completó la distribución de información: columna lateral en escritorio y fecha/hora en dos columnas con lugar debajo en móvil. Los fondos sólidos se conservan. El encuadre móvil ahora se aleja y desplaza verticalmente durante el recorrido para dejar libres los rostros y mantener visibles los pies. Se añadieron título semántico, foco al entrar, controles de tamaño táctil y acceso desde la bienvenida sin esperar todos los diálogos. En pantallas de poca altura la información admite desplazamiento vertical.

Servidor de desarrollo: http://127.0.0.1:5173/
Acceso directo de validación a escena dos: http://127.0.0.1:5173/?escena=2 (solo desarrollo).

Validación realizada: capturas en Chrome a 390×844 y 1440×900; sin desbordamiento horizontal en la vista móvil. Se recorrió bienvenida → botón de información → caminata → tres tarjetas, sin excepciones de ejecución. Cuatro pruebas de cámara y compilación correctas. Esto actualiza la limitación de la revisión inicial: ahora sí hubo comprobación visual en navegador, aunque aún falta validación del usuario en su dispositivo real. Permanece el aviso de tamaño del JavaScript; la optimización de modelos y el trabajo de escenas posteriores quedan pendientes para la siguiente etapa.
## Actualización: escena tres — programa en el jardín

Implementada la transición desde el botón Continuar de la escena dos: 14 segundos de recorrido por la entrada y el corredor lateral izquierdo, 10 segundos de panorama de 360° desde el centro del jardín y 1.4 segundos de ajuste al encuadre final. Los tiempos dependen del rendimiento del dispositivo porque se limitan los saltos por fotograma. La ruta usa coordenadas comprobadas del GLB y evita la construcción de entrada. Durante el recorrido los personajes permanecen en la escena dos; se sitúan en el jardín cuando la cámara mira hacia el lado opuesto durante el panorama, por lo que ya están esperando al terminar el giro.

Programa seleccionable con clips existentes, sin descargar modelos ni animaciones adicionales:

- 3:00 p. m.: recepción y fotos, con saludos.
- 3:30 p. m.: show de babyshower, con ambos personajes bailando.
- 5:00 p. m.: entrega de regalos con baile de invitados; Barbara agradece y Luis baila.
- 6:00 p. m.: música para bailar y divertirnos, con ambos personajes bailando.

El programa incluye el aviso de bebidas, comida y carritos de snacks durante todo el evento. El encuadre y los controles se adaptan a móvil y escritorio; en pantallas bajas la información admite desplazamiento. El enlace a regalos conserva la siguiente sección existente, cuyo desarrollo queda para después de validar esta escena.

Validación: siete pruebas automáticas de cámara correctas, incluyendo continuidad entre escenas, posición dentro del corredor, exclusión del edificio y giro completo de 360°. Se probó en Chrome el trayecto real desde escena dos hasta el programa, sin excepciones de ejecución, y los cuatro selectores de actividades. Se inspeccionaron capturas a 390×844 y 1440×900 y se amplió el margen de encuadre para los pasos de baile. Compilación correcta; permanece el aviso previo de tamaño del bundle. No se midieron FPS en un teléfono físico.

Para validar la transición: http://127.0.0.1:5173/?escena=2 y pulsar Continuar.
Vista directa de escena tres, solo en desarrollo: http://127.0.0.1:5173/?escena=3