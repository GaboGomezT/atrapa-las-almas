/**
 * LeaderboardManager - Orchestrates the leaderboard flow
 * Manages score submission, leaderboard fetching, and player ranking
 */
export class LeaderboardManager {
  constructor(uiManager, apiService) {
    this.uiManager = uiManager
    this.apiService = apiService
    this.currentPlayerData = null
    this.isProcessing = false
    this.gameEngine = null // Will be set by GameEngine during initialization
  }

  /**
   * Handle game end and start leaderboard flow
   * @param {number} score - Player's final score
   */
  async handleGameEnd(score) {
    if (this.isProcessing) {
      console.warn('Leaderboard flow already in progress')
      return
    }

    this.isProcessing = true
    
    try {
      // Store the score for later use
      this.currentPlayerData = { score }
      
      console.log('Game ended with score:', score)
      console.log('Leaderboard flow initiated - transitioning to name input')
      
      // Transition GameEngine to name input state
      if (this.gameEngine) {
        this.gameEngine.showNameInput()
      }
      
    } catch (error) {
      console.error('Error in handleGameEnd:', error)
      this.isProcessing = false
      throw error
    }
  }

  /**
   * Submit player score and handle the complete submission flow
   * @param {string} playerName - Player's name (validated)
   * @param {number} score - Player's score
   */
  async submitScore(playerName, score) {
    try {
      console.log(`Submitting score for ${playerName}: ${score}`)
      
      // Check network availability first (Requirement 5.1)
      if (!this.apiService.isNetworkAvailable()) {
        console.warn('Network not available, showing offline leaderboard')
        this.showOfflineLeaderboard(playerName, score)
        return
      }

      // First, fetch current top scores to determine if player qualifies
      let topScores = []
      let fetchError = null
      
      try {
        topScores = await this.apiService.getTopScoresWithCaching()
        console.log('Fetched current top scores:', topScores)
      } catch (error) {
        console.error('Failed to fetch top scores:', error)
        fetchError = error
        
        // Handle fetch error with retry option (Requirement 5.2)
        if (this.shouldShowRetryForError(error)) {
          this.showNetworkErrorWithRetry(error, () => {
            this.submitScore(playerName, score)
          }, () => {
            this.showOfflineLeaderboard(playerName, score)
          })
          return
        }
        
        // Continue with submission attempt even if fetch fails
      }

      // Determine if player's score qualifies for top 10
      const playerQualifies = this.doesPlayerQualify(score, topScores)
      console.log(`Player qualifies for top 10: ${playerQualifies}`)

      let submissionError = null
      let updatedTopScores = topScores

      // Submit score if player qualifies (Requirement 3.1)
      if (playerQualifies) {
        try {
          await this.apiService.submitScoreWithRetry(playerName, score)
          console.log('Score submitted successfully')
          
          // Fetch updated leaderboard after successful submission (Requirement 3.5)
          try {
            updatedTopScores = await this.apiService.getTopScoresWithCaching()
            console.log('Fetched updated leaderboard:', updatedTopScores)
          } catch (error) {
            console.error('Failed to fetch updated leaderboard:', error)
            // Use previous top scores if update fetch fails
          }
          
        } catch (error) {
          console.error('Failed to submit score:', error)
          submissionError = error
          
          // Handle submission error with retry option (Requirement 5.3)
          if (this.shouldShowRetryForError(error)) {
            this.showApiErrorWithRetry(error, () => {
              this.submitScore(playerName, score)
            }, () => {
              // Show leaderboard without submission
              this.showLeaderboardWithoutSubmission(playerName, score, topScores)
            })
            return
          }
          
          // Continue to show leaderboard even if submission fails (Requirement 5.2)
        }
      }

      // Find player's position in the leaderboard
      const playerRank = this.findPlayerInLeaderboard(playerName, updatedTopScores)
      
      // Prepare leaderboard display data
      const leaderboardData = {
        playerName,
        playerScore: score,
        playerRank,
        topScores: updatedTopScores,
        message: this.determinePlayerMessage(playerName, score, updatedTopScores, playerRank),
        errors: {
          fetchError,
          submissionError
        }
      }

      console.log('Leaderboard data prepared:', leaderboardData)
      
      // Transition GameEngine to leaderboard display state
      if (this.gameEngine) {
        this.gameEngine.showLeaderboard()
      }
      
      // Show leaderboard modal
      this.uiManager.showLeaderboardModal(leaderboardData)
      
      return leaderboardData
      
    } catch (error) {
      console.error('Error in submitScore:', error)
      
      // Handle critical errors (Requirement 5.2, 5.3)
      this.handleCriticalError(error, playerName, score)
      
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Find player's position in the leaderboard
   * @param {string} playerName - Player's name
   * @param {Array} topScores - Array of top score objects
   * @returns {number|null} Player's rank (1-10) or null if not in top 10
   */
  findPlayerInLeaderboard(playerName, topScores) {
    if (!Array.isArray(topScores) || topScores.length === 0) {
      return null
    }

    // Find the player in the leaderboard by name
    const playerIndex = topScores.findIndex(entry => 
      entry.name && entry.name.toLowerCase().trim() === playerName.toLowerCase().trim()
    )

    // Return 1-based rank or null if not found
    return playerIndex !== -1 ? playerIndex + 1 : null
  }

  /**
   * Determine if player's score qualifies for top 10
   * @param {number} playerScore - Player's score
   * @param {Array} topScores - Current top scores array
   * @returns {boolean} True if player qualifies for top 10
   */
  doesPlayerQualify(playerScore, topScores) {
    if (!Array.isArray(topScores)) {
      return true // If we can't fetch scores, assume player qualifies
    }

    // If less than 10 scores, player automatically qualifies
    if (topScores.length < 10) {
      return true
    }

    // Check if player's score is higher than the lowest score in top 10
    const lowestScore = topScores[topScores.length - 1]?.score || 0
    return playerScore > lowestScore
  }

  /**
   * Generate appropriate message for player based on their performance
   * @param {string} playerName - Player's name
   * @param {number} playerScore - Player's score
   * @param {Array} topScores - Current top scores
   * @param {number|null} playerRank - Player's rank or null
   * @returns {string} Message to display to player
   */
  determinePlayerMessage(playerName, playerScore, topScores, playerRank) {
    if (!Array.isArray(topScores) || topScores.length === 0) {
      return `Great job, ${playerName}! Your score: ${playerScore}. Leaderboard unavailable.`
    }

    if (playerRank) {
      if (playerRank === 1) {
        return `Congratulations ${playerName}! You're #1 with ${playerScore} points!`
      } else {
        return `Well done ${playerName}! You ranked #${playerRank} with ${playerScore} points!`
      }
    } else {
      // Player didn't make top 10 (Requirement 4.4)
      const highestScore = topScores[0]?.score || 0
      const lowestTopScore = topScores[topScores.length - 1]?.score || 0
      
      if (playerScore > lowestTopScore) {
        return `Good effort ${playerName}! Your score: ${playerScore}. You're close to the top 10!`
      } else {
        const pointsNeeded = lowestTopScore - playerScore + 1
        return `Nice try ${playerName}! Your score: ${playerScore}. You need ${pointsNeeded} more points to reach the top 10.`
      }
    }
  }

  /**
   * Handle API failure scenarios with appropriate error responses
   * @param {Error} error - The error that occurred
   * @returns {Object} Error response object
   */
  handleAPIFailure(error) {
    console.error('API failure handled:', error)
    
    const errorResponse = {
      type: 'api_error',
      message: error.message || 'An unexpected error occurred',
      canRetry: true,
      timestamp: new Date().toISOString()
    }

    // Determine if error is retryable (Requirement 5.3)
    if (error.message.includes('timeout') || 
        error.message.includes('Network error') ||
        error.message.includes('Server error')) {
      errorResponse.canRetry = true
      errorResponse.message = 'Connection problem. Would you like to try again?'
    } else if (error.message.includes('Invalid request') ||
               error.message.includes('validation')) {
      errorResponse.canRetry = false
      errorResponse.message = 'Invalid data. Please check your input.'
    }

    return errorResponse
  }

  /**
   * Reset the leaderboard manager state
   */
  reset() {
    this.currentPlayerData = null
    this.isProcessing = false
  }

  /**
   * Get current processing state
   * @returns {boolean} True if currently processing a leaderboard flow
   */
  isCurrentlyProcessing() {
    return this.isProcessing
  }

  /**
   * Get current player data
   * @returns {Object|null} Current player data or null
   */
  getCurrentPlayerData() {
    return this.currentPlayerData
  }

  /**
   * Set GameEngine reference for state management
   * @param {GameEngine} gameEngine - GameEngine instance
   */
  setGameEngine(gameEngine) {
    this.gameEngine = gameEngine
  }

  /**
   * Handle name input submission from UI
   * @param {string} playerName - Player's entered name
   */
  async handleNameSubmission(playerName) {
    if (!this.currentPlayerData) {
      console.error('No current player data available for name submission')
      return
    }

    try {
      await this.submitScore(playerName, this.currentPlayerData.score)
    } catch (error) {
      console.error('Error during name submission:', error)
      // Handle error appropriately - could show error modal
    }
  }

  /**
   * Handle name input cancellation from UI
   */
  handleNameCancellation() {
    console.log('Name input cancelled, returning to menu')
    this.isProcessing = false
    this.currentPlayerData = null
    
    if (this.gameEngine) {
      this.gameEngine.returnToMenuFromLeaderboard()
    }
  }

  /**
   * Handle leaderboard modal close from UI
   */
  handleLeaderboardClose() {
    console.log('Leaderboard closed, returning to menu')
    this.isProcessing = false
    this.currentPlayerData = null
    
    if (this.gameEngine) {
      this.gameEngine.returnToMenuFromLeaderboard()
    }
  }

  /**
   * Determine if an error should trigger a retry dialog
   * @param {Error} error - The error to evaluate
   * @returns {boolean} True if retry should be offered
   */
  shouldShowRetryForError(error) {
    // Don't retry for validation errors or client errors
    if (error.type === 'client_error' || error.type === 'not_found') {
      return false
    }
    
    // Retry for network, timeout, and server errors
    return error.retryable === true || 
           error.type === 'network' || 
           error.type === 'timeout' || 
           error.type === 'server_error' ||
           error.type === 'rate_limit'
  }

  /**
   * Show network error modal with retry functionality (Requirement 5.1, 5.2)
   * @param {Error} error - The network error
   * @param {Function} retryCallback - Function to call on retry
   * @param {Function} skipCallback - Function to call on skip
   */
  showNetworkErrorWithRetry(error, retryCallback, skipCallback) {
    let message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    
    if (error.type === 'timeout') {
      message = 'La conexión tardó demasiado. Verifica tu conexión a internet.'
    } else if (error.type === 'network') {
      message = 'Error de red. Verifica tu conexión a internet.'
    }

    this.uiManager.showNetworkErrorModal(message, retryCallback, skipCallback)
  }

  /**
   * Show API error modal with retry functionality (Requirement 5.3)
   * @param {Error} error - The API error
   * @param {Function} retryCallback - Function to call on retry
   * @param {Function} skipCallback - Function to call on skip
   */
  showApiErrorWithRetry(error, retryCallback, skipCallback) {
    let message = 'Hubo un problema con el servidor. Por favor, inténtalo de nuevo.'
    
    if (error.type === 'server_error') {
      message = 'El servidor está experimentando problemas. Inténtalo de nuevo en unos momentos.'
    } else if (error.type === 'rate_limit') {
      message = 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
    }

    this.uiManager.showApiErrorModal(message, retryCallback, skipCallback)
  }

  /**
   * Show offline leaderboard when network is unavailable (Requirement 5.1, 5.2)
   * @param {string} playerName - Player's name
   * @param {number} score - Player's score
   */
  showOfflineLeaderboard(playerName, score) {
    console.log('Showing offline leaderboard for:', playerName, score)
    
    const offlineData = {
      playerName,
      playerScore: score,
      message: `¡Bien hecho ${playerName}! Tu puntuación: ${score}. Conecta a internet para ver el ranking global.`
    }

    // Transition GameEngine to leaderboard display state
    if (this.gameEngine) {
      this.gameEngine.showLeaderboard()
    }

    this.uiManager.showOfflineLeaderboardModal(offlineData)
  }

  /**
   * Show leaderboard without score submission (fallback scenario)
   * @param {string} playerName - Player's name
   * @param {number} score - Player's score
   * @param {Array} topScores - Available top scores
   */
  showLeaderboardWithoutSubmission(playerName, score, topScores) {
    console.log('Showing leaderboard without submission for:', playerName, score)
    
    const leaderboardData = {
      playerName,
      playerScore: score,
      playerRank: null,
      topScores: topScores || [],
      message: `Tu puntuación: ${score}. No se pudo guardar en el ranking, pero aquí están los mejores puntajes.`,
      errors: {
        submissionFailed: true
      }
    }

    // Transition GameEngine to leaderboard display state
    if (this.gameEngine) {
      this.gameEngine.showLeaderboard()
    }

    this.uiManager.showLeaderboardModal(leaderboardData)
  }

  /**
   * Handle critical errors that prevent any leaderboard functionality
   * @param {Error} error - The critical error
   * @param {string} playerName - Player's name
   * @param {number} score - Player's score
   */
  handleCriticalError(error, playerName, score) {
    console.error('Critical error in leaderboard flow:', error)
    
    // Log the error for debugging
    this.apiService.logError('Critical leaderboard error', {
      playerName,
      score,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // Show basic offline leaderboard as fallback
    this.showOfflineLeaderboard(playerName, score)
  }

  /**
   * Test API connectivity and handle results
   * @returns {Promise<boolean>} True if API is available
   */
  async testApiConnectivity() {
    try {
      const isConnected = await this.apiService.testConnectivity()
      console.log('API connectivity test result:', isConnected)
      return isConnected
    } catch (error) {
      console.error('API connectivity test failed:', error)
      return false
    }
  }

  /**
   * Get error logs for debugging purposes
   * @returns {Array} Array of error log objects
   */
  getErrorLogs() {
    return this.apiService.getErrorLogs()
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    this.apiService.clearErrorLogs()
  }
}