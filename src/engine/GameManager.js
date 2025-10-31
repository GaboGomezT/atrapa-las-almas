/**
 * GameManager - Handles overall game state, timer, and game flow
 * Integrates with UIManager for display updates
 */
export class GameManager {
  constructor(uiManager) {
    this.uiManager = uiManager
    this.gameTimer = null
    this.gameStartTime = null
    this.gameDuration = 30 // 30 seconds
    this.isGameActive = false
    this.score = 0
    
    // Callbacks
    this.onGameEndCallback = null
    this.onScoreUpdateCallback = null
  }

  /**
   * Initialize the game manager
   */
  init() {
    if (this.uiManager) {
      // Set up restart callback
      this.uiManager.setRestartCallback(() => {
        this.startNewGame()
      })
    }
    
    console.log('GameManager initialized')
  }

  /**
   * Start a new game session
   */
  startNewGame() {
    this.isGameActive = true
    this.score = 0
    this.gameStartTime = Date.now()
    
    // Reset UI
    if (this.uiManager) {
      this.uiManager.startGame()
    }
    
    // Start game timer
    this.startGameTimer()
    
    console.log('New game started')
    
    // Notify other systems that game has started
    if (this.onGameStartCallback) {
      this.onGameStartCallback()
    }
  }

  /**
   * Start the game timer
   */
  startGameTimer() {
    // Clear any existing timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
    }
    
    // Update timer every 100ms for smooth countdown
    this.gameTimer = setInterval(() => {
      if (!this.isGameActive) {
        return
      }
      
      const elapsed = (Date.now() - this.gameStartTime) / 1000
      const remaining = Math.max(0, this.gameDuration - elapsed)
      
      // Update UI timer
      if (this.uiManager) {
        this.uiManager.updateTimerDisplay(remaining)
      }
      
      // Check if game should end
      if (remaining <= 0) {
        this.endGame()
      }
    }, 100)
  }

  /**
   * End the current game
   */
  endGame() {
    this.isGameActive = false
    
    // Clear timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
    
    // Show game over screen
    if (this.uiManager) {
      this.uiManager.showGameOverScreen()
    }
    
    console.log(`Game ended. Final score: ${this.score}`)
    
    // Notify other systems that game has ended
    if (this.onGameEndCallback) {
      this.onGameEndCallback(this.score)
    }
  }

  /**
   * Add points to the score
   * @param {number} points - Points to add
   */
  addScore(points = 1) {
    if (!this.isGameActive) {
      return
    }
    
    this.score += points
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateScoreDisplay(this.score)
    }
    
    // Notify score update
    if (this.onScoreUpdateCallback) {
      this.onScoreUpdateCallback(this.score, points)
    }
  }

  /**
   * Get current game state
   * @returns {Object} - Current game state
   */
  getGameState() {
    const elapsed = this.gameStartTime ? (Date.now() - this.gameStartTime) / 1000 : 0
    const remaining = Math.max(0, this.gameDuration - elapsed)
    
    return {
      isActive: this.isGameActive,
      score: this.score,
      timeRemaining: remaining,
      timeElapsed: elapsed
    }
  }

  /**
   * Check if game is currently running
   * @returns {boolean} - True if game is active
   */
  isRunning() {
    return this.isGameActive
  }

  /**
   * Get current score
   * @returns {number} - Current score
   */
  getCurrentScore() {
    return this.score
  }

  /**
   * Set callback for game end event
   * @param {Function} callback - Function to call when game ends
   */
  setGameEndCallback(callback) {
    this.onGameEndCallback = callback
  }

  /**
   * Set callback for game start event
   * @param {Function} callback - Function to call when game starts
   */
  setGameStartCallback(callback) {
    this.onGameStartCallback = callback
  }

  /**
   * Set callback for score update event
   * @param {Function} callback - Function to call when score updates
   */
  setScoreUpdateCallback(callback) {
    this.onScoreUpdateCallback = callback
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.isGameActive && this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
      console.log('Game paused')
    }
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (this.isGameActive && !this.gameTimer) {
      this.startGameTimer()
      console.log('Game resumed')
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
    
    this.isGameActive = false
    this.onGameEndCallback = null
    this.onGameStartCallback = null
    this.onScoreUpdateCallback = null
    
    console.log('GameManager disposed')
  }
}