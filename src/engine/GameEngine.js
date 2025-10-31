import * as THREE from 'three'

/**
 * GameEngine manages the core game logic and state
 * Handles game states, main update loop, and coordination between systems
 * 
 * Usage example:
 * const gameEngine = new GameEngine()
 * gameEngine.init({
 *   renderEngine,
 *   playerController,
 *   soulManager,
 *   collisionDetector,
 *   inputManager,
 *   uiManager // optional
 * })
 * gameEngine.startGameLoop()
 */
export class GameEngine {
  constructor() {
    // Game state management
    this.currentState = 'menu' // 'menu', 'playing', 'game-over'
    this.previousState = null
    
    // Game systems references
    this.renderEngine = null
    this.playerController = null
    this.soulManager = null
    this.collisionDetector = null
    this.inputManager = null
    this.uiManager = null
    this.soundManager = null
    
    // Game timing
    this.lastTime = 0
    this.deltaTime = 0
    this.gameTime = 0
    this.isRunning = false
    this.animationId = null
    
    // Timer and scoring system
    this.score = 0
    this.timeRemaining = 60 // seconds
    this.gameTimer = null
    this.timerUpdateInterval = 100 // Update timer every 100ms for smooth display
    
    // Game configuration
    this.config = {
      GAME_DURATION: 60, // seconds
      FIELD_SIZE: { x: 10, z: 10 },
      SOUL_COUNT: 10, // Reduced from 15 to 10
      SOUL_SPAWN_RATE: 1.5, // Reduced from 2 to 1.5 souls per second
      PLAYER_SPEED: 8,
      COLLISION_RADIUS: 1.5
    }
    
    // Bind methods to preserve context
    this.update = this.update.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
    
    console.log('GameEngine created')
  }

  /**
   * Initialize the game engine with required systems
   * @param {Object} systems - Object containing all game systems
   */
  init(systems) {
    if (!systems) {
      throw new Error('Game systems are required for GameEngine initialization')
    }
    
    // Store references to game systems
    this.renderEngine = systems.renderEngine
    this.playerController = systems.playerController
    this.soulManager = systems.soulManager
    this.collisionDetector = systems.collisionDetector
    this.inputManager = systems.inputManager
    this.uiManager = systems.uiManager
    this.soundManager = systems.soundManager
    
    // Validate required systems
    this.validateSystems()
    
    // Initialize game state
    this.initializeGameState()
    
    console.log('GameEngine initialized successfully')
  }

  /**
   * Validate that all required systems are present
   */
  validateSystems() {
    const requiredSystems = [
      'renderEngine',
      'playerController', 
      'soulManager',
      'collisionDetector',
      'inputManager'
    ]
    
    for (const system of requiredSystems) {
      if (!this[system]) {
        throw new Error(`Required system '${system}' is missing`)
      }
    }
  }

  /**
   * Initialize the game state and configure systems
   */
  initializeGameState() {
    // Set initial game state
    this.currentState = 'menu'
    this.gameTime = 0
    this.lastTime = 0
    
    // Initialize timer and scoring
    this.resetTimerAndScore()
    
    // Configure systems based on game config
    if (this.soulManager) {
      this.soulManager.setMaxSouls(this.config.SOUL_COUNT)
      this.soulManager.setSpawnRate(this.config.SOUL_SPAWN_RATE)
      this.soulManager.setFieldSize(this.config.FIELD_SIZE.x, this.config.FIELD_SIZE.z)
    }
    
    if (this.playerController) {
      this.playerController.setBoundarySize(this.config.FIELD_SIZE.x)
    }
    
    // Set up collision callback
    if (this.collisionDetector) {
      this.collisionDetector.addCollisionCallback((collisionData) => {
        this.handleSoulCollection(collisionData)
      })
    }
  }

  /**
   * Start the main game loop
   */
  startGameLoop() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = performance.now()
    this.update(this.lastTime)
    
