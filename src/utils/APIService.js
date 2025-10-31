/**
 * APIService - Handles HTTP communication with the leaderboard backend
 * Provides methods for fetching top scores and submitting player scores
 */
export class APIService {
  constructor(baseURL = '/api', timeout = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.retryAttempts = 1
  }

  /**
   * Generic GET request method
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<any>} Response data
   */
  async get(endpoint) {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
      
    } catch (error) {
      throw this.handleNetworkError(error)
    }
  }

  /**
   * Generic POST request method
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Data to send in request body
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data) {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
      
    } catch (error) {
      throw this.handleNetworkError(error)
    }
  }

  /**
   * Fetch top 10 scores from leaderboard
   * @returns {Promise<Array>} Array of player score objects
   */
  async getTopScores() {
    try {
      const data = await this.get('/leaderboard/top10')
      
      // Validate response format
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array')
      }
      
      // Validate each score object
      data.forEach((score, index) => {
        if (!score.name || typeof score.name !== 'string') {
          throw new Error(`Invalid score object at index ${index}: missing or invalid name`)
        }
        if (typeof score.score !== 'number') {
          throw new Error(`Invalid score object at index ${index}: missing or invalid score`)
        }
      })
      
      return data
      
    } catch (error) {
      console.error('Error fetching top scores:', error)
      throw error
    }
  }

  /**
   * Submit player score to leaderboard
   * @param {string} playerName - Player's name (1-20 characters)
   * @param {number} score - Player's score
   * @returns {Promise<any>} Response from server
   */
  async submitScore(playerName, score) {
    // Validate input parameters
    if (!playerName || typeof playerName !== 'string') {
      throw new Error('Player name is required and must be a string')
    }
    
    if (playerName.length < 1 || playerName.length > 20) {
      throw new Error('Player name must be between 1 and 20 characters')
    }
    
    if (typeof score !== 'number' || score < 0) {
      throw new Error('Score must be a non-negative number')
    }
    
    // Validate name contains only alphanumeric characters and spaces
    const nameRegex = /^[a-zA-Z0-9\s]+$/
    if (!nameRegex.test(playerName)) {
      throw new Error('Player name can only contain letters, numbers, and spaces')
    }
    
    const payload = {
      name: playerName.trim(),
      score: Math.floor(score) // Ensure integer score
    }
    
    try {
      const response = await this.post('/leaderboard/submit', payload)
      console.log('Score submitted successfully:', payload)
      return response
      
    } catch (error) {
      console.error('Error submitting score:', error)
      throw error
    }
  }

  /**
   * Handle network errors and provide meaningful error messages
   * @param {Error} error - Original error object
   * @returns {Error} Processed error with user-friendly message
   */
  handleNetworkError(error) {
    if (error.name === 'AbortError') {
      return new Error('Request timed out. Please check your internet connection.')
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return new Error('Network error. Please check your internet connection.')
    }
    
    if (error.message.includes('HTTP 404')) {
      return new Error('Leaderboard service not found. Please try again later.')
    }
    
    if (error.message.includes('HTTP 500') || error.message.includes('HTTP 502') || error.message.includes('HTTP 503')) {
      return new Error('Server error. Please try again later.')
    }
    
    if (error.message.includes('HTTP 400')) {
      return new Error('Invalid request. Please check your input.')
    }
    
    if (error.message.includes('HTTP 429')) {
      return new Error('Too many requests. Please wait a moment and try again.')
    }
    
    // Return original error if no specific handling applies
    return error
  }

  /**
   * Check if network is available (basic connectivity test)
   * @returns {boolean} True if network appears to be available
   */
  isNetworkAvailable() {
    // Check navigator.onLine (basic check)
    if (!navigator.onLine) {
      return false
    }
    
    // Additional checks could be added here if needed
    // For now, we rely on the basic navigator.onLine check
    return true
  }

  /**
   * Perform a retry operation with exponential backoff
   * @param {Function} operation - Async function to retry
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<any>} Result of the operation
   */
  async retryOperation(operation, maxRetries = this.retryAttempts) {
    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry on validation errors or client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error
        }
        
        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          break
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.log(`Retrying operation (attempt ${attempt + 2}/${maxRetries + 1})...`)
      }
    }
    
    throw lastError
  }

  /**
   * Get top scores with retry logic
   * @returns {Promise<Array>} Array of player score objects
   */
  async getTopScoresWithRetry() {
    return this.retryOperation(() => this.getTopScores())
  }

  /**
   * Submit score with retry logic
   * @param {string} playerName - Player's name
   * @param {number} score - Player's score
   * @returns {Promise<any>} Response from server
   */
  async submitScoreWithRetry(playerName, score) {
    return this.retryOperation(() => this.submitScore(playerName, score))
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} True if API is reachable
   */
  async testConnectivity() {
    try {
      // Try to fetch top scores as a connectivity test
      await this.getTopScores()
      return true
    } catch (error) {
      console.warn('API connectivity test failed:', error.message)
      return false
    }
  }
}