// Import jQuery related stuff
import * as $j from 'jquery';
import 'jquery.transit';
import { unitData } from './data/units';
import Game from './game';
import { PreMatchAudioPlayer } from './sound/pre-match-audio';
import { Fullscreen } from './ui/fullscreen';
import { buttonSlide } from './ui/button';
import { OllamaAIIntegration } from './ai/integration/OllamaAIIntegration';

import Connect from './multiplayer/connect';
import Authenticate from './multiplayer/authenticate';
import SessionI from './multiplayer/session';
import {
	DEBUG_AUTO_START_GAME,
	DEBUG_DISABLE_HOTKEYS,
	DEBUG_GAME_LOG,
	DEBUG_HAS_GAME_LOG,
} from './debug';

// Load the stylesheet
import './style/main.less';

import { GameState, Unit } from './game/GameState';
import { UnitProfile } from './ai/types/UnitProfile';
import { ThreatAnalysis, PositionAnalysis, PatternAnalysis } from './metrics/analysis/types';
import { ResourceAnalysis } from './metrics/analysis/resource/ResourceAnalyzer';

export type GameConfig = ReturnType<typeof getGameConfig>;

// Generic object we can decorate with helper methods to simply dev and user experience.
// TODO: Expose this in a less hacky way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Too many unknown types.
const AB = {} as any;
// Create the game
const G = new Game();
// Helper properties and methods for retrieving and playing back game logs.
// TODO: Expose these in a less hacky way too.
AB.currentGame = G;
AB.getLog = () => AB.currentGame.gamelog.stringify();
AB.saveLog = () => AB.currentGame.gamelog.save();
AB.restoreGame = (str) => AB.currentGame.gamelog.load(str);
window.AB = AB;
const connect = new Connect(G);
G.connect = connect;

// Load the abilities
const loadAbilities = async () => {
	for (const creature of unitData) {
		if (!creature.playable) {
			continue;
		}

		try {
			const abilityModule = await import(`./abilities/${creature.name.split(' ').join('-')}`);
			if (abilityModule && typeof abilityModule.default === 'function') {
				// Initialize the abilities array for this creature if needed
				if (!G.abilities[creature.id]) {
					G.abilities[creature.id] = [];
				}
				abilityModule.default(G);
			} else {
				console.error(`Invalid ability module for ${creature.name}`);
			}
		} catch (error) {
			console.error(`Error loading abilities for ${creature.name}:`, error);
		}
	}
};

// Load abilities sequentially
loadAbilities().catch(error => {
	console.error('Error loading abilities:', error);
});

