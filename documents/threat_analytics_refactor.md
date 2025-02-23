# ThreatAnalyticsManager Refactoring Plan

## Overview
This document outlines the organization of ThreatAnalyticsManager functions into logical groups for refactoring into separate files.

## Function Groups

### Core Manager Functions ✅
Primary orchestration and event handling functions that should remain in ThreatAnalyticsManager.ts:
- `constructor(game: Game)` - Initializes manager and sets up event listeners ✅
- `analyzeAbilityThreat(source: Creature, ability: Ability, target?: Creature)` - Main entry point for ability threat analysis ✅
- Public access methods: ✅
  - `getUnitProfile(unitId: number)` ✅
  - `getThreatPatterns()` ✅
  - `getRecentThreats(unitId: number, count: number)` ✅
  - `getUnitVulnerabilities(unitId: number)` ✅

### Threat Analysis Module (ThreatAnalyzer.ts) ✅
Core threat calculation and analysis functions:
- `analyzeThreatForTarget(source, ability, target)` - Primary threat analysis function ✅
- `calculateEffectiveThreat(params)` - Calculates final threat value ✅
- `getPrimaryThreatType(analysis)` - Determines main threat type ✅
- `getPotentialTargets(source, ability)` - Gets valid targets for ability ✅

### Profile Management Module (ProfileManager.ts) ✅
Functions for managing unit threat profiles:
- `getOrCreateUnitProfile(source)` ✅
- `updateUnitProfile(source, profile)` ✅
- `updateVulnerabilities(profile)` ✅
- `updateStrengths(profile)` ✅
- `checkResourceStatus(unitId)` ✅
- `checkResourceEfficiency(unitId)` ✅

### Event Recording Module (EventRecorder.ts) ✅
Functions for recording and tracking game events:
- `recordDamageEvent(source, target, damage)` ✅
- `recordControlEffect(source, effect)` ✅

### Pattern Analysis Module (PatternAnalyzer.ts) ✅
Functions for analyzing threat patterns:
- `detectThreatPatterns(profile)` ✅
- `analyzeDamagePatterns(profile)` ✅
- `analyzeControlPatterns(profile)` ✅

### Ability Analysis Module (AbilityAnalyzer.ts) ✅
Functions for analyzing ability properties:
- `calculateDamageThreat(ability)` ✅
- `identifyControlEffects(ability)` ✅
- `calculateRange(ability)` ✅
- `calculateHexCount(ability)` ✅

### Position Analysis Module (PositionAnalyzer.ts) ✅
Functions for analyzing spatial threats:
- `isInRange(source, target, range)` ✅
- `countEscapeRoutes(target)` ✅
- `willBlockEscapeRoutes(source, target, ability)` ✅
- `willTrapTarget(source, target, ability)` ✅
- `willForceMovement(ability)` ✅
- `checkTeamSynergies(source, target, ability)` ✅

### Unit State Analysis Module (UnitStateAnalyzer.ts) ✅
Functions for analyzing unit state and capabilities:
- `analyzeUnitState()` - Analyze current unit state ✅
- `analyzeFatigue()` - Analyze unit fatigue status ✅
- `analyzeAbilityState()` - Analyze ability availability and costs ✅

## Implementation Plan

1. ✅ Create new files for each module in `src/metrics/analysis/`
2. ✅ Move related functions and their dependencies to appropriate modules
3. ✅ Update imports in ThreatAnalyticsManager.ts
4. ✅ Create interfaces for module communication
5. ⏳ Update unit tests to reflect new structure

## Dependencies

### Shared Types ✅
Create `types.ts` for shared interfaces:
- `ThreatSnapshot` ✅
- `UnitThreatProfile` ✅
- `ThreatPattern` ✅
- `AbilityThreatResult` ✅

### Required Game Types ✅
Import from game core:
- `Creature` ✅
- `Ability` ✅
- `Effect` ✅
- `Game` ✅

## Testing Strategy ⏳

1. Create separate test files for each module
2. Maintain existing integration tests in ThreatAnalyticsManager.test.ts
3. Add new unit tests for isolated module functionality
4. Create mock objects for cross-module testing

## Migration Steps

1. ✅ Create new files and move type definitions
2. ✅ Implement each module one at a time
3. ✅ Update ThreatAnalyticsManager to use new modules
4. ✅ Update tests to fix type errors
5. ⏳ Verify all functionality works as before

## Future Improvements

- Add performance metrics to each module
- Implement caching for frequently accessed calculations
- Add more sophisticated pattern recognition
- Improve team synergy analysis
- Add machine learning capabilities for pattern recognition

## Code Analysis - Part 1 (Lines 1-150)

### Code to Remove

1. Caching Implementation (should be moved to a new CacheManager):
```typescript
private threatCache = new Map<string, any>();
private positionCache = new Map<string, any>();
private readonly CACHE_TTL = 1000;
private lastCleanup = Date.now();
private cleanupCaches() { ... }
private getCacheKey() { ... }
```

