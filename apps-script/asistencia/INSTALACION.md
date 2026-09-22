## Configuración actual corregida

La asistencia utiliza el archivo EmilianoNoahLista (ID 1BNM_8ojh4z6nzlnqoAZE-9LzgcVBClkdtHYG65Vcr54), pestaña Invitados. Code.gs ya contiene ambos valores. Copia el archivo actualizado a tu proyecto de Apps Script de asistencia y publica una NUEVA VERSIÓN desde Implementar → Administrar implementaciones → Editar. La implementación anterior conserva el marcador de ID y rechaza los registros con «La confirmación aún no está habilitada».

# Confirmación de asistencia

Crea una hoja de Google Sheets con una pestaña llamada Hoja1 y estos encabezados en la fila 1:

| Nombre | Cuantas personas |
| --- | --- |

La cantidad incluye a quien confirma: si va con un acompañante, escribe 2.

1. Abre Extensiones → Apps Script desde la nueva hoja. Usa un proyecto separado: este Code.gs no reemplaza al script de regalos.
2. Pega el contenido de apps-script/asistencia/Code.gs.
3. Cambia PEGA_AQUI_EL_ID_DE_TU_HOJA por el ID entre /d/ y /edit en la URL de tu hoja. Si cambias el nombre de la pestaña, actualiza sheetName.
4. Publica como aplicación web, ejecutar como tú y acceso para cualquier persona. Autoriza Google y copia la URL terminada en /exec.
5. Pásame el enlace de la hoja y la URL /exec. La hoja de asistentes puede permanecer privada: el servicio no devuelve su lista.

La conexión se configura en .env.local con VITE_RSVP_APPS_SCRIPT_URL y después se reinicia Vite. Añadir esa variable también al entorno de compilación del despliegue.

El nombre se obtiene del parámetro nombre o Nombre. Si falta o está vacío, la presentación usa Invitado y el formulario permite escribir el nombre. Al pulsar Confirmar asistencia se despliega el selector de 1 a 4 personas, incluyendo al invitado. Para confirmar se requiere un nombre válido, recibido en el enlace o escrito en el formulario. Solo mostramos éxito si el servicio responde que guardó los datos. Sin URL configurada, el formulario muestra un aviso y permite continuar a los regalos sin simular un registro.

Una nota en la celda Nombre conserva el identificador de envío para que los reintentos desde la misma sesión e invitación actualicen la misma fila; no agrega columnas. No borres esas notas si quieres conservar esa protección. Distintos navegadores o sesiones pueden crear registros distintos; no se usa el nombre como identificador porque puede repetirse entre invitados. El endpoint acepta confirmaciones de buena fe sin inicio de sesión y no permite descargar la lista de nombres.

Documentación oficial: https://developers.google.com/apps-script/guides/web