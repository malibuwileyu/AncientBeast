import Game from '../game';
import type { Creature } from '../creature';
import type { Player } from '../player';
import type { Point } from '../utility/pointfacade';
import { Hex } from '../utility/hex';

interface Position {
	x: number;
	y: number;
}

interface Action {
	type: 'ability' | 'movement';
	timestamp: number;
	source: {
		id: number;
		type: string;
		player: number;
	};
	details: {
		ability?: string;
		from?: { x: number; y: number };
		to?: { x: number; y: number };
		summonedUnit?: {
			type: string;
			name: string;
			position: Position;
		};
	};
}

export interface UnitState {
	displayName: string;  // Formatted name with player color
	id: number;
	type: string;
	level: number;
	faction: string;
	health: number;
	maxHealth: number;
	energy: number;
	maxEnergy: number;
	endurance: number;
	maxEndurance: number;
	position: Position;
	effects: string[];
	abilities: {
		id: number;
		name: string;
		used: boolean;
		available: boolean;
	}[];
	name: string;  // Original unit name (moved to end)
}

interface ResourceState {
	plasma: number;
	timePool: number;
	bonusTimePool: number;
}

interface BoardZone {
	position: Position;
	controller?: number;
	contestedBy: number[];
}

interface BoardState {
	controlZones: BoardZone[];
	threats: {
		source: number;
		target: number;
		type: string;
		severity: number;
		range: number;
		position: Position;
	}[];
	opportunities: {
		source: number;
		target: number;
		type: string;
		value: number;
		range: number;
		position: Position;
	}[];
	terrain: {
		position: Position;
		type: string;
		effects: string[];
	}[];
	visibility: {
		position: Position;
		visibleTo: number[];
	}[];
}

export interface TurnState {
	turnNumber: number;
	timestamp: number;
	activePlayer: string;
	activeCreatureId: number;  // ID of the currently active creature
	activeCreatureDisplayName: string;  // Display name of the currently active creature
	actionsTaken: Action[];
	unitsState: UnitState[];
	boardState: BoardState;
	resourceState: {
		[playerId: number]: ResourceState;
	};
	debugInfo?: {
		lastAction?: string;
		lastEffect?: string;
		queueState?: string[];
	};
}

export interface RoundState {
	roundNumber: number;
	timestamp: number;
	unitsState: UnitState[];
	boardState: BoardState;
	resourceState: {
		[playerId: number]: ResourceState;
	};
}

export class StateCapture {
	private game: Game;
	private lastCaptureTime: number;
	private currentTurnActions: Action[];
	private trackedActionsThisTurn: Set<string>;
	private lastKnownPositions: Map<number, Position>;
	private movementInProgress: boolean;
	private initialMovePosition: Position | null;

	constructor(game: Game) {
		this.game = game;
		this.lastCaptureTime = 0;
		this.currentTurnActions = [];
		this.trackedActionsThisTurn = new Set();
		this.lastKnownPositions = new Map();
		this.movementInProgress = false;
		this.initialMovePosition = null;
		this.initializeActionTracking();
	}

	private initializeActionTracking() {
		// Check for ability usage and movement every 50ms (increased frequency for better movement detection)
		setInterval(() => {
			const activeCreature = this.game.activeCreature;
			if (!activeCreature) return;

			// Track movement
			const currentPos = { x: activeCreature.x, y: activeCreature.y };
			const lastPos = this.lastKnownPositions.get(activeCreature.id);
			
			// If we don't have a last position, store the current one
			if (!lastPos) {
				this.lastKnownPositions.set(activeCreature.id, {...currentPos});
				return;
			}

			// If position changed
			if (lastPos.x !== currentPos.x || lastPos.y !== currentPos.y) {
				// If this is the start of a new movement
				if (!this.movementInProgress) {
					this.initialMovePosition = {...lastPos};
					const action: Action = {
						type: 'movement',
						timestamp: Date.now(),
						source: {
							id: activeCreature.id,
							type: activeCreature.type,
							player: activeCreature.player.id
						},
						details: {
							from: {...this.initialMovePosition},
							to: {...currentPos}
						}
					};
					this.currentTurnActions.push(action);
					this.movementInProgress = true;
				} else if (this.initialMovePosition) {
					// Update the destination of the last movement action
					const lastAction = this.currentTurnActions[this.currentTurnActions.length - 1];
					if (lastAction.type === 'movement') {
						lastAction.details.to = {...currentPos};
					}
				}
				
				// Update last known position
				this.lastKnownPositions.set(activeCreature.id, {...currentPos});
			} else {
				// If position hasn't changed for this check, movement might be complete
				if (this.movementInProgress) {
					this.movementInProgress = false;
					this.initialMovePosition = null;
				}
			}

			// Track abilities with summoning information
			activeCreature.abilities
				.filter(ability => ability.used && !this.trackedActionsThisTurn.has(`${activeCreature.id}-${ability.title}`))
				.forEach(ability => {
					const actionKey = `${activeCreature.id}-${ability.title}`;
					this.trackedActionsThisTurn.add(actionKey);
					
					const action: Action = {
						type: 'ability',
						timestamp: Date.now(),
						source: {
							id: activeCreature.id,
							type: activeCreature.type,
							player: activeCreature.player.id
						},
						details: {
							ability: ability.title
						}
					};

					// Check if this is a summoning ability (Godlet Printer)
					if (ability.title === 'Godlet Printer') {
						// Find the most recently summoned creature for this player
						const recentSummon = this.game.creatures
							.filter((c): c is Creature => 
								c !== undefined && 
								!c.dead && 
								c.player.id === activeCreature.player.id &&
								c.type !== '--' // Exclude Dark Priests
							)
							.sort((a, b) => b.id - a.id)[0]; // Most recent creature has highest ID

						if (recentSummon) {
							action.details.summonedUnit = {
								type: recentSummon.type,
								name: recentSummon.name,
								position: {
									x: recentSummon.x,
									y: recentSummon.y
								}
							};
						}
					}

					this.currentTurnActions.push(action);
				});
		}, 50);
	}

