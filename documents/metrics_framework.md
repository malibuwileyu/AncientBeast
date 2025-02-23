# Ancient Beast Metrics Framework

## Currently Available Metrics

### Unit Base Stats
```typescript
interface BaseStats {
  level: number;
  realm: string; 
  size: number;
  progress: number;
  health: number;
  regrowth: number;
  endurance: number;
  energy: number;
  meditation: number;
  initiative: number;
  offense: number;
  defense: number;
  movement: number;
}
```

### Combat Metrics (From Damage System)
```typescript
interface DamageMetrics {
  // From damage.ts
  attacker: Creature;
  target: Creature;
  type: DamageType;
  amount: number;
  area: number;
  effects: Effect[];
}
```

### AI-Specific Unit Metrics
```typescript
interface AIMetrics {
  role: "striker" | "tank" | "support" | "controller" | "debuffer" | "harasser";
  combat_style: "melee" | "ranged" | "hybrid";
  specialties: string[];
  threat_assessment: {
    damage: number;
    durability: number;
    utility: number;
    mobility: number;
  };
  optimal_range: "melee" | "medium" | "long" | "variable";
  primary_damage_types: string[];
}
```

## Proposed New Metrics

### Performance Metrics
```typescript
interface PerformanceMetrics {
  // Per-Game Metrics
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  energyUsed: number;
  abilitiesCast: number;
  unitsKilled: number;
  hexesMoved: number;
  turnTimeAverage: number;

  // Per-Unit Metrics
  unitEfficiency: {
    damagePerEnergy: number;
    damagePerTurn: number;
    survivalTime: number;
    positioningScore: number;
    threatGenerated: number;
  };
}
```

### Strategic Metrics
```typescript
interface StrategicMetrics {
  // Board Control
  zoneControl: {
    centerControl: number;
    flankControl: number;
    territoryScore: number;
  };

  // Resource Management
  resourceMetrics: {
    energyEfficiency: number;
    healthRetention: number;
    enduranceManagement: number;
  };

  // Tactical Choices
  tacticalMetrics: {
    initiativeUsage: number;
    targetPrioritization: number;
    abilitySequencing: number;
    positioningEffectiveness: number;
  };
}
```

### Learning Metrics
```typescript
interface LearningMetrics {
  // Pattern Recognition
  patterns: {
    favoredUnits: Map<string, number>;
    commonCombos: AbilitySequence[];
    movementPatterns: MovementProfile[];
  };

  // Adaptation Metrics
  adaptation: {
    strategySuccess: Map<string, number>;
    counterplayEffectiveness: number;
    learningRate: number;
  };

  // Historical Performance
  history: {
    winRate: number;
    averageDamagePerGame: number;
    averageSurvivalRate: number;
    improvementTrend: number;
  };
}
```

## Collection Points

1. Combat Events
```typescript
// In damage.ts
class Damage {
  onDamageDealt() {
    MetricsCollector.record({
      type: 'combat',
      subtype: 'damage',
      data: {
        source: this.attacker,
        target: this.target,
        amount: this.amount,
        type: this.type
      }
    });
  }
}
```

2. Turn Events
```typescript
// In game.ts
class Game {
  onTurnEnd() {
    MetricsCollector.record({
      type: 'turn',
      data: {
        activeUnit: this.activeCreature,
        turnNumber: this.turn,
        actionsUsed: this.actionsThisTurn,
        resourcesSpent: this.resourcesUsed
      }
    });
  }
}
```

3. Strategic Events
```typescript
// In creature.ts
class Creature {
  onPositionChange() {
    MetricsCollector.record({
      type: 'movement',
      data: {
        unit: this,
        from: this.previousPosition,
        to: this.position,
        context: this.game.getGameState()
      }
    });
  }
}
```

## Implementation Priority

1. Phase 1 (Core Metrics)
- [ ] Combat performance metrics
- [ ] Resource management tracking
- [ ] Basic positioning analysis
- [ ] Turn efficiency metrics

2. Phase 2 (Strategic Metrics)
- [ ] Zone control analysis
- [ ] Tactical decision tracking
- [ ] Unit synergy metrics
- [ ] Threat generation tracking

3. Phase 3 (Learning Metrics)
- [ ] Pattern recognition data
- [ ] Strategy effectiveness tracking
- [ ] Adaptation rate analysis
- [ ] Historical performance tracking 