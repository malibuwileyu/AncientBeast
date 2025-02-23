# Ancient Beast Game Analysis

## Core Game Loop

1. Turn-Based Combat
- Players alternate turns
- Each turn allows movement and ability usage
- Energy and health management is critical
- Position and range considerations are key

2. Unit System
- Each unit has 4 unique abilities
- Units have base stats and masteries
- Movement and positioning is hex-based
- Units can be upgraded during combat

3. Combat Mechanics
- Damage types: pierce, slash, crush, shock, burn, frost, poison, sonic, mental
- Range considerations: melee, medium, long, variable
- Area effects and status conditions
- Energy costs limit ability usage

4. State Management
- Game state tracked in central Game object
- Unit positions and stats maintained
- Effects and abilities queue system
- Combat log tracks all actions

## Key Systems

### Ability System
```javascript
// Each ability has:
{
  trigger: 'onQuery|onStartPhase|onDamage', // When ability activates
  require: () => boolean, // Requirements check
  query: () => void, // Target selection
  activate: () => void // Effect implementation
}
```

### Combat Resolution
```javascript
// Damage application:
new Damage(
  attacker,
  damageType,
  area,
  effects,
  gameRef
)
```

### State Tracking
- Unit positions and health
- Active effects and durations
- Available actions and costs
- Turn order and initiative 