import { Creature } from '../../../creature';
import Game from '../../../game';
import { UnitState } from '../../StateCapture';

export class StateMapper {
    public static mapUnitState(creature: Creature): UnitState {
        const colors = ['Red', 'Blue', 'Green', 'Yellow'];
        const color = colors[creature.team] || 'Unknown';
        const displayName = creature.type.includes('Dark Priest') ? 
            `${color} Priest` : 
            `${color}'s ${creature.name}`;

        return {
            displayName,
            id: creature.id,
            type: creature.type,
            level: typeof creature.level === 'string' ? parseInt(creature.level) || 0 : creature.level,
            faction: creature.realm,
            health: creature.health,
            maxHealth: creature.stats.health,
            energy: creature.energy,
            maxEnergy: creature.stats.energy,
            endurance: creature.endurance,
            maxEndurance: creature.stats.endurance,
            position: { x: creature.x, y: creature.y },
            effects: creature.effects.map(e => e.name),
            abilities: creature.abilities.map(a => ({
                id: a.id,
                name: a.title,
                used: a.used,
                available: !a.used
            })),
            name: creature.name
        };
    }

    public static mapRoundState(game: Game): RoundState {
        return {
            roundNumber: Math.floor(game.turn / game.creatures.length),
            timestamp: Date.now(),
            unitsState: game.creatures
                .filter((c): c is Creature => c !== undefined)
                .map(c => this.mapUnitState(c)),
            boardState: {
                controlZones: [],
                threats: [],
                opportunities: [],
                terrain: [],
                visibility: []
            },
            resourceState: Object.fromEntries(
                game.players.map(p => [p.id, {
                    plasma: p.plasma || 0,
                    timePool: 0,
                    bonusTimePool: 0
                }])
            )
        };
    }
}

interface RoundState {
    roundNumber: number;
    timestamp: number;
    unitsState: UnitState[];
    boardState: {
        controlZones: any[];
        threats: any[];
        opportunities: any[];
        terrain: any[];
        visibility: any[];
    };
    resourceState: {
        [playerId: number]: {
            plasma: number;
            timePool: number;
            bonusTimePool: number;
        };
    };
} 