import * as THREE from 'three'

/**
 * AssetLoader handles loading and caching of game assets with progress tracking
 * Supports textures, models, and other resources with optimization
 */
export class AssetLoader {
  constructor() {
    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
    this.cache = new Map()
    
    // Progress tracking
    this.totalItems = 0
    this.loadedItems = 0
    this.isLoading = false
    this.onProgress = null
    this.onComplete = null
    this.onError = null
    
    // Asset manifest - using fallback textures for now
    this.assetManifest = {
      textures: {
        ground: null, // Will use fallback
        papelPicado: null, // Will use fallback
        soulGlow: null // Will use fallback
      }
    }
    
    this.setupLoadingManager()
  }

  /**
   * Set up loading manager callbacks
   */
  setupLoadingManager() {
    this.loadingManager.onLoad = () => {
      this.isLoading = false
      console.log('All assets loaded successfully')
      if (this.onComplete) {
        this.onComplete()
      }
    }

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadedItems = itemsLoaded
      this.totalItems = itemsTotal
      const progress = itemsTotal > 0 ? (itemsLoaded / itemsTotal) * 100 : 0
      
      console.log(`Loading progress: ${progress.toFixed(1)}% (${itemsLoaded}/${itemsTotal})`)
      
      if (this.onProgress) {
        this.onProgress(progress, itemsLoaded, itemsTotal, url)
      }
    }