$j(() => {
	const scrim = $j('.scrim');
	scrim.on('transitionend', function () {
		scrim.remove();
	});
	scrim.removeClass('loading');
	renderPlayerModeType(G.multiplayer);

	// Select a random combat location
	const locationSelector = $j("input[name='combatLocation']");
	const randomLocationIndex = Math.floor(Math.random() * locationSelector.length);
	locationSelector.eq(randomLocationIndex).prop('checked', true).trigger('click');

	// Disable initial game setup until browser tab has focus
	window.addEventListener('blur', G.onBlur.bind(G), false);
	window.addEventListener('focus', G.onFocus.bind(G), false);

	// Function to disable scroll and arrow keys
	function disableScrollAndArrowKeys(element: HTMLElement) {
		const $element = $j(element);
		$element.attr('tabindex', '0'); // Set tabindex to make element focusable

		$element.on('mouseover', () => {
			// Add event listener for mouse over game area
			$element.focus(); // Focus the element
			$element.on('wheel', (e) => {
				e.preventDefault();
			});
			$element.on('keydown', (e) => {
				e.preventDefault();
			});

			$element.on('mouseout', () => {
				$element.blur(); // Remove focus from the element when mouse leaves game area
			});
		});
	}

	disableScrollAndArrowKeys(document.getElementById('loader')); // Disable scroll and arrow keys for loader element

	// Add listener for Fullscreen API
	const fullscreen = new Fullscreen(document.getElementById('fullscreen'));
	$j('#fullscreen').on('click', () => fullscreen.toggle());

	const startScreenHotkeys = {
		Space: {
			keyDownTest() {
				return true;
			},
			keyDownAction() {
				startGame();
			},
		},
		Enter: {
			keyDownTest() {
				return true;
			},
			keyDownAction() {
				startGame();
			},
		},
		KeyF: {
			keyDownTest(event) {
				return event.shiftKey;
			},
			keyDownAction() {
				fullscreen.toggle();
			},
		},
		KeyL: {
			keyDownTest(event) {
				return event.metaKey && event.ctrlKey;
			},
			keyDownAction() {
				readLogFromFile()
					.then((log) => G.gamelog.load(log as string))
					.catch((err) => {
						alert('An error occurred while loading the log file');
						console.log(err);
					});
			},
		},
	};

	// Binding Hotkeys
	if (!DEBUG_DISABLE_HOTKEYS) {
		$j(document).on('keydown', (event) => {
			const hotkey = startScreenHotkeys[event.code];

			if (hotkey === undefined) {
				return;
			}

			const { keyDownTest, keyDownAction } = hotkey;

			if (keyDownTest.call(this, event)) {
				event.preventDefault();
				keyDownAction.call(this, event);
			}
		});
	}

	if (G.multiplayer) {
		// TODO Remove after implementaion 2 vs 2 in multiplayer mode
		forceTwoPlayerMode();
	}

	// Allow button game options to slide in prematch screen
	buttonSlide();

	// Create new Object to play audio in pre-match screen
	const beastAudio = new PreMatchAudioPlayer();

	$j('#gameTitle').on('click', () => {
		beastAudio.playBeast();
	});

	// Hide singleplayer option initially
	$j('#singleplayer').hide();

	$j('#createMatchButton').on('click', () => {
		$j('.match-frame').hide();
		$j('#gameSetup').show();
		renderPlayerModeType(G.multiplayer);
		$j('#startMatchButton').show();
		$j('#startButton').hide();

		// TODO Remove after implementaion 2 vs 2 in multiplayer mode
		forceTwoPlayerMode();
	});

	$j('#singleplayer').hide();

	$j('#multiplayer').on('click', async () => {
		$j('#multiplayer').hide();
		$j('#singleplayer').show();
		$j('.setupFrame,.lobby').hide();
		$j('.loginregFrame').show();
		$j('#multiplayer').hide();
		$j('#singleplayer').show();
		const sess = new SessionI();
		try {
			await sess.restoreSession();
		} catch (e) {
			console.log('unable to restore session', e);
			return;
		}
	});

	$j('#singleplayer').on('click', async () => {
		$j('.setupFrame').show();
		$j('.loginregFrame').hide();
		$j('#multiplayer').show();
		$j('#singleplayer').hide();
	});

	// Focus the form to enable "press enter to start the game" functionality
	$j('#startButton').trigger('focus');

	const startGame = () => {
		G.loadGame(getGameConfig());
	};

	const restoreGameLog = (log) => {
		G.gamelog.load(log);
	};

	if (DEBUG_HAS_GAME_LOG) {
		setTimeout(() => restoreGameLog(DEBUG_GAME_LOG), 50);
	} else if (DEBUG_AUTO_START_GAME) {
		setTimeout(startGame, 50);
	}

	$j('form#gameSetup').on('submit', (e) => {
		// NOTE: Prevent submission
		e.preventDefault();
		startGame();
		// NOTE: Prevent submission
		return false;
	});

	// Register
	async function register(e) {
		e.preventDefault(); // Prevent submit
		const reg = getReg();
		// Check empty fields
		if (
			$j('#register .error-req').css('display') != 'none' ||
			$j('#register .error-req').css('visibility') != 'hidden'
		) {
			// 'element' is hidden
			$j('#register .error-req').hide();
			$j('#register .error-req-message').hide();
		}
		if (reg.username == '' || reg.email == '' || reg.password == '' || reg.passwordmatch == '') {
			$j('#register .error-req').show();
			$j('#register .error-req-message').show();
			return;
		}
		if (
			$j('.error-pw-length').css('display') != 'none' ||
			$j('.error-pw-length').css('visibility') != 'hidden'
		) {
			// 'element' is hidden
			$j('.error-pw-length').hide();
		}

		// Password length
		if (reg.password.split('').length < 8) {
			$j('.error-pw-length').show();
			return;
		}
		// Password match
		if ($j('.error-pw').css('display') != 'none' || $j('.error-pw').css('visibility') != 'hidden') {
			// 'element' is hidden
			$j('.error-pw').hide();
		}
		if (reg.password != reg.passwordmatch) {
			$j('.error-pw').show();
			return;
		}
		const auth = new Authenticate(reg, connect.client);
		const session = await auth.register();
		const sess = new SessionI(session);
		sess.storeSession();
		G.session = session;
		G.client = connect.client;
		G.multiplayer = true;
		$j('.setupFrame,.welcome').show();
		$j('.match-frame').show();
		$j('.loginregFrame,#gameSetup').hide();
		$j('.user').text(session.username);
		console.log('new user created.' + session);
		return false; // Prevent submit
	}
	$j('form#register').on('submit', register);

	async function login(e) {
		e.preventDefault(); // Prevent submit
		const login = getLogin();
		let session;
		$j('#login .login-error-req-message').hide();
		if (login.email == '' || login.password == '') {
			$j('#login .error-req').show();
			$j('#login .error-req-message').show();
			return;
		}
		// Check empty fields
		if (
			$j('#login .error-req').css('display') != 'none' ||
			$j('#login .error-req').css('visibility') != 'hidden'
		) {
			// 'element' is hidden
			$j('#login .error-req').hide();
			$j('#login .error-req-message').hide();
		}
		const auth = new Authenticate(login, connect.client);
		try {
			session = await auth.authenticateEmail();
		} catch (error) {
			$j('#login .login-error-req-message').show();
			return;
		}

		const sess = new SessionI(session);
		sess.storeSession();
		G.session = session;
		G.client = connect.client;
		G.multiplayer = true;

		$j('.setupFrame,.welcome').show();
		$j('.match-frame').show();
		$j('.loginregFrame,#gameSetup').hide();
		$j('.user').text(session.username);
		return false; // Prevent submit
	}
	// Login form
	$j('form#login').on('submit', login);
	$j('#startMatchButton').on('click', () => {
		G.loadGame(getGameConfig(), true);
		return false;
	});

	$j('#joinMatchButton').on('click', () => {
		//TODO move to match data received
		$j('.lobby').show();
		$j('.setupFrame').hide();
		G.matchJoin();
		return false;
	});

	$j('#backFromMatchButton').on('click', () => {
		$j('.lobby').hide();
		$j('.setupFrame,.welcome').show();
	});

	$j('#refreshMatchButton').on('click', () => {
		G.updateLobby();
	});

	// Add AI recommendation button handler
	$j('#aiRecommend').on('click', async () => {
		const game = G; // Current game instance
		const activeUnit = game.activeCreature;
		
		if (!activeUnit) {
			console.log("No active unit selected");
			return;
		}

		// Show loading state
		$j('#aiRecommend').addClass('disabled');
		
		const ai = new OllamaAIIntegration();
		try {
			// Get current game state
			const turnState = game.stateCapture.captureTurnState(game.turn);
			
			// Convert TurnState to GameState
			const gameState: GameState = {
				turn: game.turn,
				activeTeam: game.activePlayer.id,
				units: game.creatures.map(creature => ({
					id: creature.id,
					name: creature.name,
					health: creature.health,
					maxHealth: creature.stats.health,
					energy: creature.energy,
					maxEnergy: creature.stats.energy,
					endurance: creature.endurance,
					maxEndurance: creature.stats.endurance,
					position: {
						x: creature.x,
						y: creature.y
					},
					abilities: creature.abilities.map(ability => ({
						name: ability.title,
						energyCost: ability.costs ? ability.costs.energy : 0,
						cooldown: ability.timesUsed || 0,
						currentCooldown: ability.used ? 1 : 0
					})),
					effects: creature.effects.map(effect => ({
						name: effect.name as string,
						duration: effect.turnLifetime as number,
						type: effect.debuff ? 'debuff' as const : 'buff' as const
					}))
				})),
				objectives: [],
				terrain: [],
				getUnitByProfile(profile: UnitProfile): Unit | undefined {
					const creature = game.creatures.find(c => c.name === profile.name);
					if (!creature) return undefined;
					return {
						id: creature.id,
						name: creature.name,
						health: creature.health,
						maxHealth: creature.stats.health,
						energy: creature.energy,
						maxEnergy: creature.stats.energy,
						endurance: creature.endurance,
						maxEndurance: creature.stats.endurance,
						position: { x: creature.x, y: creature.y },
						abilities: creature.abilities.map(ability => ({
							name: ability.title,
							energyCost: ability.costs ? ability.costs.energy : 0,
							cooldown: ability.timesUsed || 0,
							currentCooldown: ability.used ? 1 : 0
						})),
						effects: creature.effects.map(effect => ({
							name: effect.name as string,
							duration: effect.turnLifetime as number,
							type: effect.debuff ? 'debuff' as const : 'buff' as const
						}))
					};
				},
				getUnitById(id: number): Unit | undefined {
					const creature = game.creatures.find(c => c.id === id);
					if (!creature) return undefined;
					return {
						id: creature.id,
						name: creature.name,
						health: creature.health,
						maxHealth: creature.stats.health,
						energy: creature.energy,
						maxEnergy: creature.stats.energy,
						endurance: creature.endurance,
						maxEndurance: creature.stats.endurance,
						position: { x: creature.x, y: creature.y },
						abilities: creature.abilities.map(ability => ({
							name: ability.title,
							energyCost: ability.costs ? ability.costs.energy : 0,
							cooldown: ability.timesUsed || 0,
							currentCooldown: ability.used ? 1 : 0
						})),
						effects: creature.effects.map(effect => ({
							name: effect.name as string,
							duration: effect.turnLifetime as number,
							type: effect.debuff ? 'debuff' as const : 'buff' as const
						}))
					};
				},
				getUnitsInRange(pos: { x: number; y: number }, range: number): Unit[] {
					return game.creatures
						.filter(c => Math.abs(c.x - pos.x) <= range && Math.abs(c.y - pos.y) <= range)
						.map(creature => ({
							id: creature.id,
							name: creature.name,
							health: creature.health,
							maxHealth: creature.stats.health,
							energy: creature.energy,
							maxEnergy: creature.stats.energy,
							endurance: creature.endurance,
							maxEndurance: creature.stats.endurance,
							position: { x: creature.x, y: creature.y },
							abilities: creature.abilities.map(ability => ({
								name: ability.title,
								energyCost: ability.costs ? ability.costs.energy : 0,
								cooldown: ability.timesUsed || 0,
								currentCooldown: ability.used ? 1 : 0
							})),
							effects: creature.effects.map(effect => ({
								name: effect.name as string,
								duration: effect.turnLifetime as number,
								type: effect.debuff ? 'debuff' as const : 'buff' as const
							}))
						}));
				},
				getObjectivesInRange: () => [],
				getTerrainAt: () => null,
				isValidPosition: (pos) => {
					const grid = game.grid;
					const width = grid.hexes[0].length;
					const height = grid.hexes.length;
					return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
				},
				getPathBetween: (start, end) => [],
				calculateDistance: (pos1, pos2) => Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
			};

			// Get unit profile and analysis
			const threatProfile = game.threatAnalyticsManager.getUnitProfile(activeUnit.id);
			if (!threatProfile) {
				throw new Error('Could not get unit profile');
			}

			// Create UnitProfile
			const profile: UnitProfile = {
				id: activeUnit.id,
				name: activeUnit.name,
				type: activeUnit.type,
				realm: activeUnit.realm || 'Unknown',
				size: activeUnit.size,
				comprehensiveEfficiency: 30,
				roles: {
					primary: 'Damage',
					playstyle: 'Aggressive',
					AIReasoningPlaystyleContext: 'Default aggressive playstyle'
				},
				combatMetrics: {
					damageOutput: {
						burstPotential: 0.7,
						sustainedDamage: 0.6,
						areaEffect: 0.5,
						targetSelection: 0.6
					},
					controlPower: {
						immobilization: 0.5,
						displacement: 0.5,
						debuffs: 0.5,
						zoneControl: 0.5
					},
					survivability: {
						healthPool: 0.6,
						defensiveAbilities: 0.5,
						mobilityOptions: 0.5,
						recoveryPotential: 0.5
					},
					utility: {
						resourceGeneration: 0.5,
						teamSupport: 0.5,
						mapControl: 0.5,
						comboEnablement: 0.5
					}
				},
				resourceProfile: {
					energyUsage: {
						optimal: 50,
						critical: 20,
						regeneration: 10
					},
					enduranceManagement: {
						safeThreshold: 0.7,
						riskThreshold: 0.3,
						recoveryPriority: 0.5
					}
				},
				positioningProfile: {
					optimalRange: 2,
					formationPlacement: {
						frontline: 0.5,
						midline: 0.5,
						backline: 0.5
					},
					zonePreferences: {
						center: 0.5,
						flank: 0.5,
						defensive: 0.5
					}
				},
				abilityProfile: {},
				matchupProfile: {
					strongAgainst: [],
					weakAgainst: []
				},
				synergyProfile: {
					pairs: [],
					formations: []
				}
			};

			const vulnerabilities = game.threatAnalyticsManager.getUnitVulnerabilities(activeUnit.id);
			const patterns = game.threatAnalyticsManager.getThreatPatterns();

			// Construct analysis object
			const analysis = {
				threat: {
					effectiveThreat: vulnerabilities.length > 0 ? 0.8 : 0.4,
					damageEstimate: 0,
					controlImpact: 0,
					positionalThreat: 0,
					resourceThreat: 0,
					details: {
						willKill: false,
						willDisable: false,
						willTrapTarget: false,
						willForceMovement: false,
						synergiesWithTeam: false
					}
				},
				position: {
					value: 0.5,
					factors: {
						safety: 0.5,
						control: 0.5,
						tactical: 0.5,
						mobility: 0.5
					},
					recommendations: {}
				},
				resource: {
					efficiency: {
						energy: { usage: activeUnit.energy / activeUnit.stats.energy },
						endurance: { usage: activeUnit.endurance / activeUnit.stats.endurance }
					}
				},
				pattern: {
					patterns,
					confidence: 0.7,
					frequency: 0.6,
					recommendations: []
				}
			};

			// Get available options from active creature's abilities
			const availableOptions = activeUnit.abilities
				.filter(ability => !ability.used)
				.map(ability => ({
					type: 'ability' as const,
					data: {
						id: ability.id,
						name: ability.title,
						cost: ability.costs,
						requirements: ability.requirements
					},
					preliminaryScore: 0.5
				}));

			const fullAnalysis = {
				threat: analysis.threat,
				position: analysis.position,
				resource: {
					efficiency: {
						energy: { 
							usage: analysis.resource.efficiency.energy.usage,
							regeneration: 0,
							waste: 0
						},
						plasma: {
							usage: 0,
							teamShare: 0,
							advantage: 0
						},
						endurance: {
							usage: analysis.resource.efficiency.endurance.usage,
							recovery: 0,
							risk: 0
						}
					},
					timing: {
						energyTiming: 0,
						plasmaTiming: 0,
						enduranceTiming: 0
					},
					forecast: {
						energyForecast: 0,
						plasmaForecast: 0,
						fatigueForecast: false
					},
					suggestions: {
						immediate: [],
						strategic: []
					}
				},
				pattern: analysis.pattern
			};

			const result = await ai.getStrategicDecision(
				gameState,
				profile,
				fullAnalysis,
				availableOptions
			);

			// Create recommendation display
			const recommendationHtml = `
				<div id="ai-recommendations" class="framed-modal__wrapper">
					<div class="framed-modal">
						<div class="framed-modal__return">
							<button class="close-button"></button>
						</div>
						<h3>AI Strategic Recommendations</h3>
						${result.recommendedActions.map((action, index) => `
							<div class="recommendation">
								<h4>Option ${index + 1}: ${action.steps[0].data.description}</h4>
								<div class="details">
									<p><strong>Outcome:</strong> ${action.expectedOutcome.outcome || 'No specific outcome'}</p>
									<p><strong>Cost:</strong> Energy: ${action.expectedOutcome.resourceCost.energy}, Endurance: ${action.expectedOutcome.resourceCost.endurance}${action.expectedOutcome.resourceCost.plasma ? `, Plasma: ${action.expectedOutcome.resourceCost.plasma}` : ''}</p>
									<p><strong>Reasoning:</strong> ${action.reasoning[0]}</p>
								</div>
							</div>
						`).join('')}
					</div>
				</div>`;

			// Add modal to UI if it doesn't exist
			if (!$j('#ai-recommendations').length) {
				$j('#ui').append(recommendationHtml);
			} else {
				$j('#ai-recommendations').replaceWith(recommendationHtml);
			}

			// Show modal and set up close handler
			$j('#ai-recommendations')
				.removeClass('hide')
				.find('.close-button')
				.off('click')  // Remove any existing handlers
				.on('click', function() {
					$j('#ai-recommendations').addClass('hide');
				});

		} catch (error) {
			console.error('Error getting AI recommendations:', error);
			alert('Error getting AI recommendations: ' + error.message);
		} finally {
			// Reset button state
			$j('#aiRecommend').removeClass('disabled');
		}
	});

	$j('#testAI').on('click', async () => {
		const ai = new OllamaAIIntegration();
		try {
			const response = await ai.getResponse("what's it like in space?");
			alert(response);
		} catch (error) {
			alert('Error testing AI connection: ' + error.message);
		}
	});
});

