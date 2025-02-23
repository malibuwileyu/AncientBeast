# Metrics Logging Analysis

## Current Game Initialization
```typescript
// From game.ts
metricsManager: MetricsManager;
stateCapture: StateCapture;
threatAnalyticsManager: ThreatAnalyticsManager;
```

## Logging Hierarchy
1. MetricsLogger (High-level game metrics)
2. ThreatAnalyticsManager (Tactical/threat analysis)
3. StateCapture (Game state snapshots)

## Current Logging Coverage

### MetricsManager (High-Level Game Events)
- ✅ Game initialization
- ✅ Turn state logging
- ✅ Round state logging
- ✅ Game end state
- ✅ Damage events
- ✅ Healing events
- ✅ Status effects

### ThreatAnalyticsManager (Tactical Analysis)
- ✅ Ability usage analysis
- ✅ Movement analysis
- ✅ Pattern detection
- ✅ Resource state tracking
- ✅ Position analysis
- ✅ Threat assessment
- ✅ Effect analysis
- ✅ Summon analysis

### StateCapture (Game State)
- ✅ Unit states
- ✅ Board state
- ✅ Resource state
- ✅ Action history
- ✅ Debug info

## Missing Critical Logging

### Game State Transitions
- ❌ Game phase changes (loading -> playing -> ended)
- ❌ Queue reordering events
- ❌ Initiative changes
- ❌ Player turn transitions

### Combat Events
- ❌ Miss/dodge events
- ❌ Critical hit events
- ❌ Damage reduction events
- ❌ Shield/protection events
- ❌ Combo chain events

### Resource Events
- ❌ Energy regeneration events
- ❌ Plasma gain/loss events
- ❌ Fatigue accumulation events
- ❌ Resource denial events

### Board Control Events
- ❌ Zone capture events
- ❌ Territory changes
- ❌ Line of sight changes
- ❌ Tactical advantage shifts

### Team Events
- ❌ Team composition changes
- ❌ Formation changes
- ❌ Synergy activations
- ❌ Cross-unit ability interactions

### Performance Metrics
- ❌ Analysis computation time
- ❌ Cache performance
- ❌ Memory usage
- ❌ Event processing latency

## Priority Fixes Needed

### 1. Game State Events
```typescript
// Need to hook into game phase changes
game.signals.stateChange.add((oldState, newState) => {
    MetricsLogger.logStateTransition(oldState, newState);
});
```

### 2. Combat Event Details
```typescript
// Need to capture combat resolution details
game.signals.combat.add((source, target, result) => {
    MetricsLogger.logCombatEvent({
        source,
        target,
        hit: result.hit,
        critical: result.critical,
        reduced: result.reduced,
        final: result.final
    });
});
```

### 3. Resource Event Tracking
```typescript
// Need to track resource changes
game.signals.resource.add((unit, type, amount, reason) => {
    MetricsLogger.logResourceEvent({
        unit,
        type,
        amount,
        reason
    });
});
```

### 4. Board Control Tracking
```typescript
// Need to track territory changes
game.signals.zoneControl.add((hex, oldTeam, newTeam) => {
    MetricsLogger.logZoneControl({
        hex,
        oldTeam,
        newTeam,
        controlPercentage: calculateControlPercentage()
    });
});
```

## Implementation Recommendations

1. Add Signal Handlers
- Create new signal types in game.ts
- Add handlers in MetricsManager
- Forward relevant events to ThreatAnalyticsManager

2. Extend MetricsLogger
- Add new logging methods for missing events
- Implement structured logging format
- Add performance tracking

3. Update StateCapture
- Track game phase changes
- Capture queue modifications
- Record initiative changes

4. Enhance ThreatAnalyticsManager
- Add team synergy analysis
- Track formation changes
- Monitor resource efficiency

## Technical Requirements

1. Signal System Updates
```typescript
export interface GameSignals {
    stateChange: Signal;
    combat: Signal;
    resource: Signal;
    zoneControl: Signal;
    formation: Signal;
    synergy: Signal;
}
```

2. Logging Format Updates
```typescript
export interface MetricsLog {
    timestamp: number;
    category: LogCategory;
    data: LogData;
    context: GameContext;
}
```

3. Performance Tracking
```typescript
export interface PerformanceMetrics {
    computeTime: number;
    memoryUsage: number;
    cacheStats: CacheStats;
    eventLatency: number;
}
```

## Next Steps

1. Immediate Actions
- Hook into game phase changes
- Implement combat event details
- Add resource change tracking

2. Short-term Improvements
- Add board control tracking
- Implement team synergy logging
- Add performance metrics

3. Long-term Goals
- Create metrics visualization
- Implement analytics dashboard
- Add machine learning analysis 