2. Duplicate Analyzer Initialization:
```typescript
// Remove from initialize() as it's already done in constructor
this.threatAnalyzer = new ThreatAnalyzer();
this.abilityAnalyzer = new AbilityAnalyzer();
this.profileManager = new ProfileManager(this.game);
this.eventRecorder = new EventRecorder(this.game);
this.patternAnalyzer = new PatternAnalyzer();
this.positionAnalyzer = new PositionAnalyzer();
```

### Code to Move

1. Move to new `src/metrics/analysis/cache/CacheManager.ts`:
```typescript
export class CacheManager {
    private caches: Map<string, Map<string, any>> = new Map();
    private readonly TTL = 1000;
    
    public getCache(name: string): Map<string, any> {
        if (!this.caches.has(name)) {
            this.caches.set(name, new Map());
        }
        return this.caches.get(name);
    }
    
    public cleanup(): void {
        const now = Date.now();
        this.caches.forEach(cache => {
            for (const [key, value] of cache.entries()) {
                if (now - value.timestamp > this.TTL) {
                    cache.delete(key);
                }
            }
        });
    }
}
```

2. Move to `PositionAnalyzer.ts`:
```typescript
// These methods are called in handleMovement but should be in PositionAnalyzer:
countSafeMovementSpaces()
analyzeZoneControl()
analyzeBoardControl()
analyzePredictedThreats()
analyzePositionThreat()
analyzeTeamPosition()
```

### Code to Keep

1. Core Event Handlers:
```typescript
private setupEventListeners(): void
private handleActivate(creature: Creature): void
private handleMovement(creature: Creature, from: Position, to: Position): void
```

2. State Management:
```typescript
private lastTurnNumber: number
private currentTurnActions: any[]
private turnStartPositions: Map<number, Position>
private turnStartResources: Map<number, Resources>
```

### Required Changes

1. Update handleMovement to use PositionAnalyzer:
```typescript
private handleMovement(creature: Creature, from: Position, to: Position): void {
    const analysis = this.positionAnalyzer.analyzeMovement(creature, from, to);
    console.log(`[ThreatAnalytics] Movement Analysis:
        Unit: ${this.getDisplayName(creature)} (ID: ${creature.id})
        From: (${from.x}, ${from.y}) to (${to.x}, ${to.y})
        ${analysis.formatForLog()}`);
}
```

2. Create new interfaces in types.ts:
```typescript
interface Position {
    x: number;
    y: number;
}

interface Resources {
    energy: number;
    plasma: number;
}

interface MovementAnalysis {
    safeSpaces: number;
    zoneControl: string;
    boardControl: string;
    threats: string;
    positionStrength: string;
    teamPosition: string;
    formatForLog(): string;
}
```

### Documentation Updates

1. Add new section for CacheManager:
```markdown
### Cache Management Module (CacheManager.ts)
Functions for managing caching across the analytics system:
- `getCache(name: string)` - Gets or creates a named cache
- `cleanup()` - Cleans up expired cache entries
- `getCacheKey()` - Generates cache keys for entries
```

2. Update PositionAnalyzer section to include new methods:
```markdown
### Position Analysis Module (PositionAnalyzer.ts)
Add new methods:
- `analyzeMovement(creature, from, to)` - Comprehensive movement analysis
- `formatMovementAnalysis()` - Formats analysis for logging
``` 

## Code Analysis - Part 2 (Lines 151-350)

### Code to Remove

1. Ability Analysis Methods (move to AbilityAnalyzer):
```typescript
analyzeAbilityThreat()
processThreatBatch()
describeControlEffects()
analyzeAbilityTargets()
analyzeThreatContext()
calculateCurrentThreat()
analyzeVulnerability()
analyzeCounterOptions()
```

2. Redundant State Management (move to EventRecorder):
```typescript
private currentTurnActions: any[] = [];
// ... action recording in handleMovement and handleAbilityUsed
```

### Code to Move

1. Move to `AbilityAnalyzer.ts`:
```typescript
interface AbilityAnalysis {
    offensiveImpact: {
        damageTypes: string[];
        controlEffects: string[];
        areaCoverage: number;
    };
    targetAnalysis: string;
    strategicContext: {
        teamPosition: string;
        resourceState: string;
        threatContext: string;
    };
    overallAssessment: {
        currentThreat: string;
        vulnerability: string;
        counterOptions: string;
    };
}

class AbilityAnalyzer {
    // Add new method:
    public analyzeAbilityUsage(source: Creature, ability: Ability): AbilityAnalysis;
}
```

2. Move to `EventRecorder.ts`:
```typescript
interface ActionRecord {
    type: 'movement' | 'ability';
    timestamp: number;
    source: {
        id: number;
        type: string;
        player: number;
        name: string;
    };
    details: any;
}

class EventRecorder {
    // Add new methods:
    public recordMovement(creature: Creature, from: Position, to: Position): void;
    public recordAbilityUsage(creature: Creature, ability: Ability): void;
    public summarizeActions(): string;
}
```

