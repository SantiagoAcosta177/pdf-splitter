# PDF Splitter

Una aplicación web moderna para dividir PDFs con interfaz intuitiva tipo iLovePDF. Permite subir un PDF, seleccionar páginas específicas o rangos, y descargar un nuevo PDF con solo las páginas seleccionadas.

## 🚀 Características

- **Autenticación simple**: Login demo con credenciales predefinidas
- **Upload de PDFs**: Arrastra y suelta o selecciona archivos (máx 50MB)
- **Vista previa**: Miniaturas de todas las páginas del PDF
- **Selección flexible**: 
  - Clic individual en páginas
  - Selección por rangos (ej: 1,3-5,8)
- **Descarga automática**: PDF resultante con páginas seleccionadas
- **Interfaz responsiva**: Diseño moderno con Tailwind CSS
- **Validaciones**: Control de tamaño, formato y rangos de páginas

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS
- **PDF Cliente**: pdfjs-dist (renderizado de miniaturas)
- **PDF Servidor**: pdf-lib (manipulación de PDFs)
- **Autenticación**: Cookies de sesión (demo)

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd pdf-splitter
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🔐 Credenciales Demo

- **Usuario**: `Fabricio`
- **Contraseña**: `Fabricio2025!`

## 📖 Uso

1. **Iniciar sesión** con las credenciales demo
2. **Subir PDF** arrastrando el archivo o usando el botón de selección
3. **Seleccionar páginas**:
   - Clic en miniaturas individuales
   - Usar el campo de rangos (ej: `1,3-5,8`)
4. **Descargar** el PDF con las páginas seleccionadas

## 🏗️ Estructura del Proyecto

```
pdf-splitter/
├── app/
│   ├── api/
│   │   ├── login/route.ts      # Autenticación
│   │   ├── me/route.ts         # Verificación de sesión
│   │   └── split/route.ts      # Procesamiento de PDF
│   ├── app/
│   │   └── page.tsx            # Página principal de la app
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página de login
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter de código

## ⚠️ ADVERTENCIA DE SEGURIDAD

**ESTE PROYECTO INCLUYE UN LOGIN DEMO CON CREDENCIALES EN CLARO FABRICIO / FABRICIO2025! ÚNICAMENTE PARA PRUEBAS RÁPIDAS.**

**NO USE ESTAS CREDENCIALES NI ESTA IMPLEMENTACIÓN DE SESIÓN EN PRODUCCIÓN.**

### Para producción, implementar:

1. **Variables de entorno** para credenciales
2. **HTTPS** obligatorio
3. **Almacenamiento seguro** de contraseñas (bcrypt + base de datos)
4. **Sesiones persistentes** seguras
5. **Validación de entrada** robusta
6. **Rate limiting** para prevenir abuso
7. **Logs de auditoría** para seguimiento

### Cambiar credenciales demo:

Editar `app/api/login/route.ts`:
```typescript
const DEMO_USER = 'tu_usuario'
const DEMO_PASS = 'tu_contraseña_segura'
```

## 🧪 Testing

### Casos de prueba recomendados:

1. **PDF multi-página** (10+ páginas)
2. **Rangos mixtos**: `1,3-5,8,10-12`
3. **Páginas duplicadas**: `1,1,2,2`
4. **Rangos inválidos**: `1,99` (página inexistente)
5. **Archivos grandes**: Cerca del límite de 50MB
6. **Formatos inválidos**: Archivos que no sean PDF

### Verificar:
- ✅ PDF resultante contiene páginas en orden correcto
- ✅ Descarga automática funciona
- ✅ Validaciones de error funcionan
- ✅ Interfaz responsiva en móviles

## 🐛 Solución de Problemas

### Error: "PDF no se carga"
- Verificar que el archivo sea un PDF válido
- Comprobar tamaño (máx 50MB)
- Revisar consola del navegador para errores

### Error: "No autorizado"
- Verificar que la sesión esté activa
- Limpiar cookies y volver a iniciar sesión

### Error: "Páginas fuera de rango"
- Verificar que los números de página sean válidos
- El PDF debe tener al menos las páginas solicitadas

## 📝 Licencia

Este proyecto es para fines educativos y de demostración.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado con ❤️ usando Next.js y TypeScript**
