import { UnitProfile } from '../ai/types/UnitProfile';

export interface Unit {
    id: number;
    name: string;
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    endurance: number;
    maxEndurance: number;
    position: {
        x: number;
        y: number;
    };
    abilities: {
        name: string;
        energyCost: number;
        cooldown: number;
        currentCooldown: number;
    }[];
    effects: {
        name: string;
        duration: number;
        type: 'buff' | 'debuff';
    }[];
}

export interface GameState {
    turn: number;
    activeTeam: number;
    units: Unit[];
    objectives: {
        id: number;
        type: string;
        position: {
            x: number;
            y: number;
        };
        controllingTeam?: number;
    }[];
    terrain: {
        type: string;
        position: {
            x: number;
            y: number;
        };
        effects?: string[];
    }[];

    // Helper methods
    getUnitByProfile(profile: UnitProfile): Unit | undefined;
    getUnitById(id: number): Unit | undefined;
    getUnitsInRange(position: { x: number; y: number }, range: number): Unit[];
    getObjectivesInRange(position: { x: number; y: number }, range: number): any[];
    getTerrainAt(position: { x: number; y: number }): any;
    isValidPosition(position: { x: number; y: number }): boolean;
    getPathBetween(start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[];
    calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number;
} 