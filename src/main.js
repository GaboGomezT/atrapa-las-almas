// Main entry point for Atrapa las Almas
import './styles/main.css'
import { RenderEngine } from './engine/RenderEngine.js'
import { EnvironmentBuilder } from './engine/EnvironmentBuilder.js'

// Global game instances
let renderEngine = null
let environmentBuilder = null
let lastTime = 0

/**
 * Initialize the game systems
 */
function initGame() {
  try {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas')
    if (!canvas) {
      throw new Error('Game canvas not found')
    }

    // Initialize render engine
    renderEngine = new RenderEngine()
    renderEngine.init(canvas)

    // Initialize environment
    environmentBuilder = new EnvironmentBuilder(renderEngine)
    environmentBuilder.buildEnvironment()

    // Start the render loop
    renderEngine.startRenderLoop()

    console.log('Atrapa las Almas - Game systems initialized')
    return true
  } catch (error) {
    console.error('Failed to initialize game:', error)
    return false
  }
}

/**
 * Game update loop (will be expanded in future tasks)
 */
function update(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // Update environment animations
  if (environmentBuilder) {
    environmentBuilder.updateAnimations(deltaTime)
  }

  // Schedule next update
  requestAnimationFrame(update)
}

/**
 * Clean up game resources
 */
function cleanup() {
  if (environmentBuilder) {
    environmentBuilder.dispose()
  }
  if (renderEngine) {
    renderEngine.dispose()
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen')
  
  // Initialize game systems
  const gameInitialized = initGame()
  
  if (gameInitialized) {
    // Start update loop
    requestAnimationFrame(update)
    
    // Hide loading screen
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.display = 'none'
      }
    }, 1500)
  } else {
    // Show error message
    if (loadingScreen) {
      const loadingContent = loadingScreen.querySelector('.loading-content')
      if (loadingContent) {
        loadingContent.innerHTML = `
          <h1>Error</h1>
          <p>No se pudo inicializar el juego. Por favor, recarga la página.</p>
        `
      }
    }
  }
})

// Clean up on page unload
window.addEventListener('beforeunload', cleanup)