3. Move to `TurnAnalyzer.ts` (new file):
```typescript
export class TurnAnalyzer {
    public analyzeTurnEnd(creature: Creature, startPos: Position, startResources: Resources, currentResources: Resources, actions: ActionRecord[]): string {
        // Move turn end analysis logic here
    }
}
```

### Code to Keep

1. Core Event Handlers:
```typescript
private handleAbilityUsed(event: { creature?: Creature; ability?: Ability }): void
private handleCreatureSummon(event: { creature: Creature }): void
private handleTurnEnd(event: { creature?: Creature }): void
```

2. Utility Functions:
```typescript
private getDisplayName(creature: Creature): string
```

### Required Changes

1. Update handleAbilityUsed:
```typescript
private handleAbilityUsed(event: { creature?: Creature; ability?: Ability }): void {
    if (!event.creature || !event.ability) return;
    
    const analysis = this.abilityAnalyzer.analyzeAbilityUsage(event.creature, event.ability);
    console.log(`[ThreatAnalytics] Ability Analysis:
        Unit: ${this.getDisplayName(event.creature)} (ID: ${event.creature.id})
        Ability: ${event.ability.title}
        ${analysis.formatForLog()}`);
        
    this.eventRecorder.recordAbilityUsage(event.creature, event.ability);
}
```

2. Update handleTurnEnd:
```typescript
private handleTurnEnd(event: { creature?: Creature }): void {
    if (!event.creature) return;
    
    const analysis = this.turnAnalyzer.analyzeTurnEnd(
        event.creature,
        this.turnStartPositions.get(event.creature.id),
        this.turnStartResources.get(event.creature.id),
        {
            energy: event.creature.energy,
            plasma: event.creature.player.plasma
        },
        this.eventRecorder.getCurrentTurnActions()
    );
    
    console.log(analysis);
    
    // Clear turn data
    this.turnStartPositions.delete(event.creature.id);
    this.turnStartResources.delete(event.creature.id);
}
```

### Documentation Updates

1. Add new section for TurnAnalyzer:
```markdown
### Turn Analysis Module (TurnAnalyzer.ts)
Functions for analyzing turn-level events and state changes:
- `analyzeTurnEnd()` - Analyzes end-of-turn state and actions
- `formatTurnSummary()` - Formats turn summary for logging
```

2. Update EventRecorder section:
```markdown
### Event Recording Module (EventRecorder.ts)
Add new methods:
- `recordMovement()` - Records movement actions
- `recordAbilityUsage()` - Records ability usage
- `summarizeActions()` - Summarizes turn actions
```

3. Update AbilityAnalyzer section:
```markdown
### Ability Analysis Module (AbilityAnalyzer.ts)
Add new methods:
- `analyzeAbilityUsage()` - Comprehensive ability usage analysis
- `formatAbilityAnalysis()` - Formats analysis for logging
``` 

## Code Analysis - Part 3 (Lines 351-550)

### Code to Remove

1. Creature Analysis Methods (move to ThreatAnalyzer):
```typescript
analyzeSummonedCreature()
calculateBaseDamage()
assessControlPotential()
determineEffectiveRange()
calculateAreaCoverage()
determineUnitRole()
findTeamSynergies()
identifyKeyAbilities()
```

2. Effect Analysis Methods (move to EffectAnalyzer):
```typescript
categorizeEffect()
analyzeEffectThreat()
```

### Code to Move

1. Move to `src/metrics/analysis/creature/CreatureAnalyzer.ts` (new file):
```typescript
export interface CreatureAnalysis {
    offensiveCapabilities: {
        baseDamage: number;
        controlPotential: number;
        range: number;
        areaCoverage: number;
    };
    defensiveProfile: {
        healthPool: number;
        defenseStats: number;
        mobility: number;
        sustain: number;
    };
    strategicValue: {
        role: string;
        synergies: string[];
        keyAbilities: string[];
        counterUnits: string[];
    };
    overallThreatLevel: number;
}

export class CreatureAnalyzer {
    public analyzeCreature(creature: Creature): CreatureAnalysis {
        // Move creature analysis logic here
    }

    private calculateBaseDamage(creature: Creature): number;
    private assessControlPotential(creature: Creature): number;
    private determineEffectiveRange(creature: Creature): number;
    private calculateAreaCoverage(creature: Creature): number;
    private determineUnitRole(creature: Creature): string;
    private findTeamSynergies(creature: Creature): string[];
    private identifyKeyAbilities(creature: Creature): string[];
}
```

2. Move to `src/metrics/analysis/effect/EffectAnalyzer.ts` (new file):
```typescript
export interface EffectAnalysis {
    duration: string;
    type: string;
    currentEffects: string[];
    targetState: {
        health: string;
        energy: string;
        position: string;
    };
    tacticalImpact: {
        movementOptions: number;
        escapeRoutes: number;
        threatLevel: string;
    };
    counterOptions: string[];
}

export class EffectAnalyzer {
    public analyzeEffect(target: Creature, effect: Effect): EffectAnalysis {
        // Move effect analysis logic here
    }

    private categorizeEffect(effect: Effect): string;
    private analyzeEffectThreat(effect: Effect, target: Creature): string;
}
```

