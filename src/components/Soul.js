import * as THREE from 'three'

/**
 * Soul class represents a collectible soul entity
 * Features translucent sphere geometry with glowing material and floating animation
 */
export class Soul {
  constructor(id = null, position = new THREE.Vector3()) {
    this.id = id
    this.position = position.clone()
    this.initialPosition = position.clone()
    
    // Animation properties
    this.floatOffset = Math.random() * Math.PI * 2 // Random phase offset
    this.floatSpeed = 1.8 + Math.random() * 1.2 // 1.8-3.0 speed variation (much faster)
    this.floatRange = 0.5 + Math.random() * 0.4 // 0.5-0.9 range variation (more movement)
    this.rotationSpeed = 1.2 + Math.random() * 0.8 // Even faster rotation
    
    // Horizontal drift properties for more erratic movement
    this.driftOffset = Math.random() * Math.PI * 2
    this.driftSpeed = 1.0 + Math.random() * 1.2 // 1.0-2.2 speed (much faster)
    this.driftRange = 1.5 + Math.random() * 1.0 // 1.5-2.5 range (wider movement)
    
    // Erratic movement properties
    this.erraticTimer = 0
    this.erraticInterval = 0.3 + Math.random() * 0.8 // Change direction every 0.3-1.1 seconds (more frequent)
    this.erraticDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    ).normalize()
    this.erraticSpeed = 1.5 + Math.random() * 2.5 // 1.5-4.0 speed multiplier (faster)
    this.erraticIntensity = 0.4 + Math.random() * 0.5 // 0.4-0.9 intensity (more intense)
    
    // Visual properties
    this.glowIntensity = 0.7 + Math.random() * 0.3
    this.pulseSpeed = 1.5 + Math.random() * 0.5
    
    // Three.js objects
    this.mesh = null
    this.particleSystem = null
    this.isCollected = false
    this.collectionAnimation = 0
    
