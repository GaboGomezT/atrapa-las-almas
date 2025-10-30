# Atrapa las Almas

Un juego 3D del Día de los Muertos donde controlas una calavera luminosa para guiar almas perdidas hacia un altar central.

## Tecnologías

- **Three.js** - Renderizado 3D
- **Vite** - Build tool y servidor de desarrollo
- **CSS3** - Estilos responsivos
- **JavaScript ES6+** - Lógica del juego

## Estructura del Proyecto

```
├── public/
│   └── assets/
│       ├── models/     # Modelos 3D (GLTF/GLB)
│       ├── textures/   # Texturas (WebP/PNG)
│       └── particles/  # Efectos de partículas
├── src/
│   ├── components/     # Componentes del juego
│   ├── engine/         # Clases del motor del juego
│   ├── styles/         # Estilos CSS
│   ├── utils/          # Funciones utilitarias
│   └── main.js         # Punto de entrada
├── index.html          # HTML principal
├── package.json        # Dependencias
└── vite.config.js      # Configuración de Vite
```

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Características

- ✅ Estructura de proyecto configurada
- ✅ Vite con Three.js configurado
- ✅ HTML responsivo con viewport móvil
- ✅ CSS con diseño responsivo
- ✅ Estructura de directorios para assets
- 🔄 Renderizado 3D (próxima tarea)
- 🔄 Sistema de jugador (próxima tarea)
- 🔄 Sistema de almas (próxima tarea)
- 🔄 Lógica del juego (próxima tarea)
- 🔄 Interfaz de usuario (próxima tarea)

## Requisitos del Sistema

- Node.js 16+
- Navegador con soporte WebGL
- Resolución mínima: 320x568 (móvil)

## Compatibilidad

- ✅ Chrome/Chromium 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Dispositivos móviles iOS/Android