3. Move to `src/metrics/analysis/damage/DamageAnalyzer.ts` (new file):
```typescript
export interface DamageAnalysis {
    details: {
        totalDamage: number;
        damageTypes: string[];
        targetHealth: string;
    };
    positionContext: {
        distance: number;
        targetPosition: string;
        nearbyAllies: string;
        nearbyEnemies: string;
    };
    strategicImpact: {
        zoneControl: string;
        resourceState: string;
        queuePosition: string;
    };
    threatAssessment: string;
}

export class DamageAnalyzer {
    public analyzeDamage(source: Creature, target: Creature, damages: Record<string, number>): DamageAnalysis {
        // Move damage analysis logic here
    }
}
```

### Code to Keep

1. Event Handlers (but updated to use new analyzers):
```typescript
private handleDamage(event: { target?: Creature; damage?: { attacker?: Creature; damages?: Record<string, number> } }): void
private handleEffectAttach(event: { creature?: Creature; effect?: Effect }): void
```

### Required Changes

1. Update handleDamage:
```typescript
private handleDamage(event: { target?: Creature; damage?: { attacker?: Creature; damages?: Record<string, number> } }): void {
    if (!event.target || !event.damage?.damages || !event.damage.attacker) return;
    
    const analysis = this.damageAnalyzer.analyzeDamage(
        event.damage.attacker,
        event.target,
        event.damage.damages
    );
    
    console.log(`[ThreatAnalytics] Damage Analysis (Team ${event.damage.attacker.team} -> Team ${event.target.team}):
        ${analysis.formatForLog()}`);
    
    const snapshot = this.eventRecorder.recordDamageEvent(event.damage.attacker, event.target, analysis.details.totalDamage);
    this.updateProfiles(snapshot);
}
```

2. Update handleEffectAttach:
```typescript
private handleEffectAttach(event: { creature?: Creature; effect?: Effect }): void {
    if (!event.creature || !event.effect) return;
    
    const analysis = this.effectAnalyzer.analyzeEffect(event.creature, event.effect);
    console.log(`[ThreatAnalytics] Effect Analysis (on Team ${event.creature.team}):
        ${analysis.formatForLog()}`);
    
    const snapshot = this.eventRecorder.recordControlEffect(event.creature, event.effect);
    this.updateProfiles(snapshot);
}
```

### Documentation Updates

1. Add new sections for new analyzers:
```markdown
### Creature Analysis Module (CreatureAnalyzer.ts)
Functions for analyzing creature capabilities and potential:
- `analyzeCreature()` - Comprehensive creature analysis
- `calculateBaseDamage()` - Calculate potential damage output
- `assessControlPotential()` - Evaluate control capabilities
- `determineUnitRole()` - Determine primary unit role

### Effect Analysis Module (EffectAnalyzer.ts)
Functions for analyzing status effects and their impact:
- `analyzeEffect()` - Analyze effect impact on target
- `categorizeEffect()` - Categorize effect type
- `analyzeEffectThreat()` - Evaluate effect threat level

### Damage Analysis Module (DamageAnalyzer.ts)
Functions for analyzing damage events and their context:
- `analyzeDamage()` - Analyze damage event impact
- `calculateTotalDamage()` - Calculate total damage from all sources
- `analyzeDamageContext()` - Analyze tactical context of damage
``` 

## Code Analysis - Part 4 (Lines 551-750)

### Code to Remove

1. Threat Calculation Methods (move to ThreatAnalyzer):
```typescript
calculateOverallThreat()
getPotentialTargets()
buildControlContext()
```

2. Position Analysis Methods (move to PositionAnalyzer):
```typescript
analyzePositionThreat()
countAdjacentMeleeUnits()
countRangedUnitsInRange()
findNearestAllyDistance()
checkNearHazards()
countBlockedDirections()
isCornerTrapped()
isOnBoardEdge()
calculateDistanceFromCenter()
countControlledZones()
countContestedZones()
hasMeleeRangedThreat()
calculateCrossfire()
calculateSurroundLevel()
```

3. Unit State Analysis Methods (move to UnitStateAnalyzer):
```typescript
analyzeUnitState()
```

### Code to Move

1. Move to `src/metrics/analysis/state/UnitStateAnalyzer.ts` (new file):
```typescript
export interface UnitStateAnalysis {
    health: {
        current: number;
        max: number;
        percentage: number;
    };
    energy: {
        current: number;
        max: number;
        meditation: number;
    };
    abilities: {
        possible: Array<{
            id: number;
            name: string;
            energyCost: number;
        }>;
        used: Array<{
            id: number;
            name: string;
        }>;
    };
    fatigue: {
        isFatigued: boolean;
        endurance: number;
        maxEndurance: number;
        protectedFromFatigue: boolean;
    };
    offensive: {
        offense: number;
        defense: number;
        initiative: number;
        masteries: Record<string, number>;
    };
}

export class UnitStateAnalyzer {
    public analyzeUnitState(creature: Creature): UnitStateAnalysis {
        // Move unit state analysis logic here
    }
}
```

