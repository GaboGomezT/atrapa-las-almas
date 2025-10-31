# Leaderboard System Design

## Overview

The leaderboard system integrates with the existing "Atrapa las Almas" game architecture to provide score submission and ranking functionality. The system consists of three main components: a name input modal, a leaderboard display modal, and an API service layer. The implementation leverages the existing GameEngine state management and UIManager infrastructure to provide a seamless user experience.

## Architecture

### Component Integration

The leaderboard system integrates with the existing game architecture at the following points:

- **GameEngine**: Hooks into the `endGame()` method to trigger leaderboard flow
- **UIManager**: Extended to manage new modal components (name input and leaderboard display)
- **API Service**: New service layer for handling HTTP requests to the leaderboard backend

### Data Flow

```
Game End → Name Input Modal → API POST Request (submit score) → 
API GET Request (fetch updated leaderboard) → Leaderboard Display → Return to Menu
```

### State Management

The leaderboard system introduces two new UI states:
- `name-input`: Player enters their name after game completion
- `leaderboard-display`: Shows ranking results and allows return to menu

## Components and Interfaces

### 1. LeaderboardManager

**Purpose**: Orchestrates the entire leaderboard flow and manages API communication.

**Key Methods**:
```javascript
class LeaderboardManager {
  constructor(uiManager, apiService)
  
  // Main flow control
  async handleGameEnd(score)
  async submitScore(playerName, score)
  
  // API interaction
  async fetchTopScores()
  async postPlayerScore(playerName, score)
  
  // Score analysis
  findPlayerInLeaderboard(playerName, topScores)
  determinePlayerMessage(playerName, topScores)
}
```

**Integration Points**:
- Called by GameEngine when game ends
- Uses UIManager for modal display
- Uses APIService for HTTP requests

### 2. APIService

**Purpose**: Handles all HTTP communication with the leaderboard backend.

**Key Methods**:
```javascript
class APIService {
  constructor(baseURL, timeout = 10000)
  
  // HTTP methods
  async get(endpoint)
  async post(endpoint, data)
  
  // Leaderboard specific
  async getTopScores()
  async submitScore(playerName, score)
  
  // Error handling
  handleNetworkError(error)
  isNetworkAvailable()
}
```

**Configuration**:
- Base URL: Configurable for different environments
- Timeout: 10 seconds for all requests
- Retry logic: Single retry attempt for failed requests

### 3. UIManager Extensions

**Purpose**: Manages new modal components for name input and leaderboard display.

**New Methods**:
```javascript
// Name input modal
showNameInputModal(score)
hideNameInputModal()
validatePlayerName(name)

// Leaderboard display modal
showLeaderboardModal(leaderboardData, playerRank)
hideLeaderboardModal()
updateLeaderboardDisplay(scores, highlightedPlayer)

// Error handling
showNetworkErrorModal(retryCallback)
showAPIErrorModal(message)
```

**Modal Components**:
- Name Input Modal: Text input with validation and submit/cancel buttons
- Leaderboard Modal: Scrollable list of top 10 players with highlighting
- Error Modals: Network and API error displays with retry options

## Data Models

### Player Score Record
```javascript
{
  name: string,        // Player name (1-20 characters, alphanumeric + spaces)
  score: number        // Player's final score (integer)
}
```

### Leaderboard Response
```javascript
{
  players: [
    {
      name: string,
      score: number
    }
    // ... up to 10 players
  ]
}
```

### Leaderboard Display Data
```javascript
{
  playerName: string,          // Current player's name
  playerScore: number,         // Player's score
  playerRank: number | null,   // Player's rank (1-10) or null if not in top 10
  topScores: PlayerScore[],    // Current top 10 scores
  message: string              // Display message for player
}
```

## Error Handling

### Network Error Scenarios

1. **API Unreachable**: Display fallback message, show only player's score
2. **Timeout**: Show retry option with exponential backoff
3. **Invalid Response**: Log error, show generic error message
4. **Server Error (5xx)**: Show retry option, log for debugging

### Validation Errors

1. **Invalid Name**: Real-time validation with error messages
2. **Empty Name**: Prevent submission, show validation error
3. **Name Too Long**: Truncate or show character limit warning

### Graceful Degradation

- If POST request fails: Show retry option for score submission
- If GET request fails: Show player score only, indicate leaderboard unavailable
- If both requests fail: Show offline message, allow game restart

## Testing Strategy

### Unit Testing Focus Areas

1. **LeaderboardManager**:
   - Score submission flow
   - Player ranking detection
   - Error handling flows

2. **APIService**:
   - HTTP request/response handling
   - Timeout behavior
   - Error response parsing

3. **UIManager Extensions**:
   - Modal display/hide logic
   - Input validation
   - Event handling

### Integration Testing

1. **End-to-End Flow**: Complete game → name input → API calls → leaderboard display
2. **Error Scenarios**: Network failures, invalid responses, timeout handling
3. **Mobile Compatibility**: Touch interactions, responsive layout

### Manual Testing Scenarios

1. **Happy Path**: Complete game, enter name, view leaderboard
2. **Network Offline**: Test graceful degradation
3. **API Errors**: Test error message display and retry functionality
4. **Edge Cases**: Very high scores, duplicate names, special characters

## Implementation Notes

### API Endpoints

**GET /api/leaderboard/top10**
- Returns: JSON array of top 10 player records
- Expected format: `[{name: string, score: number}, ...]`
- Sorted by score (descending)

**POST /api/leaderboard/submit**
- Accepts: JSON object with player name and score
- Expected format: `{name: string, score: number}`
- Returns: Success status (200-299) or error

### CSS Classes and Styling

New CSS classes needed:
- `.name-input-modal`: Styling for name input dialog
- `.leaderboard-modal`: Styling for leaderboard display
- `.leaderboard-item`: Individual player entry styling
- `.highlighted-player`: Styling for current player's entry
- `.network-error`: Error message styling

### Mobile Considerations

- Touch-friendly input fields and buttons
- Responsive modal sizing
- Virtual keyboard handling
- Swipe gestures for modal dismissal

### Performance Considerations

- Debounced input validation
- Cached API responses (session-based)
- Minimal DOM manipulation
- Efficient list rendering for leaderboard

### Security Considerations

- Input sanitization for player names
- XSS prevention in leaderboard display
- HTTPS enforcement for API calls
- Rate limiting awareness (client-side)