	/**
	 * Captures the current state of the game
	 * @param turnNumber Current turn number
	 */
	public captureTurnState(turnNumber: number): TurnState {
		const activeCreature = this.game.activeCreature;
		const playerColorMap = {
			0: "Red",
			1: "Blue",
			2: "Green",
			3: "Yellow"
		};

		let displayName = 'unknown';
		if (activeCreature) {
			displayName = activeCreature.name === "Dark Priest" 
				? `${playerColorMap[activeCreature.player.id]} Priest`
				: `${playerColorMap[activeCreature.player.id]}'s ${activeCreature.name}`;
		}

		// Combine consecutive movement actions into a single action
		const combinedActions: Action[] = [];
		let currentMovement: Action | null = null;

		this.currentTurnActions.forEach(action => {
			if (action.type === 'movement') {
				if (!currentMovement) {
					currentMovement = {...action};
					combinedActions.push(currentMovement);
				} else {
					// Update the destination of the current movement
					currentMovement.details.to = action.details.to;
					currentMovement.timestamp = action.timestamp; // Use latest timestamp
				}
			} else {
				currentMovement = null; // Reset movement tracking for non-movement actions
				combinedActions.push(action);
			}
		});

		// Reset for next turn
		this.currentTurnActions = [];
		this.trackedActionsThisTurn.clear();
		this.movementInProgress = false;
		this.initialMovePosition = null;
		// Clear position tracking for the active creature
		if (activeCreature) {
			this.lastKnownPositions.delete(activeCreature.id);
		}

		return {
			turnNumber,
			timestamp: Date.now(),
			activePlayer: activeCreature?.player.name || 'unknown',
			activeCreatureId: activeCreature?.id || 0,
			activeCreatureDisplayName: displayName,
			actionsTaken: combinedActions,
			unitsState: this.captureUnits(),
			boardState: this.captureBoardState(),
			resourceState: this.captureResources(),
			debugInfo: this.captureDebugInfo(),
		};
	}

	public captureRoundState(roundNumber: number): RoundState {
		return {
			roundNumber,
			timestamp: Date.now(),
			unitsState: this.captureUnits(),
			boardState: this.captureBoardState(),
			resourceState: this.captureResources()
		};
	}

	private captureUnits(): UnitState[] {
		// Player color mapping
		const playerColorMap = {
			0: "Red",
			1: "Blue",
			2: "Green",
			3: "Yellow"
		};

		return this.game.creatures
			.filter((creature): creature is Creature => creature !== undefined && !creature.dead)
			.map((creature) => {
				// Handle special case for Dark Priest naming
				let displayName: string = creature.name;
				if (creature.name === "Dark Priest") {
					displayName = `${playerColorMap[creature.player.id]} Priest`;
				} else {
					// Prefix other unit names with player color
					displayName = `${playerColorMap[creature.player.id]}'s ${creature.name}`;	
				}

				return {
					displayName: displayName,
					id: creature.id,
					type: creature.type.toString(),
					level: Number(creature.level),
					faction: creature.realm,
					health: creature.health,
					maxHealth: creature.stats.health,
					energy: creature.energy,
					maxEnergy: creature.stats.energy,
					endurance: creature.endurance,
					maxEndurance: creature.stats.endurance,
					position: {
						x: creature.x,
						y: creature.y,
					},
					effects: creature.effects.map((effect) => effect.name || 'unknown'),
					abilities: creature.abilities.map((ability) => ({
						id: ability.id,
						name: ability.title || 'unknown',
						used: ability.used,
						available: !ability.used && ability.require && ability.require()
					})),
					name: creature.name,  // Original name moved to end
				};
			});
	}

