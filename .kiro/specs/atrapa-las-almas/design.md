# Design Document - Atrapa las Almas

## Overview

"Atrapa las Almas" is a browser-based 3D game built with Three.js that combines real-time 3D rendering, collision detection, and responsive design. The architecture follows a modular approach with separate systems for rendering, game logic, input handling, and UI management.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Game Engine   │    │   Render Engine │    │   Input System  │
│   (Game Logic)  │◄──►│   (Three.js)    │◄──►│   (Controls)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Manager    │    │   Asset Loader  │    │   Audio System  │
│   (HUD/Menus)   │    │   (Models/Tex)  │    │   (SFX/Music)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Core Framework**: Three.js (r158+) for 3D rendering
- **Build Tool**: Vite for development and bundling
- **Styling**: CSS3 with CSS Grid/Flexbox for responsive UI
- **Asset Format**: GLTF/GLB for 3D models, WebP/PNG for textures
- **Performance**: Web Workers for collision detection (if needed)

## Components and Interfaces

### 1. Game Engine (`GameEngine.js`)

**Responsibilities:**
- Game state management (menu, playing, game-over)
- Game loop coordination (update/render cycle)
- Score and timer management
- Soul spawning and lifecycle

**Key Methods:**
```javascript
class GameEngine {
  init()                    // Initialize game systems
  startGame()              // Begin gameplay session
  update(deltaTime)        // Update game logic
  endGame()               // Handle game over state
  spawnSoul()             // Create new soul entity
  collectSoul(soulId)     // Handle soul collection
}
```

### 2. Render Engine (`RenderEngine.js`)

**Responsibilities:**
- Three.js scene management
- Camera control and positioning
- Lighting setup and management
- Material and texture handling
- Particle system for soul effects

**Key Components:**
```javascript
class RenderEngine {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  
  initScene()             // Setup 3D scene
  createEnvironment()     // Build Day of the Dead scenery
  updateCamera()          // Handle camera positioning
  render()               // Render frame
}
```

### 3. Player Controller (`PlayerController.js`)

**Responsibilities:**
- Player skull movement and animation
- Input processing (keyboard/touch)
- Collision detection with souls
- Movement constraints within game field

**Key Features:**
```javascript
class PlayerController {
  position: THREE.Vector3
  velocity: THREE.Vector3
  
  handleInput(inputState)  // Process movement input
  updatePosition(deltaTime) // Apply movement physics
  checkCollisions()       // Detect soul collisions
  constrainToBounds()     // Keep within game field
}
```

### 4. Soul System (`SoulManager.js`)

**Responsibilities:**
- Soul entity creation and management
- Floating animation patterns
- Collision detection with player
- Visual effects for collection

**Soul Entity Structure:**
```javascript
class Soul {
  id: string
  mesh: THREE.Mesh
  position: THREE.Vector3
  floatPattern: FloatPattern
  
  update(deltaTime)       // Update position and animation
  collect()              // Handle collection animation
  destroy()              // Clean up resources
}
```

### 5. UI Manager (`UIManager.js`)

**Responsibilities:**
- HUD rendering (timer, score)
- Menu system (start, game over)
- Responsive layout management
- Touch control overlay for mobile

**Interface Elements:**
- Timer display (top-center)
- Score counter (top-left)
- Touch controls (mobile bottom overlay)
- Game over modal with restart button

## Data Models

### Game State
```javascript
const GameState = {
  currentState: 'menu' | 'playing' | 'game-over',
  score: number,
  timeRemaining: number,
  souls: Soul[],
  player: {
    position: Vector3,
    isMoving: boolean
  }
}
```

### Configuration
```javascript
const GameConfig = {
  GAME_DURATION: 60,           // seconds
  FIELD_SIZE: { x: 20, z: 20 }, // game field dimensions
  SOUL_COUNT: 15,              // max souls on field
  SOUL_SPAWN_RATE: 2,          // souls per second
  PLAYER_SPEED: 8,             // units per second
  COLLISION_RADIUS: 1.5        // collision detection radius
}
```

### Visual Assets
```javascript
const AssetManifest = {
  models: {
    skull: 'assets/models/skull.glb',
    altar: 'assets/models/altar.glb',
    marigold: 'assets/models/marigold.glb'
  },
  textures: {
    ground: 'assets/textures/marigold-petals.webp',
    papelPicado: 'assets/textures/papel-picado.webp'
  },
  particles: {
    soulGlow: 'assets/particles/soul-glow.png'
  }
}
```

## Error Handling

### Asset Loading
- Graceful fallback to basic geometries if models fail to load
- Loading progress indicator with timeout handling
- Error messages for unsupported browsers or WebGL issues

### Performance Management
- Frame rate monitoring with automatic quality adjustment
- Memory management for soul entities (object pooling)
- Fallback to lower particle counts on mobile devices

### Input Validation
- Sanitize and validate all user inputs
- Handle edge cases for rapid key presses
- Touch event normalization across devices

## Testing Strategy

### Unit Testing
- Game logic functions (score calculation, timer management)
- Collision detection algorithms
- Input processing and validation
- Asset loading and error handling

### Integration Testing
- Three.js scene setup and rendering pipeline
- Game state transitions (menu → playing → game over)
- Cross-browser compatibility testing
- Mobile device testing (iOS Safari, Android Chrome)

### Performance Testing
- Frame rate consistency across different devices
- Memory usage monitoring during extended gameplay
- Asset loading time optimization
- Battery usage on mobile devices

## Implementation Considerations

### Responsive Design
- CSS Grid layout for UI elements
- Viewport meta tag configuration for mobile
- Touch-friendly button sizes (minimum 44px)
- Landscape/portrait orientation handling

### Accessibility
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader friendly UI elements
- Reduced motion options for sensitive users

### Performance Optimization
- Texture compression and mipmapping
- Geometry instancing for repeated elements (marigolds)
- Frustum culling for off-screen objects
- Level-of-detail (LOD) for distant decorative elements

### Browser Compatibility
- WebGL 1.0 minimum requirement
- Fallback for browsers without WebGL support
- Progressive enhancement for advanced features
- Polyfills for older mobile browsers