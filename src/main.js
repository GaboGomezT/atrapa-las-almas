// Main entry point for Atrapa las Almas
import './styles/main.css'
import { RenderEngine } from './engine/RenderEngine.js'
import { EnvironmentBuilder } from './engine/EnvironmentBuilder.js'
import { GameManager } from './engine/GameManager.js'
import { PlayerController } from './components/PlayerController.js'
import { InputManager } from './components/InputManager.js'
import { SoulManager } from './components/SoulManager.js'
import { CollisionDetector } from './components/CollisionDetector.js'
import { UIManager } from './components/UIManager.js'
import { TouchControlManager } from './components/TouchControlManager.js'

// Global game instances
let renderEngine = null
let environmentBuilder = null
let gameManager = null
let playerController = null
let inputManager = null
let soulManager = null
let collisionDetector = null
let uiManager = null
let touchControlManager = null
let lastTime = 0

// Game state
let isGameInitialized = false

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

    // Initialize UI manager first
    uiManager = new UIManager()
    if (!uiManager.init()) {
      throw new Error('Failed to initialize UI manager')
    }

    // Initialize touch controls for mobile
    touchControlManager = new TouchControlManager()
    touchControlManager.init()

    // Initialize game manager
    gameManager = new GameManager(uiManager)
    gameManager.init()

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
      if (gameManager && gameManager.isRunning()) {
        gameManager.addScore(1)
        console.log(`Soul collected! Score: ${gameManager.getCurrentScore()}`)
        
        // Add light effect animation (placeholder for future enhancement)
        console.log(`Collection effect at position: ${collisionData.soulPosition.x.toFixed(2)}, ${collisionData.soulPosition.y.toFixed(2)}, ${collisionData.soulPosition.z.toFixed(2)}`)
      }
    })

    // Set up game manager callbacks
    gameManager.setGameStartCallback(() => {
      console.log('Game started - resetting souls')
      if (soulManager) {
        soulManager.reset()
      }
    })

    gameManager.setGameEndCallback((finalScore) => {
      console.log(`Game ended with score: ${finalScore}`)
    })

    // Start the render loop
    renderEngine.startRenderLoop()

    // Start the first game
    setTimeout(() => {
      gameManager.startNewGame()
    }, 1000)

    isGameInitialized = true
    console.log('Atrapa las Almas - Game systems initialized')
    return true
  } catch (error) {
    console.error('Failed to initialize game:', error)
    return false
  }
}

/**
 * Game update loop
 */
function update(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // Only update game logic if game is initialized
  if (!isGameInitialized) {
    requestAnimationFrame(update)
    return
  }

  // Update environment animations
  if (environmentBuilder) {
    environmentBuilder.updateAnimations(deltaTime)
  }

  // Update player movement based on input (keyboard + touch)
  if (playerController && inputManager && gameManager && gameManager.isRunning()) {
    let inputVector = inputManager.getInputVector()
    
    // Add touch input if available
    if (touchControlManager && touchControlManager.isMobileDevice()) {
      const touchInput = touchControlManager.getInputVector()
      if (touchInput.x !== 0 || touchInput.z !== 0) {
        inputVector = touchInput
      }
    }
    
    if (inputVector.x !== 0 || inputVector.z !== 0) {
      playerController.move(inputVector.x, inputVector.z, deltaTime)
    }
    playerController.update(deltaTime)
  }

  // Update soul manager
  if (soulManager && gameManager && gameManager.isRunning()) {
    soulManager.update(deltaTime)
  }

  // Check collisions between skull and souls
  if (collisionDetector && playerController && soulManager && gameManager && gameManager.isRunning()) {
    const collectedSouls = collisionDetector.checkCollisionsOptimized(playerController, soulManager)
    
    // Souls are automatically handled by the collision callback
    if (collectedSouls.length > 0) {
      console.log(`Collected ${collectedSouls.length} soul(s) this frame`)
    }
  }

  // Schedule next update
  requestAnimationFrame(update)
}

/**
 * Clean up game resources
 */
function cleanup() {
  if (touchControlManager) {
    touchControlManager.dispose()
  }
  if (uiManager) {
    uiManager.dispose()
  }
  if (gameManager) {
    gameManager.dispose()
  }
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