# Project Structure & Architecture

## Directory Organization
```
├── public/assets/          # Static game assets
│   ├── models/            # 3D models (GLTF/GLB)
│   ├── textures/          # Texture files (WebP/PNG)
│   └── particles/         # Particle effect assets
├── src/
│   ├── components/        # Game component classes
│   ├── engine/           # Core game engine classes
│   ├── styles/           # CSS stylesheets
│   ├── utils/            # Utility classes and helpers
│   └── main.js           # Application entry point
├── index.html            # Main HTML template
└── vite.config.js        # Build configuration
```

## Architecture Patterns

### Component-Based Architecture
- Each game system is a separate class/component
- Clear separation of concerns between rendering, input, game logic
- Dependency injection pattern for system references

### Engine Layer Structure
- **GameEngine** - Core game loop and state management
- **RenderEngine** - Three.js rendering abstraction
- **EnvironmentBuilder** - Scene construction and environment

### Component Layer Structure
- **PlayerController** - Player character logic
- **SoulManager** - Soul spawning and behavior
- **InputManager** - Input handling abstraction
- **UIManager** - UI state and modal management
- **CollisionDetector** - Physics and collision detection

### Utility Layer Structure
- **AssetLoader** - Resource loading with progress tracking
- **SoundManager** - Audio management
- **APIService** - HTTP API communication
- **ObjectPool** - Memory optimization for frequent objects

## Code Conventions

### Class Structure
- Constructor initializes state and references
- `init()` method for setup requiring external dependencies
- `update(deltaTime)` method for frame-based updates
- `dispose()` method for cleanup

### Error Handling
- Try-catch blocks around critical operations
- Graceful degradation for non-essential features
- Global error handlers with recovery attempts
- User-friendly error messages

### Performance Patterns
- Object pooling for frequently created objects
- Lazy loading of non-essential assets
- Device-specific optimization settings
- Frame rate monitoring and adaptive quality

### Mobile Considerations
- Touch-first input design
- Responsive UI scaling
- Performance optimizations for low-end devices
- Viewport meta tag configuration