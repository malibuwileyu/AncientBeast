import { Creature } from '../../../creature';
import { Ability } from '../../../ability';
import Game from '../../../game';

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
    constructor(private game: Game) {}

    public analyzeUnitState(creature: Creature): UnitStateAnalysis {
        return {
            health: this.analyzeHealth(creature),
            energy: this.analyzeEnergy(creature),
            abilities: this.analyzeAbilities(creature),
            fatigue: this.analyzeFatigue(creature),
            offensive: this.analyzeOffensive(creature)
        };
    }

    private analyzeHealth(creature: Creature) {
        return {
            current: creature.health,
            max: creature.stats.health,
            percentage: (creature.health / creature.stats.health) * 100
        };
    }

    private analyzeEnergy(creature: Creature) {
        return {
            current: creature.energy,
            max: creature.stats.energy,
            meditation: creature.stats.meditation
        };
    }

    private analyzeAbilities(creature: Creature) {
        const possible = creature.abilities
            .filter(ability => !ability.used && ability.require && ability.require())
            .map(ability => ({
                id: ability.id,
                name: ability.title,
                energyCost: ability.costs?.energy || 0
            }));

        const used = creature.abilities
            .filter(ability => ability.used)
            .map(ability => ({
                id: ability.id,
                name: ability.title
            }));

        return { possible, used };
    }

    private analyzeFatigue(creature: Creature) {
        return {
            isFatigued: creature.isFatigued(),
            endurance: creature.endurance,
            maxEndurance: creature.stats.endurance,
            protectedFromFatigue: creature.protectedFromFatigue
        };
    }

    private analyzeOffensive(creature: Creature) {
        return {
            offense: creature.stats.offense,
            defense: creature.stats.defense,
            initiative: creature.stats.initiative,
            masteries: {
                pierce: creature.stats.pierce,
                slash: creature.stats.slash,
                crush: creature.stats.crush,
                shock: creature.stats.shock,
                burn: creature.stats.burn,
                frost: creature.stats.frost,
                poison: creature.stats.poison,
                sonic: creature.stats.sonic,
                mental: creature.stats.mental
            }
        };
    }
} 