/**
 * InputManager handles all user input for keyboard and touch controls
 * Provides cross-platform input normalization and virtual joystick for mobile
 */
export class InputManager {
  constructor() {
    // Input state
    this.keys = {}
    this.inputVector = { x: 0, z: 0 }
    this.isTouch = false
    
    // Touch controls
    this.touchStartPos = { x: 0, y: 0 }
    this.touchCurrentPos = { x: 0, y: 0 }
    this.touchActive = false
    this.touchSensitivity = 0.003
    this.maxTouchDistance = 100
    
    // Virtual joystick elements
    this.joystickContainer = null
    this.joystickKnob = null
    this.joystickActive = false
    
    // Event listeners
    this.boundKeyDown = this.handleKeyDown.bind(this)
    this.boundKeyUp = this.handleKeyUp.bind(this)
    this.boundTouchStart = this.handleTouchStart.bind(this)
    this.boundTouchMove = this.handleTouchMove.bind(this)
    this.boundTouchEnd = this.handleTouchEnd.bind(this)
    this.boundMouseDown = this.handleMouseDown.bind(this)
    this.boundMouseMove = this.handleMouseMove.bind(this)
    this.boundMouseUp = this.handleMouseUp.bind(this)
    
    // Device detection
    this.isMobile = this.detectMobile()
    
    this.init()
  }

  /**
   * Initialize input system and event listeners
   */
  init() {
    this.setupKeyboardControls()
    this.setupTouchControls()
    
    if (this.isMobile) {
      this.createVirtualJoystick()
    }
    
    console.log(`InputManager initialized - Mobile: ${this.isMobile}`)
  }

  /**
   * Detect if device is mobile
   * @returns {boolean} True if mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0)
  }

  /**
   * Set up keyboard event listeners
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', this.boundKeyDown, false)
    document.addEventListener('keyup', this.boundKeyUp, false)
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (event) => {
      const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']
      if (gameKeys.includes(event.code)) {
        event.preventDefault()
      }
    }, false)
  }

  /**
   * Set up touch event listeners
   */
  setupTouchControls() {
    // Touch events for mobile
    document.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    document.addEventListener('touchend', this.boundTouchEnd, { passive: false })
    
    // Mouse events for desktop testing of touch controls
    document.addEventListener('mousedown', this.boundMouseDown, false)
    document.addEventListener('mousemove', this.boundMouseMove, false)
    document.addEventListener('mouseup', this.boundMouseUp, false)
  }

  /**
   * Handle keyboard key down events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    this.keys[event.code] = true
    this.updateInputVector()
  }

  /**
   * Handle keyboard key up events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    this.keys[event.code] = false
    this.updateInputVector()
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    event.preventDefault()
    
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      this.touchStartPos.x = touch.clientX
      this.touchStartPos.y = touch.clientY
      this.touchCurrentPos.x = touch.clientX
      this.touchCurrentPos.y = touch.clientY
      this.touchActive = true
      this.isTouch = true
      
      this.updateVirtualJoystick(touch.clientX, touch.clientY, true)
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    event.preventDefault()
    
    if (this.touchActive && event.touches.length > 0) {
      const touch = event.touches[0]
      this.touchCurrentPos.x = touch.clientX
      this.touchCurrentPos.y = touch.clientY
      
      this.updateTouchInput()
      this.updateVirtualJoystick(touch.clientX, touch.clientY, false)
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    event.preventDefault()
    
    this.touchActive = false
    this.inputVector.x = 0
    this.inputVector.z = 0
    
    this.hideVirtualJoystick()
  }

  /**
   * Handle mouse down events (for desktop testing)
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    if (!this.isMobile) {
      this.touchStartPos.x = event.clientX
      this.touchStartPos.y = event.clientY
      this.touchCurrentPos.x = event.clientX
      this.touchCurrentPos.y = event.clientY
      this.touchActive = true
      this.isTouch = true
      
      this.updateVirtualJoystick(event.clientX, event.clientY, true)
    }
  }

  /**
   * Handle mouse move events (for desktop testing)
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    if (!this.isMobile && this.touchActive) {
      this.touchCurrentPos.x = event.clientX
      this.touchCurrentPos.y = event.clientY
      
      this.updateTouchInput()
      this.updateVirtualJoystick(event.clientX, event.clientY, false)
    }
  }

  /**
   * Handle mouse up events (for desktop testing)
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    if (!this.isMobile) {
      this.touchActive = false
      this.inputVector.x = 0
      this.inputVector.z = 0
      
      this.hideVirtualJoystick()
    }
  }

  /**
   * Update input vector based on keyboard input
   */
  updateInputVector() {
    this.inputVector.x = 0
    this.inputVector.z = 0
    
    // Horizontal movement (A/D or Left/Right arrows)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.inputVector.x -= 1
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.inputVector.x += 1
    }
    