2. Update `PositionAnalyzer.ts` with new methods:
```typescript
export interface PositionThreatAnalysis {
    adjacentUnits: {
        melee: number;
        ranged: number;
    };
    allyProximity: {
        nearestDistance: number;
        nearHazards: boolean;
    };
    movementConstraints: {
        blockedDirections: number;
        cornerTrapped: boolean;
        sizeLimited: boolean;
    };
    boardPosition: {
        isOnEdge: boolean;
        distanceFromCenter: number;
        zoneControl: {
            friendly: number;
            enemy: number;
            contested: number;
        };
    };
    threatSynergy: {
        meleeRangedCombo: boolean;
        crossfire: number;
        surroundLevel: number;
    };
}

// Add new methods to PositionAnalyzer class
```

### Code to Keep

1. Public Access Methods:
```typescript
public getUnitProfile(unitId: number): UnitThreatProfile | undefined
public getThreatPatterns(): ThreatPattern[]
public getRecentThreats(unitId: number, count: number = 5): ThreatSnapshot[]
public getUnitVulnerabilities(unitId: number): string[]
```

2. Profile Management Methods:
```typescript
private updateAnalysis(source?: Creature, target?: Creature, ability?: Ability, analysis?: any): void
private updateProfiles(snapshot?: ThreatSnapshot): void
```

### Required Changes

1. Update ThreatAnalyticsManager constructor to include new analyzers:
```typescript
constructor(game: Game) {
    this.game = game;
    this.threatAnalyzer = new ThreatAnalyzer();
    this.abilityAnalyzer = new AbilityAnalyzer();
    this.profileManager = new ProfileManager(game);
    this.eventRecorder = new EventRecorder(game);
    this.patternAnalyzer = new PatternAnalyzer();
    this.positionAnalyzer = new PositionAnalyzer();
    this.unitStateAnalyzer = new UnitStateAnalyzer();
}
```

2. Update buildControlContext to use new analyzers:
```typescript
private buildControlContext(source: Creature, target: Creature): ControlContext {
    return {
        positionThreat: this.positionAnalyzer.analyzePositionThreat(target),
        unitState: this.unitStateAnalyzer.analyzeUnitState(target),
        tacticalState: this.tacticalAnalyzer.analyzeTacticalState(target)
    };
}
```

### Documentation Updates

1. Add new section for UnitStateAnalyzer:
```markdown
### Unit State Analysis Module (UnitStateAnalyzer.ts)
Functions for analyzing unit state and capabilities:
- `analyzeUnitState()` - Analyze current unit state ✅
- `analyzeFatigue()` - Analyze unit fatigue status ✅
- `analyzeAbilityState()` - Analyze ability availability and costs ✅
```

2. Update PositionAnalyzer section:
```markdown
### Position Analysis Module (PositionAnalyzer.ts)
Add new methods:
- `analyzePositionThreat()` - Analyze position-based threats
- `analyzeMeleeThreats()` - Analyze melee unit threats
- `analyzeRangedThreats()` - Analyze ranged unit threats
- `analyzeZoneControl()` - Analyze board control
``` 

## Code Analysis - Part 5 (Lines 751-950)

### Code to Remove

1. Tactical Analysis Methods (move to TacticalAnalyzer):
```typescript
analyzeTacticalState()
calculateTurnsUntilAction()
calculateIncomingDamage()
countTotalMovementSpaces()
countSafeMovementSpaces()
countOptimalMovementSpaces()
isHexThreatened()
```

2. Movement Analysis Methods (move to MovementAnalyzer):
```typescript
isPositionImprovement()
```

### Code to Move

1. Create new `src/metrics/analysis/tactical/TacticalAnalyzer.ts`:
```typescript
export interface TacticalAnalysis {
    timing: {
        turnsUntilAction: number;
        escapeRoutes: number;
        incomingDamage: number;
    };
    resources: {
        plasmaAvailable: boolean;
        teamPlasma: number;
        enemyPlasma: number;
        plasmaAdvantage: boolean;
    };
    movement: {
        totalSpaces: number;
        safeSpaces: number;
        optimalSpaces: number;
    };
    queue: {
        nextEnemyDistance: number;
        alliesBeforeEnemy: number;
        hasAdvantage: boolean;
    };
    abilities: {
        criticalUsed: string[];
        hasComboSetup: boolean;
        hasCounterplay: boolean;
    };
}

export class TacticalAnalyzer {
    constructor(private game: Game) {}

    public analyzeTacticalState(target: Creature): TacticalAnalysis {
        // Move tactical analysis logic here
    }

    private calculateTurnsUntilAction(target: Creature): number {
        // Move method implementation
    }

    private calculateIncomingDamage(target: Creature): number {
        // Move method implementation
    }

    private analyzeMovementOptions(target: Creature): TacticalAnalysis['movement'] {
        // Move movement analysis logic
    }

    private analyzeQueueState(target: Creature): TacticalAnalysis['queue'] {
        // Move queue analysis logic
    }

    private analyzeAbilityTiming(target: Creature): TacticalAnalysis['abilities'] {
        // Move ability timing analysis logic
    }
}
```

