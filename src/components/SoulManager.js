import * as THREE from 'three'
import { Soul } from './Soul.js'
import { SoulPool } from '../utils/ObjectPool.js'

/**
 * SoulManager handles spawning, lifecycle, and management of soul entities
 * Implements object pooling for performance optimization
 */
export class SoulManager {
  constructor(renderEngine) {
    this.renderEngine = renderEngine
    this.scene = renderEngine.getScene()
    
    // Soul management
    this.activeSouls = new Map() // Active souls in the game
    this.soulPool = new SoulPool(Soul, renderEngine, 12) // Optimized object pool (reduced from 15)
    this.nextSoulId = 0
    
    // Spawning configuration
    this.maxSouls = 10 // Maximum souls on field at once (reduced from 15)
    this.spawnRate = 1.5 // Souls per second (reduced from 2.0)
    this.spawnTimer = 0
    this.spawnInterval = 1.0 / this.spawnRate
    this.isSpawningPaused = false
    
    // Game field boundaries
    this.fieldSize = { x: 10, z: 10 }
    this.spawnHeight = { min: 1.5, max: 4.0 }
    
    console.log('SoulManager initialized with optimized object pooling')
  }

  /**
   * Update soul spawning and lifecycle
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update spawn timer only if spawning is not paused
    if (!this.isSpawningPaused) {
      this.spawnTimer += deltaTime
      
      // Spawn new souls if needed
      if (this.spawnTimer >= this.spawnInterval && this.activeSouls.size < this.maxSouls) {
        this.spawnSoul()
        this.spawnTimer = 0
      }
    }
    
    // Update all active souls
    const soulsToRemove = []
    
    for (const [id, soul] of this.activeSouls) {
      soul.update(deltaTime)
      
      // Check if collection animation is complete
      if (soul.isCollectionComplete()) {
        soulsToRemove.push(id)
      }
    }
    
    // Remove completed souls
    for (const id of soulsToRemove) {
      this.removeSoul(id)
    }
  }

  /**
   * Spawn a new soul at a random position
   * @returns {Soul|null} The spawned soul or null if spawn failed
   */
  spawnSoul() {
    if (this.activeSouls.size >= this.maxSouls || this.isSpawningPaused) {
      return null
    }
    
    // Generate random spawn position
    const position = this.generateSpawnPosition()
    
    // Get soul from optimized pool
    const soul = this.soulPool.acquireSoul(position)
    soul.id = `soul-${this.nextSoulId++}`
    
    // Add to active souls tracking
    this.activeSouls.set(soul.getId(), soul)
    
    return soul
  }

  /**
   * Generate a random spawn position within the game field
   * @returns {THREE.Vector3} Random spawn position
   */
  generateSpawnPosition() {
    // Generate random position within field boundaries
    const x = (Math.random() - 0.5) * this.fieldSize.x * 2
    const z = (Math.random() - 0.5) * this.fieldSize.z * 2
    const y = this.spawnHeight.min + Math.random() * (this.spawnHeight.max - this.spawnHeight.min)
    
    return new THREE.Vector3(x, y, z)
  }



  /**
   * Remove a soul from the game
   * @param {string} soulId - ID of soul to remove
   */
  removeSoul(soulId) {
    const soul = this.activeSouls.get(soulId)
    if (!soul) return
    
    // Remove from active souls tracking
    this.activeSouls.delete(soulId)
    
    // Return to optimized pool (handles scene removal automatically)
    this.soulPool.releaseSoul(soul)
  }

  /**
   * Collect a soul (start collection animation)
   * @param {string} soulId - ID of soul to collect
   * @returns {boolean} True if soul was successfully collected
   */
  collectSoul(soulId) {
    const soul = this.activeSouls.get(soulId)
    if (!soul || soul.getIsCollected()) {
      return false
    }
    
    // Start collection animation
    soul.startCollection()
    return true
  }

  /**
   * Get all active souls
   * @returns {Map<string, Soul>} Map of active souls
   */
  getActiveSouls() {
    return this.activeSouls
  }

  /**
   * Get soul by ID
   * @param {string} soulId - Soul ID
   * @returns {Soul|null} Soul object or null if not found
   */
  getSoul(soulId) {
    return this.activeSouls.get(soulId) || null
  }

