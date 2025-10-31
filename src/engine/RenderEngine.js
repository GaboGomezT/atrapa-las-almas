import * as THREE from 'three'

/**
 * RenderEngine handles all Three.js rendering operations
 * Manages scene, camera, renderer, and the main render loop
 */
export class RenderEngine {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.canvas = null
    this.isRunning = false
    this.animationId = null
    
    // Bind methods to preserve context
    this.render = this.render.bind(this)
    this.handleResize = this.handleResize.bind(this)
  }

  /**
   * Initialize the Three.js scene, camera, and renderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  init(canvas) {
    if (!canvas) {
      throw new Error('Canvas element is required for RenderEngine initialization')
    }
    
    this.canvas = canvas
    
    // Initialize scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a0f1a) // Dark purple background
    
    // Initialize camera
    this.initCamera()
    
    // Initialize renderer
    this.initRenderer()
    
    // Set up responsive canvas sizing
    this.setupResponsiveCanvas()
    
    console.log('RenderEngine initialized successfully')
  }

  /**
   * Initialize the perspective camera
   */
  initCamera() {
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    
    // Position camera for overhead view of the game field
    this.camera.position.set(0, 15, 12)
    this.camera.lookAt(0, 0, 0)
  }

  /**
   * Initialize the WebGL renderer with optimal settings
   */
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    })
    
    // Handle device pixel ratio for crisp rendering
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(pixelRatio)
    
    // Set initial size
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    
    // Enable shadows for better visual quality
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    // Set tone mapping for better lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
  }

  /**
   * Set up responsive canvas sizing and event listeners
   */
  setupResponsiveCanvas() {
    // Add resize event listener
    window.addEventListener('resize', this.handleResize, false)
    
    // Add WebGL context lost/restored handlers
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false)
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false)
    
    // Initial resize to ensure proper sizing
    this.handleResize()
  }

  /**
   * Handle WebGL context lost event
   */
  handleContextLost(event) {
    console.warn('WebGL context lost')
    event.preventDefault()
    this.stopRenderLoop()
  }

  /**
   * Handle WebGL context restored event
   */
  handleContextRestored(event) {
    console.log('WebGL context restored, reinitializing...')
    
    try {
      // Reinitialize renderer
      this.initRenderer()
      
      // Restart render loop
      this.startRenderLoop()
      
      console.log('WebGL context successfully restored')
    } catch (error) {
      console.error('Failed to restore WebGL context:', error)
    }
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    if (!this.camera || !this.renderer) return
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Update camera aspect ratio
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    // Update renderer size
    this.renderer.setSize(width, height)
    
    // Update pixel ratio if needed
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(pixelRatio)
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.render()
    console.log('Render loop started')
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (!this.isRunning) return
    
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    console.log('Render loop stopped')
  }

  /**
   * Main render loop using requestAnimationFrame
   */
  render() {
    if (!this.isRunning) return
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(this.render)
    
    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object - Object to add to the scene
   */
  addToScene(object) {
    if (this.scene && object) {
      this.scene.add(object)
    }
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - Object to remove from the scene
   */
  removeFromScene(object) {
    if (this.scene && object) {
      this.scene.remove(object)
    }
  }

  /**
   * Get the current scene
   * @returns {THREE.Scene} The current scene
   */
  getScene() {
    return this.scene
  }

  /**
   * Get the current camera
   * @returns {THREE.PerspectiveCamera} The current camera
   */
  getCamera() {
    return this.camera
  }

  /**
   * Get the current renderer
   * @returns {THREE.WebGLRenderer} The current renderer
   */
  getRenderer() {
    return this.renderer
  }

  /**
   * Clean up resources and event listeners
   */
  dispose() {
    this.stopRenderLoop()
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    
    // Dispose of Three.js resources
    if (this.renderer) {
      this.renderer.dispose()
    }
    
    if (this.scene) {
      // Dispose of all objects in the scene
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
    
    console.log('RenderEngine disposed')
  }
}