    this.loadingManager.onError = (url) => {
      console.error(`Failed to load asset: ${url}`)
      if (this.onError) {
        this.onError(url)
      }
    }
  }

  /**
   * Load all essential game assets
   * @returns {Promise} Promise that resolves when all assets are loaded
   */
  async loadEssentialAssets() {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.onComplete = resolve
      this.onError = reject

      try {
        // Create fallback textures directly since we don't have asset files
        console.log('Creating fallback textures...')
        this.cache.set('ground', this.createFallbackTexture('ground'))
        this.cache.set('papelPicado', this.createFallbackTexture('papelPicado'))
        this.cache.set('soulGlow', this.createFallbackTexture('soulGlow'))

        // Resolve immediately since we're using fallbacks
        this.isLoading = false
        console.log('Fallback textures created successfully')
        resolve()
      } catch (error) {
        this.isLoading = false
        reject(error)
      }
    })
  }

  /**
   * Load a texture with fallback to procedural generation
   * @param {string} key - Cache key for the texture
   * @param {string} url - URL to load the texture from
   */
  loadTextureWithFallback(key, url) {
    // Check if already cached
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }

    try {
      const texture = this.textureLoader.load(
        url,
        // onLoad
        (loadedTexture) => {
          this.optimizeTexture(loadedTexture, key)
          this.cache.set(key, loadedTexture)
          console.log(`Texture loaded successfully: ${key}`)
        },
        // onProgress
        undefined,
        // onError - create fallback texture
        (error) => {
          console.warn(`Failed to load texture ${key}, creating fallback:`, error)
          const fallbackTexture = this.createFallbackTexture(key)
          this.cache.set(key, fallbackTexture)
        }
      )

      return texture
    } catch (error) {
      console.warn(`Error loading texture ${key}, creating fallback:`, error)
      const fallbackTexture = this.createFallbackTexture(key)
      this.cache.set(key, fallbackTexture)
      return fallbackTexture
    }
  }

  /**
   * Create a fallback texture when loading fails
   * @param {string} key - Texture key to determine fallback type
   * @returns {THREE.Texture} Procedurally generated fallback texture
   */
  createFallbackTexture(key) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 256

    switch (key) {
      case 'ground':
        // Create orange/yellow gradient for marigold petals
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        gradient.addColorStop(0, '#ffaa00')
        gradient.addColorStop(0.5, '#ff8800')
        gradient.addColorStop(1, '#cc6600')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 256, 256)
        
        // Add some texture with random dots
        ctx.fillStyle = '#ff6600'
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 256
          const y = Math.random() * 256
          const radius = Math.random() * 3 + 1
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        break

      case 'papelPicado':
        // Create colorful papel picado pattern
        const colors = ['#ff6b35', '#f7931e', '#ffd23f', '#06d6a0', '#118ab2', '#073b4c']
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          const x = Math.random() * 256
          const y = Math.random() * 256
          const width = Math.random() * 30 + 10
          const height = Math.random() * 30 + 10
          ctx.fillRect(x, y, width, height)
        }
        break

      case 'soulGlow':
        // Create blue/violet glow for souls
        const soulGradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
        soulGradient.addColorStop(0, 'rgba(138, 43, 226, 1)')
        soulGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.8)')
        soulGradient.addColorStop(1, 'rgba(75, 0, 130, 0)')
        ctx.fillStyle = soulGradient
        ctx.fillRect(0, 0, 256, 256)
        break

      default:
        // Generic white texture
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 256, 256)
    }

    const texture = new THREE.CanvasTexture(canvas)
    this.optimizeTexture(texture, key)
    return texture
  }

  /**
   * Optimize texture settings for performance
   * @param {THREE.Texture} texture - Texture to optimize
   * @param {string} key - Texture key for specific optimizations
   */
  optimizeTexture(texture, key) {
    // Generate mipmaps for better performance at distance
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    
    // Set appropriate wrapping
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    
    // Optimize based on texture type
    switch (key) {
      case 'ground':
        // Ground texture should repeat
        texture.repeat.set(4, 4)
        break
        
      case 'soulGlow':
        // Soul glow should not repeat and use alpha
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.repeat.set(1, 1)
        break
        
      case 'papelPicado':
        // Papel picado can repeat but less frequently
        texture.repeat.set(2, 2)
        break
    }
    
    // Force texture update
    texture.needsUpdate = true
  }

  /**
   * Get a cached texture by key
   * @param {string} key - Texture cache key
   * @returns {THREE.Texture|null} Cached texture or null if not found
   */
  getTexture(key) {
    return this.cache.get(key) || null
  }

  /**
   * Check if a texture is loaded and cached
   * @param {string} key - Texture cache key
   * @returns {boolean} True if texture is cached
   */
  hasTexture(key) {
    return this.cache.has(key)
  }

  /**
   * Set progress callback
   * @param {Function} callback - Progress callback function
   */
  setProgressCallback(callback) {
    this.onProgress = callback
  }

  /**
   * Set completion callback
   * @param {Function} callback - Completion callback function
   */
  setCompleteCallback(callback) {
    this.onComplete = callback
  }

  /**
   * Set error callback
   * @param {Function} callback - Error callback function
   */
  setErrorCallback(callback) {
    this.onError = callback
  }

  /**
   * Get loading progress
   * @returns {Object} Loading progress information
   */
  getProgress() {
    return {
      isLoading: this.isLoading,
      loadedItems: this.loadedItems,
      totalItems: this.totalItems,
      percentage: this.totalItems > 0 ? (this.loadedItems / this.totalItems) * 100 : 0
    }
  }

  /**
   * Preload additional assets that aren't essential
   * @returns {Promise} Promise that resolves when optional assets are loaded
   */
  async loadOptionalAssets() {
    // This method can be used to load non-essential assets after the game starts
    return Promise.resolve()
  }

  /**
   * Clear all cached assets to free memory
   */
  clearCache() {
    // Dispose of all cached textures
    for (const [key, texture] of this.cache) {
      if (texture && texture.dispose) {
        texture.dispose()
      }
    }
    
    this.cache.clear()
    console.log('Asset cache cleared')
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    const textureCount = this.cache.size
    let estimatedMemory = 0
    
    // Rough estimation of texture memory usage
    for (const [key, texture] of this.cache) {
      if (texture && texture.image) {
        const width = texture.image.width || 256
        const height = texture.image.height || 256
        // Assume 4 bytes per pixel (RGBA)
        estimatedMemory += width * height * 4
      }
    }
    
    return {
      textureCount,
      estimatedMemoryMB: (estimatedMemory / (1024 * 1024)).toFixed(2)
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.clearCache()
    this.loadingManager = null
    this.textureLoader = null
    this.onProgress = null
    this.onComplete = null
    this.onError = null
    
    console.log('AssetLoader disposed')
  }
}