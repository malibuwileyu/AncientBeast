import { Creature } from '../../creature';
import { Ability } from '../../ability';
import { Effect } from '../../effect';
import Game from '../../game';
import { ThreatAnalyzer } from './threat/ThreatAnalyzer';
import { AbilityAnalyzer } from './ability/AbilityAnalyzer';
import { PositionAnalyzer } from './PositionAnalyzer';
import { UnitStateAnalyzer } from './state/UnitStateAnalyzer';
import { PatternAnalyzer } from './PatternAnalyzer';
import { ProfileManager } from './ProfileManager';
import { EventRecorder } from './EventRecorder';
import { CacheManager } from './cache/CacheManager';

export interface AnalyzerEvent<T = any> {
    timestamp: number;
    source: {
        id: number;
        type: string;
        name: string;
    };
    target?: {
        id: number;
        type: string;
        name: string;
    };
    data: T;
}

export interface DamageEvent extends AnalyzerEvent {
    data: {
        amount: number;
        type: string;
        isCritical?: boolean;
    };
}

export interface ControlEvent extends AnalyzerEvent {
    data: {
        effect: string;
        duration: number;
        isRemoved?: boolean;
    };
}

export interface MovementEvent extends AnalyzerEvent {
    data: {
        from: { x: number; y: number };
        to: { x: number; y: number };
        isForced?: boolean;
    };
}

export interface AbilityEvent extends AnalyzerEvent {
    data: {
        abilityId: number;
        name: string;
        targets: Array<{
            id: number;
            type: string;
            position: { x: number; y: number };
        }>;
        result: {
            damage?: number;
            control?: string[];
            movement?: boolean;
        };
    };
}

export interface AnalyzerResult<T = any> {
    timestamp: number;
    source: Creature;
    result: T;
    metadata?: Record<string, any>;
}

export interface AnalyzerDependencies {
    game: Game;
    threatAnalyzer?: ThreatAnalyzer;
    abilityAnalyzer?: AbilityAnalyzer;
    positionAnalyzer?: PositionAnalyzer;
    unitStateAnalyzer?: UnitStateAnalyzer;
    patternAnalyzer?: PatternAnalyzer;
    profileManager?: ProfileManager;
    eventRecorder?: EventRecorder;
    cacheManager?: CacheManager;
}

export interface Analyzer {
    analyze(source: Creature, ...args: any[]): AnalyzerResult;
    handleEvent?(event: AnalyzerEvent): void;
    getDependencies(): AnalyzerDependencies;
}

export interface AnalyzerFactory {
    createAnalyzer(type: string, dependencies: AnalyzerDependencies): Analyzer;
} 