import type { Analysis } from './RealTimeAnalyzer';
import type { TurnState, RoundState } from './StateCapture';
import type { PerformanceMetrics } from './MetricsManager';
import type { LogLevel, LogType } from './types';
import type { GameEndState } from './MetricsManager';

interface BaseLogEntry {
	timestamp: string;
	level: LogLevel;
	type: LogType;
	gameId: string;
	version: string;
}

interface StateLogEntry extends BaseLogEntry {
	type: 'state';
	data: {
		turnNumber: number;
		activePlayer: string;
		units: {
			id: number;
			health: number;
			energy: number;
			position: { x: number; y: number };
			effects: string[];
		}[];
		actions: {
			type: 'ability' | 'movement';
			source: { id: number };
			details: {
				ability?: string;
				from?: { x: number; y: number };
				to?: { x: number; y: number };
			};
		}[];
	};
}

interface AnalysisLogEntry extends BaseLogEntry {
	type: 'analysis';
	data: {
		threats: {
			type: string;
			severity: number;
			source: { id: number };
			target: { id: number };
		}[];
		opportunities: {
			type: string;
			value: number;
			source: { id: number };
			target: { id: number };
		}[];
		analysisTime: number;
	};
}

interface PerformanceLogEntry extends BaseLogEntry {
	type: 'performance';
	data: {
		executionTime: number;
		memoryUsage: number;
		thresholds: {
			executionTime: number;
			memoryUsage: number;
		};
		warnings: string[];
	};
}

interface ErrorLogEntry extends BaseLogEntry {
	type: 'error';
	data: {
		message: string;
		stack?: string;
		context: string;
		severity: 'low' | 'medium' | 'high' | 'critical';
	};
}

interface GameEndLogEntry extends BaseLogEntry {
	type: 'gameEnd';
	data: GameEndState;
}

interface DamageLogEntry extends BaseLogEntry {
	type: 'damage';
	data: {
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
	};
}

interface HealingLogEntry extends BaseLogEntry {
	type: 'healing';
	data: {
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
	};
}

interface StatusEffectLogEntry extends BaseLogEntry {
	type: 'status';
	data: {
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
	};
}

type LogEntry = StateLogEntry | AnalysisLogEntry | PerformanceLogEntry | ErrorLogEntry | GameEndLogEntry | DamageLogEntry | HealingLogEntry | StatusEffectLogEntry;

interface GameLog {
	gameId: string;
	version: string;
	startTime: string;
	lastUpdated: string;
	turns: {
		turnNumber: number;
		timestamp: string;
		state: TurnState;
	}[];
	rounds: {
		roundNumber: number;
		timestamp: string;
		state: RoundState;
	}[];
	analyses: AnalysisLogEntry[];
	performance: PerformanceLogEntry[];
	errors: ErrorLogEntry[];
	damage: DamageLogEntry[];
	healing: HealingLogEntry[];
	status: StatusEffectLogEntry[];
	gameEnd?: GameEndLogEntry;
}

export class MetricsLogger {
	private static readonly MAX_LOGS = 1000;
	private static readonly STORAGE_KEY_PREFIX = 'ancient_beast_game_';
	private readonly logLevel: LogLevel;
	private readonly gameVersion: string;
	private readonly performanceThresholds: {
		executionTime: number;
		memoryUsage: number;
	};
	private currentGameLog: GameLog | null = null;

	constructor(logLevel: LogLevel = 'info', gameVersion = '0.0.0') {
		this.logLevel = logLevel;
		this.gameVersion = gameVersion;
		this.performanceThresholds = {
			executionTime: 500,
			memoryUsage: 50 * 1024 * 1024
		};
		this.cleanOldLogs();
	}

	private createBaseEntry<T extends LogType>(
		type: T,
		level: LogLevel,
		gameId: string
	): BaseLogEntry & { type: T } {
		return {
			timestamp: new Date().toISOString(),
			level,
			type,
			gameId,
			version: this.gameVersion
		};
	}

	private initializeGameLog(gameId: string): void {
		this.currentGameLog = {
			gameId,
			version: this.gameVersion,
			startTime: new Date().toISOString(),
			lastUpdated: new Date().toISOString(),
			turns: [],
			rounds: [],
			analyses: [],
			performance: [],
			errors: [],
			damage: [],
			healing: [],
			status: [],
		};
		this.saveGameLog();
	}

	private saveGameLog(): void {
		if (!this.currentGameLog) return;
		try {
			const key = `${MetricsLogger.STORAGE_KEY_PREFIX}${this.currentGameLog.gameId}`;
			localStorage.setItem(key, JSON.stringify(this.currentGameLog));
			} catch (error) {
			console.warn(`[MetricsLogger] Failed to save game log: ${error.message}`);
			this.cleanOldLogs();
		}
	}

