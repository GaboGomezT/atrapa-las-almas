/**
 * UIManager - Manages all user interface elements and HUD components
 * Handles timer display, score counter, and responsive layout
 */
export class UIManager {
  constructor() {
    this.timerElement = null
    this.scoreElement = null
    this.gameOverModal = null
    this.finalScoreElement = null
    this.restartButton = null
    
    // Game state tracking
    this.currentScore = 0
    this.timeRemaining = 60
    this.isGameActive = false
    
    // Callbacks
    this.onRestartCallback = null
  }

  /**
   * Initialize UI elements and set up event listeners
   */
  init() {
    try {
      // Get timer display elements
      this.timerElement = document.getElementById('timer-value')
      if (!this.timerElement) {
        throw new Error('Timer display element not found')
      }

      // Get score display elements
      this.scoreElement = document.getElementById('score-value')
      if (!this.scoreElement) {
        throw new Error('Score display element not found')
      }

      // Get game over modal elements
      this.gameOverModal = document.getElementById('game-over-modal')
      this.finalScoreElement = document.getElementById('final-score')
      this.restartButton = document.getElementById('restart-button')

      if (!this.gameOverModal || !this.finalScoreElement || !this.restartButton) {
        throw new Error('Game over modal elements not found')
      }

      // Set up restart button event listener
      this.restartButton.addEventListener('click', () => {
        this.handleRestart()
      })

      // Initialize display values
      this.updateTimerDisplay(this.timeRemaining)
      this.updateScoreDisplay(this.currentScore)

      // Initialize mobile-specific features
      this.initMobileFeatures()

      console.log('UIManager initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize UIManager:', error)
      return false
    }
  }

  /**
   * Update the timer display
   * @param {number} seconds - Remaining time in seconds
   */
  updateTimerDisplay(seconds) {
    this.timeRemaining = Math.max(0, Math.floor(seconds))
    
    if (this.timerElement) {
      this.timerElement.textContent = this.timeRemaining.toString()
      
      // Add visual warning when time is running low
      const timerDisplay = this.timerElement.parentElement
      if (this.timeRemaining <= 10) {
        timerDisplay.style.color = '#ff4444'
        timerDisplay.style.animation = 'pulse 1s infinite'
      } else if (this.timeRemaining <= 30) {
        timerDisplay.style.color = '#ffaa00'
        timerDisplay.style.animation = 'none'
      } else {
        timerDisplay.style.color = '#ffaa00'
        timerDisplay.style.animation = 'none'
      }
    }
  }

  /**
   * Update the score display
   * @param {number} score - Current score value
   */
  updateScoreDisplay(score) {
    this.currentScore = score
    
    if (this.scoreElement) {
      this.scoreElement.textContent = this.currentScore.toString()
      
      // Add brief highlight animation when score increases
      if (score > 0) {
        const scoreDisplay = this.scoreElement.parentElement
        scoreDisplay.style.transform = 'scale(1.1)'
        scoreDisplay.style.transition = 'transform 0.2s ease'
        
        setTimeout(() => {
          scoreDisplay.style.transform = 'scale(1)'
        }, 200)
      }
    }
  }

  /**
   * Show the game over screen with final score
   */
  showGameOverScreen() {
    if (this.gameOverModal && this.finalScoreElement) {
      // Update final score display
      this.finalScoreElement.textContent = this.currentScore.toString()
      
      // Update congratulatory message based on score
      const messageElement = document.getElementById('final-message')
      if (messageElement) {
        let message = 'Las almas agradecen tu guía'
        
        // Add score-based variations to the message
        if (this.currentScore >= 20) {
          message = '¡Excelente! Las almas agradecen tu guía'
        } else if (this.currentScore >= 10) {
          message = '¡Bien hecho! Las almas agradecen tu guía'
        } else if (this.currentScore >= 5) {
          message = 'Las almas agradecen tu guía'
        } else {
          message = 'Las almas esperan tu ayuda. ¡Inténtalo de nuevo!'
        }
        
        messageElement.textContent = message
      }
      
      // Show the modal with fade-in effect
      this.gameOverModal.classList.remove('hidden')
      this.gameOverModal.style.opacity = '0'
      this.gameOverModal.style.transition = 'opacity 0.3s ease'
      
      setTimeout(() => {
        this.gameOverModal.style.opacity = '1'
      }, 10)
      
      this.isGameActive = false
      
      // Focus on restart button for accessibility
      setTimeout(() => {
        if (this.restartButton) {
          this.restartButton.focus()
        }
      }, 400)
    }
  }

