import { Creature } from '../../../creature';
import { Ability } from '../../../ability';
import Game from '../../../game';

export interface ResourceAnalysis {
    efficiency: {
        energy: {
            usage: number;        // 0-1 scale of energy usage efficiency
            regeneration: number; // Meditation effectiveness
            waste: number;        // Amount of unused energy
        };
        plasma: {
            usage: number;        // 0-1 scale of plasma usage efficiency
            teamShare: number;    // Proportion of team's total plasma
            advantage: number;    // Plasma advantage over enemy team (-1 to 1)
        };
        endurance: {
            usage: number;        // 0-1 scale of endurance management
            recovery: number;     // Recovery rate from fatigue
            risk: number;        // Risk of fatigue (0-1)
        };
    };
    timing: {
        energyTiming: number;    // 0-1 scale of energy usage timing
        plasmaTiming: number;    // 0-1 scale of plasma usage timing
        enduranceTiming: number; // 0-1 scale of endurance management timing
    };
    forecast: {
        energyForecast: number;  // Predicted energy in 3 turns
        plasmaForecast: number;  // Predicted plasma in 3 turns
        fatigueForecast: boolean; // Will unit be fatigued in next 3 turns
    };
    suggestions: {
        immediate: string[];     // Immediate resource management suggestions
        strategic: string[];     // Long-term resource strategy suggestions
    };
}

export class ResourceAnalyzer {
    private resourceHistory: Map<number, Array<{
        timestamp: number;
        energy: number;
        plasma: number;
        endurance: number;
    }>> = new Map();

    constructor(private game: Game) {}

    public analyzeResourceUsage(creature: Creature, ability?: Ability): ResourceAnalysis {
        // Get current resource states
        const currentEnergy = creature.energy;
        const maxEnergy = creature.stats.energy;
        const meditation = creature.stats.meditation;
        const currentEndurance = creature.endurance;
        const maxEndurance = creature.stats.endurance;
        const teamPlasma = creature.player?.plasma || 0;
        
        // Get enemy team's plasma
        const enemyPlasma = this.game.players
            .filter(p => p.id !== creature.player?.id)
            .reduce((total, p) => total + p.plasma, 0);

        // Calculate efficiency metrics
        const efficiency = this.calculateEfficiency(creature, {
            currentEnergy,
            maxEnergy,
            meditation,
            currentEndurance,
            maxEndurance,
            teamPlasma,
            enemyPlasma,
            ability
        });

        // Calculate timing metrics
        const timing = this.calculateTiming(creature, ability);

        // Calculate resource forecasts
        const forecast = this.calculateForecast(creature);

        // Generate suggestions
        const suggestions = this.generateSuggestions(creature, {
            efficiency,
            timing,
            forecast
        });

        return {
            efficiency,
            timing,
            forecast,
            suggestions
        };
    }

    private calculateEfficiency(
        creature: Creature,
        params: {
            currentEnergy: number;
            maxEnergy: number;
            meditation: number;
            currentEndurance: number;
            maxEndurance: number;
            teamPlasma: number;
            enemyPlasma: number;
            ability?: Ability;
        }
    ): ResourceAnalysis['efficiency'] {
        // Energy efficiency
        const energyUsage = this.calculateEnergyEfficiency(creature, params);
        const energyRegeneration = params.meditation / 10; // Normalize meditation to 0-1
        const energyWaste = Math.max(0, (params.currentEnergy / params.maxEnergy) - 0.8);

        // Plasma efficiency
        const plasmaUsage = this.calculatePlasmaEfficiency(creature, params);
        const plasmaShare = params.teamPlasma > 0 ? 
            (creature.player?.plasma || 0) / params.teamPlasma : 0;
        const plasmaAdvantage = this.calculatePlasmaAdvantage(params.teamPlasma, params.enemyPlasma);

        // Endurance efficiency
        const enduranceUsage = params.currentEndurance / params.maxEndurance;
        const enduranceRecovery = creature.protectedFromFatigue ? 1 : 
            params.currentEndurance / params.maxEndurance;
        const fatigueRisk = this.calculateFatigueRisk(creature);

        return {
            energy: {
                usage: energyUsage,
                regeneration: energyRegeneration,
                waste: energyWaste
            },
            plasma: {
                usage: plasmaUsage,
                teamShare: plasmaShare,
                advantage: plasmaAdvantage
            },
            endurance: {
                usage: enduranceUsage,
                recovery: enduranceRecovery,
                risk: fatigueRisk
            }
        };
    }

