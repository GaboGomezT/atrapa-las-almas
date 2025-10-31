/**
 * ObjectPool provides object pooling for performance optimization
 * Reduces garbage collection by reusing objects instead of creating new ones
 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    this.activeObjects = new Set()
    
    // Pre-populate pool with initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
    
    console.log(`ObjectPool created with ${initialSize} initial objects`)
  }

  /**
   * Get an object from the pool
   * @returns {Object} Object from pool or newly created object
   */
  acquire() {
    let obj
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()
    } else {
      obj = this.createFn()
      console.log('ObjectPool: Created new object (pool was empty)')
    }
    
    this.activeObjects.add(obj)
    return obj
  }

  /**
   * Return an object to the pool
   * @param {Object} obj - Object to return to pool
   */
  release(obj) {
    if (!this.activeObjects.has(obj)) {
      console.warn('ObjectPool: Attempting to release object not from this pool')
      return
    }
    
    this.activeObjects.delete(obj)
    
    // Reset object to initial state
    if (this.resetFn) {
      this.resetFn(obj)
    }
    
    this.pool.push(obj)
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeObjects: this.activeObjects.size,
      totalObjects: this.pool.length + this.activeObjects.size
    }
  }

  /**
   * Clear the pool and dispose of all objects
   */
  dispose() {
    // Dispose of pooled objects if they have a dispose method
    for (const obj of this.pool) {
      if (obj && typeof obj.dispose === 'function') {
        obj.dispose()
      }
    }
    
    // Dispose of active objects
    for (const obj of this.activeObjects) {
      if (obj && typeof obj.dispose === 'function') {
        obj.dispose()
      }
    }
    
    this.pool.length = 0
    this.activeObjects.clear()
    
    console.log('ObjectPool disposed')
  }
}

/**
 * SoulPool specialized for Soul objects
 */
export class SoulPool extends ObjectPool {
  constructor(soulClass, renderEngine, initialSize = 15) {
    const createFn = () => {
      // Create soul without ID initially (for pooling)
      const soul = new soulClass(null)
      soul.init()
      return soul
    }
    
    const resetFn = (soul) => {
      // Reset soul to initial state
      if (soul.reset) {
        soul.reset()
      }
      // Remove from scene if it's there
      if (soul.mesh && renderEngine) {
        renderEngine.removeFromScene(soul.mesh)
      }
    }
    
    super(createFn, resetFn, initialSize)
    this.soulClass = soulClass
    this.renderEngine = renderEngine
  }

  /**
   * Acquire a soul and add it to the scene
   * @param {THREE.Vector3} position - Initial position for the soul
   * @returns {Soul} Soul object from pool
   */
  acquireSoul(position) {
    const soul = this.acquire()
    
    if (soul.setPosition) {
      soul.setPosition(position.x, position.y, position.z)
    }
    
    // Add to scene
    if (soul.mesh && this.renderEngine) {
      this.renderEngine.addToScene(soul.mesh)
    }
    
    return soul
  }

  /**
   * Release a soul back to the pool
   * @param {Soul} soul - Soul to release
   */
  releaseSoul(soul) {
    // Remove from scene before releasing
    if (soul.mesh && this.renderEngine) {
      this.renderEngine.removeFromScene(soul.mesh)
    }
    
    this.release(soul)
  }
}

/**
 * ParticlePool for particle system optimization
 */
export class ParticlePool extends ObjectPool {
  constructor(particleClass, initialSize = 50) {
    const createFn = () => new particleClass()
    const resetFn = (particle) => {
      if (particle.reset) {
        particle.reset()
      }
    }
    
    super(createFn, resetFn, initialSize)
  }
}