  /**
   * Get the number of active souls
   * @returns {number} Number of active souls
   */
  getActiveSoulCount() {
    return this.activeSouls.size
  }

  /**
   * Check if a position is too close to existing souls (to prevent overlap)
   * @param {THREE.Vector3} position - Position to check
   * @param {number} minDistance - Minimum distance between souls
   * @returns {boolean} True if position is valid
   */
  isValidSpawnPosition(position, minDistance = 2.0) {
    for (const soul of this.activeSouls.values()) {
      if (soul.getPosition().distanceTo(position) < minDistance) {
        return false
      }
    }
    return true
  }

  /**
   * Spawn souls in a specific pattern (for testing or special events)
   * @param {Array<THREE.Vector3>} positions - Array of positions to spawn souls
   */
  spawnSoulsAtPositions(positions) {
    for (const position of positions) {
      if (this.activeSouls.size >= this.maxSouls) break
      
      const soul = new Soul(`soul-${this.nextSoulId++}`, position)
      this.activeSouls.set(soul.getId(), soul)
      this.scene.add(soul.getMesh())
    }
  }

  /**
   * Set the maximum number of souls that can be active at once
   * @param {number} maxSouls - Maximum number of souls
   */
  setMaxSouls(maxSouls) {
    this.maxSouls = Math.max(1, maxSouls)
  }

  /**
   * Set the soul spawn rate
   * @param {number} spawnRate - Souls per second
   */
  setSpawnRate(spawnRate) {
    this.spawnRate = Math.max(0.1, spawnRate)
    this.spawnInterval = 1.0 / this.spawnRate
  }

  /**
   * Set the game field size for spawning
   * @param {number} sizeX - Field size in X direction
   * @param {number} sizeZ - Field size in Z direction
   */
  setFieldSize(sizeX, sizeZ) {
    this.fieldSize.x = Math.max(1, sizeX)
    this.fieldSize.z = Math.max(1, sizeZ)
  }

  /**
   * Set the spawn height range
   * @param {number} minHeight - Minimum spawn height
   * @param {number} maxHeight - Maximum spawn height
   */
  setSpawnHeightRange(minHeight, maxHeight) {
    this.spawnHeight.min = Math.max(0, minHeight)
    this.spawnHeight.max = Math.max(minHeight + 0.5, maxHeight)
  }

  /**
   * Clear all souls from the game
   */
  clearAllSouls() {
    // Return all souls to pool (handles scene removal automatically)
    for (const [id, soul] of this.activeSouls) {
      this.soulPool.releaseSoul(soul)
    }
    
    this.activeSouls.clear()
    this.spawnTimer = 0
  }

  /**
   * Reset the soul manager for a new game
   */
  reset() {
    this.clearAllSouls()
    this.spawnTimer = 0
    this.resumeSpawning(1.5) // Reset to default spawn rate (reduced from 2.0)
    console.log('SoulManager reset for new game')
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    const poolStats = this.soulPool.getStats()
    
    return {
      activeSouls: this.activeSouls.size,
      poolSize: poolStats.poolSize,
      totalPoolObjects: poolStats.totalObjects,
      activePoolObjects: poolStats.activeObjects,
      maxSouls: this.maxSouls,
      spawnRate: this.spawnRate,
      isSpawningPaused: this.isSpawningPaused
    }
  }

  /**
   * Pause soul spawning
   */
  pauseSpawning() {
    this.isSpawningPaused = true
  }

  /**
   * Resume soul spawning
   * @param {number} spawnRate - Souls per second (optional, uses previous rate if not provided)
   */
  resumeSpawning(spawnRate = null) {
    this.isSpawningPaused = false
    if (spawnRate !== null) {
      this.setSpawnRate(spawnRate)
    }
  }

  /**
   * Clean up all resources
   */
  dispose() {
    // Clear all active souls
    this.clearAllSouls()
    
    // Dispose of optimized pool
    if (this.soulPool) {
      this.soulPool.dispose()
      this.soulPool = null
    }
    
    // Reset counters
    this.nextSoulId = 0
    
    console.log('SoulManager disposed')
  }
}