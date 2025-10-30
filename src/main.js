// Main entry point for Atrapa las Almas
import './styles/main.css'
import { RenderEngine } from './engine/RenderEngine.js'
import { EnvironmentBuilder } from './engine/EnvironmentBuilder.js'
import { PlayerController } from './components/PlayerController.js'
import { InputManager } from './components/InputManager.js'
import { SoulManager } from './components/SoulManager.js'
import { CollisionDetector } from './components/CollisionDetector.js'

// Global game instances
let renderEngine = null
let environmentBuilder = null
let playerController = null
let inputManager = null
let soulManager = null
let collisionDetector = null
let lastTime = 0

// Game state
let score = 0

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

    // Initialize player controller
    playerController = new PlayerController(renderEngine)
    playerController.init()

    // Initialize input manager
    inputManager = new InputManager()

    // Initialize soul manager
    soulManager = new SoulManager(renderEngine)

    // Initialize collision detector
    collisionDetector = new CollisionDetector()

    // Set up collision callback for score tracking
    collisionDetector.addCollisionCallback((collisionData) => {
      score++
      console.log(`Soul collected! Score: ${score}`)
      
      // Add light effect animation (placeholder for future UI integration)
      console.log(`Collection effect at position: ${collisionData.soulPosition.x.toFixed(2)}, ${collisionData.soulPosition.y.toFixed(2)}, ${collisionData.soulPosition.z.toFixed(2)}`)
    })

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

  // Update player movement based on input
  if (playerController && inputManager) {
    const inputVector = inputManager.getInputVector()
    if (inputVector.x !== 0 || inputVector.z !== 0) {
      playerController.move(inputVector.x, inputVector.z, deltaTime)
    }
    playerController.update(deltaTime)
  }

  // Update soul manager
  if (soulManager) {
    soulManager.update(deltaTime)
  }

  // Check collisions between skull and souls
  if (collisionDetector && playerController && soulManager) {
    const collectedSouls = collisionDetector.checkCollisionsOptimized(playerController, soulManager)
    
    // Log collection events (will be replaced with proper UI updates later)
    if (collectedSouls.length > 0) {
      console.log(`Collected ${collectedSouls.length} soul(s). Total score: ${score}`)
    }
  }

  // Schedule next update
  requestAnimationFrame(update)
}

/**
 * Clean up game resources
 */
function cleanup() {
  if (collisionDetector) {
    collisionDetector.dispose()
  }
  if (soulManager) {
    soulManager.dispose()
  }
  if (inputManager) {
    inputManager.dispose()
  }
  if (playerController) {
    playerController.dispose()
  }
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