    // Vertical movement (W/S or Up/Down arrows)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.inputVector.z -= 1
    }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) {
      this.inputVector.z += 1
    }
    
    // Normalize diagonal movement
    if (this.inputVector.x !== 0 && this.inputVector.z !== 0) {
      const length = Math.sqrt(this.inputVector.x * this.inputVector.x + this.inputVector.z * this.inputVector.z)
      this.inputVector.x /= length
      this.inputVector.z /= length
    }
    
    this.isTouch = false
  }

  /**
   * Update input vector based on touch input
   */
  updateTouchInput() {
    const deltaX = this.touchCurrentPos.x - this.touchStartPos.x
    const deltaY = this.touchCurrentPos.y - this.touchStartPos.y
    
    // Calculate distance and clamp to max touch distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const clampedDistance = Math.min(distance, this.maxTouchDistance)
    
    if (distance > 0) {
      // Normalize and apply sensitivity
      this.inputVector.x = (deltaX / distance) * (clampedDistance / this.maxTouchDistance)
      this.inputVector.z = (deltaY / distance) * (clampedDistance / this.maxTouchDistance)
    } else {
      this.inputVector.x = 0
      this.inputVector.z = 0
    }
  }

  /**
   * Create virtual joystick UI for mobile devices
   */
  createVirtualJoystick() {
    // Create joystick container
    this.joystickContainer = document.createElement('div')
    this.joystickContainer.className = 'virtual-joystick'
    this.joystickContainer.style.cssText = `
      position: fixed;
      width: 120px;
      height: 120px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.2);
      display: none;
      z-index: 1000;
      pointer-events: none;
    `
    
    // Create joystick knob
    this.joystickKnob = document.createElement('div')
    this.joystickKnob.className = 'virtual-joystick-knob'
    this.joystickKnob.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: none;
    `
    
    this.joystickContainer.appendChild(this.joystickKnob)
    document.body.appendChild(this.joystickContainer)
  }

  /**
   * Update virtual joystick position and visibility
   * @param {number} x - Touch X position
   * @param {number} y - Touch Y position
   * @param {boolean} isStart - Whether this is the start of touch
   */
  updateVirtualJoystick(x, y, isStart) {
    if (!this.joystickContainer || !this.joystickKnob) return
    
    if (isStart) {
      // Show joystick at touch position
      this.joystickContainer.style.display = 'block'
      this.joystickContainer.style.left = (x - 60) + 'px'
      this.joystickContainer.style.top = (y - 60) + 'px'
      this.joystickActive = true
    }
    
    if (this.joystickActive) {
      // Update knob position based on touch delta
      const deltaX = x - this.touchStartPos.x
      const deltaY = y - this.touchStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = 40 // Half of container size minus knob radius
      
      let knobX = deltaX
      let knobY = deltaY
      
      if (distance > maxDistance) {
        knobX = (deltaX / distance) * maxDistance
        knobY = (deltaY / distance) * maxDistance
      }
      
      this.joystickKnob.style.transform = `translate(${-20 + knobX}px, ${-20 + knobY}px)`
    }
  }

  /**
   * Hide virtual joystick
   */
  hideVirtualJoystick() {
    if (this.joystickContainer) {
      this.joystickContainer.style.display = 'none'
      this.joystickActive = false
    }
    
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)'
    }
  }

  /**
   * Get current normalized input vector
   * @returns {Object} Input vector with x and z components
   */
  getInputVector() {
    return {
      x: this.inputVector.x,
      z: this.inputVector.z
    }
  }

  /**
   * Check if any movement input is active
   * @returns {boolean} True if movement input is detected
   */
  hasMovementInput() {
    return this.inputVector.x !== 0 || this.inputVector.z !== 0
  }

  /**
   * Check if using touch controls
   * @returns {boolean} True if using touch controls
   */
  isUsingTouch() {
    return this.isTouch
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  isMobileDevice() {
    return this.isMobile
  }

  /**
   * Set touch sensitivity
   * @param {number} sensitivity - Touch sensitivity value
   */
  setTouchSensitivity(sensitivity) {
    this.touchSensitivity = Math.max(0.001, Math.min(0.01, sensitivity))
  }

  /**
   * Get current touch sensitivity
   * @returns {number} Touch sensitivity value
   */
  getTouchSensitivity() {
    return this.touchSensitivity
  }

  /**
   * Clean up event listeners and DOM elements
   */
  dispose() {
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.boundKeyDown)
    document.removeEventListener('keyup', this.boundKeyUp)
    
    // Remove touch event listeners
    document.removeEventListener('touchstart', this.boundTouchStart)
    document.removeEventListener('touchmove', this.boundTouchMove)
    document.removeEventListener('touchend', this.boundTouchEnd)
    
    // Remove mouse event listeners
    document.removeEventListener('mousedown', this.boundMouseDown)
    document.removeEventListener('mousemove', this.boundMouseMove)
    document.removeEventListener('mouseup', this.boundMouseUp)
    
    // Remove virtual joystick from DOM
    if (this.joystickContainer && this.joystickContainer.parentNode) {
      this.joystickContainer.parentNode.removeChild(this.joystickContainer)
    }
    
    // Reset state
    this.keys = {}
    this.inputVector = { x: 0, z: 0 }
    this.touchActive = false
    this.joystickActive = false
    
    console.log('InputManager disposed')
  }
}