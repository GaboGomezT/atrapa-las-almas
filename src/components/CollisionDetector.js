import * as THREE from 'three'

/**
 * CollisionDetector handles collision detection between player skull and souls
 * Uses distance-based collision detection for performance
 */
export class CollisionDetector {
  constructor() {
    // Collision configuration
    this.skullCollisionRadius = 1.2 // Skull collision radius
    this.soulCollisionRadius = 0.6  // Soul collision radius (from Soul class)
    
    // Temporary vectors for calculations (to avoid creating new objects)
    this.tempVector1 = new THREE.Vector3()
    this.tempVector2 = new THREE.Vector3()
    
    // Collision events
    this.collisionCallbacks = []
    
    console.log('CollisionDetector initialized')
  }

  /**
   * Check collisions between player skull and all active souls
   * @param {PlayerController} playerController - Player controller instance
   * @param {SoulManager} soulManager - Soul manager instance
   * @returns {Array<string>} Array of collected soul IDs
   */
  checkCollisions(playerController, soulManager) {
    if (!playerController || !soulManager) {
      return []
    }

    const collectedSouls = []
    const playerPosition = playerController.getPosition()
    const activeSouls = soulManager.getActiveSouls()

    // Check collision with each active soul
    for (const [soulId, soul] of activeSouls) {
      // Skip already collected souls
      if (soul.getIsCollected()) {
        continue
      }

      // Calculate distance between skull and soul
      const soulPosition = soul.getPosition()
      const distance = this.calculateDistance(playerPosition, soulPosition)
      
      // Check if collision occurred
      const collisionDistance = this.skullCollisionRadius + soul.getCollisionRadius()
      
      if (distance <= collisionDistance) {
        // Collision detected - collect the soul
        if (soulManager.collectSoul(soulId)) {
          collectedSouls.push(soulId)
          
          // Trigger collision callbacks
          this.triggerCollisionCallbacks({
            soulId: soulId,
            soul: soul,
            playerPosition: playerPosition.clone(),
            soulPosition: soulPosition.clone(),
            distance: distance
          })
        }
      }
    }

    return collectedSouls
  }

  /**
   * Calculate distance between two positions
   * @param {THREE.Vector3} pos1 - First position
   * @param {THREE.Vector3} pos2 - Second position
   * @returns {number} Distance between positions
   */
  calculateDistance(pos1, pos2) {
    // Use temporary vectors to avoid creating new objects
    this.tempVector1.copy(pos1)
    this.tempVector2.copy(pos2)
    
    return this.tempVector1.distanceTo(this.tempVector2)
  }

  /**
   * Check collision between two spherical objects
   * @param {THREE.Vector3} pos1 - Position of first object
   * @param {number} radius1 - Radius of first object
   * @param {THREE.Vector3} pos2 - Position of second object
   * @param {number} radius2 - Radius of second object
   * @returns {boolean} True if collision detected
   */
  checkSphereCollision(pos1, radius1, pos2, radius2) {
    const distance = this.calculateDistance(pos1, pos2)
    return distance <= (radius1 + radius2)
  }

  /**
   * Check collision with custom radii
   * @param {PlayerController} playerController - Player controller
   * @param {Soul} soul - Soul to check collision with
   * @param {number} customSkullRadius - Custom skull collision radius
   * @param {number} customSoulRadius - Custom soul collision radius
   * @returns {boolean} True if collision detected
   */
  checkCustomCollision(playerController, soul, customSkullRadius = null, customSoulRadius = null) {
    const skullRadius = customSkullRadius || this.skullCollisionRadius
    const soulRadius = customSoulRadius || soul.getCollisionRadius()
    
    const playerPosition = playerController.getPosition()
    const soulPosition = soul.getPosition()
    
    return this.checkSphereCollision(playerPosition, skullRadius, soulPosition, soulRadius)
  }

  /**
   * Add collision callback function
   * @param {Function} callback - Callback function to call on collision
   */
  addCollisionCallback(callback) {
    if (typeof callback === 'function') {
      this.collisionCallbacks.push(callback)
    }
  }

  /**
   * Remove collision callback function
   * @param {Function} callback - Callback function to remove
   */
  removeCollisionCallback(callback) {
    const index = this.collisionCallbacks.indexOf(callback)
    if (index > -1) {
      this.collisionCallbacks.splice(index, 1)
    }
  }

  /**
   * Trigger all collision callbacks
   * @param {Object} collisionData - Data about the collision
   */
  triggerCollisionCallbacks(collisionData) {
    for (const callback of this.collisionCallbacks) {
      try {
        callback(collisionData)
      } catch (error) {
        console.error('Error in collision callback:', error)
      }
    }
  }

  /**
   * Set skull collision radius
   * @param {number} radius - New collision radius for skull
   */
  setSkullCollisionRadius(radius) {
    this.skullCollisionRadius = Math.max(0.1, radius)
  }

  /**
   * Get skull collision radius
   * @returns {number} Current skull collision radius
   */
  getSkullCollisionRadius() {
    return this.skullCollisionRadius
  }

