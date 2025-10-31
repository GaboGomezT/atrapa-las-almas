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
      
      // Show name input modal to collect player name
      // This will be handled by UIManager in task 3
      console.log('Game ended with score:', score)
      console.log('Leaderboard flow initiated - waiting for name input modal implementation')
      
      // For now, we'll prepare the flow but the actual modal interaction
      // will be implemented when UIManager extensions are added in task 3
      
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
      
      // First, fetch current top scores to determine if player qualifies
      let topScores = []
      let fetchError = null
      
      try {
        topScores = await this.apiService.getTopScoresWithRetry()
        console.log('Fetched current top scores:', topScores)
      } catch (error) {
        console.error('Failed to fetch top scores:', error)
        fetchError = error
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
            updatedTopScores = await this.apiService.getTopScoresWithRetry()
            console.log('Fetched updated leaderboard:', updatedTopScores)
          } catch (error) {
            console.error('Failed to fetch updated leaderboard:', error)
            // Use previous top scores if update fetch fails
          }
          
        } catch (error) {
          console.error('Failed to submit score:', error)
          submissionError = error
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
      
      // Show leaderboard modal (will be implemented in task 4)
      console.log('Ready to show leaderboard modal - waiting for UIManager implementation')
      
      return leaderboardData
      
    } catch (error) {
      console.error('Error in submitScore:', error)
      
      // Handle critical errors (Requirement 5.2, 5.3)
      const errorData = {
        playerName,
        playerScore: score,
        playerRank: null,
        topScores: [],
        message: 'Unable to process leaderboard request. Please try again.',
        errors: {
          criticalError: error
        }
      }
      
      // Show error modal (will be implemented in task 6)
      console.log('Critical error occurred - ready to show error modal')
      
      throw error
      
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
}