  /**
   * Hide the game over screen
   */
  hideGameOverScreen() {
    if (this.gameOverModal) {
      // Fade out effect
      this.gameOverModal.style.opacity = '0'
      this.gameOverModal.style.transition = 'opacity 0.3s ease'
      
      setTimeout(() => {
        this.gameOverModal.classList.add('hidden')
        this.gameOverModal.style.opacity = '1'
      }, 300)
    }
  }

  /**
   * Handle restart button click
   */
  handleRestart() {
    this.hideGameOverScreen()
    this.resetUI()
    
    if (this.onRestartCallback) {
      this.onRestartCallback()
    }
  }

  /**
   * Reset UI to initial state
   */
  resetUI() {
    this.currentScore = 0
    this.timeRemaining = 60
    this.isGameActive = true
    
    this.updateTimerDisplay(this.timeRemaining)
    this.updateScoreDisplay(this.currentScore)
    
    // Reset timer styling
    if (this.timerElement) {
      const timerDisplay = this.timerElement.parentElement
      timerDisplay.style.color = '#ffaa00'
      timerDisplay.style.animation = 'none'
    }
  }

  /**
   * Set callback for restart functionality
   * @param {Function} callback - Function to call when restart is requested
   */
  setRestartCallback(callback) {
    this.onRestartCallback = callback
  }

  /**
   * Start the game timer and UI updates
   */
  startGame() {
    this.isGameActive = true
    this.resetUI()
  }

  /**
   * Check if the game is currently active
   * @returns {boolean} - True if game is active
   */
  isGameRunning() {
    return this.isGameActive && this.timeRemaining > 0
  }

  /**
   * Get current score
   * @returns {number} - Current score value
   */
  getCurrentScore() {
    return this.currentScore
  }

  /**
   * Get remaining time
   * @returns {number} - Remaining time in seconds
   */
  getRemainingTime() {
    return this.timeRemaining
  }

  /**
   * Update responsive layout based on screen size
   */
  updateResponsiveLayout() {
    const isMobile = window.innerWidth <= 768
    const isLandscape = window.innerWidth > window.innerHeight
    const isSmallScreen = window.innerHeight < 500
    
    // Adjust UI element sizes for mobile
    if (isMobile) {
      const uiElements = document.querySelectorAll('.ui-element')
      uiElements.forEach(element => {
        if (isLandscape && isSmallScreen) {
          element.style.fontSize = '1rem'
          element.style.padding = '4px 8px'
        } else {
          element.style.fontSize = '1.2rem'
          element.style.padding = '8px 16px'
        }
      })
      
      // Adjust timer for different screen sizes
      if (this.timerElement) {
        const timerDisplay = this.timerElement.parentElement
        if (isLandscape && isSmallScreen) {
          timerDisplay.style.fontSize = '1.2rem'
          timerDisplay.style.top = '5px'
        } else if (isSmallScreen) {
          timerDisplay.style.fontSize = '1.3rem'
          timerDisplay.style.top = '5px'
        } else {
          timerDisplay.style.fontSize = '1.5rem'
          timerDisplay.style.top = '10px'
        }
      }
      
      // Adjust score display
      if (this.scoreElement) {
        const scoreDisplay = this.scoreElement.parentElement
        if (isLandscape && isSmallScreen) {
          scoreDisplay.style.fontSize = '1rem'
          scoreDisplay.style.top = '5px'
          scoreDisplay.style.left = '5px'
        } else if (isSmallScreen) {
          scoreDisplay.style.fontSize = '1.1rem'
          scoreDisplay.style.top = '5px'
          scoreDisplay.style.left = '5px'
        } else {
          scoreDisplay.style.fontSize = '1.2rem'
          scoreDisplay.style.top = '10px'
          scoreDisplay.style.left = '10px'
        }
      }
    }
    
    // Adjust modal for mobile
    if (this.gameOverModal) {
      const modalContent = this.gameOverModal.querySelector('.modal-content')
      if (modalContent && isMobile) {
        if (isLandscape && isSmallScreen) {
          modalContent.style.padding = '20px 15px'
          modalContent.style.maxWidth = '350px'
        } else {
          modalContent.style.padding = '30px 20px'
          modalContent.style.margin = '20px'
        }
      }
    }
  }