/**
 * force 1 vs 1 game mode
 * should be removed after implementaion 2 vs 2 in multiplayer mode
 */
function forceTwoPlayerMode() {
	$j('#p2').trigger('click');
	$j('#p4').prop('disabled', true);
}

/**
 * get Registration.
 * @return {Object} login form.
 */
function getReg() {
	const reg = {
		username: $j('.register input[name="username"]').val() as string,
		email: $j('.register input[name="email"]').val() as string,
		password: $j('.register input[name="password"]').val() as string,
		passwordmatch: $j('.register input[name="passwordmatch"]').val() as string,
	};

	return reg;
}

/**
 * read log from file
 * @returns {Promise<string>}
 */
function readLogFromFile() {
	// TODO: This would probably be better off in ./src/utility/gamelog.ts
	return new Promise((resolve, reject) => {
		const fileInput = document.createElement('input') as HTMLInputElement;
		fileInput.accept = '.ab';
		fileInput.type = 'file';

		fileInput.onchange = (event) => {
			const file = (event.target as HTMLInputElement).files[0];
			const reader = new FileReader();

			reader.readAsText(file);

			reader.onload = () => {
				resolve(reader.result);
			};

			reader.onerror = () => {
				reject(reader.error);
			};
		};

		fileInput.click();
	});
}

