# App Horas Extras - Google Apps Script

Esta carpeta contiene la version para publicar como Web App en Google Apps Script.

## Archivos

- `Code.gs`: servidor, rutas HTML y backend de solicitudes.
- `index.html`: login.
- `trabajador.html`: formulario de solicitud.
- `admin.html`: aprobacion y resumen.
- `styles.html`: estilos compartidos, con ajustes para celular.
- `auth_js.html`, `trabajador_js.html`, `admin_js.html`: JavaScript de cada vista.
- `logo_data.html`: logo embebido como base64.
- `appsscript.json`: manifest para Apps Script y clasp.

## Publicacion manual

1. Crea un proyecto en Apps Script.
2. Crea cada archivo con el mismo nombre de esta carpeta.
3. Pega el contenido correspondiente.
4. En `Configuracion del proyecto`, activa "Mostrar el archivo de manifiesto appsscript.json".
5. Reemplaza el manifiesto por el contenido de `appsscript.json`.
6. Ejecuta una vez `listarSolicitudes` desde el editor para autorizar permisos y crear la planilla de datos.
7. Ve a `Implementar > Nueva implementacion > Aplicacion web`.
8. Usa `Ejecutar como: Yo` y el acceso que corresponda para tus trabajadores.

## Flujo de datos

La primera vez que se ejecuta, `Code.gs` crea automaticamente una planilla llamada `Horas Extras - Datos` y guarda su ID en las propiedades del script. Las solicitudes quedan en la hoja `Solicitudes`.

Para ver la planilla creada, ejecuta `obtenerUrlPlanilla` desde Apps Script y revisa el resultado en el registro de ejecucion.

## GitHub y clasp

Cuando quieras subirlo a GitHub, esta carpeta puede ser la base del repo o una subcarpeta. Para sincronizar con Apps Script desde GitHub/local se puede usar `clasp`.

Comandos tipicos:

```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "App Horas Extras"
clasp push
clasp deploy --description "Version inicial"
```

Si ya creaste el proyecto manualmente en Apps Script, usa:

```bash
clasp clone SCRIPT_ID
```

y luego copia estos archivos dentro del proyecto clonado.

## Uso en celulares

La app esta preparada como Web App responsiva. Los trabajadores pueden abrir la URL `/exec` desde Chrome o Safari y agregarla a la pantalla de inicio del telefono.