2. Create new `src/metrics/analysis/movement/MovementAnalyzer.ts`:
```typescript
export interface MovementAnalysis {
    availableSpaces: {
        total: number;
        safe: number;
        optimal: number;
    };
    threats: {
        threatenedHexes: number;
        threatSources: Array<{
            id: number;
            type: string;
            range: number;
        }>;
    };
    improvements: {
        betterPositions: number;
        reasonsForImprovement: string[];
    };
}

export class MovementAnalyzer {
    constructor(private game: Game) {}

    public analyzeMovementOptions(creature: Creature): MovementAnalysis {
        // Move movement analysis logic here
    }

    private isHexThreatened(hex: Hex, target: Creature): boolean {
        // Move method implementation
    }

    private isPositionImprovement(hex: Hex, target: Creature): boolean {
        // Move method implementation
    }
}
```

### Code to Keep

None of the code in this section needs to be kept in ThreatAnalyticsManager.ts - it should all be moved to appropriate analyzer classes.

### Required Changes

1. Update ThreatAnalyticsManager to use new analyzers:
```typescript
export class ThreatAnalyticsManager {
    private tacticalAnalyzer: TacticalAnalyzer;
    private movementAnalyzer: MovementAnalyzer;

    constructor(game: Game) {
        // ... existing initialization ...
        this.tacticalAnalyzer = new TacticalAnalyzer(game);
        this.movementAnalyzer = new MovementAnalyzer(game);
    }

    private handleMovement(creature: Creature, from: Position, to: Position): void {
        const movementAnalysis = this.movementAnalyzer.analyzeMovementOptions(creature);
        const tacticalAnalysis = this.tacticalAnalyzer.analyzeTacticalState(creature);
        
        console.log(`[ThreatAnalytics] Movement Analysis:
            Unit: ${this.getDisplayName(creature)} (ID: ${creature.id})
            From: (${from.x}, ${from.y}) to (${to.x}, ${to.y})
            ${this.formatMovementAnalysis(movementAnalysis, tacticalAnalysis)}`);
    }
}
```

### Documentation Updates

1. Add new sections for new analyzers:
```markdown
### Tactical Analysis Module (TacticalAnalyzer.ts)
Functions for analyzing tactical state and opportunities:
- `analyzeTacticalState()` - Analyze current tactical situation
- `calculateTurnsUntilAction()` - Calculate turns until unit can act
- `calculateIncomingDamage()` - Calculate potential incoming damage
- `analyzeMovementOptions()` - Analyze available movement options
- `analyzeQueueState()` - Analyze queue position and timing
- `analyzeAbilityTiming()` - Analyze ability usage timing

### Movement Analysis Module (MovementAnalyzer.ts)
Functions for analyzing movement options and consequences:
- `analyzeMovementOptions()` - Analyze available movement options
- `isHexThreatened()` - Check if hex is under threat
- `isPositionImprovement()` - Check if position is an improvement
``` 

## Code Analysis - Part 6 (Lines 951-1200)

### Code to Remove

1. Queue Analysis Methods (move to QueueAnalyzer):
```typescript
findNextEnemyTurnDistance()
countAlliesBeforeEnemy()
hasQueueAdvantage()
```

2. Resource Analysis Methods (move to ResourceAnalyzer):
```typescript
getEnemyPlasma()
analyzeResourceState()
```

3. Formation Analysis Methods (move to FormationAnalyzer):
```typescript
analyzeFormation()
analyzeTeamPosition()
analyzeTeamCoverage()
```

4. State Mapping Methods (move to StateMapper):
```typescript
mapUnitState()
```

### Code to Move

1. Create new `src/metrics/analysis/queue/QueueAnalyzer.ts`:
```typescript
export interface QueueAnalysis {
    nextEnemy: {
        distance: number;
        creature: Creature;
    };
    allies: {
        beforeEnemy: number;
        hasAdvantage: boolean;
    };
}

export class QueueAnalyzer {
    constructor(private game: Game) {}

    public analyzeQueuePosition(creature: Creature): QueueAnalysis {
        return {
            nextEnemy: this.findNextEnemy(creature),
            allies: {
                beforeEnemy: this.countAlliesBeforeEnemy(creature),
                hasAdvantage: this.hasQueueAdvantage(creature)
            }
        };
    }

    private findNextEnemy(creature: Creature): QueueAnalysis['nextEnemy'];
    private countAlliesBeforeEnemy(creature: Creature): number;
    private hasQueueAdvantage(creature: Creature): boolean;
}
```

