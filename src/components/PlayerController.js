import * as THREE from 'three'

/**
 * PlayerController manages the player skull character
 * Handles skull model creation, movement, animation, and constraints
 */
export class PlayerController {
  constructor(renderEngine) {
    this.renderEngine = renderEngine
    this.scene = renderEngine.getScene()
    
    // Player state
    this.position = new THREE.Vector3(0, 2.5, 0)
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.targetPosition = new THREE.Vector3(0, 2.5, 0)
    this.lastPosition = new THREE.Vector3(0, 2.5, 0)
    
    // Movement configuration
    this.moveSpeed = 8.0 // units per second
    this.smoothingFactor = 0.15 // for smooth interpolation
    this.boundarySize = 10 // game field boundary
    
    // Skull model and materials
    this.skullMesh = null
    this.glowMaterial = null
    this.isInitialized = false
    
    // Animation properties
    this.bobOffset = 0
    this.bobSpeed = 2.0
    this.bobRange = 0.2
    this.rotationSpeed = 1.0
  }

  /**
   * Initialize the player skull model and add to scene
   */
  init() {
    this.createSkullModel()
    this.addToScene()
    this.isInitialized = true
    console.log('PlayerController initialized')
  }

  /**
   * Create the luminous skull 3D model
   */
  createSkullModel() {
    // Create skull geometry - using a combination of shapes for realistic skull
    const skullGroup = new THREE.Group()
    
    // Create luminous material for the skull
    this.glowMaterial = new THREE.MeshPhongMaterial({
      color: 0xf5f5dc, // Beige bone color
      emissive: 0x2a2a2a, // Subtle glow
      shininess: 20,
      transparent: false,
      opacity: 1.0
    })
    
    // Main skull cranium - more elongated and skull-like
    const craniumGeometry = new THREE.SphereGeometry(0.7, 20, 16)
    // Modify vertices to create skull shape
    const craniumVertices = craniumGeometry.attributes.position.array
    for (let i = 0; i < craniumVertices.length; i += 3) {
      const x = craniumVertices[i]
      const y = craniumVertices[i + 1]
      const z = craniumVertices[i + 2]
      
      // Flatten the bottom and back of skull
      if (y < -0.2) {
        craniumVertices[i + 1] = -0.2 + (y + 0.2) * 0.4
      }
      
      // Make the back of skull flatter
      if (z < -0.3) {
        craniumVertices[i + 2] = -0.3 + (z + 0.3) * 0.6
      }
      
      // Narrow the sides slightly
      craniumVertices[i] = x * (1.0 - Math.abs(y) * 0.1)
    }
    craniumGeometry.attributes.position.needsUpdate = true
    craniumGeometry.computeVertexNormals()
    
    const cranium = new THREE.Mesh(craniumGeometry, this.glowMaterial)
    cranium.castShadow = true
    cranium.receiveShadow = true
    cranium.name = 'skull-cranium'
    cranium.position.y = 0.1
    
    // Create more realistic eye sockets
    const eyeSocketGeometry = new THREE.SphereGeometry(0.18, 12, 12)
    const eyeSocketMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: false,
      opacity: 1.0
    })
    
    // Left eye socket - larger and more recessed
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial)
    leftEyeSocket.position.set(-0.28, 0.15, 0.55)
    leftEyeSocket.scale.set(1.1, 1.3, 0.7)
    leftEyeSocket.name = 'left-eye-socket'
    
    // Right eye socket
    const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial)
    rightEyeSocket.position.set(0.28, 0.15, 0.55)
    rightEyeSocket.scale.set(1.1, 1.3, 0.7)
    rightEyeSocket.name = 'right-eye-socket'
    
    // Add eye socket rims for more definition
    const rimGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 16)
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0xe0e0e0,
      emissive: 0x1a1a1a
    })
    
    const leftRim = new THREE.Mesh(rimGeometry, rimMaterial)
    leftRim.position.set(-0.28, 0.15, 0.58)
    leftRim.name = 'left-eye-rim'
    
    const rightRim = new THREE.Mesh(rimGeometry, rimMaterial)
    rightRim.position.set(0.28, 0.15, 0.58)
    rightRim.name = 'right-eye-rim'
    
    // Glowing eyes - more prominent
    const eyeGlowGeometry = new THREE.SphereGeometry(0.1, 12, 12)
    const eyeGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444, // Red glow for more dramatic effect
      transparent: true,
      opacity: 0.95
    })
    
    const leftEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial)
    leftEyeGlow.position.set(-0.28, 0.15, 0.62)
    leftEyeGlow.name = 'left-eye-glow'
    
    const rightEyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial)
    rightEyeGlow.position.set(0.28, 0.15, 0.62)
    rightEyeGlow.name = 'right-eye-glow'
    
    // Nasal cavity - more realistic shape
    const nasalGeometry = new THREE.ConeGeometry(0.08, 0.25, 6)
    const nasalMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: false,
      opacity: 1.0
    })
    
    const nasalCavity = new THREE.Mesh(nasalGeometry, nasalMaterial)
    nasalCavity.position.set(0, -0.05, 0.58)
    nasalCavity.rotation.x = Math.PI
    nasalCavity.name = 'nasal-cavity'
    
    // Add nasal bridge detail
    const bridgeGeometry = new THREE.BoxGeometry(0.04, 0.15, 0.1)
    const nasalBridge = new THREE.Mesh(bridgeGeometry, this.glowMaterial)
    nasalBridge.position.set(0, 0.05, 0.62)
    nasalBridge.name = 'nasal-bridge'
    
    // Upper jaw/maxilla
    const upperJawGeometry = new THREE.BoxGeometry(0.55, 0.2, 0.35)
    const upperJaw = new THREE.Mesh(upperJawGeometry, this.glowMaterial)
    upperJaw.position.set(0, -0.25, 0.4)
    upperJaw.castShadow = true
    upperJaw.name = 'upper-jaw'
    
    // Lower jaw/mandible - more prominent
    const lowerJawGeometry = new THREE.BoxGeometry(0.5, 0.25, 0.3)
    const lowerJaw = new THREE.Mesh(lowerJawGeometry, this.glowMaterial)
    lowerJaw.position.set(0, -0.55, 0.35)
    lowerJaw.castShadow = true
    lowerJaw.name = 'lower-jaw'
    
    // Cheekbones for more skull-like structure
    const cheekboneGeometry = new THREE.SphereGeometry(0.12, 8, 8)
    const leftCheekbone = new THREE.Mesh(cheekboneGeometry, this.glowMaterial)
    leftCheekbone.position.set(-0.35, -0.1, 0.45)
    leftCheekbone.scale.set(1.2, 0.8, 1.0)
    leftCheekbone.name = 'left-cheekbone'
    
    const rightCheekbone = new THREE.Mesh(cheekboneGeometry, this.glowMaterial)
    rightCheekbone.position.set(0.35, -0.1, 0.45)
    rightCheekbone.scale.set(1.2, 0.8, 1.0)
    rightCheekbone.name = 'right-cheekbone'
    
    // Teeth
    const toothGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05)
    const toothMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 50
    })
    
    // Upper teeth
    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
      tooth.position.set((i - 2.5) * 0.08, -0.35, 0.52)
      tooth.name = `upper-tooth-${i}`
      skullGroup.add(tooth)
    }
    
    // Lower teeth
    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
      tooth.position.set((i - 2.5) * 0.08, -0.65, 0.52)
      tooth.name = `lower-tooth-${i}`
      skullGroup.add(tooth)
    }
    
    // Assemble skull
    skullGroup.add(cranium)
    skullGroup.add(leftEyeSocket)
    skullGroup.add(rightEyeSocket)
    skullGroup.add(leftRim)
    skullGroup.add(rightRim)
    skullGroup.add(leftEyeGlow)
    skullGroup.add(rightEyeGlow)
    skullGroup.add(nasalCavity)
    skullGroup.add(nasalBridge)
    skullGroup.add(upperJaw)
    skullGroup.add(lowerJaw)
    skullGroup.add(leftCheekbone)
    skullGroup.add(rightCheekbone)
    
    // Add subtle glow effect around the skull
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x404040,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    })
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.name = 'skull-glow'
    skullGroup.add(glow)
    
    // Set initial position and angle the skull to look slightly upward
    skullGroup.position.copy(this.position)
    skullGroup.rotation.x = -0.3 // Tilt the skull back about 17 degrees to show the face
    skullGroup.name = 'player-skull'
    
    this.skullMesh = skullGroup
  }

  /**
   * Add the skull model to the scene
   */
  addToScene() {
    if (this.skullMesh && this.scene) {
      this.scene.add(this.skullMesh)
    }
  }

  /**
   * Remove the skull model from the scene
   */
  removeFromScene() {
    if (this.skullMesh && this.scene) {
      this.scene.remove(this.skullMesh)
    }
  }

  /**
   * Update player position and animation
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.isInitialized || !this.skullMesh) return
    
    // Store last position for direction calculation
    this.lastPosition.copy(this.position)
    
    // Smooth movement interpolation
    this.position.lerp(this.targetPosition, this.smoothingFactor)
    
    // Apply movement constraints
    this.constrainToBounds()
    
    // Calculate movement direction for rotation
    const movementVector = new THREE.Vector3().subVectors(this.position, this.lastPosition)
    if (movementVector.length() > 0.001) {
      // Calculate target rotation based on movement direction
      const targetRotation = Math.atan2(movementVector.x, movementVector.z)
      
      // Smooth rotation towards movement direction
      let currentRotation = this.skullMesh.rotation.y
      let rotationDiff = targetRotation - currentRotation
      
      // Handle rotation wrapping (shortest path)
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2
      
      // Apply smooth rotation
      this.skullMesh.rotation.y += rotationDiff * 0.1
    }
    
    // Update skull mesh position
    this.skullMesh.position.copy(this.position)
    
    // Add floating animation (bobbing)
    this.bobOffset += deltaTime * this.bobSpeed
    const bobY = Math.sin(this.bobOffset) * this.bobRange
    this.skullMesh.position.y = this.position.y + bobY
    
    // Animate eye glow
    this.animateEyeGlow(deltaTime)
  }

  /**
   * Animate the glowing eyes
   * @param {number} deltaTime - Time since last update
   */
  animateEyeGlow(deltaTime) {
    const leftEyeGlow = this.skullMesh.getObjectByName('left-eye-glow')
    const rightEyeGlow = this.skullMesh.getObjectByName('right-eye-glow')
    
    if (leftEyeGlow && rightEyeGlow) {
      const glowIntensity = 0.7 + Math.sin(Date.now() * 0.003) * 0.3
      leftEyeGlow.material.opacity = glowIntensity
      rightEyeGlow.material.opacity = glowIntensity
    }
  }

  /**
   * Set target position for smooth movement
   * @param {THREE.Vector3} newPosition - Target position
   */
  setTargetPosition(newPosition) {
    this.targetPosition.copy(newPosition)
    this.targetPosition.y = 2.5 // Keep skull at consistent height above ground
  }

  /**
   * Move the player by a delta amount
   * @param {number} deltaX - Movement in X direction
   * @param {number} deltaZ - Movement in Z direction
   * @param {number} deltaTime - Time since last update
   */
  move(deltaX, deltaZ, deltaTime) {
    // Calculate movement based on speed and time
    const moveDistance = this.moveSpeed * deltaTime
    
    // Update target position
    this.targetPosition.x += deltaX * moveDistance
    this.targetPosition.z += deltaZ * moveDistance
    
    // Ensure Y stays consistent at proper height
    this.targetPosition.y = 2.5
    
    // Apply constraints
    this.constrainTargetToBounds()
  }

  /**
   * Constrain player position within game field boundaries
   */
  constrainToBounds() {
    this.position.x = Math.max(-this.boundarySize, Math.min(this.boundarySize, this.position.x))
    this.position.z = Math.max(-this.boundarySize, Math.min(this.boundarySize, this.position.z))
    this.position.y = 2.5 // Keep at consistent height above ground
  }

  /**
   * Constrain target position within game field boundaries
   */
  constrainTargetToBounds() {
    this.targetPosition.x = Math.max(-this.boundarySize, Math.min(this.boundarySize, this.targetPosition.x))
    this.targetPosition.z = Math.max(-this.boundarySize, Math.min(this.boundarySize, this.targetPosition.z))
    this.targetPosition.y = 2.5 // Keep at consistent height above ground
  }

  /**
   * Get current player position
   * @returns {THREE.Vector3} Current position
   */
  getPosition() {
    return this.position.clone()
  }

  /**
   * Get the skull mesh for collision detection
   * @returns {THREE.Group} The skull mesh group
   */
  getSkullMesh() {
    return this.skullMesh
  }

  /**
   * Set the boundary size for movement constraints
   * @param {number} size - Boundary size
   */
  setBoundarySize(size) {
    this.boundarySize = size
  }

  /**
   * Get the current boundary size
   * @returns {number} Boundary size
   */
  getBoundarySize() {
    return this.boundarySize
  }

  /**
   * Reset player to initial position
   */
  reset() {
    this.position.set(0, 2.5, 0)
    this.targetPosition.set(0, 2.5, 0)
    this.lastPosition.set(0, 2.5, 0)
    this.velocity.set(0, 0, 0)
    this.bobOffset = 0
    
    if (this.skullMesh) {
      this.skullMesh.position.copy(this.position)
      this.skullMesh.rotation.set(0, 0, 0)
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.skullMesh) {
      this.removeFromScene()
      
      // Dispose of geometries and materials
      this.skullMesh.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }
    
    this.isInitialized = false
    console.log('PlayerController disposed')
  }
}