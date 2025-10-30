// Main entry point for Atrapa las Almas
import './styles/main.css'

// Game initialization will be implemented in future tasks
console.log('Atrapa las Almas - Game initialization placeholder')

// Hide loading screen once basic setup is complete
document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.display = 'none'
    }, 1000)
  }
})