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
    
    // Touch control manager reference
    this.touchControlManager = null
    this.inputManager = null
    
    // Name input modal elements
    this.nameInputModal = null
    this.nameInputScoreElement = null
    this.playerNameInput = null
    this.submitNameButton = null
    this.cancelNameButton = null
    this.nameValidationError = null
    
    // Leaderboard modal elements
    this.leaderboardModal = null
    this.playerResultMessage = null
    this.leaderboardList = null
    this.closeLeaderboardButton = null
    
    // Error modal elements
    this.networkErrorModal = null
    this.networkErrorMessage = null
    this.retryNetworkButton = null
    this.continueOfflineButton = null
    this.apiErrorModal = null
    this.apiErrorMessage = null
    this.retryApiButton = null
    this.skipLeaderboardButton = null
    
    // Game state tracking
    this.currentScore = 0
    this.timeRemaining = 30
    this.isGameActive = false
    
    // Error handling state
    this.currentRetryCallback = null
    this.currentSkipCallback = null
    
    // Callbacks
    this.onRestartCallback = null
    this.onNameSubmitCallback = null
    this.onNameCancelCallback = null
    this.onLeaderboardCloseCallback = null
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

      // Get name input modal elements
      this.nameInputModal = document.getElementById('name-input-modal')
      this.nameInputScoreElement = document.getElementById('name-input-score')
      this.playerNameInput = document.getElementById('player-name-input')
      this.submitNameButton = document.getElementById('submit-name-button')
      this.cancelNameButton = document.getElementById('cancel-name-button')
      this.nameValidationError = document.getElementById('name-validation-error')

      if (!this.nameInputModal || !this.nameInputScoreElement || !this.playerNameInput || 
          !this.submitNameButton || !this.cancelNameButton || !this.nameValidationError) {
        throw new Error('Name input modal elements not found')
      }

      // Get leaderboard modal elements
      this.leaderboardModal = document.getElementById('leaderboard-modal')
      this.playerResultMessage = document.getElementById('player-result-message')
      this.leaderboardList = document.getElementById('leaderboard-list')
      this.closeLeaderboardButton = document.getElementById('close-leaderboard-button')

      if (!this.leaderboardModal || !this.playerResultMessage || !this.leaderboardList || !this.closeLeaderboardButton) {
        throw new Error('Leaderboard modal elements not found')
      }

      // Get error modal elements
      this.networkErrorModal = document.getElementById('network-error-modal')
      this.networkErrorMessage = document.getElementById('network-error-message')
      this.retryNetworkButton = document.getElementById('retry-network-button')
      this.continueOfflineButton = document.getElementById('continue-offline-button')
      this.apiErrorModal = document.getElementById('api-error-modal')
      this.apiErrorMessage = document.getElementById('api-error-message')
      this.retryApiButton = document.getElementById('retry-api-button')
      this.skipLeaderboardButton = document.getElementById('skip-leaderboard-button')

      if (!this.networkErrorModal || !this.networkErrorMessage || !this.retryNetworkButton || 
          !this.continueOfflineButton || !this.apiErrorModal || !this.apiErrorMessage || 
          !this.retryApiButton || !this.skipLeaderboardButton) {
        throw new Error('Error modal elements not found')
      }

      // Set up restart button event listener
      this.restartButton.addEventListener('click', () => {
        this.handleRestart()
      })

      // Set up name input modal event listeners
      this.submitNameButton.addEventListener('click', () => {
        this.handleNameSubmit()
      })

      this.cancelNameButton.addEventListener('click', () => {
        this.handleNameCancel()
      })

      // Real-time validation for name input
      this.playerNameInput.addEventListener('input', () => {
        this.validatePlayerNameInput()
      })

      // Handle Enter key in name input
      this.playerNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.handleNameSubmit()
        }
      })

      // Set up leaderboard modal event listeners
      this.closeLeaderboardButton.addEventListener('click', () => {
        this.handleLeaderboardClose()
      })

      // Set up error modal event listeners
      this.retryNetworkButton.addEventListener('click', () => {
        this.handleNetworkRetry()
      })

      this.continueOfflineButton.addEventListener('click', () => {
        this.handleContinueOffline()
      })

      this.retryApiButton.addEventListener('click', () => {
        this.handleApiRetry()
      })

      this.skipLeaderboardButton.addEventListener('click', () => {
        this.handleSkipLeaderboard()
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
      if (this.timeRemaining <= 5) {
        timerDisplay.style.color = '#ff4444'
        timerDisplay.style.animation = 'pulse 1s infinite'
      } else if (this.timeRemaining <= 15) {
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
    this.timeRemaining = 30
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
   * Show name input modal for leaderboard submission
   * @param {number} score - Player's final score
   */
  showNameInputModal(score) {
    if (this.nameInputModal && this.nameInputScoreElement && this.playerNameInput) {
      // Disable touch controls to prevent interference with modal
      if (this.touchControlManager) {
        this.touchControlManager.disableControls()
      }
      if (this.inputManager) {
        this.inputManager.disableTouchControls()
      }
      
      // Update score display
      this.nameInputScoreElement.textContent = score.toString()
      
      // Clear previous input and validation
      this.playerNameInput.value = ''
      this.hideNameValidationError()
      this.playerNameInput.classList.remove('invalid')
      
      // Show the modal with fade-in effect
      this.nameInputModal.classList.remove('hidden')
      this.nameInputModal.style.opacity = '0'
      this.nameInputModal.style.transition = 'opacity 0.3s ease'
      
      setTimeout(() => {
        this.nameInputModal.style.opacity = '1'
      }, 10)
      
      // Focus on input field for better UX
      setTimeout(() => {
        if (this.playerNameInput) {
          this.playerNameInput.focus()
        }
      }, 400)
      
      console.log('Name input modal shown for score:', score)
    }
  }

  /**
   * Hide name input modal
   */
  hideNameInputModal() {
    if (this.nameInputModal) {
      // Re-enable touch controls when modal is hidden
      if (this.touchControlManager) {
        this.touchControlManager.enableControls()
      }
      if (this.inputManager) {
        this.inputManager.enableTouchControls()
      }
      
      // Fade out effect
      this.nameInputModal.style.opacity = '0'
      this.nameInputModal.style.transition = 'opacity 0.3s ease'
      
      setTimeout(() => {
        this.nameInputModal.classList.add('hidden')
        this.nameInputModal.style.opacity = '1'
      }, 300)
    }
  }

  /**
   * Validate player name input
   * @param {string} name - Name to validate
   * @returns {boolean} - True if valid
   */
  validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return false
    }
    
    // Trim whitespace for validation
    const trimmedName = name.trim()
    
    // Check length (1-20 characters after trimming)
    if (trimmedName.length < 1 || trimmedName.length > 20) {
      return false
    }
    
    // Check for alphanumeric characters and spaces only
    // Must contain at least one non-space character
    const validNameRegex = /^[a-zA-Z0-9\s]+$/
    const hasNonSpaceChar = /[a-zA-Z0-9]/.test(trimmedName)
    
    return validNameRegex.test(trimmedName) && hasNonSpaceChar
  }

  /**
   * Validate name input field in real-time
   */
  validatePlayerNameInput() {
    if (!this.playerNameInput) return
    
    const name = this.playerNameInput.value.trim()
    const isValid = this.validatePlayerName(name)
    
    if (name.length === 0) {
      // Empty input - hide error, remove invalid styling
      this.hideNameValidationError()
      this.playerNameInput.classList.remove('invalid')
    } else if (!isValid) {
      // Invalid input - show error and invalid styling
      this.showNameValidationError()
      this.playerNameInput.classList.add('invalid')
    } else {
      // Valid input - hide error, remove invalid styling
      this.hideNameValidationError()
      this.playerNameInput.classList.remove('invalid')
    }
    
    return isValid
  }

  /**
   * Show name validation error
   */
  showNameValidationError() {
    if (this.nameValidationError) {
      this.nameValidationError.classList.remove('hidden')
    }
  }

  /**
   * Hide name validation error
   */
  hideNameValidationError() {
    if (this.nameValidationError) {
      this.nameValidationError.classList.add('hidden')
    }
  }

  /**
   * Handle name submit button click
   */
  handleNameSubmit() {
    if (!this.playerNameInput) return
    
    const name = this.playerNameInput.value.trim()
    
    // Validate name before submission
    if (!this.validatePlayerName(name)) {
      this.showNameValidationError()
      this.playerNameInput.classList.add('invalid')
      this.playerNameInput.focus()
      return
    }
    
    // Hide modal and call callback
    this.hideNameInputModal()
    
    if (this.onNameSubmitCallback) {
      this.onNameSubmitCallback(name, this.currentScore)
    }
    
    console.log('Name submitted:', name, 'Score:', this.currentScore)
  }

  /**
   * Handle name cancel button click
   */
  handleNameCancel() {
    this.hideNameInputModal()
    
    if (this.onNameCancelCallback) {
      this.onNameCancelCallback()
    }
    
    console.log('Name input cancelled')
  }

  /**
   * Set callback for name submission
   * @param {Function} callback - Function to call when name is submitted (name, score)
   */
  setNameSubmitCallback(callback) {
    this.onNameSubmitCallback = callback
  }

  /**
   * Set callback for name cancellation
   * @param {Function} callback - Function to call when name input is cancelled
   */
  setNameCancelCallback(callback) {
    this.onNameCancelCallback = callback
  }

  /**
   * Show leaderboard modal with ranking data
   * @param {Object} leaderboardData - Leaderboard display data
   * @param {string} leaderboardData.playerName - Current player's name
   * @param {number} leaderboardData.playerScore - Player's score
   * @param {number|null} leaderboardData.playerRank - Player's rank (1-10) or null if not in top 10
   * @param {Array} leaderboardData.topScores - Array of top 10 player records
   * @param {string} leaderboardData.message - Display message for player
   */
  showLeaderboardModal(leaderboardData) {
    if (!this.leaderboardModal || !this.playerResultMessage || !this.leaderboardList) {
      console.error('Leaderboard modal elements not found')
      return
    }

    // Disable touch controls to prevent interference with modal
    if (this.touchControlManager) {
      this.touchControlManager.disableControls()
    }
    if (this.inputManager) {
      this.inputManager.disableTouchControls()
    }

    const { playerName, playerScore, playerRank, topScores, message } = leaderboardData

    // Update player result message
    this.playerResultMessage.textContent = message

    // Clear previous leaderboard entries
    this.leaderboardList.innerHTML = ''

    // Populate leaderboard list
    if (topScores && topScores.length > 0) {
      topScores.forEach((player, index) => {
        const rank = index + 1
        const isCurrentPlayer = player.name === playerName && player.score === playerScore

        const leaderboardItem = document.createElement('div')
        leaderboardItem.className = `leaderboard-item${isCurrentPlayer ? ' highlighted-player' : ''}`

        // Create rank element with special styling for top 3
        const rankElement = document.createElement('div')
        rankElement.className = `leaderboard-rank rank-${rank}`
        rankElement.textContent = `${rank}`

        // Create name element
        const nameElement = document.createElement('div')
        nameElement.className = 'leaderboard-name'
        nameElement.textContent = player.name
        nameElement.title = player.name // Tooltip for long names

        // Create score element
        const scoreElement = document.createElement('div')
        scoreElement.className = 'leaderboard-score'
        scoreElement.textContent = player.score.toString()

        // Assemble the item
        leaderboardItem.appendChild(rankElement)
        leaderboardItem.appendChild(nameElement)
        leaderboardItem.appendChild(scoreElement)

        this.leaderboardList.appendChild(leaderboardItem)
      })
    } else {
      // Show empty state
      const emptyMessage = document.createElement('div')
      emptyMessage.className = 'leaderboard-item'
      emptyMessage.style.justifyContent = 'center'
      emptyMessage.style.fontStyle = 'italic'
      emptyMessage.style.color = '#888'
      emptyMessage.textContent = 'No hay datos de ranking disponibles'
      this.leaderboardList.appendChild(emptyMessage)
    }

    // Show the modal with fade-in effect
    this.leaderboardModal.classList.remove('hidden')
    this.leaderboardModal.style.opacity = '0'
    this.leaderboardModal.style.transition = 'opacity 0.3s ease'

    setTimeout(() => {
      this.leaderboardModal.style.opacity = '1'
    }, 10)

    // Focus on close button for accessibility
    setTimeout(() => {
      if (this.closeLeaderboardButton) {
        this.closeLeaderboardButton.focus()
      }
    }, 400)

    console.log('Leaderboard modal shown:', leaderboardData)
  }

  /**
   * Hide leaderboard modal
   */
  hideLeaderboardModal() {
    if (this.leaderboardModal) {
      // Re-enable touch controls when modal is hidden
      if (this.touchControlManager) {
        this.touchControlManager.enableControls()
      }
      if (this.inputManager) {
        this.inputManager.enableTouchControls()
      }
      
      // Fade out effect
      this.leaderboardModal.style.opacity = '0'
      this.leaderboardModal.style.transition = 'opacity 0.3s ease'

      setTimeout(() => {
        this.leaderboardModal.classList.add('hidden')
        this.leaderboardModal.style.opacity = '1'
      }, 300)
    }
  }

  /**
   * Handle leaderboard close button click
   */
  handleLeaderboardClose() {
    this.hideLeaderboardModal()

    if (this.onLeaderboardCloseCallback) {
      this.onLeaderboardCloseCallback()
    }

    console.log('Leaderboard modal closed')
  }

  /**
   * Set callback for leaderboard close
   * @param {Function} callback - Function to call when leaderboard is closed
   */
  setLeaderboardCloseCallback(callback) {
    this.onLeaderboardCloseCallback = callback
  }

  /**
   * Set touch control manager reference
   * @param {TouchControlManager} touchControlManager - Touch control manager instance
   */
  setTouchControlManager(touchControlManager) {
    this.touchControlManager = touchControlManager
  }

  /**
   * Set input manager reference
   * @param {InputManager} inputManager - Input manager instance
   */
  setInputManager(inputManager) {
    this.inputManager = inputManager
  }

  /**
   * Show network error modal with retry and offline options
   * @param {string} message - Error message to display
   * @param {Function} retryCallback - Function to call when retry is clicked
   * @param {Function} skipCallback - Function to call when continue offline is clicked
   */
  showNetworkErrorModal(message, retryCallback, skipCallback) {
    if (!this.networkErrorModal || !this.networkErrorMessage) {
      console.error('Network error modal elements not found')
      return
    }

    // Disable touch controls to prevent interference with modal
    if (this.touchControlManager) {
      this.touchControlManager.disableControls()
    }
    if (this.inputManager) {
      this.inputManager.disableTouchControls()
    }

    // Store callbacks for button handlers
    this.currentRetryCallback = retryCallback
    this.currentSkipCallback = skipCallback

    // Update error message
    this.networkErrorMessage.textContent = message || 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'

    // Show the modal with fade-in effect
    this.networkErrorModal.classList.remove('hidden')
    this.networkErrorModal.style.opacity = '0'
    this.networkErrorModal.style.transition = 'opacity 0.3s ease'

    setTimeout(() => {
      this.networkErrorModal.style.opacity = '1'
    }, 10)

    // Focus on retry button for accessibility
    setTimeout(() => {
      if (this.retryNetworkButton) {
        this.retryNetworkButton.focus()
      }
    }, 400)

    console.log('Network error modal shown:', message)
  }

  /**
   * Hide network error modal
   */
  hideNetworkErrorModal() {
    if (this.networkErrorModal) {
      // Re-enable touch controls when modal is hidden
      if (this.touchControlManager) {
        this.touchControlManager.enableControls()
      }
      if (this.inputManager) {
        this.inputManager.enableTouchControls()
      }
      
      // Fade out effect
      this.networkErrorModal.style.opacity = '0'
      this.networkErrorModal.style.transition = 'opacity 0.3s ease'

      setTimeout(() => {
        this.networkErrorModal.classList.add('hidden')
        this.networkErrorModal.style.opacity = '1'
      }, 300)
    }

    // Clear callbacks
    this.currentRetryCallback = null
    this.currentSkipCallback = null
  }

  /**
   * Show API error modal with retry and skip options
   * @param {string} message - Error message to display
   * @param {Function} retryCallback - Function to call when retry is clicked
   * @param {Function} skipCallback - Function to call when skip is clicked
   */
  showApiErrorModal(message, retryCallback, skipCallback) {
    if (!this.apiErrorModal || !this.apiErrorMessage) {
      console.error('API error modal elements not found')
      return
    }

    // Disable touch controls to prevent interference with modal
    if (this.touchControlManager) {
      this.touchControlManager.disableControls()
    }
    if (this.inputManager) {
      this.inputManager.disableTouchControls()
    }

    // Store callbacks for button handlers
    this.currentRetryCallback = retryCallback
    this.currentSkipCallback = skipCallback

    // Update error message
    this.apiErrorMessage.textContent = message || 'Hubo un problema con el servidor. Por favor, inténtalo de nuevo.'

    // Show the modal with fade-in effect
    this.apiErrorModal.classList.remove('hidden')
    this.apiErrorModal.style.opacity = '0'
    this.apiErrorModal.style.transition = 'opacity 0.3s ease'

    setTimeout(() => {
      this.apiErrorModal.style.opacity = '1'
    }, 10)

    // Focus on retry button for accessibility
    setTimeout(() => {
      if (this.retryApiButton) {
        this.retryApiButton.focus()
      }
    }, 400)

    console.log('API error modal shown:', message)
  }

  /**
   * Hide API error modal
   */
  hideApiErrorModal() {
    if (this.apiErrorModal) {
      // Re-enable touch controls when modal is hidden
      if (this.touchControlManager) {
        this.touchControlManager.enableControls()
      }
      if (this.inputManager) {
        this.inputManager.enableTouchControls()
      }
      
      // Fade out effect
      this.apiErrorModal.style.opacity = '0'
      this.apiErrorModal.style.transition = 'opacity 0.3s ease'

      setTimeout(() => {
        this.apiErrorModal.classList.add('hidden')
        this.apiErrorModal.style.opacity = '1'
      }, 300)
    }

    // Clear callbacks
    this.currentRetryCallback = null
    this.currentSkipCallback = null
  }

  /**
   * Handle network retry button click
   */
  handleNetworkRetry() {
    this.hideNetworkErrorModal()

    if (this.currentRetryCallback) {
      this.currentRetryCallback()
    }

    console.log('Network retry requested')
  }

  /**
   * Handle continue offline button click
   */
  handleContinueOffline() {
    this.hideNetworkErrorModal()

    if (this.currentSkipCallback) {
      this.currentSkipCallback()
    }

    console.log('Continue offline requested')
  }

  /**
   * Handle API retry button click
   */
  handleApiRetry() {
    this.hideApiErrorModal()

    if (this.currentRetryCallback) {
      this.currentRetryCallback()
    }

    console.log('API retry requested')
  }

  /**
   * Handle skip leaderboard button click
   */
  handleSkipLeaderboard() {
    this.hideApiErrorModal()

    if (this.currentSkipCallback) {
      this.currentSkipCallback()
    }

    console.log('Skip leaderboard requested')
  }

  /**
   * Show fallback leaderboard display for offline scenarios
   * @param {Object} playerData - Player's data for offline display
   * @param {string} playerData.playerName - Player's name
   * @param {number} playerData.playerScore - Player's score
   * @param {string} playerData.message - Message to display
   */
  showOfflineLeaderboardModal(playerData) {
    if (!this.leaderboardModal || !this.playerResultMessage || !this.leaderboardList) {
      console.error('Leaderboard modal elements not found')
      return
    }

    // Disable touch controls to prevent interference with modal
    if (this.touchControlManager) {
      this.touchControlManager.disableControls()
    }
    if (this.inputManager) {
      this.inputManager.disableTouchControls()
    }

    const { playerName, playerScore, message } = playerData

    // Update player result message
    this.playerResultMessage.textContent = message || `¡Bien hecho ${playerName}! Tu puntuación: ${playerScore}. Ranking no disponible sin conexión.`

    // Clear previous leaderboard entries and show offline message
    this.leaderboardList.innerHTML = ''

    const offlineMessage = document.createElement('div')
    offlineMessage.className = 'leaderboard-item'
    offlineMessage.style.justifyContent = 'center'
    offlineMessage.style.fontStyle = 'italic'
    offlineMessage.style.color = '#ffaa00'
    offlineMessage.style.textAlign = 'center'
    offlineMessage.style.padding = '20px'
    offlineMessage.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 1.2rem; margin-bottom: 10px;">📡</div>
        <div>Ranking no disponible</div>
        <div style="font-size: 0.9rem; margin-top: 5px; color: #ccc;">Conecta a internet para ver el ranking global</div>
      </div>
    `
    this.leaderboardList.appendChild(offlineMessage)

    // Show the modal with fade-in effect
    this.leaderboardModal.classList.remove('hidden')
    this.leaderboardModal.style.opacity = '0'
    this.leaderboardModal.style.transition = 'opacity 0.3s ease'

    setTimeout(() => {
      this.leaderboardModal.style.opacity = '1'
    }, 10)

    // Focus on close button for accessibility
    setTimeout(() => {
      if (this.closeLeaderboardButton) {
        this.closeLeaderboardButton.focus()
      }
    }, 400)

    console.log('Offline leaderboard modal shown:', playerData)
  }

  /**
   * Clean up resources and event listeners
   */
  dispose() {
    if (this.restartButton) {
      this.restartButton.removeEventListener('click', this.handleRestart)
    }
    
    if (this.submitNameButton) {
      this.submitNameButton.removeEventListener('click', this.handleNameSubmit)
    }
    
    if (this.cancelNameButton) {
      this.cancelNameButton.removeEventListener('click', this.handleNameCancel)
    }
    
    if (this.playerNameInput) {
      this.playerNameInput.removeEventListener('input', this.validatePlayerNameInput)
      this.playerNameInput.removeEventListener('keypress', this.handleNameSubmit)
    }

    if (this.closeLeaderboardButton) {
      this.closeLeaderboardButton.removeEventListener('click', this.handleLeaderboardClose)
    }

    if (this.retryNetworkButton) {
      this.retryNetworkButton.removeEventListener('click', this.handleNetworkRetry)
    }

    if (this.continueOfflineButton) {
      this.continueOfflineButton.removeEventListener('click', this.handleContinueOffline)
    }

    if (this.retryApiButton) {
      this.retryApiButton.removeEventListener('click', this.handleApiRetry)
    }

    if (this.skipLeaderboardButton) {
      this.skipLeaderboardButton.removeEventListener('click', this.handleSkipLeaderboard)
    }
    
    this.timerElement = null
    this.scoreElement = null
    this.gameOverModal = null
    this.finalScoreElement = null
    this.restartButton = null
    this.nameInputModal = null
    this.nameInputScoreElement = null
    this.playerNameInput = null
    this.submitNameButton = null
    this.cancelNameButton = null
    this.nameValidationError = null
    this.leaderboardModal = null
    this.playerResultMessage = null
    this.leaderboardList = null
    this.closeLeaderboardButton = null
    this.networkErrorModal = null
    this.networkErrorMessage = null
    this.retryNetworkButton = null
    this.continueOfflineButton = null
    this.apiErrorModal = null
    this.apiErrorMessage = null
    this.retryApiButton = null
    this.skipLeaderboardButton = null
    this.currentRetryCallback = null
    this.currentSkipCallback = null
    this.touchControlManager = null
    this.inputManager = null
    this.onRestartCallback = null
    this.onNameSubmitCallback = null
    this.onNameCancelCallback = null
    this.onLeaderboardCloseCallback = null
    
    console.log('UIManager disposed')
  }
}