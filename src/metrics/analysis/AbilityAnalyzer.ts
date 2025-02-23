import { Creature } from '../../creature';
import { Ability } from '../../ability';
import { AbilityThreatResult, ThreatAnalysis, ControlContext, ControlSeverity } from './types';
import Game from '../../game';

export class AbilityAnalyzer {
    constructor(private game: Game) {}

    public analyzeAbility(ability: Ability): AbilityThreatResult {
        return {
            damage: this.calculateDamageThreat(ability),
            controlEffects: this.identifyControlEffects(ability),
            range: this.calculateRange(ability),
            hexesAffected: this.calculateHexCount(ability)
        };
    }

    private calculateDamageThreat(ability: Ability): number {
        if (!ability.damages) return 0;

        return Object.entries(ability.damages).reduce((sum, [type, amount]) => {
            if (typeof amount === 'number') {
                return sum + amount;
            }
            // Handle string damage values (e.g. "12 × creature size")
            const damageStr = String(amount);
            if (damageStr.includes('×')) {
                const baseDamage = parseInt(damageStr.split('×')[0].trim());
                return !isNaN(baseDamage) ? sum + baseDamage : sum;
            }
            return sum;
        }, 0);
    }

    private identifyControlEffects(ability: Ability): AbilityThreatResult['controlEffects'] {
        const effects = ability.effects || [];
        const special = effects.map(effect => effect.special?.toLowerCase() || '');

        // Check for effects that make target unmovable
        const hasImmobilize = special.some(s => 
            s.includes('immobilize') || 
            s.includes('root') || 
            s.includes('cannot move')
        );

        // Check for frozen and its enhanced version (cryostasis)
        const hasFrozen = special.some(s => s.includes('frozen'));
        const hasCryostasis = hasFrozen && special.some(s => s.includes('cryostasis'));

        return {
            frozen: hasFrozen,
            cryostasis: hasCryostasis,
            dizzy: special.some(s => s.includes('dizzy')),
            immobilize: hasImmobilize,
            trap: special.some(s => s.includes('trap')),
            delayed: special.some(s => s.includes('delay')),
            hindered: special.some(s => s.includes('hinder')),
            materializationSickness: special.some(s => s.includes('materializationsickness')),
            noActionPossible: special.some(s => s.includes('noaction'))
        };
    }

    private calculateRange(ability: Ability): number {
        if (ability.range) {
            return ability.isUpgraded() ? 
                (ability.range.upgraded || ability.range.regular) : 
                ability.range.regular;
        }
        return 1; // Default to melee range
    }

    private calculateHexCount(ability: Ability): number {
        // Get the ability's target pattern using _getTarget
        if (ability._getTarget) {
            const directions = [1, 1, 1, 1, 1, 1]; // All directions
            const pattern = ability._getTarget(directions);
            if (pattern && pattern.length > 0) {
                return pattern.length;
            }
        }
        return 1; // Single target if no pattern
    }

    public analyzeAbilityThreat(source: Creature, target: Creature, ability: Ability, context: ControlContext): ThreatAnalysis {
        const threatResult = this.analyzeAbility(ability);
        const controlSeverity = this.calculateControlSeverity(threatResult.controlEffects, context);

        // Calculate effective threat components
        const damageEstimate = threatResult.damage / target.stats.health;
        const controlImpact = controlSeverity / ControlSeverity.CRITICAL;
        const positionalThreat = threatResult.hexesAffected / 6; // Normalized by max hex count
        
        // Handle plasma cost threat
        let resourceThreat = 0;
        if (ability.costs?.plasma && typeof ability.costs.plasma === 'number') {
            const targetPlasma = context.tacticalState.resourceState.teamPlasma;
            resourceThreat = targetPlasma > 0 ? ability.costs.plasma / targetPlasma : 1;
        }

        // Calculate effective threat (capped at 1.0)
        const effectiveThreat = Math.min(
            damageEstimate * 0.4 +    // 40% weight on damage
            controlImpact * 0.3 +     // 30% weight on control
            positionalThreat * 0.2 +  // 20% weight on position
            resourceThreat * 0.1,     // 10% weight on resources
            1.0
        );

        return {
            effectiveThreat,
            damageEstimate,
            controlImpact,
            positionalThreat,
            resourceThreat,
            details: {
                willKill: damageEstimate >= 1.0,
                willDisable: controlSeverity >= ControlSeverity.SEVERE,
                willTrapTarget: threatResult.controlEffects.trap || false,
                willForceMovement: ability.effects?.some(e => 
                    e.special?.toLowerCase().includes('push') || 
                    e.special?.toLowerCase().includes('pull')
                ) || false,
                synergiesWithTeam: false // This should be calculated by PositionAnalyzer
            }
        };
    }

    private calculateControlSeverity(effects: AbilityThreatResult['controlEffects'], context: ControlContext): ControlSeverity {
        let severity = ControlSeverity.MINOR;

        // Check for complete control loss
        if (effects.frozen || effects.cryostasis || effects.noActionPossible) {
            severity = ControlSeverity.CRITICAL;
        }
        // Check for severe control
        else if (effects.immobilize || effects.trap) {
            severity = ControlSeverity.SEVERE;
        }
        // Check for moderate control
        else if (effects.dizzy || effects.delayed || effects.hindered) {
            severity = ControlSeverity.MODERATE;
        }

        // Adjust severity based on context
        if (context.positionThreat.adjacentMeleeUnits > 1) severity++;
        if (context.positionThreat.nearHazards) severity++;
        if (context.positionThreat.movementConstraints.cornerTrapped) severity++;
        if (context.tacticalState.escapeRoutesCount <= 1) severity++;
        if (context.unitState.healthPercentage < 0.3) severity++;

        return Math.min(severity, ControlSeverity.CRITICAL);
    }
}