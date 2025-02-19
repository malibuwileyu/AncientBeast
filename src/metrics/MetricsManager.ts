import type { Analysis } from './RealTimeAnalyzer';
import type { TurnState, RoundState } from './StateCapture';
import { MetricsLogger } from './MetricsLogger';

// Interfaces
interface PerformanceMetrics {
	executionTime: number;
	memoryUsage: number;
}

export interface GameEndState {
	gameId: string;
	endTime: number;
	totalTurns: number;
	totalRounds: number;
	winner: {
		id: number;
		name: string;
		score: number;
		remainingCreatures: number;
	};
	players: {
		id: number;
		name: string;
		score: number;
		remainingCreatures: number;
	}[];
}

interface GameMetrics {
	gameId: string;
	startTime: number;
	endTime: number;
	turns: number;
	performanceMetrics: PerformanceMetrics[];
	analyses: Analysis[];
	stateHistory: TurnState[];
	finalState: any;
}

export { type PerformanceMetrics };

export class MetricsManager {
	private currentGameMetrics: GameMetrics | null = null;
	private gameId: string;
	private logger: MetricsLogger;
	private turnStates: TurnState[];
	private roundStates: RoundState[];
	private gameEndState: GameEndState | null;

	constructor() {
		this.gameId = `game_${Date.now()}`;
		this.logger = new MetricsLogger();
		this.turnStates = [];
		this.roundStates = [];
		this.gameEndState = null;
	}

	public initializeGame(gameId?: string): void {
		this.gameId = gameId || `game_${Date.now()}`;
		this.turnStates = [];
		this.roundStates = [];
		this.gameEndState = null;
		
		// Initialize the current game metrics
		this.currentGameMetrics = {
			gameId: this.gameId,
			startTime: Date.now(),
			endTime: 0,
			turns: 0,
			performanceMetrics: [],
			analyses: [],
			stateHistory: [],
			finalState: null
		};
		
		// Initialize the game log in the logger
		this.logger.logTurnState({
			turnNumber: 0,
			timestamp: Date.now(),
			activePlayer: 'initialization',
			activeCreatureId: 0,
			activeCreatureDisplayName: 'initialization',
			actionsTaken: [],
			unitsState: [],
			boardState: {
				controlZones: [],
				threats: [],
				opportunities: [],
				terrain: [],
				visibility: []
			},
			resourceState: {},
			debugInfo: {
				lastAction: 'game_initialization'
			}
		}, this.gameId);
	}

	public getCurrentMetrics(): { gameId: string } | null {
		if (!this.gameId) return null;
		return { gameId: this.gameId };
	}

	public getGameHistory(): {
		gameId: string;
		turns: TurnState[];
		rounds: RoundState[];
		endState: GameEndState | null;
	} {
		return {
			gameId: this.gameId,
			turns: this.turnStates,
			rounds: this.roundStates,
			endState: this.gameEndState
		};
	}

	public addPerformanceMetrics(metrics: PerformanceMetrics): void {
		if (!this.currentGameMetrics) return;
		this.currentGameMetrics.performanceMetrics.push(metrics);
	}

	public addAnalysis(analysis: Analysis): void {
		if (!this.currentGameMetrics) return;
		this.currentGameMetrics.analyses.push(analysis);
	}

	public addTurnState(state: TurnState): void {
		if (!this.currentGameMetrics) return;
		this.currentGameMetrics.turns++;
		this.currentGameMetrics.stateHistory.push(state);
		this.currentGameMetrics.finalState = {
			turnNumber: state.turnNumber,
			activePlayer: state.activePlayer,
			units: state.unitsState,
			board: state.boardState,
			resources: state.resourceState,
			actions: state.actionsTaken,
			debugInfo: state.debugInfo,
		};
		this.turnStates.push(state);
		this.logger.logTurnState(state, this.gameId);
	}

	public addRoundState(state: RoundState): void {
		this.roundStates.push(state);
		this.logger.logRoundState(state, this.gameId);
		console.log('Round', state.roundNumber, 'Summary:', state);
	}

	public endGame(state: GameEndState): void {
		this.gameEndState = state;
		this.logger.logGameEnd(state);
	}

	public logDamage(damage: {
		source: { 
			id: number; 
			name: string;
			maxHealth: number;
			currentHealth: number;
		};
		target: { 
			id: number; 
			name: string;
			maxHealth: number;
			currentHealth: number;
		};
		amount: number;
		damageType: string;
		turnNumber: number;
		roundNumber: number;
	}): void {
		this.logger.logDamage(damage, this.gameId);
	}

	public logHealing(healing: {
		source: { 
			id: number; 
			name: string;
			maxHealth: number;
			currentHealth: number;
		};
		target: { 
			id: number; 
			name: string;
			maxHealth: number;
			currentHealth: number;
		};
		amount: number;
		isRegrowth: boolean;
		turnNumber: number;
		roundNumber: number;
	}): void {
		this.logger.logHealing(healing, this.gameId);
	}

	public logStatusEffect(status: {
		source: { 
			id: number; 
			name: string;
		};
		target: { 
			id: number; 
			name: string;
		};
		effect: {
			name: string;
			duration: number;
			action: 'applied' | 'removed';
		};
		turnNumber: number;
		roundNumber: number;
	}): void {
		this.logger.logStatusEffect(status, this.gameId);
	}
}

export type { GameMetrics };
