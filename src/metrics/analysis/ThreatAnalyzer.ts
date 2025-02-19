import type { Creature } from '../../creature';
import type { Ability } from '../../ability';
import type { UnitState, TurnState } from '../StateCapture';
import type { Position } from '../types';

export interface ThreatAssessment {
    sourceId: number;
    targetId: number;
    threatLevel: number;
    threatType: ThreatType;
    range: number;
    position: Position;
    details: ThreatDetails;
}

export type ThreatType = 
    | 'damage'           // Direct damage abilities
    | 'control'          // Movement impairment, freezing, etc
    | 'debuff'           // Stat reduction
    | 'zone'             // Area denial
    | 'positioning'      // Forced movement
    | 'resource'         // Energy/health drain
    | 'combo';           // Multiple threat types combined

export interface ThreatDetails {
    damageEstimate?: number;
    controlDuration?: number;
    debuffMagnitude?: number;
    zoneRadius?: number;
    resourceDrain?: number;
    effects?: string[];
}

export class ThreatAnalyzer {
    constructor() {}

    /**
     * Analyzes threats for a specific target creature
     */
    public analyzeThreatLevel(
        target: Creature,
        currentState: TurnState
    ): ThreatAssessment[] {
        const threats: ThreatAssessment[] = [];
        
        // Analyze each unit's threat potential against the target
        currentState.unitsState.forEach(unit => {
            if (unit.id === target.id) return; // Skip self
            
            const assessment = this.assessUnitThreat(unit, target, currentState);
            if (assessment) {
                threats.push(assessment);
            }
        });

        return this.prioritizeThreats(threats);
    }

    /**
     * Assesses how threatening a specific unit is to a target
     */
    private assessUnitThreat(
        unit: UnitState,
        target: Creature,
        state: TurnState
    ): ThreatAssessment | null {
        // Skip if unit is on same team
        if (unit.type === target.type) return null;

        const threatDetails: ThreatDetails = {};
        let totalThreatLevel = 0;

        // Analyze available abilities
        unit.abilities.forEach(ability => {
            if (!ability.available) return;

            const abilityThreat = this.assessAbilityThreat(ability, unit, target);
            if (abilityThreat) {
                totalThreatLevel += abilityThreat.threatLevel;
                this.mergeThreatDetails(threatDetails, abilityThreat.details);
            }
        });

        // If no significant threat, return null
        if (totalThreatLevel === 0) return null;

        // Calculate range to target
        const range = this.calculateRange(unit.position, target.pos);

        return {
            sourceId: unit.id,
            targetId: target.id,
            threatLevel: totalThreatLevel,
            threatType: this.determineThreatType(threatDetails),
            range,
            position: unit.position,
            details: threatDetails
        };
    }

    /**
     * Assesses the threat level of a specific ability
     */
    private assessAbilityThreat(
        ability: { id: number; name: string; used: boolean; available: boolean },
        source: UnitState,
        target: Creature
    ): { threatLevel: number; details: ThreatDetails } | null {
        // This is where we'll need to analyze the ability data from the codebase
        // For now, returning a placeholder implementation
        return {
            threatLevel: 1,
            details: {
                damageEstimate: 0,
                effects: []
            }
        };
    }

    /**
     * Merges multiple threat details together
     */
    private mergeThreatDetails(base: ThreatDetails, addition: ThreatDetails): void {
        base.damageEstimate = (base.damageEstimate || 0) + (addition.damageEstimate || 0);
        base.controlDuration = Math.max(base.controlDuration || 0, addition.controlDuration || 0);
        base.debuffMagnitude = Math.max(base.debuffMagnitude || 0, addition.debuffMagnitude || 0);
        base.zoneRadius = Math.max(base.zoneRadius || 0, addition.zoneRadius || 0);
        base.resourceDrain = (base.resourceDrain || 0) + (addition.resourceDrain || 0);
        base.effects = [...(base.effects || []), ...(addition.effects || [])];
    }

    /**
     * Determines the primary threat type based on threat details
     */
    private determineThreatType(details: ThreatDetails): ThreatType {
        if (!details) return 'damage'; // Default to damage if no details

        // Count the number of significant threat types
        let significantThreats = 0;
        
        if (details.damageEstimate && details.damageEstimate > 10) significantThreats++;
        if (details.controlDuration && details.controlDuration > 0) significantThreats++;
        if (details.debuffMagnitude && details.debuffMagnitude > 0) significantThreats++;
        if (details.zoneRadius && details.zoneRadius > 0) significantThreats++;
        if (details.resourceDrain && details.resourceDrain > 0) significantThreats++;

        // If multiple significant threats, it's a combo threat
        if (significantThreats > 1) return 'combo';

        // Otherwise, return the most significant threat type
        if (details.damageEstimate && details.damageEstimate > 10) return 'damage';
        if (details.controlDuration && details.controlDuration > 0) return 'control';
        if (details.debuffMagnitude && details.debuffMagnitude > 0) return 'debuff';
        if (details.zoneRadius && details.zoneRadius > 0) return 'zone';
        if (details.resourceDrain && details.resourceDrain > 0) return 'resource';

        return 'damage'; // Default to damage
    }

    /**
     * Calculates range between two positions
     */
    private calculateRange(pos1: Position, pos2: Position): number {
        return Math.max(
            Math.abs(pos1.x - pos2.x),
            Math.abs(pos1.y - pos2.y)
        );
    }

    /**
     * Prioritizes and sorts threats by severity
     */
    private prioritizeThreats(threats: ThreatAssessment[]): ThreatAssessment[] {
        return threats.sort((a, b) => {
            // Higher threat level is higher priority
            if (a.threatLevel !== b.threatLevel) {
                return b.threatLevel - a.threatLevel;
            }
            
            // Closer range is higher priority
            return a.range - b.range;
        });
    }
} 