	public logTurnState(state: TurnState, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		try {
			this.currentGameLog.turns.push({
				turnNumber: state.turnNumber,
				timestamp: new Date().toISOString(),
				state
			});
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.debug(`[MetricsLogger] Turn ${state.turnNumber} logged for game ${gameId}`);
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log turn state: ${error.message}`);
		}
	}

	public logRoundState(state: RoundState, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		try {
			this.currentGameLog.rounds.push({
				roundNumber: state.roundNumber,
				timestamp: new Date().toISOString(),
				state
			});
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.debug(`[MetricsLogger] Round ${state.roundNumber} logged for game ${gameId}`);
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log round state: ${error.message}`);
		}
	}

	public logAnalysis(analysis: Analysis, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const logEntry = {
			...this.createBaseEntry('analysis', 'info', gameId),
			data: {
				threats: analysis.threats.map(threat => ({
					type: threat.type || 'unknown',
					severity: threat.severity || 1,
					source: { id: threat.source?.id || 0 },
					target: { id: threat.target?.id || 0 }
				})),
				opportunities: analysis.opportunities.map(opp => ({
					type: opp.type || 'unknown',
					value: opp.value || 1,
					source: { id: opp.source?.id || 0 },
					target: { id: opp.target?.id || 0 }
				})),
				analysisTime: Date.now() - analysis.timestamp
			}
		};

		try {
			this.currentGameLog.analyses.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log analysis: ${error.message}`);
		}
	}

	public logPerformance(metrics: PerformanceMetrics, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const warnings: string[] = [];
		if (metrics.executionTime > this.performanceThresholds.executionTime) {
			warnings.push(`High execution time: ${metrics.executionTime}ms`);
		}
		if (metrics.memoryUsage > this.performanceThresholds.memoryUsage) {
			warnings.push(`High memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
		}

		const logEntry = {
			...this.createBaseEntry('performance', warnings.length > 0 ? 'warn' : 'info', gameId),
			data: {
				executionTime: metrics.executionTime,
				memoryUsage: metrics.memoryUsage,
				thresholds: { ...this.performanceThresholds },
				warnings
			}
		};

		try {
			this.currentGameLog.performance.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log performance: ${error.message}`);
		}
	}

	public logError(error: Error, context: string, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const logEntry = {
			...this.createBaseEntry('error', 'error', gameId),
			data: {
				message: error.message,
				stack: error.stack,
				context,
				severity: 'medium' as 'low' | 'medium' | 'high' | 'critical'
			}
		};

		try {
			this.currentGameLog.errors.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log error: ${error.message}`);
		}
	}

	public logGameEnd(state: GameEndState): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(state.gameId);
		}

		const logEntry = {
			...this.createBaseEntry('gameEnd', 'info', state.gameId),
			data: state
		};

		try {
			this.currentGameLog.gameEnd = logEntry;
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.log(`[${new Date().toISOString()}] Game Over:`, {
				winner: state.winner.name,
				score: state.winner.score,
				totalTurns: state.totalTurns,
				totalRounds: state.totalRounds
			});
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log game end: ${error.message}`);
		}
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
	}, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const logEntry: DamageLogEntry = {
			...this.createBaseEntry('damage', 'info', gameId),
			data: damage
		};

		try {
			this.currentGameLog.damage.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.debug(`[MetricsLogger] Damage logged for game ${gameId}: ${damage.amount} ${damage.damageType} damage from ${damage.source.name} (${damage.source.currentHealth}/${damage.source.maxHealth}) to ${damage.target.name} (${damage.target.currentHealth}/${damage.target.maxHealth})`);
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log damage: ${error.message}`);
		}
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
	}, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const logEntry: HealingLogEntry = {
			...this.createBaseEntry('healing', 'info', gameId),
			data: healing
		};

		try {
			this.currentGameLog.healing.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.debug(`[MetricsLogger] Healing logged for game ${gameId}: ${healing.amount} ${healing.isRegrowth ? 'regrowth' : 'healing'} from ${healing.source.name} (${healing.source.currentHealth}/${healing.source.maxHealth}) to ${healing.target.name} (${healing.target.currentHealth}/${healing.target.maxHealth})`);
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log healing: ${error.message}`);
		}
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
	}, gameId: string): void {
		if (!this.currentGameLog) {
			this.initializeGameLog(gameId);
		}

		const logEntry: StatusEffectLogEntry = {
			...this.createBaseEntry('status', 'info', gameId),
			data: status
		};

		try {
			this.currentGameLog.status.push(logEntry);
			this.currentGameLog.lastUpdated = new Date().toISOString();
			this.saveGameLog();
			console.debug(`[MetricsLogger] Status effect logged for game ${gameId}: ${status.effect.name} ${status.effect.action} by ${status.source.name} on ${status.target.name} (duration: ${status.effect.duration})`);
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to log status effect: ${error.message}`);
		}
	}

	private cleanOldLogs(): void {
		try {
			const keys = Object.keys(localStorage)
				.filter(key => key.startsWith(MetricsLogger.STORAGE_KEY_PREFIX))
				.sort((a, b) => {
					const aData = JSON.parse(localStorage.getItem(a) || '{}');
					const bData = JSON.parse(localStorage.getItem(b) || '{}');
					return new Date(bData.lastUpdated).getTime() - new Date(aData.lastUpdated).getTime();
				});

			if (keys.length > MetricsLogger.MAX_LOGS) {
				keys.slice(MetricsLogger.MAX_LOGS).forEach(key => {
					localStorage.removeItem(key);
				});
			}
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to clean old logs: ${error.message}`);
		}
	}

	public getGameLog(gameId: string): GameLog | null {
		try {
			const key = `${MetricsLogger.STORAGE_KEY_PREFIX}${gameId}`;
			const data = localStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.warn(`[MetricsLogger] Failed to retrieve game log: ${error.message}`);
			return null;
		}
	}

	public getLogLevel(): LogLevel {
		return this.logLevel;
	}
}



