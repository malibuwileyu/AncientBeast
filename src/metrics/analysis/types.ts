import { Creature } from '../../creature';
import { Ability } from '../../ability';

export interface ThreatSnapshot {
    timestamp: number;
    turnNumber: number;
    roundNumber: number;
    targetId: number;
    sourceId: number;
    threatResult: AbilityThreatResult;
}

export interface UnitThreatProfile {
    unitId: number;
    unitType: string;
    threatHistory: ThreatSnapshot[];
    vulnerabilities: {
        controlVulnerable: boolean;
        damageThreatened: boolean;
        positionallyWeak: boolean;
        resourceStarved: boolean;
    };
    strengths: {
        controlResistant: boolean;
        survivalRate: number;
        positionalControl: boolean;
        resourceEfficient: boolean;
    };
    abilities: Map<string, AbilityThreatResult>;
    totalDamageDealt: number;
    damageTargets: Map<number, number>;
    controlEffectsApplied: Map<string, number>;
}

export interface ThreatPattern {
    pattern: string;                   // Description of the threat pattern
    frequency: number;                 // How often it occurs
    effectiveness: number;             // How effective it is
    counterMeasures: string[];        // Possible ways to counter
}

export interface AbilityThreatResult {
    damage: number;
    controlEffects: {
        frozen?: boolean;
        cryostasis?: boolean;
        dizzy?: boolean;
        immobilize?: boolean;
        trap?: boolean;
        delayed?: boolean;
        hindered?: boolean;
        materializationSickness?: boolean;
        noActionPossible?: boolean;
    };
    range: number;
    hexesAffected: number;
    hexesCount?: number;
    summonedUnit?: {
        id: number;
        type: string;
        position: { x: number; y: number };
    };
}

export interface ThreatAnalysis {
    effectiveThreat: number;
    damageEstimate: number;
    controlImpact: number;
    positionalThreat: number;
    resourceThreat: number;
    details: {
        willKill: boolean;
        willDisable: boolean;
        willTrapTarget: boolean;
        willForceMovement: boolean;
        synergiesWithTeam: boolean;
    };
}

export enum ControlSeverity {
    MINOR = 1,      // Minor inconvenience (e.g., slight delay)
    MODERATE = 2,   // Moderate impact (e.g., hindered movement)
    SEVERE = 3,     // Severe impact (e.g., immobilize, trap)
    CRITICAL = 4    // Complete control loss (e.g., frozen + nearby threats)
}

export interface ControlContext {
    positionThreat: {
        adjacentMeleeUnits: number;    // Number of melee units that can attack
        rangedUnitsInRange: number;    // Number of ranged units that can attack
        nearestAllyDistance: number;   // Distance to closest friendly unit
        nearHazards: boolean;          // Proximity to traps or drops
        movementConstraints: {         // Factors limiting movement
            blockedDirections: number; // Number of blocked cardinal directions
            cornerTrapped: boolean;    // Whether unit is trapped in a corner
            sizeLimited: boolean;      // Whether unit size limits available positions
        };
        boardPosition: {
            isOnEdge: boolean;         // Limited movement options on board edge
            distanceFromCenter: number; // Strategic value/vulnerability
            zoneControl: {
                friendlyZones: number;  // Number of hexes controlled by allies
                enemyZones: number;     // Number of hexes controlled by enemies
                contestedZones: number; // Number of contested hexes
            };
        };
        threatSynergy: {
            meleeRangedCombo: boolean; // Threatened by both melee and ranged
            crossfire: number;         // Number of directions being threatened from
            surroundLevel: number;     // Degree of encirclement (0-6 directions)
        };
    };
    
    unitState: {
        currentHealth: number;         // Absolute health value
        maxHealth: number;            // Maximum health pool
        healthPercentage: number;     // Current health percentage
        currentEnergy: number;        // Current energy value
        maxEnergy: number;           // Maximum energy pool
        meditation: number;          // Energy regen per turn
        possibleAbilities: {         // Abilities that could be used
            id: number;
            name: string;
            energyCost: number;
        }[];
        usedAbilities: {            // Abilities already used
            id: number;
            name: string;
        }[];
        fatigueState: {
            isFatigued: boolean;      // Current fatigue status
            endurance: number;        // Current endurance
            maxEndurance: number;     // Max endurance
            protectedFromFatigue: boolean;
        };
        offensiveCapability: {
            offense: number;          // Offense stat
            defense: number;          // Defense stat
            initiative: number;       // Initiative stat
            masteries: {             // Damage type masteries
                pierce: number;
                slash: number;
                crush: number;
                shock: number;
                burn: number;
                frost: number;
                poison: number;
                sonic: number;
                mental: number;
            };
        };
    };
    
    tacticalState: {
        turnsUntilAction: number;     // Turns before next action
        escapeRoutesCount: number;    // Number of safe movement options
        incomingDamage: number;       // Projected damage from threats
        plasmaAvailable: boolean;     // Whether plasma can be used
        movementOptions: {            // Detailed movement analysis
            totalSpaces: number;      // Total spaces unit could move to
            safeSpaces: number;       // Spaces outside of enemy threat range
            optimalSpaces: number;    // Spaces that improve position
        };
        queueState: {
            nextActiveEnemy: number;    // Turns until next enemy acts
            alliesBeforeEnemy: number;  // Allies that act before next enemy
            queueAdvantage: boolean;    // Whether queue position is favorable
        };
        resourceState: {
            teamPlasma: number;         // Team's total plasma
            enemyPlasma: number;        // Enemy team's plasma
            plasmaAdvantage: boolean;   // Whether team has plasma advantage
        };
        abilityTiming: {
            criticalAbilitiesUsed: string[];  // Key abilities on cooldown
            comboSetupPotential: boolean;     // Can set up ability combos
            counterplayAvailable: boolean;     // Has defensive options
        };
    };
}

export interface PositionAnalysis {
    value: number;              // 0-1 overall position quality
    factors: {
        safety: number;         // Distance from threats
        control: number;        // Control over important areas
        tactical: number;       // Tactical advantage
        mobility: number;       // Movement options
    };
    recommendations: {
        move?: { x: number; y: number };
        retreat?: boolean;
        hold?: boolean;
    };
}

export interface PatternAnalysis {
    patterns: ThreatPattern[];
    confidence: number;         // 0-1 confidence in patterns
    frequency: number;         // How often patterns occur
    recommendations: string[];
} 