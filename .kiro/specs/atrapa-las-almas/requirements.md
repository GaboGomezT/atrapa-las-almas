# Requirements Document

## Introduction

"Atrapa las Almas" (Soul Catcher 3D) is a web-based 3D minigame where players control a luminous skull to guide lost souls to a central altar within a 60-second time limit. The game features Day of the Dead (Día de Muertos) aesthetics with marigold flowers, candles, and papel picado decorations in a Three.js-powered 3D environment.

## Glossary

- **Soul_Catcher_Game**: The complete 3D web game application
- **Player_Skull**: The luminous skull character controlled by the player
- **Lost_Soul**: Translucent glowing spheres that float around the game field
- **Central_Altar**: The target destination where souls must be collected
- **Game_Timer**: 60-second countdown mechanism
- **Soul_Counter**: Score tracking system for collected souls
- **Game_Field**: The 3D playing area with Day of the Dead decorations

## Requirements

### Requirement 1

**User Story:** As a player, I want to control a skull character in a 3D environment, so that I can navigate and collect souls.

#### Acceptance Criteria

1. WHEN the player presses arrow keys or WASD keys, THE Soul_Catcher_Game SHALL move the Player_Skull in the corresponding direction within the Game_Field
2. THE Soul_Catcher_Game SHALL render the Player_Skull as a luminous 3D model with cartoon-style texturing
3. THE Soul_Catcher_Game SHALL constrain Player_Skull movement within the boundaries of the Game_Field
4. THE Soul_Catcher_Game SHALL provide smooth movement animation for the Player_Skull at 60 frames per second
5. THE Soul_Catcher_Game SHALL respond to both keyboard and touch controls for cross-platform compatibility

### Requirement 2

**User Story:** As a player, I want to collect floating souls by touching them with my skull, so that I can increase my score.

#### Acceptance Criteria

1. WHEN the Player_Skull collides with a Lost_Soul, THE Soul_Catcher_Game SHALL remove the Lost_Soul from the Game_Field with a light animation effect
2. WHEN a Lost_Soul is collected, THE Soul_Catcher_Game SHALL increment the Soul_Counter by one
3. THE Soul_Catcher_Game SHALL spawn Lost_Soul entities as translucent glowing spheres with blue or violet particle effects
4. THE Soul_Catcher_Game SHALL animate Lost_Soul entities with slow floating movement patterns
5. THE Soul_Catcher_Game SHALL detect collision between Player_Skull and Lost_Soul within a defined radius

### Requirement 3

**User Story:** As a player, I want to see how much time remains and my current score, so that I can track my progress during gameplay.

#### Acceptance Criteria

1. WHEN the game starts, THE Soul_Catcher_Game SHALL initialize the Game_Timer to 60 seconds and begin countdown
2. THE Soul_Catcher_Game SHALL display the remaining time in seconds on the game interface
3. THE Soul_Catcher_Game SHALL display the current Soul_Counter value on the game interface
4. WHEN the Game_Timer reaches zero, THE Soul_Catcher_Game SHALL end the gameplay session
5. THE Soul_Catcher_Game SHALL update the displayed timer and score in real-time during gameplay

### Requirement 4

**User Story:** As a player, I want to experience an immersive Day of the Dead atmosphere, so that I can enjoy the cultural theme while playing.

#### Acceptance Criteria

1. THE Soul_Catcher_Game SHALL render the Game_Field with marigold petal textures on the ground surface
2. THE Soul_Catcher_Game SHALL display floating marigold flowers, lit candles, and animated papel picado in the background
3. THE Soul_Catcher_Game SHALL provide warm ambient lighting with orange tones resembling altar candlelight
4. THE Soul_Catcher_Game SHALL include a Central_Altar model as the visual focal point of the Game_Field
5. THE Soul_Catcher_Game SHALL maintain consistent Day of the Dead visual theming across all game elements

### Requirement 5

**User Story:** As a player, I want to see my final score when the game ends, so that I can know how many souls I successfully guided.

#### Acceptance Criteria

1. WHEN the Game_Timer reaches zero, THE Soul_Catcher_Game SHALL display a game over screen with the final Soul_Counter value
2. THE Soul_Catcher_Game SHALL show a congratulatory message such as "Las almas agradecen tu guía" on the game over screen
3. THE Soul_Catcher_Game SHALL provide a restart option to begin a new gameplay session
4. THE Soul_Catcher_Game SHALL pause all game mechanics when displaying the game over screen
5. THE Soul_Catcher_Game SHALL maintain the final score display until the player chooses to restart

### Requirement 6

**User Story:** As a player using different devices, I want the game to work well on both desktop and mobile, so that I can play anywhere.

#### Acceptance Criteria

1. THE Soul_Catcher_Game SHALL adapt the user interface layout for mobile and desktop screen sizes
2. THE Soul_Catcher_Game SHALL provide touch controls for mobile devices and keyboard controls for desktop
3. THE Soul_Catcher_Game SHALL maintain consistent performance across different device capabilities
4. THE Soul_Catcher_Game SHALL scale the 3D viewport appropriately for different screen aspect ratios
5. THE Soul_Catcher_Game SHALL load and render efficiently on both mobile and desktop browsers