2. Create new `src/metrics/analysis/resource/ResourceAnalyzer.ts`:
```typescript
export interface ResourceAnalysis {
    plasma: {
        team: number;
        enemy: number;
        hasAdvantage: boolean;
    };
    energy: {
        current: number;
        max: number;
        percentage: number;
    };
}

export class ResourceAnalyzer {
    constructor(private game: Game) {}

    public analyzeResources(creature: Creature): ResourceAnalysis {
        return {
            plasma: this.analyzePlasmaState(creature),
            energy: this.analyzeEnergyState(creature)
        };
    }

    private analyzePlasmaState(creature: Creature): ResourceAnalysis['plasma'];
    private analyzeEnergyState(creature: Creature): ResourceAnalysis['energy'];
}
```

3. Create new `src/metrics/analysis/formation/FormationAnalyzer.ts`:
```typescript
export interface FormationAnalysis {
    type: 'Isolated' | 'Dispersed' | 'Spread' | 'Clustered';
    allies: {
        nearby: number;
        total: number;
    };
    coverage: {
        hexes: number;
        controlledZones: number;
    };
    position: {
        quality: string;
        threats: string[];
    };
}

export class FormationAnalyzer {
    constructor(private game: Game) {}

    public analyzeFormation(creature: Creature): FormationAnalysis {
        return {
            type: this.determineFormationType(creature),
            allies: this.analyzeAllyPositions(creature),
            coverage: this.analyzeTeamCoverage(creature),
            position: this.analyzeTeamPosition(creature)
        };
    }

    private determineFormationType(creature: Creature): FormationAnalysis['type'];
    private analyzeAllyPositions(creature: Creature): FormationAnalysis['allies'];
    private analyzeTeamCoverage(creature: Creature): FormationAnalysis['coverage'];
    private analyzeTeamPosition(creature: Creature): FormationAnalysis['position'];
}
```

4. Create new `src/metrics/analysis/state/StateMapper.ts`:
```typescript
export class StateMapper {
    public static mapUnitState(creature: Creature): UnitState {
        // Move mapUnitState implementation here
    }

    public static mapRoundState(game: Game): RoundState {
        // Move round state mapping logic here
    }
}
```

### Code to Keep

1. Round End Handler (but updated to use new analyzers):
```typescript
private handleRoundEnd(): void {
    const roundState = StateMapper.mapRoundState(this.game);
    
    this.game.creatures
        .filter((c): c is Creature => c !== undefined && !c.dead)
        .forEach(creature => {
            const threatAssessment = this.threatAnalyzer.analyzeThreatLevel(creature, roundState);
            this.updateAnalysis(creature, undefined, undefined, {
                threatAssessment,
                roundState
            });
        });
}
```

### Required Changes

1. Update ThreatAnalyticsManager constructor:
```typescript
constructor(game: Game) {
    this.game = game;
    this.threatAnalyzer = new ThreatAnalyzer();
    this.abilityAnalyzer = new AbilityAnalyzer();
    this.profileManager = new ProfileManager(game);
    this.eventRecorder = new EventRecorder(game);
    this.patternAnalyzer = new PatternAnalyzer();
    this.positionAnalyzer = new PositionAnalyzer();
    this.queueAnalyzer = new QueueAnalyzer(game);
    this.resourceAnalyzer = new ResourceAnalyzer(game);
    this.formationAnalyzer = new FormationAnalyzer(game);
}
```

### Documentation Updates

1. Add new sections for new analyzers:
```markdown
### Queue Analysis Module (QueueAnalyzer.ts)
Functions for analyzing queue positions and timing:
- `analyzeQueuePosition()` - Analyze creature's queue position
- `findNextEnemy()` - Find next enemy in queue
- `countAlliesBeforeEnemy()` - Count allies before next enemy

### Resource Analysis Module (ResourceAnalyzer.ts)
Functions for analyzing resource states:
- `analyzeResources()` - Analyze creature's resource state
- `analyzePlasmaState()` - Analyze plasma availability
- `analyzeEnergyState()` - Analyze energy state

### Formation Analysis Module (FormationAnalyzer.ts)
Functions for analyzing team formations:
- `analyzeFormation()` - Analyze team formation
- `determineFormationType()` - Determine formation type
- `analyzeTeamCoverage()` - Analyze team zone coverage
- `analyzeTeamPosition()` - Analyze team positioning

### State Mapping Module (StateMapper.ts)
Functions for mapping game state to analytics structures:
- `mapUnitState()` - Map creature state to analytics format
- `mapRoundState()` - Map game state to round state format
``` 

## Code Analysis - Part 7 (Lines 1201-1475)

### Code to Remove

1. Distance Calculation Methods (move to DistanceAnalyzer):
```typescript
calculateDistance()
calculateUnitSpread()
```

2. Threat Assessment Methods (move to ThreatAnalyzer):
```typescript
calculateTargetThreat()
analyzeTargetVulnerability()
calculateEnemyThreat()
analyzeCounterPotential()
calculateCurrentThreat()
analyzeVulnerability()
analyzePredictedThreats()
```

