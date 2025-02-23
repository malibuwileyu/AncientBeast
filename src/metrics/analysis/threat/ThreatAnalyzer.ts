import { Creature } from '../../../creature';
import { Ability } from '../../../ability';
import Game from '../../../game';
import { AbilityAnalyzer } from '../ability/AbilityAnalyzer';
import { PositionAnalyzer } from '../PositionAnalyzer';
import { UnitStateAnalyzer } from '../state/UnitStateAnalyzer';

export interface ThreatAssessment {
    sourceId: number;
    targetId: number;
    threatLevel: number;
    threatType: ThreatType;
    range: number;
    position: { x: number; y: number };
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
    // Position analysis details
    escapeRoutes?: number;
    willBlock?: boolean;
    willTrap?: boolean;
    willForceMove?: boolean;
    hasSynergy?: boolean;
}

export class ThreatAnalyzer {
    private abilityAnalyzer: AbilityAnalyzer;
    private positionAnalyzer: PositionAnalyzer;
    private unitStateAnalyzer: UnitStateAnalyzer;

    constructor(private game: Game) {
        this.abilityAnalyzer = new AbilityAnalyzer(game);
        this.positionAnalyzer = new PositionAnalyzer(game);
        this.unitStateAnalyzer = new UnitStateAnalyzer(game);
    }

    public analyzeThreatForTarget(source: Creature, ability: Ability, target: Creature): ThreatAssessment {
        const abilityAnalysis = this.abilityAnalyzer.analyzeAbilityUsage(source, ability);
        const targetState = this.unitStateAnalyzer.analyzeUnitState(target);
        
        // Special handling for Dark Priest with Plasma
        if (target.name === "Dark Priest" && target.player?.plasma > 0) {
            const threatReduction = Math.min(0.8, target.player.plasma * 0.1); // Up to 80% reduction based on plasma
            abilityAnalysis.offensiveImpact.predictedEffectiveness.damageValue *= (1 - threatReduction);
        }
        
        // Build position threat analysis from available methods
        const positionThreat = {
            escapeRoutes: this.positionAnalyzer.countEscapeRoutes(target),
            willBlock: this.positionAnalyzer.willBlockEscapeRoutes(source, target, ability),
            willTrap: this.positionAnalyzer.willTrapTarget(source, target, ability),
            willForceMove: this.positionAnalyzer.willForceMovement(ability),
            hasSynergy: this.positionAnalyzer.checkTeamSynergies(source, target, ability)
        };

        const threatType = this.getPrimaryThreatType(abilityAnalysis);
        const threatLevel = this.calculateEffectiveThreat({
            ability: abilityAnalysis,
            target: targetState,
            position: positionThreat
        });

        return {
            sourceId: source.id,
            targetId: target.id,
            threatLevel,
            threatType,
            range: ability.range ? ability.range.regular : 1,
            position: { x: source.x, y: source.y },
            details: this.getThreatDetails(ability, abilityAnalysis, positionThreat)
        };
    }

    private calculateEffectiveThreat(params: {
        ability: any;
        target: any;
        position: {
            escapeRoutes: number;
            willBlock: boolean;
            willTrap: boolean;
            willForceMove: boolean;
            hasSynergy: boolean;
        };
    }): number {
        // Calculate threat level based on multiple factors
        let threatLevel = 0;

        // Damage threat (40% weight)
        if (params.ability.offensiveImpact.predictedEffectiveness.damageValue > 0) {
            threatLevel += 0.4 * Math.min(1, params.ability.offensiveImpact.predictedEffectiveness.damageValue);
        }

        // Control threat (30% weight)
        if (params.ability.offensiveImpact.predictedEffectiveness.controlDuration > 0) {
            threatLevel += 0.3 * Math.min(1, params.ability.offensiveImpact.predictedEffectiveness.controlDuration / 3);
        }

        // Position threat (20% weight)
        if (params.position.willTrap || 
            params.position.willBlock || 
            (params.position.escapeRoutes <= 1 && params.position.willForceMove)) {
            threatLevel += 0.2;
        }

        // Resource threat (10% weight)
        if (params.target.energy.percentage < 30 || params.target.health.percentage < 40) {
            threatLevel += 0.1;
        }

        return Math.min(threatLevel, 1.0);
    }

    private getPrimaryThreatType(abilityAnalysis: any): ThreatType {
        const { offensiveImpact } = abilityAnalysis;

        // Check damage first
        if (offensiveImpact.predictedEffectiveness.damageValue > 0) {
            if (offensiveImpact.predictedEffectiveness.controlDuration > 0) {
                return 'combo';
            }
            return 'damage';
        }

        // Then check control
        if (offensiveImpact.predictedEffectiveness.controlDuration > 0) {
            return 'control';
        }

        // Then check zone control
        if (offensiveImpact.predictedEffectiveness.zoneControl > 0) {
            return 'zone';
        }

        return 'debuff';
    }

    private getThreatDetails(ability: Ability, analysis: any, positionThreat?: any): ThreatDetails {
        const details: ThreatDetails = {};

        // Estimate damage
        if (ability.damages) {
            details.damageEstimate = Object.values(ability.damages)
                .reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
        }

        // Estimate control duration
        if (analysis.offensiveImpact.predictedEffectiveness.controlDuration > 0) {
            details.controlDuration = 1; // Default duration
            if (ability.effects?.some(e => e.special?.includes('frozen'))) {
                details.controlDuration = 2;
            }
        }

        // Track effects
        if (ability.effects) {
            details.effects = ability.effects
                .map(e => e.special)
                .filter(Boolean);
        }

        // Include position analysis if available
        if (positionThreat) {
            details.escapeRoutes = positionThreat.escapeRoutes;
            details.willBlock = positionThreat.willBlock;
            details.willTrap = positionThreat.willTrap;
            details.willForceMove = positionThreat.willForceMove;
            details.hasSynergy = positionThreat.hasSynergy;
        }

        return details;
    }

    public getPotentialTargets(source: Creature, ability: Ability): Creature[] {
        const range = ability.range ? ability.range.regular : 1;
        
        return this.game.creatures
            .filter((c): c is Creature => 
                c !== undefined && 
                !c.dead &&
                c !== source &&
                this.positionAnalyzer.isInRange(source, c, range)
            );
    }
} 