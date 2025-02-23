import { Creature } from '../../../creature';
import Game from '../../../game';

export interface DistanceAnalysis {
    unitDistance: number;
    unitSpread: number;
    nearbyUnits: {
        allies: number;
        enemies: number;
    };
}

export class DistanceAnalyzer {
    constructor(private game: Game) {}

    public calculateDistance(unit1: Creature, unit2: Creature): number {
        return Math.max(
            Math.abs(unit1.x - unit2.x),
            Math.abs(unit1.y - unit2.y)
        );
    }

    public calculateUnitSpread(units: Creature[]): number {
        if (units.length <= 1) return 0;
        
        let maxDistance = 0;
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                maxDistance = Math.max(maxDistance, this.calculateDistance(units[i], units[j]));
            }
        }
        return maxDistance;
    }

    public analyzeDistances(source: Creature): DistanceAnalysis {
        const nearbyUnits = {
            allies: this.countNearbyUnits(source, true),
            enemies: this.countNearbyUnits(source, false)
        };

        const allies = this.game.creatures.filter(c => c.team === source.team);
        const unitSpread = this.calculateUnitSpread(allies);

        return {
            unitDistance: this.findNearestAllyDistance(source),
            unitSpread,
            nearbyUnits
        };
    }

    private countNearbyUnits(source: Creature, allies: boolean): number {
        return this.game.creatures
            .filter((c): c is Creature => 
                c !== undefined && 
                !c.dead && 
                c.team === (allies ? source.team : source.team % 2 !== c.team % 2) &&
                c !== source &&
                this.calculateDistance(source, c) <= 2
            ).length;
    }

    private findNearestAllyDistance(source: Creature): number {
        const allies = this.game.creatures.filter(c => 
            c.id !== source.id && c.team === source.team
        );
        
        if (allies.length === 0) return Infinity;
        
        return Math.min(...allies.map(ally => 
            this.calculateDistance(source, ally)
        ));
    }
} 