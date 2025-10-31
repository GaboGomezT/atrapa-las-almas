// Main entry point for Atrapa las Almas
import './styles/main.css'
import { RenderEngine } from './engine/RenderEngine.js'
import { EnvironmentBuilder } from './engine/EnvironmentBuilder.js'
import { GameEngine } from './engine/GameEngine.js'
import { PlayerController } from './components/PlayerController.js'
import { InputManager } from './components/InputManager.js'
import { SoulManager } from './components/SoulManager.js'
import { CollisionDetector } from './components/CollisionDetector.js'
import { UIManager } from './components/UIManager.js'
import { TouchControlManager } from './components/TouchControlManager.js'
import { AssetLoader } from './utils/AssetLoader.js'
import { SoundManager } from './utils/SoundManager.js'

// Global game instances
let renderEngine = null
let environmentBuilder = null
let gameEngine = null
let playerController = null
let inputManager = null
let soulManager = null
let collisionDetector = null
let uiManager = null
let touchControlManager = null
let assetLoader = null
let soundManager = null

// Game state
let isGameInitialized = false
let initializationError = null

/**
 * Check WebGL support and browser compatibility
 */
function checkBrowserSupport() {
  const errors = []
  const warnings = []
  
  // Check WebGL support
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    errors.push('WebGL no está soportado en este navegador')
  } else {
    // Check WebGL capabilities
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    if (maxTextureSize < 1024) {
      warnings.push('Tamaño máximo de textura limitado')
    }
    
    const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
    if (maxVertexAttribs < 8) {
      warnings.push('Atributos de vértice limitados')
    }
  }
  
  // Check for required APIs
  if (!window.requestAnimationFrame) {
    errors.push('requestAnimationFrame no está soportado')
  }
  
  if (!window.performance || !window.performance.now) {
    errors.push('Performance API no está soportada')
  }
  
  // Check for modern JavaScript features
  try {
    // Test for ES6 features
    const testArrow = () => true
    const testConst = 'test'
    const testLet = 'test'
    const testTemplate = `template ${testConst}`
  } catch (e) {
    errors.push('JavaScript ES6 no está soportado completamente')
  }
  
  // Check device capabilities
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory < 2
  
  if (isMobile && (isLowEndDevice || hasLimitedMemory)) {
    warnings.push('Dispositivo con recursos limitados detectado')
  }
  
  // Check for touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return { errors, warnings, capabilities: { isMobile, hasTouch, isLowEndDevice, hasLimitedMemory } }
}

/**
 * Initialize the game systems with proper error handling
 */
async function initGame() {
  try {
    // Check browser compatibility first
    const browserCheck = checkBrowserSupport()
    if (browserCheck.errors.length > 0) {
      throw new Error(`Navegador no compatible: ${browserCheck.errors.join(', ')}`)
    }
    
    // Log warnings but continue
    if (browserCheck.warnings.length > 0) {
      console.warn('Advertencias de compatibilidad:', browserCheck.warnings.join(', '))
    }
    
    // Apply device-specific optimizations
    const deviceOptimizations = getDeviceOptimizations(browserCheck.capabilities)
    console.log('Optimizaciones aplicadas:', deviceOptimizations)

    // Get the canvas element
    const canvas = document.getElementById('game-canvas')
    if (!canvas) {
      throw new Error('Elemento canvas del juego no encontrado')
    }

    console.log('Inicializando sistemas del juego...')

    // Initialize asset loader first
    assetLoader = new AssetLoader()
    
    // Set up asset loading progress callback
    assetLoader.setProgressCallback((progress, loaded, total, url) => {
      updateLoadingProgress(progress, `Cargando recursos... (${loaded}/${total})`)
    })

    // Initialize sound manager
    soundManager = new SoundManager()

    // Initialize UI manager (required for error display)
    uiManager = new UIManager()
    if (!uiManager.init()) {
      throw new Error('Error al inicializar el gestor de interfaz')
    }

    // Load essential assets before continuing
    updateLoadingProgress(10, 'Cargando texturas...')
    await assetLoader.loadEssentialAssets()

    // Initialize touch controls for mobile
    touchControlManager = new TouchControlManager()
    touchControlManager.init()

    // Initialize render engine
    renderEngine = new RenderEngine()
    renderEngine.init(canvas)

    // Initialize environment builder
    updateLoadingProgress(40, 'Construyendo entorno...')
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

    // Initialize game engine with all systems
    updateLoadingProgress(80, 'Inicializando motor del juego...')
    gameEngine = new GameEngine()
    gameEngine.init({
      renderEngine,
      playerController,
      soulManager,
      collisionDetector,
      inputManager,
      uiManager,
      soundManager
    })

    // Set up UI restart callback to work with GameEngine
    uiManager.setRestartCallback(() => {
      if (gameEngine) {
        gameEngine.restartGame()
      }
    })

    // Start the render loop
    renderEngine.startRenderLoop()

    // Start the game engine loop
    gameEngine.startGameLoop()

    // Start the first game after a brief delay
    setTimeout(() => {
      if (gameEngine) {
        updateLoadingProgress(100, 'Listo para jugar!')
        gameEngine.startGame()
      }
    }, 1000)

    isGameInitialized = true
    console.log('Atrapa las Almas - Sistemas del juego inicializados correctamente')
    
    // Log performance information
    if (assetLoader) {
      const memoryUsage = assetLoader.getMemoryUsage()
      console.log(`Assets cargados: ${memoryUsage.textureCount} texturas, ~${memoryUsage.estimatedMemoryMB}MB`)
    }
    
    return true

  } catch (error) {
    console.error('Error al inicializar el juego:', error)
    initializationError = error
    return false
  }
}

