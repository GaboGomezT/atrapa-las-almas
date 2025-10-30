import * as THREE from 'three'

/**
 * EnvironmentBuilder creates the Day of the Dead themed 3D environment
 * Handles ground plane, lighting, altar, and decorative elements
 */
export class EnvironmentBuilder {
  constructor(renderEngine) {
    this.renderEngine = renderEngine
    this.scene = renderEngine.getScene()
    this.textureLoader = new THREE.TextureLoader()
    this.decorativeElements = []
  }

  /**
   * Build the complete Day of the Dead environment
   */
  buildEnvironment() {
    this.createGroundPlane()
    this.setupLighting()
    this.createCentralAltar()
    this.addFloatingDecorations()
    
    console.log('Day of the Dead environment created')
  }

  /**
   * Create the ground plane with marigold petal texture
   */
  createGroundPlane() {
    // Create ground geometry
    const groundGeometry = new THREE.PlaneGeometry(25, 25, 32, 32)
    
    // Create marigold petal material
    // For now, use a procedural texture since we don't have actual texture files
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xd4691a, // Orange color resembling marigold petals
      transparent: false
    })
    
    // Add some texture variation with a simple pattern
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Create a marigold petal pattern
    ctx.fillStyle = '#d4691a'
    ctx.fillRect(0, 0, 512, 512)
    
    // Add petal-like spots
    ctx.fillStyle = '#ff8c00'
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const radius = Math.random() * 20 + 10
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Add darker spots for depth
    ctx.fillStyle = '#b8560f'
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const radius = Math.random() * 15 + 5
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    
    groundMaterial.map = texture
    
    // Create ground mesh
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2 // Rotate to be horizontal
    ground.receiveShadow = true
    ground.name = 'ground'
    
    this.scene.add(ground)
  }

  /**
   * Set up ambient and directional lighting with warm orange tones
   */
  setupLighting() {
    // Ambient light with warm orange tone
    const ambientLight = new THREE.AmbientLight(0xff9966, 0.4)
    this.scene.add(ambientLight)
    
    // Main directional light (simulating candlelight)
    const directionalLight = new THREE.DirectionalLight(0xffaa44, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -15
    directionalLight.shadow.camera.right = 15
    directionalLight.shadow.camera.top = 15
    directionalLight.shadow.camera.bottom = -15
    
    this.scene.add(directionalLight)
    
    // Add point lights to simulate candles around the altar
    const candleLights = [
      { position: [3, 2, 3], color: 0xff6600, intensity: 0.5 },
      { position: [-3, 2, 3], color: 0xff6600, intensity: 0.5 },
      { position: [3, 2, -3], color: 0xff6600, intensity: 0.5 },
      { position: [-3, 2, -3], color: 0xff6600, intensity: 0.5 }
    ]
    
    candleLights.forEach(lightConfig => {
      const pointLight = new THREE.PointLight(
        lightConfig.color, 
        lightConfig.intensity, 
        10
      )
      pointLight.position.set(...lightConfig.position)
      pointLight.castShadow = true
      this.scene.add(pointLight)
    })
  }

  /**
   * Create the central altar as the focal point
   */
  createCentralAltar() {
    // Create altar base
    const altarBaseGeometry = new THREE.BoxGeometry(4, 1, 4)
    const altarBaseMaterial = new THREE.MeshLambertMaterial({
      color: 0x8b4513 // Brown color for wood
    })
    const altarBase = new THREE.Mesh(altarBaseGeometry, altarBaseMaterial)
    altarBase.position.set(0, 0.5, 0)
    altarBase.castShadow = true
    altarBase.receiveShadow = true
    altarBase.name = 'altar-base'
    
    // Create altar top
    const altarTopGeometry = new THREE.BoxGeometry(4.5, 0.2, 4.5)
    const altarTopMaterial = new THREE.MeshLambertMaterial({
      color: 0xa0522d // Slightly lighter brown
    })
    const altarTop = new THREE.Mesh(altarTopGeometry, altarTopMaterial)
    altarTop.position.set(0, 1.1, 0)
    altarTop.castShadow = true
    altarTop.receiveShadow = true
    altarTop.name = 'altar-top'
    
    // Add candles on the altar
    this.createCandles(altarTop)
    
    // Group altar elements
    const altarGroup = new THREE.Group()
    altarGroup.add(altarBase)
    altarGroup.add(altarTop)
    altarGroup.name = 'central-altar'
    
    this.scene.add(altarGroup)
  }

  /**
   * Create candles for the altar
   * @param {THREE.Mesh} altar - The altar mesh to place candles on
   */
  createCandles(altar) {
    const candlePositions = [
      [1.5, 0.5, 1.5],
      [-1.5, 0.5, 1.5],
      [1.5, 0.5, -1.5],
      [-1.5, 0.5, -1.5]
    ]
    
    candlePositions.forEach((position, index) => {
      // Candle body
      const candleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8)
      const candleMaterial = new THREE.MeshLambertMaterial({
        color: 0xfff8dc // Cream color
      })
      const candle = new THREE.Mesh(candleGeometry, candleMaterial)
      candle.position.set(...position)
      candle.castShadow = true
      candle.name = `candle-${index}`
      
      // Flame effect
      const flameGeometry = new THREE.SphereGeometry(0.05, 8, 8)
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.8
      })
      const flame = new THREE.Mesh(flameGeometry, flameMaterial)
      flame.position.set(position[0], position[1] + 0.6, position[2])
      flame.name = `flame-${index}`
      
      altar.add(candle)
      altar.add(flame)
    })
  }

  /**
   * Add floating decorative elements (marigolds, papel picado)
   */
  addFloatingDecorations() {
    this.createFloatingMarigolds()
    this.createPapelPicado()
  }

  /**
   * Create floating marigold flowers
   */
  createFloatingMarigolds() {
    const marigoldPositions = [
      [8, 3, 8], [-8, 3, 8], [8, 3, -8], [-8, 3, -8],
      [6, 4, 0], [-6, 4, 0], [0, 4, 6], [0, 4, -6]
    ]
    
    marigoldPositions.forEach((position, index) => {
      // Create simple marigold representation
      const petalGeometry = new THREE.SphereGeometry(0.3, 8, 6)
      const petalMaterial = new THREE.MeshLambertMaterial({
        color: 0xffa500 // Orange color
      })
      
      const marigold = new THREE.Group()
      
      // Create petals
      for (let i = 0; i < 8; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial)
        const angle = (i / 8) * Math.PI * 2
        petal.position.set(
          Math.cos(angle) * 0.4,
          0,
          Math.sin(angle) * 0.4
        )
        petal.scale.set(0.8, 0.3, 0.8)
        marigold.add(petal)
      }
      
      // Center of flower
      const centerGeometry = new THREE.SphereGeometry(0.2, 8, 8)
      const centerMaterial = new THREE.MeshLambertMaterial({
        color: 0xff6600 // Darker orange
      })
      const center = new THREE.Mesh(centerGeometry, centerMaterial)
      marigold.add(center)
      
      marigold.position.set(...position)
      marigold.name = `marigold-${index}`
      
      // Add floating animation data
      marigold.userData = {
        originalY: position[1],
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatRange: 0.5 + Math.random() * 0.3
      }
      
      this.decorativeElements.push(marigold)
      this.scene.add(marigold)
    })
  }

  /**
   * Create papel picado (decorative paper banners)
   */
  createPapelPicado() {
    const bannerPositions = [
      { start: [-10, 6, -10], end: [10, 6, -10] },
      { start: [-10, 6, 10], end: [10, 6, 10] },
      { start: [-10, 6, -10], end: [-10, 6, 10] },
      { start: [10, 6, -10], end: [10, 6, 10] }
    ]
    
    bannerPositions.forEach((banner, index) => {
      const bannerGroup = new THREE.Group()
      
      // Create banner segments
      const segmentCount = 8
      const colors = [0xff69b4, 0x00ff00, 0xffff00, 0xff0000, 0x00ffff]
      
      for (let i = 0; i < segmentCount; i++) {
        const t = i / (segmentCount - 1)
        const position = new THREE.Vector3().lerpVectors(
          new THREE.Vector3(...banner.start),
          new THREE.Vector3(...banner.end),
          t
        )
        
        const segmentGeometry = new THREE.PlaneGeometry(1, 1.5)
        const segmentMaterial = new THREE.MeshLambertMaterial({
          color: colors[i % colors.length],
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
        
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
        segment.position.copy(position)
        segment.position.y += Math.sin(t * Math.PI * 2) * 0.3 // Add wave effect
        
        // Add animation data
        segment.userData = {
          originalPosition: position.clone(),
          waveOffset: t * Math.PI * 2,
          waveSpeed: 1.0
        }
        
        bannerGroup.add(segment)
        this.decorativeElements.push(segment)
      }
      
      bannerGroup.name = `papel-picado-${index}`
      this.scene.add(bannerGroup)
    })
  }

  /**
   * Update floating animations for decorative elements
   * @param {number} deltaTime - Time since last update
   */
  updateAnimations(deltaTime) {
    const time = Date.now() * 0.001
    
    this.decorativeElements.forEach(element => {
      if (element.userData.floatSpeed !== undefined) {
        // Floating marigolds
        const floatOffset = Math.sin(time * element.userData.floatSpeed) * element.userData.floatRange
        element.position.y = element.userData.originalY + floatOffset
        element.rotation.y += deltaTime * 0.5 // Slow rotation
      }
      
      if (element.userData.waveSpeed !== undefined) {
        // Waving papel picado
        const waveOffset = Math.sin(time * element.userData.waveSpeed + element.userData.waveOffset) * 0.3
        element.position.y = element.userData.originalPosition.y + waveOffset
      }
    })
  }

  /**
   * Get all decorative elements for external animation updates
   * @returns {Array} Array of decorative elements
   */
  getDecorativeElements() {
    return this.decorativeElements
  }

  /**
   * Clean up environment resources
   */
  dispose() {
    this.decorativeElements.forEach(element => {
      if (element.geometry) element.geometry.dispose()
      if (element.material) {
        if (Array.isArray(element.material)) {
          element.material.forEach(mat => mat.dispose())
        } else {
          element.material.dispose()
        }
      }
    })
    
    this.decorativeElements = []
    console.log('Environment disposed')
  }
}