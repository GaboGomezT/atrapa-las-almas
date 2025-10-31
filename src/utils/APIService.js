/**
 * APIService - Handles HTTP communication with the leaderboard backend
 * Provides methods for fetching top scores and submitting player scores
 */
export class APIService {
  constructor(baseURL = 'https://atrapa-almas-microservice.vercel.app/api', timeout = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.retryAttempts = 1
    
    // Hardcoded endpoint URLs
    this.endpoints = {
      topScores: 'https://atrapa-almas-microservice.vercel.app/api/leaderboard/top10',
      submitScore: 'https://atrapa-almas-microservice.vercel.app/api/leaderboard/submit'
    }
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
      // Use hardcoded endpoint URL with proper headers (CORS now handled by server)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch(this.endpoints.topScores, {
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
      
      const data = await response.json()
      
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
      // Use hardcoded endpoint URL with proper headers (CORS now handled by server)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch(this.endpoints.submitScore, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Score submitted successfully:', payload)
      return result
      
    } catch (error) {
      console.error('Error submitting score:', error)
      throw this.handleNetworkError(error)
    }
  }

  /**
   * Handle network errors and provide meaningful error messages
   * @param {Error} error - Original error object
   * @returns {Error} Processed error with user-friendly message and metadata
   */
  handleNetworkError(error) {
    // Log detailed error information for debugging (Requirement 5.5)
    this.logError('Network error occurred', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      url: window.location.href
    })

    let processedError

    if (error.name === 'AbortError') {
      processedError = new Error('Request timed out. Please check your internet connection.')
      processedError.type = 'timeout'
      processedError.retryable = true
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      processedError = new Error('Network error. Please check your internet connection.')
      processedError.type = 'network'
      processedError.retryable = true
    } else if (error.message.includes('HTTP 404')) {
      processedError = new Error('Leaderboard service not found. Please try again later.')
      processedError.type = 'not_found'
      processedError.retryable = false
    } else if (error.message.includes('HTTP 500') || error.message.includes('HTTP 502') || error.message.includes('HTTP 503')) {
      processedError = new Error('Server error. Please try again later.')
      processedError.type = 'server_error'
      processedError.retryable = true
    } else if (error.message.includes('HTTP 400')) {
      processedError = new Error('Invalid request. Please check your input.')
      processedError.type = 'client_error'
      processedError.retryable = false
    } else if (error.message.includes('HTTP 429')) {
      processedError = new Error('Too many requests. Please wait a moment and try again.')
      processedError.type = 'rate_limit'
      processedError.retryable = true
    } else {
      processedError = new Error(error.message || 'An unexpected error occurred.')
      processedError.type = 'unknown'
      processedError.retryable = true
    }

    // Add original error for debugging
    processedError.originalError = error
    processedError.timestamp = new Date().toISOString()

    return processedError
  }

  /**
   * Log error information for debugging purposes
   * @param {string} message - Error description
   * @param {Object} details - Error details and context
   */
  logError(message, details) {
    const errorLog = {
      level: 'ERROR',
      message,
      details,
      timestamp: new Date().toISOString(),
      service: 'APIService'
    }

    // Log to console for development
    console.error('[APIService Error]', message, details)

    // Store in session storage for debugging (limited to prevent memory issues)
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('apiErrorLogs') || '[]')
      existingLogs.push(errorLog)
      
      // Keep only the last 50 error logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50)
      }
      
      sessionStorage.setItem('apiErrorLogs', JSON.stringify(existingLogs))
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError)
    }

    // In a production environment, you might want to send this to a logging service
    // this.sendToLoggingService(errorLog)
  }

  /**
   * Get stored error logs for debugging
   * @returns {Array} Array of error log objects
   */
  getErrorLogs() {
    try {
      return JSON.parse(sessionStorage.getItem('apiErrorLogs') || '[]')
    } catch (error) {
      console.warn('Failed to retrieve error logs:', error)
      return []
    }
  }

  /**
   * Clear stored error logs
   */
  clearErrorLogs() {
    try {
      sessionStorage.removeItem('apiErrorLogs')
      console.log('Error logs cleared')
    } catch (error) {
      console.warn('Failed to clear error logs:', error)
    }
  }

  /**
   * Get fallback leaderboard data for offline scenarios
   * @returns {Array} Empty array or cached data if available
   */
  getFallbackLeaderboardData() {
    try {
      const cached = sessionStorage.getItem('lastKnownLeaderboard')
      if (cached) {
        const data = JSON.parse(cached)
        console.log('Using cached leaderboard data for fallback')
        return data
      }
    } catch (error) {
      console.warn('Failed to retrieve cached leaderboard data:', error)
    }
    
    return []
  }

  /**
   * Cache leaderboard data for offline fallback
   * @param {Array} leaderboardData - Leaderboard data to cache
   */
  cacheLeaderboardData(leaderboardData) {
    try {
      if (Array.isArray(leaderboardData) && leaderboardData.length > 0) {
        sessionStorage.setItem('lastKnownLeaderboard', JSON.stringify(leaderboardData))
        sessionStorage.setItem('leaderboardCacheTime', new Date().toISOString())
        console.log('Leaderboard data cached for offline fallback')
      }
    } catch (error) {
      console.warn('Failed to cache leaderboard data:', error)
    }
  }

  /**
   * Enhanced get top scores with caching for offline fallback
   * @returns {Promise<Array>} Array of player score objects
   */
  async getTopScoresWithCaching() {
    try {
      const scores = await this.getTopScoresWithRetry()
      
      // Cache successful response for offline fallback
      this.cacheLeaderboardData(scores)
      
      return scores
    } catch (error) {
      console.error('Failed to fetch top scores, checking for cached data:', error)
      
      // Return cached data if available
      const fallbackData = this.getFallbackLeaderboardData()
      if (fallbackData.length > 0) {
        console.log('Using cached leaderboard data due to network error')
        return fallbackData
      }
      
      // Re-throw error if no fallback available
      throw error
    }
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
   * Perform a retry operation with exponential backoff and enhanced error handling
   * @param {Function} operation - Async function to retry
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Result of the operation
   */
  async retryOperation(operation, maxRetries = this.retryAttempts, options = {}) {
    const {
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      jitter = true
    } = options

    let lastError
    let attempt = 0
    
    while (attempt <= maxRetries) {
      try {
        // Log retry attempt (except for first attempt)
        if (attempt > 0) {
          this.logError(`Retry attempt ${attempt}/${maxRetries}`, {
            operation: operation.name || 'anonymous',
            previousError: lastError?.message
          })
        }
        
        return await operation()
        
      } catch (error) {
        lastError = this.handleNetworkError(error)
        
        // Don't retry on non-retryable errors
        if (!lastError.retryable) {
          console.log('Error is not retryable, stopping retry attempts')
          throw lastError
        }
        
        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          console.log('Max retry attempts reached')
          break
        }
        
        // Calculate delay with exponential backoff and optional jitter
        let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay)
        
        if (jitter) {
          // Add random jitter to prevent thundering herd
          delay = delay * (0.5 + Math.random() * 0.5)
        }
        
        console.log(`Retrying operation in ${Math.round(delay)}ms (attempt ${attempt + 2}/${maxRetries + 1})...`)
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
        
        attempt++
      }
    }
    
    // Log final failure
    this.logError('All retry attempts failed', {
      operation: operation.name || 'anonymous',
      totalAttempts: attempt + 1,
      finalError: lastError?.message
    })
    
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
   * Test API connectivity with lightweight request
   * @returns {Promise<boolean>} True if API is reachable
   */
  async testConnectivity() {
    try {
      // Use a lightweight HEAD request if available, otherwise GET with short timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Shorter timeout for connectivity test
      
      const response = await fetch(this.endpoints.topScores, {
        method: 'HEAD', // Lightweight request
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Consider 2xx and 4xx as "connected" (server is reachable)
      // Only 5xx or network errors indicate connectivity issues
      return response.status < 500
      
    } catch (error) {
      // If HEAD is not supported, try GET with minimal processing
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(this.endpoints.topScores, {
          method: 'GET',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return response.status < 500
        
      } catch (fallbackError) {
        console.warn('API connectivity test failed:', fallbackError.message)
        this.logError('Connectivity test failed', {
          primaryError: error.message,
          fallbackError: fallbackError.message,
          online: navigator.onLine
        })
        return false
      }
    }
  }

  /**
   * Enhanced network availability check
   * @returns {boolean} True if network appears to be available
   */
  isNetworkAvailable() {
    // Check navigator.onLine (basic check)
    if (!navigator.onLine) {
      console.warn('Navigator reports offline status')
      return false
    }
    
    // Additional check: verify if we have a connection type (if available)
    if ('connection' in navigator) {
      const connection = navigator.connection
      if (connection.effectiveType === 'slow-2g' || connection.downlink === 0) {
        console.warn('Very slow or no network connection detected')
        return false
      }
    }
    
    return true
  }
}