/**
 * Performance monitoring and adaptive quality
 */
let performanceMonitor = {
  frameCount: 0,
  lastFPSCheck: 0,
  currentFPS: 60,
  lowFPSCount: 0,
  qualityReduced: false
}

/**
 * Monitor performance and adjust quality if needed
 */
function monitorPerformance() {
  performanceMonitor.frameCount++
  const now = performance.now()
  
  // Check FPS every second
  if (now - performanceMonitor.lastFPSCheck >= 1000) {
    performanceMonitor.currentFPS = performanceMonitor.frameCount
    performanceMonitor.frameCount = 0
    performanceMonitor.lastFPSCheck = now
    
    // If FPS is consistently low, reduce quality
    if (performanceMonitor.currentFPS < 30) {
      performanceMonitor.lowFPSCount++
      
      if (performanceMonitor.lowFPSCount >= 3 && !performanceMonitor.qualityReduced) {
        console.warn('Rendimiento bajo detectado, reduciendo calidad...')
        reduceQuality()
        performanceMonitor.qualityReduced = true
      }
    } else {
      performanceMonitor.lowFPSCount = 0
    }
  }
}

/**
 * Reduce rendering quality for better performance
 */
function reduceQuality() {
  if (renderEngine && renderEngine.getRenderer()) {
    const renderer = renderEngine.getRenderer()
    
    // Reduce pixel ratio
    renderer.setPixelRatio(1)
    
    // Disable shadows
    renderer.shadowMap.enabled = false
    
    // Reduce soul count
    if (gameEngine) {
      gameEngine.updateConfig({ SOUL_COUNT: 8 })
    }
    
    console.log('Calidad reducida para mejorar rendimiento')
  }
}

/**
 * Handle additional system integrations and performance monitoring
 */
function updateSystemIntegrations() {
  // Monitor performance
  monitorPerformance()
  
  // Handle any additional cross-system communication here
  // (GameEngine handles most of the game logic internally)
}

/**
 * Main application update loop (separate from GameEngine loop)
 * Handles integration between systems that GameEngine doesn't manage directly
 */
function update() {
  // Only run if game is initialized
  if (!isGameInitialized) {
    requestAnimationFrame(update)
    return
  }

  try {
    // Update additional system integrations
    updateSystemIntegrations()

    // Update environment animations
    if (environmentBuilder) {
      environmentBuilder.updateAnimations(0.016) // Approximate 60fps delta
    }

    // Handle any additional cross-system communication here
    // (GameEngine handles most of the game logic internally)

  } catch (error) {
    console.error('Error in main update loop:', error)
    // Continue running despite errors to maintain stability
  }

  // Schedule next update
  requestAnimationFrame(update)
}

/**
 * Get device-specific optimizations
 */
function getDeviceOptimizations(capabilities) {
  const optimizations = {
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    shadowsEnabled: true,
    particleCount: 100,
    maxSouls: 15,
    antialiasing: true,
    textureQuality: 'high'
  }
  
  // Mobile optimizations
  if (capabilities.isMobile) {
    optimizations.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    optimizations.particleCount = 50
    optimizations.textureQuality = 'medium'
    
    // Low-end mobile optimizations
    if (capabilities.isLowEndDevice || capabilities.hasLimitedMemory) {
      optimizations.shadowsEnabled = false
      optimizations.particleCount = 25
      optimizations.maxSouls = 10
      optimizations.antialiasing = false
      optimizations.textureQuality = 'low'
      optimizations.pixelRatio = 1
    }
  }
  
  // Apply optimizations to global settings
  window.gameOptimizations = optimizations
  
  return optimizations
}

/**
 * Update loading progress display
 */
function updateLoadingProgress(percentage, message = 'Cargando...') {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    const loadingContent = loadingScreen.querySelector('.loading-content')
    if (loadingContent) {
      const progressText = loadingContent.querySelector('p')
      if (progressText) {
        progressText.textContent = `${message} (${Math.round(percentage)}%)`
      }
    }
  }
}

/**
 * Display error message to user
 */
function displayError(error) {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    const loadingContent = loadingScreen.querySelector('.loading-content')
    if (loadingContent) {
      loadingContent.innerHTML = `
        <h1>Error</h1>
        <p>${error.message || 'No se pudo inicializar el juego'}</p>
        <p>Por favor, verifica que tu navegador soporte WebGL y recarga la página.</p>
        <button onclick="window.location.reload()" style="
          background: #ff6b35;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        ">Recargar Página</button>
      `
    }
  }
}