	private captureActions(): Action[] {
		// We now track actions through the initializeActionTracking method
		return this.currentTurnActions;
	}

	private captureBoardState(): BoardState {
		const state: BoardState = {
			controlZones: [],
			threats: [],
			opportunities: [],
			terrain: [],
			visibility: [],
		};

		// Capture control zones and terrain
		if (this.game.grid) {
			this.game.grid.hexes.forEach((row, y) => {
				row.forEach((hex, x) => {
					// Capture terrain
					if (hex.trap || hex.drop) {
						state.terrain.push({
							position: { x, y },
							type: hex.trap ? 'trap' : 'drop',
							effects: [], // TODO: Add effects when trap system is implemented
						});
					}

					// Capture control zones
					if (hex.creature) {
						const zone: BoardZone = {
							position: { x, y },
							controller: hex.creature.team,
							contestedBy: [],
						};
						// Add any contesting units
						this.game.creatures
							.filter((c): c is Creature => c !== undefined && !c.dead)
							.forEach((creature) => {
								// Check if creature is in range to contest
								if (
									creature.team !== hex.creature?.team &&
									Math.abs(creature.x - x) <= 1 &&
									Math.abs(creature.y - y) <= 1
								) {
									zone.contestedBy.push(creature.team);
								}
							});
						state.controlZones.push(zone);
					}

					// Capture visibility
					const visibleTo: number[] = [];
					this.game.creatures
						.filter((c): c is Creature => c !== undefined && !c.dead)
						.forEach((creature) => {
							// Use movement range as sight range since there's no explicit sight property
							const sightRange = creature.stats.movement;
							if (
								Math.abs(creature.x - x) <= sightRange &&
								Math.abs(creature.y - y) <= sightRange
							) {
								visibleTo.push(creature.team);
							}
						});
					if (visibleTo.length > 0) {
						state.visibility.push({ position: { x, y }, visibleTo });
					}
				});
			});
		}

		// Analyze threats and opportunities
		this.game.creatures
			.filter((c): c is Creature => c !== undefined && !c.dead)
			.forEach((creature) => {
				// Check each creature's abilities for threats
				creature.abilities.forEach((ability) => {
					if (!ability.used && ability.require && ability.require()) {
						// Get ability range by checking target hexes
						const targetHexes = ability._getTarget?.([1, 1, 1, 1, 1, 1]) || [];
						const range = targetHexes.length;

						// Add as threat if it has damage properties
						if (ability.damages) {
							const totalDamage = Object.values(ability.damages).reduce((sum, val) => {
								const damage = typeof val === 'number' ? val : 0;
								return sum + damage;
							}, 0);

							if (totalDamage > 0) {
								state.threats.push({
									source: creature.id,
									target: -1, // -1 indicates area threat
									type: 'ability',
									severity: totalDamage,
									range,
									position: { x: creature.x, y: creature.y },
								});
							}
						}

						// Add as opportunity if it requires energy (potential buff/heal)
						if (ability.requirements?.energy && ability.requirements.energy > 0) {
							state.opportunities.push({
								source: creature.id,
								target: -1, // -1 indicates area opportunity
								type: 'ability',
								value: ability.requirements.energy,
								range,
								position: { x: creature.x, y: creature.y },
							});
						}
					}
				});
			});

		return state;
	}

	private captureResources(): { [playerId: number]: ResourceState } {
		const resources: { [playerId: number]: ResourceState } = {};

		this.game.players.forEach((player: Player) => {
			resources[player.id] = {
				plasma: player.plasma,
				timePool: player.totalTimePool,
				bonusTimePool: player.bonusTimePool,
			};
		});

		return resources;
	}

	private captureDebugInfo() {
		if (!this.game.activeCreature) return undefined;

		return {
			lastAction:
				this.game.activeCreature.abilities.find((ability) => ability.used)?.title || undefined,
			lastEffect: this.game.activeCreature.effects.slice(-1)[0]?.name || undefined,
			queueState: this.game.queue.queue.map((creature) => `${creature.type}(${creature.id})`),
		};
	}
}
