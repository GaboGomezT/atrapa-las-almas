/**
 * TouchControlManager - Handles mobile touch controls and virtual joystick
 * Provides touch-friendly interface for mobile devices
 */
export class TouchControlManager {
  constructor() {
    this.virtualJoystick = null
    this.joystickKnob = null
    this.touchControls = null

    // Touch state
    this.isActive = false
    this.touchId = null
    this.centerX = 0
    this.centerY = 0
    this.currentX = 0
    this.currentY = 0
    this.maxDistance = 50 // Maximum distance from center

    // Input vector
    this.inputVector = { x: 0, z: 0 }

    // Device detection
    this.isMobile = this.detectMobileDevice()
    this.isTouch = 'ontouchstart' in window

    // Control state
    this.controlsEnabled = true

    // Store event handler references for proper cleanup
    this.boundTouchStart = null
    this.boundTouchMove = null
    this.boundTouchEnd = null
    this.boundMouseStart = null
    this.boundMouseMove = null
    this.boundMouseEnd = null
    this.boundOrientationChange = null
    this.boundResize = null
  }

  /**
   * Initialize touch controls
   */
  init() {
    if (!this.isMobile && !this.isTouch) {
      console.log('TouchControlManager: Not a mobile device, skipping initialization')
      return false
    }

    try {
      // Get touch control elements
      this.touchControls = document.getElementById('touch-controls')
      this.virtualJoystick = document.getElementById('virtual-joystick')
      
      if (!this.touchControls || !this.virtualJoystick) {
        console.warn('TouchControlManager: Touch control elements not found')
        return false
      }

      // Create joystick knob if it doesn't exist
      this.joystickKnob = this.virtualJoystick.querySelector('.virtual-joystick-knob')
      if (!this.joystickKnob) {
        this.joystickKnob = document.createElement('div')
        this.joystickKnob.className = 'virtual-joystick-knob'
        this.virtualJoystick.appendChild(this.joystickKnob)
      }

      // Show mobile controls
      this.showMobileControls()
      
      // Set up event listeners
      this.setupEventListeners()
      
      console.log('TouchControlManager initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize TouchControlManager:', error)
      return false
    }
  }

  /**
   * Detect if device is mobile
   * @returns {boolean} - True if mobile device
   */
  detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const screenSize = window.innerWidth <= 768 || window.innerHeight <= 768
    