/**
 * get Login.
 * @return {Object} login form.
 */
function getLogin() {
	const login = {
		email: $j('.login input[name="email"]').val(),
		password: $j('.login input[name="password"]').val(),
	};
	return login;
}

/**
 * Render the player mode text inside game form
 * @param {Boolean} isMultiPlayer Is playing in online multiplayer mode or hotSeat mode
 * @returns {Object} JQuery<HTMLElement>
 */
function renderPlayerModeType(isMultiPlayer) {
	const playerModeType = $j('#playerModeType');
	return isMultiPlayer ? playerModeType.text('[ Online ]') : playerModeType.text('[ Hotseat ]');
}

/**
 * Generate game config from form and return it.
 * @return {Object} The game config.
 */
export function getGameConfig() {
	const defaultConfig = {
		playerMode: parseInt($j('input[name="playerMode"]:checked').val() as string, 10),
		creaLimitNbr: parseInt($j('input[name="activeUnits"]:checked').val() as string, 10), // DP counts as One
		unitDrops: parseInt($j('input[name="unitDrops"]:checked').val() as string, 10),
		abilityUpgrades: parseInt($j('input[name="abilityUpgrades"]:checked').val() as string, 10),
		plasma_amount: parseInt($j('input[name="plasmaPoints"]:checked').val() as string, 10),
		turnTimePool: parseInt($j('input[name="turnTime"]:checked').val() as string, 10),
		timePool: parseInt($j('input[name="timePool"]:checked').val() as string, 10) * 60,
		background_image: $j('input[name="combatLocation"]:checked').val(),
		combatLocation: $j('input[name="combatLocation"]:checked').val(),
		fullscreenMode: $j('#fullscreen').hasClass('fullscreenMode'),
	};
	return defaultConfig;
}

/**
 * Return true if an object has no keys.
 * @param {Object} obj The object to test.
 * @return {boolean} Empty or not.
 */
export function isEmpty(obj) {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			return false;
		}
	}

	return true;
}
