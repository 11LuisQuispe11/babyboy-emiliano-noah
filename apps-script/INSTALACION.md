# Activar confirmaciones de regalos

El diseño y la lectura de los 91 productos ya están conectados a tu hoja. Falta desplegar el pequeño servicio que puede escribir la confirmación. No necesitas escribir código: está completo en `Code.gs`.

## En tu cuenta de Google

1. Abre la hoja EmilianoNoahLista y entra en **Extensiones → Apps Script**.
2. Si ya tienes un script, conserva su contenido. Si existe un `doGet` o `doPost`, compártelo para integrar los endpoints sin reemplazarlo. En un proyecto nuevo, pega el contenido de `apps-script/Code.gs` en `Code.gs` y guarda.
3. Pulsa **Implementar → Nueva implementación → Aplicación web**.
4. Elige **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**. Autoriza el acceso solicitado por Google. Esto permite confirmar desde la invitación sin pedir inicio de sesión a cada invitado; el endpoint público únicamente permite listar productos y marcar uno como comprado. La hoja puede seguir compartida solo para lectura.
5. Copia la URL que termina en **/exec** y envíamela. No uses la URL `/dev`.

Si tu cuenta no permite acceso a cualquier persona, dime qué opciones muestra Google para adaptar la conexión.

## Conexión en el proyecto

Crear `.env.local` con:

```env
VITE_GIFTS_APPS_SCRIPT_URL=https://script.google.com/macros/s/ID_DE_LA_IMPLEMENTACION/exec
```

Reiniciar Vite. Al desplegar el sitio también debe existir esa variable durante la compilación. La URL es pública; no es una clave secreta. No se incluyen credenciales de Google en el navegador.

## Comportamiento

- La hoja verificada es `Hoja1`, con A: Orden, B: Link del producto sugerido, C: Nombre del producto, D: ¿fue comprado?.
- Se identifica cada regalo por **Orden**, que debe ser único y estable. Puedes ordenar filas; evita reutilizar un número para otro producto.
- La aplicación consulta la lista al entrar, al volver a la pestaña y cada 30 segundos mientras está visible; también permite actualizar manualmente. La lectura pública de Google puede tener caché. Con el script configurado se consulta directamente la hoja.
- Se marca **Sí** solo después de que el invitado pulse “Ya lo compré” y confirme. La interfaz muestra “Comprado” únicamente tras una respuesta válida que verifica la escritura.
- `LockService` serializa las confirmaciones. Una compra ya registrada no se vuelve a escribir; el siguiente invitado recibe un aviso de que ya estaba comprada. Esto evita dobles confirmaciones, aunque no puede impedir que dos personas compren físicamente el producto antes de confirmarlo.
- No se piden ni guardan nombres, teléfonos ni correos. Cualquier persona que tenga acceso al endpoint puede confirmar: es una confirmación de buena fe, no una verificación de pago.
- Para corregir una confirmación accidental, el organizador puede cambiar **Sí** por **No** directamente en la hoja.
- Si hay error o demora, la app no inventa un resultado exitoso: pide actualizar para comprobar el estado. Reintentar una compra ya guardada es idempotente.
- Sin URL de Apps Script, los estados se leen de la hoja, pero el botón de confirmar queda desactivado con un aviso visible.

## Validación pendiente después del despliegue

Primero verificaremos `GET ?action=list` y la lectura desde el navegador. Para probar una escritura real, usar una copia de la hoja y un regalo de prueba: no marcar regalos reales como comprados solo para probar. Las pruebas automáticas locales cubren la escritura con una hoja simulada. Aún falta verificar el POST y los permisos/CORS con la URL de tu implementación real.

## Referencias oficiales

- [Publicar aplicaciones web en Apps Script](https://developers.google.com/apps-script/guides/web)
- [Content Service y respuestas JSON/JSONP](https://developers.google.com/apps-script/guides/content)
- [LockService para evitar escrituras simultáneas](https://developers.google.com/apps-script/reference/lock/lock-service)