    // Only create mesh if we have an ID (for object pooling compatibility)
    if (this.id !== null) {
      this.init()
    }
  }

  /**
   * Initialize the soul (create mesh and effects)
   * This method is called by the object pool or constructor
   */
  init() {
    this.createSoulMesh()
    this.createParticleEffects()
  }

  /**
   * Create the translucent sphere geometry with glowing material
   */
  createSoulMesh() {
    // Create soul geometry - slightly irregular sphere for organic feel
    const geometry = new THREE.SphereGeometry(0.4, 16, 12)
    
    // Slightly deform the sphere for more organic appearance
    const vertices = geometry.attributes.position.array
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i]
      const y = vertices[i + 1]
      const z = vertices[i + 2]
      
      // Add subtle random deformation
      const deformation = 1.0 + (Math.random() - 0.5) * 0.1
      vertices[i] = x * deformation
      vertices[i + 1] = y * deformation
      vertices[i + 2] = z * deformation
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    // Create glowing material with blue/violet colors
    const soulColors = [
      0x4169e1, // Royal blue
      0x6a5acd, // Slate blue
      0x9370db, // Medium purple
      0x8a2be2, // Blue violet
      0x7b68ee  // Medium slate blue
    ]
    
    const baseColor = soulColors[Math.floor(Math.random() * soulColors.length)]
    
    const material = new THREE.MeshPhongMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
      shininess: 100,
      side: THREE.DoubleSide
    })

    // Create the main soul mesh
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    this.mesh.name = `soul-${this.id}`
    
    // Add inner glow sphere
    const innerGlowGeometry = new THREE.SphereGeometry(0.3, 12, 8)
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    })
    
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial)
    innerGlow.name = 'inner-glow'
    this.mesh.add(innerGlow)
    
    // Add outer glow sphere
    const outerGlowGeometry = new THREE.SphereGeometry(0.6, 12, 8)
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    })
    
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial)
    outerGlow.name = 'outer-glow'
    this.mesh.add(outerGlow)
  }

  /**
   * Create particle effects for blue/violet glow
   */
  createParticleEffects() {
    const particleCount = 20
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    // Create particles around the soul
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Random position around soul
      const radius = 0.8 + Math.random() * 0.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.cos(phi)
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      
      // Blue/violet particle colors
      const colorVariation = Math.random()
      if (colorVariation < 0.5) {
        // Blue particles
        colors[i3] = 0.2 + Math.random() * 0.3     // R
        colors[i3 + 1] = 0.4 + Math.random() * 0.4 // G
        colors[i3 + 2] = 0.8 + Math.random() * 0.2 // B
      } else {
        // Violet particles
        colors[i3] = 0.5 + Math.random() * 0.3     // R
        colors[i3 + 1] = 0.2 + Math.random() * 0.3 // G
        colors[i3 + 2] = 0.7 + Math.random() * 0.3 // B
      }
      
      sizes[i] = 0.05 + Math.random() * 0.1
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    // Create particle material
    const material = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
    
    this.particleSystem = new THREE.Points(geometry, material)
    this.particleSystem.name = 'soul-particles'
    this.mesh.add(this.particleSystem)
  }

  /**
   * Update soul animation and floating movement
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.mesh) return
    
    // Handle collection animation first
    if (this.collectionAnimation > 0) {
      this.updateCollectionAnimation(deltaTime)
    }
    
    // Skip normal animations if collected
    if (this.isCollected) return
    
    // Update erratic movement timer
    this.erraticTimer += deltaTime
    
    // Change erratic direction periodically
    if (this.erraticTimer >= this.erraticInterval) {
      this.erraticTimer = 0
      this.erraticInterval = 0.2 + Math.random() * 0.9 // New random interval (more frequent changes)
      
      // Generate new random direction
      this.erraticDirection.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 2
      ).normalize()
      
      // Vary the speed randomly (faster speeds)
      this.erraticSpeed = 1.2 + Math.random() * 3.0 // 1.2-4.2 speed range
      
      // Brief glow pulse when changing direction
      if (this.mesh && this.mesh.material) {
        this.mesh.material.emissiveIntensity = Math.min(1.0, this.mesh.material.emissiveIntensity + 0.3)
      }
    }
    
    // Update float animation (vertical bobbing)
    this.floatOffset += deltaTime * this.floatSpeed
    const floatY = Math.sin(this.floatOffset) * this.floatRange
    
    // Update horizontal drift for organic movement
    this.driftOffset += deltaTime * this.driftSpeed
    const driftX = Math.sin(this.driftOffset) * this.driftRange
    const driftZ = Math.cos(this.driftOffset * 0.7) * this.driftRange * 0.6
    
    // Add erratic movement on top of drift
    const erraticMovement = this.erraticDirection.clone()
    erraticMovement.multiplyScalar(this.erraticSpeed * this.erraticIntensity * deltaTime)
    
    // Apply position updates with erratic movement
    this.position.x = this.initialPosition.x + driftX + erraticMovement.x
    this.position.y = this.initialPosition.y + floatY + erraticMovement.y
    this.position.z = this.initialPosition.z + driftZ + erraticMovement.z
    
    // Keep souls within reasonable bounds (prevent them from going too far)
    const maxDistance = 9.0 // Increased from 8.0 to accommodate faster movement
    const distanceFromCenter = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z)
    if (distanceFromCenter > maxDistance) {
      const scale = maxDistance / distanceFromCenter
      this.position.x *= scale
      this.position.z *= scale
    }
    
    // Keep souls at reasonable height
    this.position.y = Math.max(0.5, Math.min(6.0, this.position.y))
    
    this.mesh.position.copy(this.position)
    
    // Rotate the soul slowly
    this.mesh.rotation.y += deltaTime * this.rotationSpeed
    this.mesh.rotation.x += deltaTime * this.rotationSpeed * 0.3
    
    // Animate glow intensity (pulsing effect)
    const pulseIntensity = this.glowIntensity + Math.sin(Date.now() * 0.001 * this.pulseSpeed) * 0.2
    this.mesh.material.emissiveIntensity = Math.max(0.1, pulseIntensity)
    
    // Animate inner and outer glow
    const innerGlow = this.mesh.getObjectByName('inner-glow')
    const outerGlow = this.mesh.getObjectByName('outer-glow')
    
    if (innerGlow) {
      innerGlow.material.opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1
    }
    
    if (outerGlow) {
      outerGlow.material.opacity = 0.1 + Math.sin(Date.now() * 0.0015) * 0.05
      outerGlow.scale.setScalar(1.0 + Math.sin(Date.now() * 0.001) * 0.1)
    }
    
    // Animate particles
    this.animateParticles(deltaTime)
  }

  /**
   * Animate the particle system
   * @param {number} deltaTime - Time since last update
   */
  animateParticles(deltaTime) {
    if (!this.particleSystem) return
    
    const positions = this.particleSystem.geometry.attributes.position.array
    const particleCount = positions.length / 3
    
    // Rotate particles around the soul
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const x = positions[i3]
      const y = positions[i3 + 1]
      const z = positions[i3 + 2]
      
      // Rotate around Y axis
      const rotationSpeed = 0.5 + (i % 3) * 0.2
      const angle = deltaTime * rotationSpeed
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      
      positions[i3] = x * cosAngle - z * sinAngle
      positions[i3 + 2] = x * sinAngle + z * cosAngle
      
      // Add slight vertical bobbing
      positions[i3 + 1] = y + Math.sin(Date.now() * 0.001 + i) * 0.05
    }
    
    this.particleSystem.geometry.attributes.position.needsUpdate = true
    
    // Rotate the entire particle system
    this.particleSystem.rotation.y += deltaTime * 0.3
  }

  /**
   * Start collection animation
   */
  startCollection() {
    if (this.isCollected) return
    
    this.isCollected = true
    this.collectionAnimation = 1.0 // Start at full intensity
    
    // Increase glow intensity for collection effect
    if (this.mesh && this.mesh.material) {
      this.mesh.material.emissiveIntensity = 1.5
    }
    
    console.log(`Soul ${this.id} collected - starting disappear animation`)
  }

  /**
   * Update collection animation
   * @param {number} deltaTime - Time since last update
   */
  updateCollectionAnimation(deltaTime) {
    this.collectionAnimation -= deltaTime * 4.0 // Fast animation (0.25 seconds)
    
    if (this.collectionAnimation <= 0) {
      this.collectionAnimation = 0
      return
    }
    
    // Calculate animation progress (0 = start, 1 = end)
    const progress = 1.0 - this.collectionAnimation
    
    // Scale up and fade out
    const scale = 1.0 + progress * 1.5 // Scale up to 2.5x
    const opacity = this.collectionAnimation * 0.7
    
    // Move upward during collection
    const upwardMovement = progress * 2.0 // Move up 2 units
    this.mesh.position.y = this.position.y + upwardMovement
    
    this.mesh.scale.setScalar(scale)
    this.mesh.material.opacity = opacity
    
    // Increase glow intensity during collection
    this.mesh.material.emissiveIntensity = 0.3 + progress * 1.2
    
    // Animate glow spheres
    const innerGlow = this.mesh.getObjectByName('inner-glow')
    const outerGlow = this.mesh.getObjectByName('outer-glow')
    
    if (innerGlow) {
      innerGlow.material.opacity = this.collectionAnimation * 0.6
    }
    
    if (outerGlow) {
      outerGlow.material.opacity = this.collectionAnimation * 0.25
      outerGlow.scale.setScalar(scale * 1.2)
    }
    
    // Animate particles during collection - make them spread out
    if (this.particleSystem) {
      this.particleSystem.material.opacity = this.collectionAnimation * 1.2
      this.particleSystem.scale.setScalar(scale * 1.3)
      
      // Add upward particle movement
      const positions = this.particleSystem.geometry.attributes.position.array
      const particleCount = positions.length / 3
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Move particles upward and outward
        positions[i3 + 1] += deltaTime * 2.0 * (1 + i * 0.1) // Upward movement
      }
      
      this.particleSystem.geometry.attributes.position.needsUpdate = true
    }
  }

  /**
   * Check if collection animation is complete
   * @returns {boolean} True if animation is complete
   */
  isCollectionComplete() {
    return this.isCollected && this.collectionAnimation <= 0
  }

  /**
   * Get the current position of the soul
   * @returns {THREE.Vector3} Current position
   */
  getPosition() {
    return this.position.clone()
  }

  /**
   * Get the mesh for rendering and collision detection
   * @returns {THREE.Mesh} The soul mesh
   */
  getMesh() {
    return this.mesh
  }

  /**
   * Get the soul ID
   * @returns {string} Soul ID
   */
  getId() {
    return this.id
  }

  /**
   * Check if the soul has been collected
   * @returns {boolean} True if collected
   */
  getIsCollected() {
    return this.isCollected
  }

  /**
   * Get collision radius for detection
   * @returns {number} Collision radius
   */
  getCollisionRadius() {
    return 0.5 // Reduced from 0.6 to make souls harder to catch
  }

  /**
   * Reset the soul to initial state (for object pooling)
   */
  reset() {
    this.isCollected = false
    this.collectionAnimation = 0
    
    // Reset animation properties with new random values
    this.floatOffset = Math.random() * Math.PI * 2
    this.floatSpeed = 1.8 + Math.random() * 1.2
    this.floatRange = 0.5 + Math.random() * 0.4
    this.rotationSpeed = 1.2 + Math.random() * 0.8
    this.driftOffset = Math.random() * Math.PI * 2
    this.driftSpeed = 1.0 + Math.random() * 1.2
    this.driftRange = 1.5 + Math.random() * 1.0
    this.glowIntensity = 0.7 + Math.random() * 0.3
    this.pulseSpeed = 1.5 + Math.random() * 0.5
    
    // Reset erratic movement properties
    this.erraticTimer = 0
    this.erraticInterval = 0.3 + Math.random() * 0.8
    this.erraticDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    ).normalize()
    this.erraticSpeed = 1.5 + Math.random() * 2.5
    this.erraticIntensity = 0.4 + Math.random() * 0.5
    
    // Reset mesh properties if mesh exists
    if (this.mesh) {
      this.mesh.scale.setScalar(1.0)
      this.mesh.rotation.set(0, 0, 0)
      this.mesh.position.copy(this.position) // Reset position
      
      if (this.mesh.material) {
        this.mesh.material.opacity = 0.7
        this.mesh.material.emissiveIntensity = 0.3
      }
      
      // Reset glow spheres
      const innerGlow = this.mesh.getObjectByName('inner-glow')
      const outerGlow = this.mesh.getObjectByName('outer-glow')
      
      if (innerGlow) {
        innerGlow.material.opacity = 0.4
        innerGlow.scale.setScalar(1.0)
      }
      
      if (outerGlow) {
        outerGlow.material.opacity = 0.15
        outerGlow.scale.setScalar(1.0)
      }
      
      // Reset particle system
      if (this.particleSystem) {
        this.particleSystem.material.opacity = 0.8
        this.particleSystem.scale.setScalar(1.0)
        this.particleSystem.rotation.set(0, 0, 0)
      }
    }
  }

  /**
   * Set the position of the soul
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate  
   * @param {number} z - Z coordinate
   */
  setPosition(x, y, z) {
    this.position.set(x, y, z)
    this.initialPosition.copy(this.position)
    
    if (this.mesh) {
      this.mesh.position.copy(this.position)
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.mesh) {
      // Dispose of geometries and materials
      this.mesh.traverse((child) => {
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
  }
}