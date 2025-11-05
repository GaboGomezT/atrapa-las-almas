/**
 * SoundManager handles procedural sound generation using Web Audio API
 * Creates simple sound effects without requiring audio files
 */
export class SoundManager {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isEnabled = true
    this.volume = 0.3 // Default volume (30%)
    
    this.init()
  }

  /**
   * Initialize the audio context and master gain
   */
  init() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
      this.masterGain.connect(this.audioContext.destination)
      
      console.log('SoundManager initialized successfully')
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      this.isEnabled = false
    }
  }

  /**
   * Resume audio context if it's suspended (required for user interaction)
   */
  async resumeAudioContext() {
    if (!this.audioContext) return
    
    // Always try to resume, even if state is not 'suspended'
    // Some mobile browsers need explicit resume even when state appears 'running'
    if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
      try {
        await this.audioContext.resume()
        console.log('Audio context resumed')
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
      }
    }
    
    // Ensure audio context is running
    if (this.audioContext.state !== 'running') {
      try {
        await this.audioContext.resume()
        console.log('Audio context forced to running state')
      } catch (error) {
        console.warn('Failed to force audio context to running:', error)
      }
    }
  }

  /**
   * Play soul collection sound effect
   */
  async playSoulCollected() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create oscillator for the main tone
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    // Configure the sound - magical chime effect
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(523.25, now) // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1) // C6
    oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.3) // G5
    
    // Envelope - quick attack, gentle decay
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    
    // Play the sound
    oscillator.start(now)
    oscillator.stop(now + 0.4)
    
    // Add a subtle harmonic
    const harmonic = this.audioContext.createOscillator()
    const harmonicGain = this.audioContext.createGain()
    
    harmonic.connect(harmonicGain)
    harmonicGain.connect(this.masterGain)
    
    harmonic.type = 'triangle'
    harmonic.frequency.setValueAtTime(1046.5, now) // C6
    harmonic.frequency.exponentialRampToValueAtTime(1567.98, now + 0.2) // G6
    
    harmonicGain.gain.setValueAtTime(0, now)
    harmonicGain.gain.linearRampToValueAtTime(0.15, now + 0.05)
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    
    harmonic.start(now + 0.02)
    harmonic.stop(now + 0.3)
  }

  /**
   * Play game start sound effect
   */
  async playGameStart() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25] // C4, E4, G4, C5
    
    notes.forEach((frequency, index) => {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)
      
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(frequency, now)
      
      const startTime = now + index * 0.1
      const duration = 0.2
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    })
  }

  /**
   * Play game over sound effect
   */
  async playGameOver() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create descending sequence
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(523.25, now) // C5
    oscillator.frequency.exponentialRampToValueAtTime(261.63, now + 0.5) // C4
    oscillator.frequency.exponentialRampToValueAtTime(196.00, now + 1.0) // G3
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.5)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0)
    
    oscillator.start(now)
    oscillator.stop(now + 1.0)
  }

  /**
   * Play countdown tick sound
   */
  async playCountdownTick() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create short tick sound
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(800, now)
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    
    oscillator.start(now)
    oscillator.stop(now + 0.1)
  }

  /**
   * Play final countdown warning sound (last 10 seconds)
   */
  async playCountdownWarning() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create urgent beep
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(1000, now)
    oscillator.frequency.setValueAtTime(1200, now + 0.05)
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    
    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }

  /**
   * Play ambient background tone (subtle)
   */
  async playAmbientTone() {
    if (!this.isEnabled || !this.audioContext) return
    
    await this.resumeAudioContext()
    
    const now = this.audioContext.currentTime
    
    // Create very subtle ambient drone
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    
    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.masterGain)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(65.41, now) // C2
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, now)
    
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.05, now + 2.0)
    
    oscillator.start(now)
    
    // Return the nodes so they can be stopped later
    return { oscillator, gainNode }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    }
  }

  /**
   * Enable or disable sound effects
   * @param {boolean} enabled - Whether sounds should be enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }

  /**
   * Get current volume level
   * @returns {number} Current volume (0.0 to 1.0)
   */
  getVolume() {
    return this.volume
  }

  /**
   * Check if sound is enabled
   * @returns {boolean} True if sound is enabled
   */
  getEnabled() {
    return this.isEnabled
  }

  /**
   * Clean up audio resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.masterGain = null
    console.log('SoundManager disposed')
  }
}