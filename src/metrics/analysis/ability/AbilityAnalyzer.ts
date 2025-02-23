import { Creature } from '../../../creature';
import { Ability } from '../../../ability';
import { Effect } from '../../../effect';
import Game from '../../../game';

export interface AbilityAnalysis {
    offensiveImpact: {
        damageTypes: string[];
        controlEffects: string[];
        areaCoverage: number;
        predictedEffectiveness: {
            damageValue: number;
            controlDuration: number;
            zoneControl: number;
        };
    };
    targetAnalysis: {
        validTargets: number;
        optimalTargets: {
            id: number;
            name: string;
            reason: string;
        }[];
        vulnerableTargets: {
            id: number;
            name: string;
            vulnerability: string;
        }[];
    };
    strategicContext: {
        teamPosition: string;
        resourceState: string;
        threatContext: string;
        comboPotential: {
            followUps: {
                abilityName: string;
                synergy: string;
                timing: string;
            }[];
            teamCombos: {
                allyName: string;
                abilityName: string;
                synergy: string;
            }[];
        };
    };
    overallAssessment: {
        currentThreat: string;
        vulnerability: string;
        counterOptions: {
            immediate: {
                abilityName: string;
                effectiveness: number;
                reason: string;
            }[];
            preventive: {
                abilityName: string;
                setupRequired: string;
                effectiveness: number;
            }[];
        };
    };
}

export class AbilityAnalyzer {
    constructor(private game: Game) {}

    public analyzeAbilityUsage(source: Creature, ability: Ability): AbilityAnalysis {
        return {
            offensiveImpact: this.analyzeOffensiveImpact(ability),
            targetAnalysis: this.analyzeTargets(source, ability),
            strategicContext: this.analyzeStrategicContext(source, ability),
            overallAssessment: this.assessOverallThreat(source, ability)
        };
    }

    private analyzeOffensiveImpact(ability: Ability) {
        const damageTypes = this.identifyDamageTypes(ability);
        const controlEffects = this.identifyControlEffects(ability);
        const areaCoverage = this.calculateAreaCoverage(ability);

        // Calculate predicted effectiveness
        const predictedEffectiveness = {
            damageValue: this.predictDamageValue(ability),
            controlDuration: this.predictControlDuration(ability),
            zoneControl: this.predictZoneControl(ability)
        };

        return {
            damageTypes,
            controlEffects,
            areaCoverage,
            predictedEffectiveness
        };
    }

    private predictDamageValue(ability: Ability): number {
        if (!ability.damages) return 0;
        
        const totalDamage = Object.entries(ability.damages).reduce((total, [type, value]) => {
            if (typeof value !== 'number') return total;
            // Apply damage type effectiveness modifiers
            const modifier = this.getDamageTypeModifier(type);
            return total + (value * modifier);
        }, 0);

        // Normalize against typical health values (most units have 100-150 health)
        return totalDamage / 100; // This gives us a 0-1+ scale where 1.0 means "can kill a typical unit"
    }

    private predictControlDuration(ability: Ability): number {
        if (!ability.effects) return 0;

        return ability.effects.reduce((maxDuration, effect) => {
            const special = effect.special?.toLowerCase() || '';
            // Map different control types to their typical durations
            if (special.includes('frozen') || special.includes('cryostasis')) return Math.max(maxDuration, 3);
            if (special.includes('trap') || special.includes('immobilize')) return Math.max(maxDuration, 2);
            if (special.includes('dizzy') || special.includes('delay')) return Math.max(maxDuration, 1);
            return maxDuration;
        }, 0);
    }

