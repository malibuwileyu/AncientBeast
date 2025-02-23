# Metrics System Test Plan

> Testing metrics collection and analysis only
> Following existing test patterns from src/__tests__/

## Unit Tests
```typescript
import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import { MetricsCollector } from '../metrics/MetricsCollector';

// Mock Data Setup
const getMockGameState = () => ({
  creatures: [],
  resources: { energy: 0, health: 0 },
  effects: [],
  turn: 0
});

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;
  let mockGame;

  beforeEach(() => {
    mockGame = getMockGameState();
    metricsCollector = new MetricsCollector(mockGame);
  });

  describe('Unit State Metrics', () => {
    test('captures empty state', () => {
      const metrics = metricsCollector.collect();
      expect(metrics.unitCount).toBe(0);
      expect(metrics.unitMetrics).toEqual([]);
    });

    test('captures single unit metrics', () => {
      mockGame.creatures = [{ 
        id: 1, 
        health: 100,
        energy: 50,
        position: {x: 0, y: 0},
        effects: []
      }];
      const metrics = metricsCollector.collect();
      expect(metrics.unitMetrics[0]).toMatchSnapshot({
        id: 1,
        healthPercent: 100,
        energyPercent: 50,
        threatLevel: expect.any(Number)
      });
    });

    test('handles unit state changes', () => {
      const unit = { id: 1, health: 100, energy: 100 };
      mockGame.creatures = [unit];
      
      // Initial capture
      let metrics = metricsCollector.collect();
      const initial = metrics.unitMetrics[0];

      // State change
      unit.health = 50;
      metrics = metricsCollector.collect();
      expect(metrics.unitMetrics[0].healthPercent).toBe(50);
      expect(metrics.unitMetrics[0].delta).toBeDefined();
    });
  });

  describe('Resource Metrics', () => {
    test('tracks resource changes', () => {
      mockGame.resources = { energy: 100 };
      let metrics = metricsCollector.collect();
      expect(metrics.resourceMetrics.energy.value).toBe(100);
      
      mockGame.resources.energy = 50;
      metrics = metricsCollector.collect();
      expect(metrics.resourceMetrics.energy.delta).toBe(-50);
    });
  });

  describe('Error Cases', () => {
    test('handles null values', () => {
      mockGame.creatures = [{ id: 1, health: null }];
      const metrics = metricsCollector.collect();
      expect(metrics.unitMetrics[0].healthPercent).toBe(0);
    });

    test('handles missing properties', () => {
      mockGame.creatures = [{ id: 1 }]; // Missing health/energy
      const metrics = metricsCollector.collect();
      expect(metrics.unitMetrics[0]).toBeDefined();
    });

    test('handles invalid data types', () => {
      mockGame.creatures = [{ id: 1, health: "100" }]; // String instead of number
      const metrics = metricsCollector.collect();
      expect(metrics.unitMetrics[0].healthPercent).toBe(0);
    });
  });
});
```

## Integration Tests
```typescript
describe('Metrics Integration', () => {
  test('metrics update when game state changes', () => {
    const game = new Game();
    const metricsCollector = new MetricsCollector(game);
    
    game.addUnit({ id: 1, health: 100 });
    let metrics = metricsCollector.collect();
    expect(metrics.unitCount).toBe(1);

    game.removeUnit(1);
    metrics = metricsCollector.collect();
    expect(metrics.unitCount).toBe(0);
  });

  test('metrics capture combat events', () => {
    const game = new Game();
    const metricsCollector = new MetricsCollector(game);
    
    game.addUnit({ id: 1, health: 100 });
    game.addUnit({ id: 2, health: 100 });
    game.simulateCombat(1, 2);

    const metrics = metricsCollector.collect();
    expect(metrics.combatMetrics).toBeDefined();
    expect(metrics.combatMetrics.length).toBeGreaterThan(0);
  });
});
```

## End-to-End Tests
```typescript
describe('Metrics E2E', () => {
  test('full game turn metrics collection', async () => {
    const game = new Game();
    const metricsCollector = new MetricsCollector(game);
    
    // Setup game state
    game.initialize();
    
    // Collect metrics for entire turn
    const turnMetrics = [];
    game.on('stateChange', () => {
      turnMetrics.push(metricsCollector.collect());
    });

    // Play through turn
    await game.playTurn();

    // Verify metrics
    expect(turnMetrics.length).toBeGreaterThan(0);
    expect(turnMetrics[0].timestamp).toBeDefined();
    expect(turnMetrics[turnMetrics.length-1].turnComplete).toBe(true);
  });

  test('performance over multiple turns', async () => {
    const game = new Game();
    const metricsCollector = new MetricsCollector(game);
    
    const times = [];
    for(let i = 0; i < 10; i++) {
      const start = performance.now();
      metricsCollector.collect();
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a,b) => a + b) / times.length;
    expect(avgTime).toBeLessThan(5); // 5ms limit
  });
});
```

## Performance Thresholds
- Collection time: <2ms per unit
- Analysis time: <3ms per analysis
- Memory growth: <1MB per 1000 collections
- Update frequency: Every state change

## Edge Cases to Test
1. State Changes
- Rapid state updates
- Multiple units changing simultaneously
- Resource spikes/drops

2. Data Integrity
- Missing data
- Invalid data types
- Null/undefined values
- Maximum/minimum values

3. System Stress
- Maximum unit count
- Maximum effect count
- Rapid collection requests
- Long-running collection

4. Game Events
- Unit creation/destruction
- Combat initiation/completion
- Resource gain/loss
- Effect application/removal

## Key Test Areas

1. Basic Metric Collection
- Unit counts and positions
- Resource levels
- Game state snapshots
- Unit relationships

2. Combat Metrics
- Threat assessment
- Position evaluation
- Unit synergies
- Combat effectiveness

3. Performance Metrics
- Collection time (<5ms)
- Memory usage (<1MB)
- Update frequency (every turn)

4. Error Cases
- Invalid game states
- Missing data
- Type mismatches
- Edge cases

## Test Coverage Requirements

1. All metric types collected
2. Collection performance verified
3. Error handling confirmed
4. Edge cases covered

Would you like me to detail any specific test area further? 