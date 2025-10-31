# Technology Stack

## Core Technologies
- **Three.js** (v0.158.0) - 3D rendering and WebGL abstraction
- **Vite** (v5.0.8) - Build tool and development server
- **JavaScript ES6+** - Modern JavaScript with modules
- **CSS3** - Responsive styling with flexbox/grid
- **HTML5** - Semantic markup with canvas element

## Build System
- **Vite** for fast development and optimized production builds
- **ES Modules** for modern JavaScript module system
- **Source maps** enabled for debugging
- **Hot Module Replacement** in development

## Common Commands
```bash
# Development
npm install          # Install dependencies
npm run dev         # Start development server (port 3000)
npm run build       # Build for production
npm run preview     # Preview production build

# Development server opens automatically at http://localhost:3000
```

## Browser Compatibility
- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers with WebGL support

## Performance Considerations
- Adaptive quality based on device capabilities
- Pixel ratio optimization for mobile devices
- Memory management for textures and 3D objects
- Frame rate monitoring with automatic quality reduction
- Asset loading with progress tracking
- Object pooling for frequently created/destroyed objects

## API Integration
- RESTful API for leaderboard functionality
- Error handling for network failures
- Offline mode support when API unavailable