    private calculateEnergyEfficiency(
        creature: Creature,
        params: { currentEnergy: number; maxEnergy: number; ability?: Ability }
    ): number {
        // Base efficiency is current/max ratio
        let efficiency = params.currentEnergy / params.maxEnergy;

        // Penalize if energy is too low for important abilities
        const criticalAbilities = creature.abilities.filter(a => 
            !a.used && a.costs?.energy && a.costs.energy > params.currentEnergy
        );
        if (criticalAbilities.length > 0) {
            efficiency *= 0.8; // 20% penalty for each unusable critical ability
        }

        // Bonus for maintaining optimal energy range (30-70%)
        if (efficiency >= 0.3 && efficiency <= 0.7) {
            efficiency *= 1.2; // 20% bonus for optimal range
        }

        return Math.min(1, efficiency);
    }

    private calculatePlasmaEfficiency(
        creature: Creature,
        params: { teamPlasma: number; ability?: Ability }
    ): number {
        if (!creature.player) return 0;

        // Base efficiency is having plasma available for key abilities
        const hasPlasmaAbilities = creature.abilities.some(a => a.costs?.plasma);
        if (!hasPlasmaAbilities) return 1; // No plasma abilities = perfect efficiency

        // Calculate based on available plasma vs needed plasma
        const neededPlasma = creature.abilities
            .filter(a => !a.used && a.costs?.plasma)
            .reduce((total, a) => total + (typeof a.costs?.plasma === 'number' ? a.costs.plasma : 0), 0);

        return Math.min(1, params.teamPlasma / (neededPlasma || 1));
    }

    private calculatePlasmaAdvantage(teamPlasma: number, enemyPlasma: number): number {
        if (teamPlasma === 0 && enemyPlasma === 0) return 0;
        const totalPlasma = teamPlasma + enemyPlasma;
        return totalPlasma > 0 ? 
            (teamPlasma - enemyPlasma) / totalPlasma : 0;
    }

    private calculateFatigueRisk(creature: Creature): number {
        if (creature.protectedFromFatigue) return 0;
        
        // Base risk on current endurance
        let risk = 1 - (creature.endurance / creature.stats.endurance);
        
        // Increase risk if low on energy
        if (creature.energy < creature.stats.energy * 0.3) {
            risk += 0.2;
        }

        // Increase risk if multiple abilities used
        const usedAbilities = creature.abilities.filter(a => a.used).length;
        risk += usedAbilities * 0.1;

        return Math.min(1, Math.max(0, risk));
    }

    private calculateTiming(creature: Creature, ability?: Ability): ResourceAnalysis['timing'] {
        // Get historical resource usage
        const history = this.resourceHistory.get(creature.id) || [];
        
        // Energy timing
        const energyTiming = this.calculateEnergyTiming(creature, history);
        
        // Plasma timing
        const plasmaTiming = this.calculatePlasmaTiming(creature, history);
        
        // Endurance timing
        const enduranceTiming = this.calculateEnduranceTiming(creature, history);

        // Update history
        this.updateResourceHistory(creature);

        return {
            energyTiming,
            plasmaTiming,
            enduranceTiming
        };
    }