    return mobileRegex.test(userAgent.toLowerCase()) || screenSize
  }

  /**
   * Show mobile-specific controls
   */
  showMobileControls() {
    if (this.touchControls) {
      this.touchControls.style.display = 'block'
    }
    
    if (this.virtualJoystick) {
      this.virtualJoystick.style.display = 'block'
    }
    
    // Add mobile-specific CSS class to body
    document.body.classList.add('mobile-controls-active')
  }

  /**
   * Hide mobile controls
   */
  hideMobileControls() {
    if (this.touchControls) {
      this.touchControls.style.display = 'none'
    }
    
    if (this.virtualJoystick) {
      this.virtualJoystick.style.display = 'none'
    }
    
    document.body.classList.remove('mobile-controls-active')
  }

  /**
   * Set up touch event listeners
   */
  setupEventListeners() {
    if (!this.virtualJoystick) return

    // Create bound functions for proper cleanup
    this.boundTouchStart = (e) => this.handleTouchStart(e)
    this.boundTouchMove = (e) => this.handleTouchMove(e)
    this.boundTouchEnd = (e) => this.handleTouchEnd(e)
    this.boundMouseStart = (e) => this.handleMouseStart(e)
    this.boundMouseMove = (e) => this.handleMouseMove(e)
    this.boundMouseEnd = (e) => this.handleMouseEnd(e)
    this.boundOrientationChange = () => {
      setTimeout(() => {
        this.updateLayout()
      }, 100)
    }
    this.boundResize = () => this.updateLayout()

    // Touch start
    this.virtualJoystick.addEventListener('touchstart', this.boundTouchStart, { passive: false })

    // Touch move
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false })

    // Touch end
    document.addEventListener('touchend', this.boundTouchEnd, { passive: false })

    // Mouse events for testing on desktop
    this.virtualJoystick.addEventListener('mousedown', this.boundMouseStart)

    document.addEventListener('mousemove', this.boundMouseMove)

    document.addEventListener('mouseup', this.boundMouseEnd)

    // Prevent context menu on long press
    this.virtualJoystick.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // Handle orientation change
    window.addEventListener('orientationchange', this.boundOrientationChange)

    // Handle resize
    window.addEventListener('resize', this.boundResize)
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (!this.controlsEnabled) {
      return // Don't handle touch events when disabled - allow default behavior
    }
    
    e.preventDefault()
    
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      this.startTouch(touch.identifier, touch.clientX, touch.clientY)
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.controlsEnabled || !this.isActive) {
      return // Don't handle touch events when disabled - allow default behavior
    }
    
    e.preventDefault()
    
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i]
      if (touch.identifier === this.touchId) {
        this.updateTouch(touch.clientX, touch.clientY)
        break
      }
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (!this.controlsEnabled || !this.isActive) {
      return // Don't handle touch events when disabled - allow default behavior
    }
    
    // Check if our touch ended
    let touchEnded = true
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touchEnded = false
        break
      }
    }
    
    if (touchEnded) {
      this.endTouch()
    }
  }

  /**
   * Handle mouse start (for desktop testing)
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseStart(e) {
    e.preventDefault()
    this.startTouch('mouse', e.clientX, e.clientY)
  }

  /**
   * Handle mouse move (for desktop testing)
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    if (!this.isActive || this.touchId !== 'mouse') return
    this.updateTouch(e.clientX, e.clientY)
  }

  /**
   * Handle mouse end (for desktop testing)
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseEnd(e) {
    if (this.touchId === 'mouse') {
      this.endTouch()
    }
  }

  /**
   * Start touch interaction
   * @param {string|number} touchId - Touch identifier
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  startTouch(touchId, x, y) {
    if (this.isActive) return
    
    const rect = this.virtualJoystick.getBoundingClientRect()
    this.centerX = rect.left + rect.width / 2
    this.centerY = rect.top + rect.height / 2
    
    this.touchId = touchId
    this.isActive = true
    this.currentX = x
    this.currentY = y
    
    this.updateJoystickVisual()
    this.calculateInputVector()
  }

  /**
   * Update touch position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateTouch(x, y) {
    this.currentX = x
    this.currentY = y
    
    this.updateJoystickVisual()
    this.calculateInputVector()
  }

  /**
   * End touch interaction
   */
  endTouch() {
    this.isActive = false
    this.touchId = null
    this.inputVector = { x: 0, z: 0 }
    
    // Reset joystick knob position
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)'
    }
  }

  /**
   * Update joystick visual representation
   */
  updateJoystickVisual() {
    if (!this.joystickKnob || !this.isActive) return
    
    const deltaX = this.currentX - this.centerX
    const deltaY = this.currentY - this.centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Constrain to maximum distance
    const constrainedDistance = Math.min(distance, this.maxDistance)
    const angle = Math.atan2(deltaY, deltaX)
    
    const knobX = Math.cos(angle) * constrainedDistance
    const knobY = Math.sin(angle) * constrainedDistance
    
    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`
  }

  /**
   * Calculate input vector from joystick position
   */
  calculateInputVector() {
    if (!this.isActive) {
      this.inputVector = { x: 0, z: 0 }
      return
    }
    
    const deltaX = this.currentX - this.centerX
    const deltaY = this.currentY - this.centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance > 0) {
      const normalizedDistance = Math.min(distance / this.maxDistance, 1)
      this.inputVector.x = (deltaX / distance) * normalizedDistance
      this.inputVector.z = (deltaY / distance) * normalizedDistance
    } else {
      this.inputVector = { x: 0, z: 0 }
    }
  }

  /**
   * Get current input vector
   * @returns {Object} - Input vector {x, z}
   */
  getInputVector() {
    return { ...this.inputVector }
  }

  /**
   * Update layout for orientation/resize changes
   */
  updateLayout() {
    if (!this.isMobile) return
    
    const isLandscape = window.innerWidth > window.innerHeight
    const isSmallScreen = window.innerHeight < 500
    
    if (this.virtualJoystick) {
      if (isLandscape && isSmallScreen) {
        this.virtualJoystick.style.width = '80px'
        this.virtualJoystick.style.height = '80px'
        this.virtualJoystick.style.bottom = '10px'
        this.virtualJoystick.style.left = '10px'
        this.maxDistance = 30
      } else {
        this.virtualJoystick.style.width = '120px'
        this.virtualJoystick.style.height = '120px'
        this.virtualJoystick.style.bottom = '20px'
        this.virtualJoystick.style.left = '20px'
        this.maxDistance = 50
      }
    }
  }

  /**
   * Check if device is mobile
   * @returns {boolean} - True if mobile device
   */
  isMobileDevice() {
    return this.isMobile
  }

  /**
   * Check if touch controls are active
   * @returns {boolean} - True if touch controls are active
   */
  isActive() {
    return this.isActive
  }

  /**
   * Enable touch controls
   */
  enableControls() {
    this.controlsEnabled = true
    if (this.isMobile || this.isTouch) {
      this.showMobileControls()
    }

    // Re-add touch event listeners using stored references
    if (this.virtualJoystick && this.boundTouchStart) {
      this.virtualJoystick.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    }
    if (this.boundTouchMove) {
      document.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    }
    if (this.boundTouchEnd) {
      document.addEventListener('touchend', this.boundTouchEnd, { passive: false })
    }
  }

  /**
   * Disable touch controls (useful when modals are shown)
   */
  disableControls() {
    this.controlsEnabled = false
    this.hideMobileControls()
    this.endTouch() // End any active touch

    // Remove touch event listeners to prevent interference
    if (this.virtualJoystick && this.boundTouchStart) {
      this.virtualJoystick.removeEventListener('touchstart', this.boundTouchStart)
    }
    if (this.boundTouchMove) {
      document.removeEventListener('touchmove', this.boundTouchMove)
    }
    if (this.boundTouchEnd) {
      document.removeEventListener('touchend', this.boundTouchEnd)
    }
  }

  /**
   * Clean up resources and event listeners
   */
  dispose() {
    if (this.virtualJoystick) {
      if (this.boundTouchStart) {
        this.virtualJoystick.removeEventListener('touchstart', this.boundTouchStart)
      }
      if (this.boundMouseStart) {
        this.virtualJoystick.removeEventListener('mousedown', this.boundMouseStart)
      }
      this.virtualJoystick.removeEventListener('contextmenu', (e) => e.preventDefault())
    }

    if (this.boundTouchMove) {
      document.removeEventListener('touchmove', this.boundTouchMove)
    }
    if (this.boundTouchEnd) {
      document.removeEventListener('touchend', this.boundTouchEnd)
    }
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove)
    }
    if (this.boundMouseEnd) {
      document.removeEventListener('mouseup', this.boundMouseEnd)
    }

    if (this.boundOrientationChange) {
      window.removeEventListener('orientationchange', this.boundOrientationChange)
    }
    if (this.boundResize) {
      window.removeEventListener('resize', this.boundResize)
    }

    this.hideMobileControls()

    console.log('TouchControlManager disposed')
  }
}