  /**
   * Get collision statistics for debugging
   * @param {PlayerController} playerController - Player controller
   * @param {SoulManager} soulManager - Soul manager
   * @returns {Object} Collision statistics
   */
  getCollisionStats(playerController, soulManager) {
    if (!playerController || !soulManager) {
      return {
        playerPosition: null,
        activeSouls: 0,
        nearestSoulDistance: null,
        collisionRadius: this.skullCollisionRadius
      }
    }

    const playerPosition = playerController.getPosition()
    const activeSouls = soulManager.getActiveSouls()
    let nearestDistance = Infinity

    // Find nearest soul distance
    for (const soul of activeSouls.values()) {
      if (!soul.getIsCollected()) {
        const distance = this.calculateDistance(playerPosition, soul.getPosition())
        nearestDistance = Math.min(nearestDistance, distance)
      }
    }

    return {
      playerPosition: {
        x: playerPosition.x.toFixed(2),
        y: playerPosition.y.toFixed(2),
        z: playerPosition.z.toFixed(2)
      },
      activeSouls: activeSouls.size,
      nearestSoulDistance: nearestDistance === Infinity ? null : nearestDistance.toFixed(2),
      collisionRadius: this.skullCollisionRadius,
      totalCallbacks: this.collisionCallbacks.length
    }
  }

  /**
   * Perform broad-phase collision detection to optimize performance
   * Only check detailed collisions for souls within a larger radius
   * @param {PlayerController} playerController - Player controller
   * @param {SoulManager} soulManager - Soul manager
   * @param {number} broadPhaseRadius - Radius for broad-phase detection
   * @returns {Array<Soul>} Souls that passed broad-phase detection
   */
  broadPhaseDetection(playerController, soulManager, broadPhaseRadius = 5.0) {
    const candidateSouls = []
    const playerPosition = playerController.getPosition()
    const activeSouls = soulManager.getActiveSouls()

    for (const soul of activeSouls.values()) {
      if (!soul.getIsCollected()) {
        const distance = this.calculateDistance(playerPosition, soul.getPosition())
        if (distance <= broadPhaseRadius) {
          candidateSouls.push(soul)
        }
      }
    }

    return candidateSouls
  }

  /**
   * Check collisions with broad-phase optimization
   * @param {PlayerController} playerController - Player controller
   * @param {SoulManager} soulManager - Soul manager
   * @returns {Array<string>} Array of collected soul IDs
   */
  checkCollisionsOptimized(playerController, soulManager) {
    // First, perform broad-phase detection
    const candidateSouls = this.broadPhaseDetection(playerController, soulManager)
    
    if (candidateSouls.length === 0) {
      return []
    }

    const collectedSouls = []
    const playerPosition = playerController.getPosition()

    // Perform detailed collision detection only on candidate souls
    for (const soul of candidateSouls) {
      const soulPosition = soul.getPosition()
      const distance = this.calculateDistance(playerPosition, soulPosition)
      const collisionDistance = this.skullCollisionRadius + soul.getCollisionRadius()
      
      if (distance <= collisionDistance) {
        // Collision detected
        if (soulManager.collectSoul(soul.getId())) {
          collectedSouls.push(soul.getId())
          
          // Trigger collision callbacks
          this.triggerCollisionCallbacks({
            soulId: soul.getId(),
            soul: soul,
            playerPosition: playerPosition.clone(),
            soulPosition: soulPosition.clone(),
            distance: distance
          })
        }
      }
    }

    return collectedSouls
  }

  /**
   * Visualize collision boundaries (for debugging)
   * @param {THREE.Scene} scene - Three.js scene
   * @param {PlayerController} playerController - Player controller
   * @param {SoulManager} soulManager - Soul manager
   */
  visualizeCollisionBoundaries(scene, playerController, soulManager) {
    // Remove existing debug objects
    const existingDebugObjects = scene.children.filter(child => 
      child.name && child.name.startsWith('collision-debug')
    )
    
    for (const obj of existingDebugObjects) {
      scene.remove(obj)
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    }

    // Create skull collision boundary
    const skullPosition = playerController.getPosition()
    const skullBoundaryGeometry = new THREE.SphereGeometry(this.skullCollisionRadius, 16, 16)
    const skullBoundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    })
    
    const skullBoundary = new THREE.Mesh(skullBoundaryGeometry, skullBoundaryMaterial)
    skullBoundary.position.copy(skullPosition)
    skullBoundary.name = 'collision-debug-skull'
    scene.add(skullBoundary)

    // Create soul collision boundaries
    const activeSouls = soulManager.getActiveSouls()
    let soulIndex = 0
    
    for (const soul of activeSouls.values()) {
      if (!soul.getIsCollected()) {
        const soulPosition = soul.getPosition()
        const soulBoundaryGeometry = new THREE.SphereGeometry(soul.getCollisionRadius(), 12, 12)
        const soulBoundaryMaterial = new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          transparent: true,
          opacity: 0.2,
          wireframe: true
        })
        
        const soulBoundary = new THREE.Mesh(soulBoundaryGeometry, soulBoundaryMaterial)
        soulBoundary.position.copy(soulPosition)
        soulBoundary.name = `collision-debug-soul-${soulIndex++}`
        scene.add(soulBoundary)
      }
    }
  }

  /**
   * Clear all collision callbacks
   */
  clearCollisionCallbacks() {
    this.collisionCallbacks.length = 0
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.clearCollisionCallbacks()
    console.log('CollisionDetector disposed')
  }
}