    private calculateEnergyTiming(
        creature: Creature,
        history: Array<{ energy: number }>
    ): number {
        // Perfect timing keeps energy between 30-70%
        const currentRatio = creature.energy / creature.stats.energy;
        
        // Penalize if energy is too high or too low
        if (currentRatio < 0.2 || currentRatio > 0.8) return 0.5;
        
        // Bonus for maintaining optimal range
        if (currentRatio >= 0.3 && currentRatio <= 0.7) return 1;
        
        return 0.75;
    }

    private calculatePlasmaTiming(
        creature: Creature,
        history: Array<{ plasma: number }>
    ): number {
        if (!creature.player) return 0;

        // Check if plasma is needed soon
        const needsPlasmaSoon = creature.abilities.some(a => 
            !a.used && 
            a.costs?.plasma && 
            typeof a.costs.plasma === 'number' &&
            a.costs.plasma <= creature.player!.plasma
        );

        // Perfect timing has plasma available when needed
        return needsPlasmaSoon ? 1 : 0.5;
    }

    private calculateEnduranceTiming(
        creature: Creature,
        history: Array<{ endurance: number }>
    ): number {
        // Perfect timing avoids fatigue
        if (creature.protectedFromFatigue) return 1;
        
        const enduranceRatio = creature.endurance / creature.stats.endurance;
        
        // Penalize if close to fatigue
        if (enduranceRatio < 0.3) return 0.2;
        
        // Bonus for maintaining high endurance
        if (enduranceRatio > 0.7) return 1;
        
        return 0.6;
    }

    private calculateForecast(creature: Creature): ResourceAnalysis['forecast'] {
        // Predict energy in 3 turns
        const energyForecast = Math.min(
            creature.stats.energy,
            creature.energy + (creature.stats.meditation * 3)
        );

        // Predict plasma in 3 turns (assume 1 plasma per turn)
        const plasmaForecast = (creature.player?.plasma || 0) + 3;

        // Predict fatigue state
        const fatigueForecast = this.predictFatigue(creature);

        return {
            energyForecast,
            plasmaForecast,
            fatigueForecast
        };
    }

    private predictFatigue(creature: Creature): boolean {
        if (creature.protectedFromFatigue) return false;
        
        // Predict based on current endurance and usage patterns
        const enduranceRatio = creature.endurance / creature.stats.endurance;
        const usedAbilities = creature.abilities.filter(a => a.used).length;
        
        return enduranceRatio < 0.3 || (enduranceRatio < 0.5 && usedAbilities > 1);
    }

    private generateSuggestions(
        creature: Creature,
        analysis: Omit<ResourceAnalysis, 'suggestions'>
    ): ResourceAnalysis['suggestions'] {
        const immediate: string[] = [];
        const strategic: string[] = [];

        // Energy suggestions
        if (analysis.efficiency.energy.usage < 0.5) {
            immediate.push('Conserve energy for critical abilities');
        }
        if (analysis.efficiency.energy.waste > 0.2) {
            immediate.push('Use abilities to avoid wasting energy');
        }

        // Plasma suggestions
        if (analysis.efficiency.plasma.advantage < -0.3) {
            strategic.push('Build plasma advantage before engaging');
        }
        if (analysis.efficiency.plasma.teamShare > 0.6) {
            strategic.push('Share plasma with team for better efficiency');
        }

        // Endurance suggestions
        if (analysis.efficiency.endurance.risk > 0.7) {
            immediate.push('Avoid actions to prevent fatigue');
        }
        if (analysis.forecast.fatigueForecast) {
            strategic.push('Plan for recovery from predicted fatigue');
        }

        return {
            immediate,
            strategic
        };
    }

    private updateResourceHistory(creature: Creature): void {
        const history = this.resourceHistory.get(creature.id) || [];
        
        // Add current state
        history.push({
            timestamp: Date.now(),
            energy: creature.energy,
            plasma: creature.player?.plasma || 0,
            endurance: creature.endurance
        });

        // Keep last 10 turns of history
        if (history.length > 10) {
            history.shift();
        }

        this.resourceHistory.set(creature.id, history);
    }
} 