  /**
   * Initialize mobile-specific features
   */
  initMobileFeatures() {
    // Add viewport meta tag if not present
    let viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no'
      document.head.appendChild(viewport)
    }
    
    // Prevent zoom on input focus (iOS Safari)
    const style = document.createElement('style')
    style.textContent = `
      input, select, textarea, button {
        font-size: 16px !important;
      }
      
      /* Prevent pull-to-refresh */
      body {
        overscroll-behavior: none;
      }
      
      /* Prevent text selection on touch */
      .ui-element, .btn-primary, #virtual-joystick {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
    `
    document.head.appendChild(style)
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateResponsiveLayout()
      }, 100)
    })
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.updateResponsiveLayout()
    })
    
    // Initial layout update
    this.updateResponsiveLayout()
  }

  /**
   * Check if device is mobile
   * @returns {boolean} - True if mobile device
   */
  isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const screenSize = window.innerWidth <= 768 || window.innerHeight <= 768
    
    return mobileRegex.test(userAgent.toLowerCase()) || screenSize
  }

  /**
   * Update score (alias for updateScoreDisplay for GameEngine compatibility)
   * @param {number} score - Current score value
   */
  updateScore(score) {
    this.updateScoreDisplay(score)
  }

  /**
   * Update timer (alias for updateTimerDisplay for GameEngine compatibility)
   * @param {number} seconds - Remaining time in seconds
   */
  updateTimer(seconds) {
    this.updateTimerDisplay(seconds)
  }

  /**
   * Update game UI with current game state
   * @param {Object} gameState - Current game state object
   */
  updateGameUI(gameState) {
    if (gameState.score !== undefined) {
      this.updateScoreDisplay(gameState.score)
    }
    if (gameState.timeRemaining !== undefined) {
      this.updateTimerDisplay(gameState.timeRemaining)
    }
  }

  /**
   * Show game UI (called when game starts)
   */
  showGameUI() {
    this.hideGameOverScreen()
    this.isGameActive = true
  }

  /**
   * Show game over UI
   * @param {Object} gameState - Final game state
   */
  showGameOverUI(gameState) {
    if (gameState.score !== undefined) {
      this.currentScore = gameState.score
    }
    this.showGameOverScreen()
  }

  /**
   * Show menu UI (placeholder for future menu implementation)
   */
  showMenuUI() {
    this.hideGameOverScreen()
    this.isGameActive = false
  }

  /**
   * Clean up resources and event listeners
   */
  dispose() {
    if (this.restartButton) {
      this.restartButton.removeEventListener('click', this.handleRestart)
    }
    
    this.timerElement = null
    this.scoreElement = null
    this.gameOverModal = null
    this.finalScoreElement = null
    this.restartButton = null
    this.onRestartCallback = null
    
    console.log('UIManager disposed')
  }
}