    private predictZoneControl(ability: Ability): number {
        const range = ability.range ? (ability.range.upgraded || ability.range.regular) : 0;
        const area = ability.effects?.length || 0;
        const hasZoneControl = ability.effects?.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            return special.includes('trap') || 
                   special.includes('wall') ||
                   special.includes('field') ||
                   special.includes('zone');
        });
        return hasZoneControl ? (range * area) : 0;
    }

    private getDamageTypeModifier(type: string): number {
        // Base effectiveness of different damage types
        const modifiers: Record<string, number> = {
            pierce: 1.2,  // Good against low armor
            slash: 1.1,   // Consistent damage
            crush: 1.3,   // High burst potential
            shock: 1.15,  // Good against mechanical
            burn: 1.25,   // DoT potential
            frost: 1.1,   // Utility value
            poison: 1.2,  // Sustained damage
            sonic: 1.15,  // Hard to resist
            mental: 1.25  // Bypass defenses
        };
        return modifiers[type] || 1.0;
    }

    private analyzeTargets(source: Creature, ability: Ability): AbilityAnalysis['targetAnalysis'] {
        const validTargets = this.game.creatures.filter(c => 
            c !== source && 
            !c.dead && 
            this.isValidTarget(source, c, ability)
        );

        // Find optimal targets based on various factors
        const optimalTargets = validTargets.map(target => {
            const score = this.calculateTargetScore(target, ability);
            const reason = this.getTargetingReason(target, ability);
            return {
                id: target.id,
                name: target.name,
                score,
                reason
            };
        }).sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({id, name, reason}) => ({id, name, reason}));

        // Identify particularly vulnerable targets
        const vulnerableTargets = validTargets.map(target => {
            const vulnerability = this.identifyVulnerability(target, ability);
            if (!vulnerability) return null;
            return {
                id: target.id,
                name: target.name,
                vulnerability
            };
        }).filter((t): t is NonNullable<typeof t> => t !== null);

        return {
            validTargets: validTargets.length,
            optimalTargets,
            vulnerableTargets
        };
    }

    private calculateTargetScore(target: Creature, ability: Ability): number {
        let score = 0;
        
        // Health state
        score += (1 - (target.health / target.stats.health)) * 0.3;
        
        // Resource state
        if (target.energy < target.stats.energy * 0.3) score += 0.2;
        
        // Positioning
        const distanceFromCenter = Math.max(
            Math.abs(target.x - Math.floor(this.game.grid.hexes[0].length / 2)),
            Math.abs(target.y - Math.floor(this.game.grid.hexes.length / 2))
        );
        score += (distanceFromCenter / Math.max(this.game.grid.hexes[0].length, this.game.grid.hexes.length)) * 0.2;
        
        // Ability synergy
        if (this.hasAbilitySynergy(target, ability)) score += 0.3;
        
        return Math.min(score, 1);
    }

    private checkAbilityCombo(ability1: Ability, ability2: Ability): boolean {
        // Check for damage amplification
        const hasVulnerability = ability1.effects?.some(e => 
            e.special?.toLowerCase().includes('vulnerable') ||
            e.special?.toLowerCase().includes('weakness')
        );

        // Check for control effects that enable combos
        const hasSetup = ability1.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('trap') ||
                   special.includes('immobilize') ||
                   special.includes('pull') ||
                   special.includes('push');
        });

        // Check if second ability can capitalize on the setup
        const canFollowUp = Boolean(ability2.damages) || ability2.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('execute') ||
                   special.includes('bonus') ||
                   special.includes('chain');
        });

        return (hasVulnerability || hasSetup) && canFollowUp;
    }

    private getTargetingReason(target: Creature, ability: Ability): string {
        if (target.health < target.stats.health * 0.3) return "Low health target";
        if (typeof target.energy === 'number' && target.energy < target.stats.energy * 0.3) return "Low energy target";
        if (this.isPositionallyVulnerable(target)) return "Positionally vulnerable";
        if (this.hasAbilitySynergy(target, ability)) return "Good ability synergy";
        return "General target";
    }

    private identifyVulnerability(target: Creature, ability: Ability): string | null {
        if (target.health < target.stats.health * 0.3) return "Critical health";
        if (target.isFatigued()) return "Fatigued";
        if (typeof target.energy === 'number' && ability.costs?.energy && target.energy < ability.costs.energy) return "Cannot counter";
        if (this.isPositionallyVulnerable(target)) return "Poor positioning";
        return null;
    }

    private isPositionallyVulnerable(target: Creature): boolean {
        const nearbyAllies = this.game.creatures.filter(c => 
            c !== target && 
            c.team === target.team && 
            !c.dead &&
            Math.max(Math.abs(c.x - target.x), Math.abs(c.y - target.y)) <= 2
        ).length;
        return nearbyAllies === 0;
    }

    private hasAbilitySynergy(target: Creature, ability: Ability): boolean {
        // Check if target has effects that synergize with the ability
        return target.effects.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            if (ability.damages) {
                return special.includes('vulnerable') || 
                       special.includes('weakness');
            }
            if (ability.effects?.some(e => e.special?.toLowerCase().includes('control'))) {
                return special.includes('slowed') || 
                       special.includes('dizzy');
            }
            return false;
        });
    }

    private analyzeStrategicContext(source: Creature, ability: Ability): AbilityAnalysis['strategicContext'] {
        const teamPosition = this.analyzeTeamPosition(source);
        const resourceState = this.analyzeResourceState(source, ability);
        const threatContext = this.analyzeThreatContext(source);
        const comboPotential = this.analyzeComboPotential(source, ability);

        return {
            teamPosition,
            resourceState,
            threatContext,
            comboPotential
        };
    }

    private analyzeTeamPosition(source: Creature): string {
        const allyCount = this.game.creatures.filter(c => 
            c !== source && 
            c.team === source.team && 
            !c.dead
        ).length;
        
        const enemyCount = this.game.creatures.filter(c => 
            c.team !== source.team && 
            !c.dead
        ).length;

        if (allyCount > enemyCount) return "Numerical advantage";
        if (allyCount < enemyCount) return "Numerical disadvantage";
        return "Even numbers";
    }

    private analyzeResourceState(source: Creature, ability: Ability): string {
        const energyRatio = source.energy / source.stats.energy;
        const plasmaAvailable = source.player?.plasma || 0;
        const abilityCost = ability.costs?.energy || 0;

        if (energyRatio < 0.3) return "Critical energy";
        if (energyRatio < 0.5) return "Low energy";
        if (abilityCost > source.energy) return "Insufficient energy";
        if (ability.costs?.plasma && typeof ability.costs.plasma === 'number' && ability.costs.plasma > plasmaAvailable) return "Insufficient plasma";
        return "Resources available";
    }

    private analyzeThreatContext(source: Creature): string {
        const nearbyThreats = this.game.creatures.filter(c => 
            c.team !== source.team && 
            !c.dead &&
            Math.max(Math.abs(c.x - source.x), Math.abs(c.y - source.y)) <= 2
        ).length;

        if (nearbyThreats === 0) return "No immediate threats";
        if (nearbyThreats === 1) return "Single threat nearby";
        return `Multiple threats (${nearbyThreats})`;
    }

    private analyzeComboPotential(source: Creature, ability: Ability): AbilityAnalysis['strategicContext']['comboPotential'] {
        const followUps = source.abilities
            .filter(a => !a.used && this.checkAbilityCombo(ability, a))
            .map(a => ({
                abilityName: a.title,
                synergy: this.describeSynergy(ability, a),
                timing: this.suggestTiming(a)
            }));

        const teamCombos = this.game.creatures
            .filter((c): c is Creature => 
                c !== undefined && 
                !c.dead && 
                c.team === source.team && 
                c !== source
            )
            .flatMap(ally => 
                ally.abilities
                    .filter(a => this.checkAbilityCombo(ability, a))
                    .map(a => ({
                        allyName: ally.name,
                        abilityName: a.title,
                        synergy: this.describeSynergy(ability, a)
                    }))
            );

        return {
            followUps,
            teamCombos
        };
    }

    private describeSynergy(ability1: Ability, ability2: Ability): string {
        if (this.isDamageAmplification(ability1, ability2)) {
            return "Damage amplification";
        }
        if (this.isControlSetup(ability1, ability2)) {
            return "Control chain";
        }
        if (this.isResourceDrain(ability1, ability2)) {
            return "Resource pressure";
        }
        if (this.isPositionalSetup(ability1, ability2)) {
            return "Positional advantage";
        }
        return "General combo";
    }

    private suggestTiming(ability: Ability): string {
        if (ability.costs?.energy && ability.costs.energy > 5) {
            return "When energy available";
        }
        if (ability.effects?.some(e => e.special?.toLowerCase().includes('counter'))) {
            return "Save for counter";
        }
        return "Use when ready";
    }

    private isDamageAmplification(ability1: Ability, ability2: Ability): boolean {
        const hasVulnerability = ability1.effects?.some(e => 
            e.special?.toLowerCase().includes('vulnerable') ||
            e.special?.toLowerCase().includes('weakness')
        );
        return hasVulnerability && Boolean(ability2.damages);
    }

    private isControlSetup(ability1: Ability, ability2: Ability): boolean {
        const hasSetup = ability1.effects?.some(e => 
            e.special?.toLowerCase().includes('trap') ||
            e.special?.toLowerCase().includes('immobilize')
        );
        const hasFollowup = ability2.effects?.some(e => 
            e.special?.toLowerCase().includes('execute') ||
            e.special?.toLowerCase().includes('bonus')
        );
        return hasSetup && hasFollowup;
    }

    private isResourceDrain(ability1: Ability, ability2: Ability): boolean {
        const cost1 = typeof ability1.costs?.energy === 'number' ? ability1.costs.energy : 0;
        const cost2 = typeof ability2.costs?.energy === 'number' ? ability2.costs.energy : 0;
        return cost1 + cost2 > 10;
    }

    private isPositionalSetup(ability1: Ability, ability2: Ability): boolean {
        const hasPositioning = ability1.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('push') ||
                   special.includes('pull') ||
                   special.includes('swap');
        });
        return hasPositioning && Boolean(ability2.damages);
    }

    private assessOverallThreat(source: Creature, ability: Ability): AbilityAnalysis['overallAssessment'] {
        return {
            currentThreat: this.calculateCurrentThreat(ability),
            vulnerability: this.analyzeVulnerability(source),
            counterOptions: this.analyzeCounterOptions(source, ability)
        };
    }

    private calculateCurrentThreat(ability: Ability): string {
        const hasDamage = ability.damages && Object.keys(ability.damages).length > 0;
        const hasControl = ability.effects?.some(e => e.special);
        const hasSetup = ability.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('trap') ||
                   special.includes('buff') ||
                   special.includes('field');
        });
        
        if (hasDamage && hasControl) return "High threat - combines damage and control";
        if (hasDamage && hasSetup) return "High threat - setup into damage";
        if (hasDamage) return "Moderate threat - damage focused";
        if (hasControl) return "Moderate threat - control focused";
        if (hasSetup) return "Low threat - setup ability";
        return "Low threat - utility ability";
    }

    private analyzeVulnerability(source: Creature): string {
        if (source.health < source.stats.health * 0.3) return "Critical health - vulnerable";
        if (source.energy < source.stats.energy * 0.3) return "Low energy - limited options";
        if (source.isFatigued()) return "Fatigued - reduced effectiveness";
        return "Normal state";
    }

    private analyzeCounterOptions(source: Creature, ability: Ability): AbilityAnalysis['overallAssessment']['counterOptions'] {
        const immediate = source.abilities
            .filter(a => !a.used && this.isImmediateCounter(a, ability))
            .map(a => ({
                abilityName: a.title,
                effectiveness: this.calculateCounterEffectiveness(a, ability),
                reason: this.getCounterReason(a, ability)
            }))
            .sort((a, b) => b.effectiveness - a.effectiveness);

        const preventive = source.abilities
            .filter(a => !a.used && this.isPreventiveCounter(a, ability))
            .map(a => ({
                abilityName: a.title,
                setupRequired: this.getSetupRequired(a),
                effectiveness: this.calculatePreventiveEffectiveness(a, ability)
            }))
            .sort((a, b) => b.effectiveness - a.effectiveness);

        return { immediate, preventive };
    }

    private isImmediateCounter(counter: Ability, ability: Ability): boolean {
        // Check if counter can be used immediately to mitigate the ability
        return counter.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('shield') ||
                   special.includes('dodge') ||
                   special.includes('counter') ||
                   special.includes('interrupt');
        }) || false;
    }

    private isPreventiveCounter(counter: Ability, ability: Ability): boolean {
        // Check if counter can be used to prevent or prepare for the ability
        return counter.effects?.some(e => {
            const special = e.special?.toLowerCase() || '';
            return special.includes('protect') ||
                   special.includes('immunity') ||
                   special.includes('preparation');
        }) || false;
    }

    private calculateCounterEffectiveness(counter: Ability, ability: Ability): number {
        let effectiveness = 0;

        // Base effectiveness for defensive abilities
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('shield'))) {
            effectiveness += 0.7;
        }

        // Bonus for specific counter types
        if (ability.damages && counter.effects?.some(e => e.special?.toLowerCase().includes('dodge'))) {
            effectiveness += 0.3;
        }

        // Penalty for high energy cost
        if (counter.costs?.energy) {
            effectiveness -= (counter.costs.energy / 10) * 0.1;
        }

        return Math.max(0, Math.min(1, effectiveness));
    }

    private calculatePreventiveEffectiveness(counter: Ability, ability: Ability): number {
        let effectiveness = 0;

        // Base effectiveness for protective abilities
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('protect'))) {
            effectiveness += 0.6;
        }

        // Bonus for specific prevention types
        if (ability.effects && counter.effects?.some(e => e.special?.toLowerCase().includes('immunity'))) {
            effectiveness += 0.4;
        }

        // Penalty for setup time
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('preparation'))) {
            effectiveness -= 0.2;
        }

        return Math.max(0, Math.min(1, effectiveness));
    }

    private getCounterReason(counter: Ability, ability: Ability): string {
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('shield'))) {
            return "Damage mitigation";
        }
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('dodge'))) {
            return "Avoid damage";
        }
        if (counter.effects?.some(e => e.special?.toLowerCase().includes('counter'))) {
            return "Counter attack";
        }
        return "General defense";
    }

    private getSetupRequired(ability: Ability): string {
        if (ability.effects?.some(e => e.special?.toLowerCase().includes('preparation'))) {
            return "Requires preparation turn";
        }
        if (ability.costs?.energy && ability.costs.energy > 5) {
            return "Requires energy buildup";
        }
        if (ability.costs?.plasma) {
            return "Requires plasma";
        }
        return "No setup needed";
    }

    private identifyDamageTypes(ability: Ability): string[] {
        const damageTypes = new Set<string>();
        
        if (ability.damages) {
            Object.keys(ability.damages).forEach(type => {
                if (ability.damages[type]) {
                    damageTypes.add(type);
                }
            });
        }

        return Array.from(damageTypes);
    }

    private identifyControlEffects(ability: Ability): string[] {
        const controlTypes = new Set<string>();
        
        if (ability.effects) {
            ability.effects.forEach(effect => {
                if (effect.special) {
                    controlTypes.add(effect.special);
                }
            });
        }

        return Array.from(controlTypes);
    }

    private calculateAreaCoverage(ability: Ability): number {
        // Calculate the area of effect coverage
        const range = ability.range ? 
            (ability.range.upgraded || ability.range.regular) : 0;
        const area = ability.effects?.length || 0;
        return range * area;
    }

    private isValidTarget(source: Creature, target: Creature, ability: Ability): boolean {
        // Basic target validation
        if (ability._targets && ability._targets.length > 0) {
            return ability._targets.some(hex => hex.creature === target);
        }

        // Fallback to team-based targeting
        if (ability._targetTeam === source.team) {
            return target.team === source.team;
        } else if (ability._targetTeam !== undefined) {
            return target.team !== source.team;
        }

        return true; // Default to any target being valid
    }
} 