3. Ability Analysis Methods (move to AbilityAnalyzer):
```typescript
analyzeAvailableAbilities()
hasOffensiveAbilities()
hasDefensiveAbilities()
analyzeCounterOptions()
```

### Code to Move

1. Create new `src/metrics/analysis/distance/DistanceAnalyzer.ts`:
```typescript
export interface DistanceAnalysis {
    unitDistance: number;
    unitSpread: number;
    nearbyUnits: {
        allies: number;
        enemies: number;
    };
}

export class DistanceAnalyzer {
    public calculateDistance(unit1: Creature, unit2: Creature): number {
        // Move distance calculation logic
    }

    public calculateUnitSpread(units: Creature[]): number {
        // Move unit spread calculation logic
    }

    public analyzeDistances(source: Creature): DistanceAnalysis {
        // Combine distance analysis methods
    }
}
```

2. Add to ThreatAnalyzer.ts:
```typescript
export interface DetailedThreatAnalysis {
    target: {
        threat: 'High' | 'Medium' | 'Low';
        vulnerabilities: string[];
    };
    enemy: {
        threat: 'Immediate' | 'Potential' | 'Low';
        range: number;
        distance: number;
    };
    counter: {
        potential: string[];
        options: string[];
    };
    predicted: {
        threats: Array<{
            name: string;
            distance: number;
            threat: string;
        }>;
    };
}

// Add to ThreatAnalyzer class:
public analyzeDetailedThreat(source: Creature, target: Creature): DetailedThreatAnalysis;
private calculateTargetThreat(source: Creature, target: Creature): DetailedThreatAnalysis['target'];
private analyzeTargetVulnerability(target: Creature): string[];
private calculateEnemyThreat(source: Creature, enemy: Creature): DetailedThreatAnalysis['enemy'];
private analyzeCounterPotential(enemy: Creature, ability: Ability): DetailedThreatAnalysis['counter'];
private analyzePredictedThreats(creature: Creature): DetailedThreatAnalysis['predicted'];
```

3. Add to AbilityAnalyzer.ts:
```typescript
export interface AbilityAvailability {
    available: string[];
    offensive: boolean;
    defensive: boolean;
    counterOptions: string[];
}

// Add to AbilityAnalyzer class:
public analyzeAbilityAvailability(creature: Creature): AbilityAvailability {
    return {
        available: this.getAvailableAbilities(creature),
        offensive: this.hasOffensiveAbilities(creature),
        defensive: this.hasDefensiveAbilities(creature),
        counterOptions: this.analyzeCounterOptions(creature)
    };
}

private getAvailableAbilities(creature: Creature): string[];
private hasOffensiveAbilities(creature: Creature): boolean;
private hasDefensiveAbilities(creature: Creature): boolean;
private analyzeCounterOptions(creature: Creature): string[];
```

### Code to Keep

None - all functionality should be moved to appropriate analyzer classes.

### Required Changes

1. Update ThreatAnalyticsManager to use new analyzers:
```typescript
export class ThreatAnalyticsManager {
    private distanceAnalyzer: DistanceAnalyzer;

    constructor(game: Game) {
        // ... existing initialization ...
        this.distanceAnalyzer = new DistanceAnalyzer();
    }

    private handleAbilityUsed(event: { creature?: Creature; ability?: Ability }): void {
        if (!event.creature || !event.ability) return;

        const source = event.creature;
        const ability = event.ability;
        const analysis = {
            ability: this.abilityAnalyzer.analyzeAbilityUsage(source, ability),
            threat: this.threatAnalyzer.analyzeDetailedThreat(source, ability.target),
            distance: this.distanceAnalyzer.analyzeDistances(source)
        };

        console.log(`[ThreatAnalytics] Ability Analysis:
            Unit: ${this.getDisplayName(source)} (ID: ${source.id})
            Ability: ${ability.title}
            ${this.formatAnalysis(analysis)}`);
    }
}
```

### Documentation Updates

1. Add new section for DistanceAnalyzer:
```markdown
### Distance Analysis Module (DistanceAnalyzer.ts)
Functions for analyzing distances and unit positioning:
- `calculateDistance()` - Calculate distance between units
- `calculateUnitSpread()` - Calculate spread of unit formation
- `analyzeDistances()` - Comprehensive distance analysis
```

2. Update ThreatAnalyzer section:
```markdown
### Threat Analysis Module (ThreatAnalyzer.ts)
Add new methods:
- `analyzeDetailedThreat()` - Detailed threat analysis
- `calculateTargetThreat()` - Calculate threat to target
- `analyzeTargetVulnerability()` - Analyze target vulnerabilities
- `calculateEnemyThreat()` - Calculate threat from enemy
```

3. Update AbilityAnalyzer section:
```markdown
### Ability Analysis Module (AbilityAnalyzer.ts)
Add new methods:
- `analyzeAbilityAvailability()` - Analyze available abilities
- `getAvailableAbilities()` - Get list of available abilities
- `hasOffensiveAbilities()` - Check for offensive abilities
- `hasDefensiveAbilities()` - Check for defensive abilities
``` 