    console.log('Game loop started')
  }

  /**
   * Stop the main game loop
   */
  stopGameLoop() {
    if (!this.isRunning) return
    
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    
    console.log('Game loop stopped')
  }

  /**
   * Main update loop with delta time calculation
   * @param {number} currentTime - Current timestamp from requestAnimationFrame
   */
  update(currentTime) {
    if (!this.isRunning) return
    
    // Schedule next update
    this.animationId = requestAnimationFrame(this.update)
    
    // Calculate delta time
    this.deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    
    // Clamp delta time to prevent large jumps
    this.deltaTime = Math.min(this.deltaTime, 1/30) // Max 30 FPS minimum
    
    // Update based on current game state
    switch (this.currentState) {
      case 'menu':
        this.updateMenuState()
        break
      case 'playing':
        this.updatePlayingState()
        break
      case 'game-over':
        this.updateGameOverState()
        break
    }
  }

  /**
   * Update logic for menu state
   */
  updateMenuState() {
    // Update environment animations even in menu
    // Note: Environment animations are handled by the main update loop in main.js
    
    // Check for input to start game
    if (this.inputManager) {
      const inputVector = this.inputManager.getInputVector()
      if (inputVector.x !== 0 || inputVector.z !== 0) {
        this.startGame()
      }
    }
  }

  /**
   * Update logic for playing state
   */
  updatePlayingState() {
    // Update game time
    this.gameTime += this.deltaTime
    
    // Update timer countdown
    this.updateTimer()
    
    // Check if time is up
    if (this.timeRemaining <= 0) {
      this.endGame()
      return
    }
    
    // Update environment animations
    // Note: Environment animations are handled by the main update loop in main.js
    
    // Update player movement
    if (this.playerController && this.inputManager) {
      const inputVector = this.inputManager.getInputVector()
      if (inputVector.x !== 0 || inputVector.z !== 0) {
        this.playerController.move(inputVector.x, inputVector.z, this.deltaTime)
      }
      this.playerController.update(this.deltaTime)
    }
    
    // Update soul manager
    if (this.soulManager) {
      this.soulManager.update(this.deltaTime)
    }
    
    // Check collisions
    if (this.collisionDetector && this.playerController && this.soulManager) {
      const collectedSouls = this.collisionDetector.checkCollisionsOptimized(
        this.playerController, 
        this.soulManager
      )
      
      // Handle collected souls (callback will be triggered automatically)
      if (collectedSouls.length > 0) {
        console.log(`Collected ${collectedSouls.length} soul(s) this frame`)
      }
    }
    
    // Update UI if available
    if (this.uiManager) {
      this.uiManager.updateGameUI(this.getGameState())
    }
  }

  /**
   * Update logic for game over state
   */
  updateGameOverState() {
    // Update environment animations
    // Note: Environment animations are handled by the main update loop in main.js
    
    // Keep souls and player visible but don't update gameplay
    if (this.soulManager) {
      // Update soul animations but don't spawn new ones
      this.soulManager.pauseSpawning()
      this.soulManager.update(this.deltaTime)
    }
    
    // Check for restart input
    if (this.inputManager && this.inputManager.isRestartPressed()) {
      this.restartGame()
    }
  }

  /**
   * Start a new game session
   */
  startGame() {
    console.log('Starting new game session')
    
    // Play game start sound
    if (this.soundManager) {
      this.soundManager.playGameStart()
    }
    
    // Change state to playing
    this.changeState('playing')
    
    // Reset game time
    this.gameTime = 0
    
    // Reset timer and score
    this.resetTimerAndScore()
    this.startTimer()
    
    // Reset player position
    if (this.playerController) {
      this.playerController.reset()
    }
    
    // Clear existing souls and resume spawning
    if (this.soulManager) {
      this.soulManager.clearAllSouls()
      this.soulManager.resumeSpawning(this.config.SOUL_SPAWN_RATE)
    }
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.showGameUI()
    }
  }

  /**
   * End the current game session
   */
  endGame() {
    console.log(`Ending game session - Final Score: ${this.score}`)
    
    // Play game over sound
    if (this.soundManager) {
      this.soundManager.playGameOver()
    }
    
    // Stop the timer
    this.stopTimer()
    
    // Change state to game over
    this.changeState('game-over')
    
    // Stop soul spawning
    if (this.soulManager) {
      this.soulManager.pauseSpawning()
    }
    
    // Show game over UI
    if (this.uiManager) {
      this.uiManager.showGameOverUI(this.getGameState())
    }
  }

  /**
   * Restart the game
   */
  restartGame() {
    console.log('Restarting game')
    
    // Start a new game session
    this.startGame()
  }

  /**
   * Change the current game state
   * @param {string} newState - New game state ('menu', 'playing', 'game-over')
   */
  changeState(newState) {
    if (this.currentState === newState) return
    
    const validStates = ['menu', 'playing', 'game-over']
    if (!validStates.includes(newState)) {
      console.warn(`Invalid game state: ${newState}`)
      return
    }
    
    console.log(`Game state changed: ${this.currentState} -> ${newState}`)
    
    this.previousState = this.currentState
    this.currentState = newState
    
    // Handle state change
    this.handleStateChange(newState, this.previousState)
  }

  /**
   * Handle state change logic
   * @param {string} newState - New state
   * @param {string} previousState - Previous state
   */
  handleStateChange(newState, previousState) {
    // Perform state-specific initialization
    switch (newState) {
      case 'menu':
        this.onEnterMenuState(previousState)
        break
      case 'playing':
        this.onEnterPlayingState(previousState)
        break
      case 'game-over':
        this.onEnterGameOverState(previousState)
        break
    }
  }

  /**
   * Handle entering menu state
   * @param {string} previousState - Previous state
   */
  onEnterMenuState(previousState) {
    // Pause soul spawning
    if (this.soulManager) {
      this.soulManager.pauseSpawning()
    }
    
    // Show menu UI
    if (this.uiManager) {
      this.uiManager.showMenuUI()
    }
  }

  /**
   * Handle entering playing state
   * @param {string} previousState - Previous state
   */
  onEnterPlayingState(previousState) {
    // Resume soul spawning
    if (this.soulManager) {
      this.soulManager.resumeSpawning(this.config.SOUL_SPAWN_RATE)
    }
    
    // Show game UI
    if (this.uiManager) {
      this.uiManager.showGameUI()
    }
  }

  /**
   * Handle entering game over state
   * @param {string} previousState - Previous state
   */
  onEnterGameOverState(previousState) {
    // Pause soul spawning
    if (this.soulManager) {
      this.soulManager.pauseSpawning()
    }
    
    // Show game over UI
    if (this.uiManager) {
      this.uiManager.showGameOverUI(this.getGameState())
    }
  }

  /**
   * Handle soul collection event
   * @param {Object} collisionData - Collision data from collision detector
   */
  handleSoulCollection(collisionData) {
    // Only count souls collected during gameplay
    if (this.currentState !== 'playing') return
    
    // Play collection sound effect
    if (this.soundManager) {
      this.soundManager.playSoulCollected()
    }
    
    // Increment score
    this.incrementScore()
    
    console.log(`Soul collected! Score: ${this.score} | Position: ${collisionData.soulPosition.x.toFixed(2)}, ${collisionData.soulPosition.y.toFixed(2)}, ${collisionData.soulPosition.z.toFixed(2)}`)
  }

  /**
   * Get current game state data
   * @returns {Object} Current game state
   */
  getGameState() {
    return {
      currentState: this.currentState,
      gameTime: this.gameTime,
      deltaTime: this.deltaTime,
      isRunning: this.isRunning,
      score: this.score,
      timeRemaining: Math.max(0, this.timeRemaining),
      config: { ...this.config }
    }
  }

  /**
   * Get current game state name
   * @returns {string} Current state
   */
  getCurrentState() {
    return this.currentState
  }

  /**
   * Check if game is currently running
   * @returns {boolean} True if game loop is running
   */
  getIsRunning() {
    return this.isRunning
  }

  /**
   * Get game time elapsed
   * @returns {number} Game time in seconds
   */
  getGameTime() {
    return this.gameTime
  }

  /**
   * Get delta time for current frame
   * @returns {number} Delta time in seconds
   */
  getDeltaTime() {
    return this.deltaTime
  }

  /**
   * Update game configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Apply configuration changes to systems
    if (this.soulManager) {
      if (newConfig.SOUL_COUNT !== undefined) {
        this.soulManager.setMaxSouls(newConfig.SOUL_COUNT)
      }
      if (newConfig.SOUL_SPAWN_RATE !== undefined) {
        this.soulManager.setSpawnRate(newConfig.SOUL_SPAWN_RATE)
      }
      if (newConfig.FIELD_SIZE !== undefined) {
        this.soulManager.setFieldSize(newConfig.FIELD_SIZE.x, newConfig.FIELD_SIZE.z)
      }
    }
    
    if (this.playerController && newConfig.FIELD_SIZE !== undefined) {
      this.playerController.setBoundarySize(newConfig.FIELD_SIZE.x)
    }
    
    console.log('Game configuration updated:', newConfig)
  }

  /**
   * Get current game configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Reset timer and score to initial values
   */
  resetTimerAndScore() {
    this.score = 0
    this.timeRemaining = this.config.GAME_DURATION
    this.gameTime = 0
    
    console.log(`Timer and score reset - Duration: ${this.config.GAME_DURATION}s`)
  }

  /**
   * Start the game timer
   */
  startTimer() {
    // Clear any existing timer
    this.stopTimer()
    
    // Start new timer that updates every 100ms for smooth countdown
    this.gameTimer = setInterval(() => {
      this.updateTimerDisplay()
    }, this.timerUpdateInterval)
    
    console.log('Game timer started')
  }

  /**
   * Stop the game timer
   */
  stopTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
      console.log('Game timer stopped')
    }
  }

  /**
   * Update the timer countdown
   */
  updateTimer() {
    if (this.currentState === 'playing') {
      const previousTime = this.timeRemaining
      
      // Calculate time remaining based on game time
      this.timeRemaining = Math.max(0, this.config.GAME_DURATION - this.gameTime)
      
      // Play countdown sounds
      if (this.soundManager) {
        // Warning sound for last 10 seconds
        if (this.timeRemaining <= 10 && previousTime > 10) {
          this.soundManager.playCountdownWarning()
        }
        // Tick sound for last 5 seconds
        else if (this.timeRemaining <= 5 && Math.floor(this.timeRemaining) !== Math.floor(previousTime)) {
          this.soundManager.playCountdownTick()
        }
      }
      
      // Check if time is up
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0
        console.log('Time is up!')
      }
    }
  }

  /**
   * Update timer display (called by interval timer)
   */
  updateTimerDisplay() {
    if (this.uiManager && this.currentState === 'playing') {
      this.uiManager.updateTimer(this.timeRemaining)
    }
  }

  /**
   * Increment the player's score
   * @param {number} points - Points to add (default: 1)
   */
  incrementScore(points = 1) {
    this.score += points
    
    // Update UI immediately
    if (this.uiManager) {
      this.uiManager.updateScore(this.score)
    }
    
    console.log(`Score incremented by ${points}. Total: ${this.score}`)
  }

  /**
   * Get current score
   * @returns {number} Current score
   */
  getScore() {
    return this.score
  }

  /**
   * Set score to a specific value
   * @param {number} newScore - New score value
   */
  setScore(newScore) {
    this.score = Math.max(0, newScore)
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateScore(this.score)
    }
    
    console.log(`Score set to: ${this.score}`)
  }

  /**
   * Get time remaining in seconds
   * @returns {number} Time remaining
   */
  getTimeRemaining() {
    return this.timeRemaining
  }

  /**
   * Get formatted time string (MM:SS)
   * @returns {string} Formatted time string
   */
  getFormattedTime() {
    const minutes = Math.floor(this.timeRemaining / 60)
    const seconds = Math.floor(this.timeRemaining % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * Check if the game timer has expired
   * @returns {boolean} True if time is up
   */
  isTimeUp() {
    return this.timeRemaining <= 0
  }

  /**
   * Add bonus time to the timer
   * @param {number} bonusSeconds - Seconds to add
   */
  addBonusTime(bonusSeconds) {
    this.timeRemaining += bonusSeconds
    console.log(`Bonus time added: ${bonusSeconds}s. New time remaining: ${this.timeRemaining}s`)
  }

  /**
   * Get game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    const timeElapsed = this.config.GAME_DURATION - this.timeRemaining
    const soulsPerSecond = timeElapsed > 0 ? (this.score / timeElapsed).toFixed(2) : 0
    
    return {
      score: this.score,
      timeElapsed: timeElapsed.toFixed(1),
      timeRemaining: this.timeRemaining.toFixed(1),
      soulsPerSecond: parseFloat(soulsPerSecond),
      gameState: this.currentState
    }
  }

  /**
   * Clean up game engine resources
   */
  dispose() {
    // Stop the game loop and timer
    this.stopGameLoop()
    this.stopTimer()
    
    // Clear system references
    this.renderEngine = null
    this.playerController = null
    this.soulManager = null
    this.collisionDetector = null
    this.inputManager = null
    this.uiManager = null
    this.soundManager = null
    
    // Reset state
    this.currentState = 'menu'
    this.previousState = null
    this.gameTime = 0
    this.lastTime = 0
    this.deltaTime = 0
    this.score = 0
    this.timeRemaining = 60
    
    console.log('GameEngine disposed')
  }
}