/**
 * Clean up game resources with error handling
 */
function cleanup() {
  console.log('Limpiando recursos del juego...')
  
  try {
    // Stop game engine first to prevent further updates
    if (gameEngine) {
      gameEngine.dispose()
      gameEngine = null
    }

    // Clean up other systems in reverse order of initialization
    if (touchControlManager) {
      touchControlManager.dispose()
      touchControlManager = null
    }
    
    if (uiManager) {
      uiManager.dispose()
      uiManager = null
    }
    
    if (collisionDetector) {
      collisionDetector.dispose()
      collisionDetector = null
    }
    
    if (soulManager) {
      soulManager.dispose()
      soulManager = null
    }
    
    if (inputManager) {
      inputManager.dispose()
      inputManager = null
    }
    
    if (playerController) {
      playerController.dispose()
      playerController = null
    }
    
    if (environmentBuilder) {
      environmentBuilder.dispose()
      environmentBuilder = null
    }
    
    if (renderEngine) {
      renderEngine.dispose()
      renderEngine = null
    }
    
    if (assetLoader) {
      assetLoader.dispose()
      assetLoader = null
    }
    
    if (soundManager) {
      soundManager.dispose()
      soundManager = null
    }

    isGameInitialized = false
    console.log('Recursos del juego limpiados correctamente')
    
  } catch (error) {
    console.error('Error durante la limpieza de recursos:', error)
  }
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM cargado, inicializando aplicación...')
  
  const loadingScreen = document.getElementById('loading-screen')
  
  try {
    // Initialize game systems
    const gameInitialized = await initGame()
    
    if (gameInitialized) {
      // Start main update loop
      requestAnimationFrame(update)
      
      // Hide loading screen with fade effect
      setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.style.transition = 'opacity 0.5s ease'
          loadingScreen.style.opacity = '0'
          
          setTimeout(() => {
            loadingScreen.style.display = 'none'
          }, 500)
        }
      }, 1500)
      
      console.log('Aplicación inicializada correctamente')
      
    } else {
      // Show error message
      displayError(initializationError || new Error('Error desconocido durante la inicialización'))
    }
    
  } catch (error) {
    console.error('Error crítico durante la inicialización:', error)
    displayError(error)
  }
})

// Handle first user interaction to enable audio
function enableAudioOnFirstInteraction() {
  if (soundManager) {
    soundManager.resumeAudioContext()
  }
  
  // Remove listeners after first interaction
  document.removeEventListener('click', enableAudioOnFirstInteraction)
  document.removeEventListener('keydown', enableAudioOnFirstInteraction)
  document.removeEventListener('touchstart', enableAudioOnFirstInteraction)
}

// Add listeners for first user interaction
document.addEventListener('click', enableAudioOnFirstInteraction)
document.addEventListener('keydown', enableAudioOnFirstInteraction)
document.addEventListener('touchstart', enableAudioOnFirstInteraction)

// Handle page visibility changes (pause/resume game)
document.addEventListener('visibilitychange', () => {
  if (gameEngine) {
    if (document.hidden) {
      // Page is hidden, pause game if running
      if (gameEngine.getCurrentState() === 'playing') {
        console.log('Página oculta, pausando juego...')
        // Note: GameEngine doesn't have pause/resume, but we could add it
      }
    } else {
      // Page is visible again
      console.log('Página visible, reanudando juego...')
    }
  }
})

// Handle errors globally with recovery attempts
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error)
  
  // If game hasn't initialized yet, show error
  if (!isGameInitialized) {
    displayError(event.error)
  } else {
    // Try to recover from runtime errors
    attemptErrorRecovery(event.error)
  }
})

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason)
  
  // If game hasn't initialized yet, show error
  if (!isGameInitialized) {
    displayError(new Error('Error de inicialización asíncrona'))
  }
  
  // Prevent the default behavior (logging to console)
  event.preventDefault()
})

/**
 * Attempt to recover from runtime errors
 */
function attemptErrorRecovery(error) {
  console.log('Intentando recuperación de error...')
  
  try {
    // If it's a WebGL context lost error, try to restore
    if (error.message && error.message.includes('WebGL')) {
      console.log('Error de WebGL detectado, intentando restaurar contexto...')
      
      if (renderEngine) {
        // Try to reinitialize the renderer
        const canvas = document.getElementById('game-canvas')
        if (canvas) {
          renderEngine.dispose()
          renderEngine.init(canvas)
          console.log('Contexto WebGL restaurado')
        }
      }
    }
    
    // For other errors, just log and continue
    console.log('Continuando ejecución después del error')
    
  } catch (recoveryError) {
    console.error('Error durante la recuperación:', recoveryError)
    // If recovery fails, show error to user
    displayError(new Error('Error crítico - Por favor recarga la página'))
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanup)

// Clean up on page hide (mobile browsers)
window.addEventListener('pagehide', cleanup)