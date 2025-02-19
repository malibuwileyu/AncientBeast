import { ThreatAnalyticsManager } from '../../metrics/analysis/ThreatAnalyticsManager';
import Game from '../../game';
import { Creature } from '../../creature';
import { Ability } from '../../ability';
import { Effect } from '../../effect';
import { CreatureType, Unit } from '../../data/types';
import { PlayerID } from '../../player';

jest.mock('../../game');
jest.mock('../../creature');
jest.mock('../../ability');
jest.mock('../../effect');

describe('ThreatAnalyticsManager', () => {
    let manager: ThreatAnalyticsManager;
    let mockGame: jest.Mocked<Game>;
    let mockCreature: jest.Mocked<Creature>;
    let mockAbility: jest.Mocked<Ability>;
    let mockEffect: jest.Mocked<Effect>;

    beforeEach(() => {
        // Setup mock game
        mockGame = new Game() as jest.Mocked<Game>;
        mockGame.signals = {
            creature: {
                add: jest.fn(),
                dispatch: jest.fn()
            }
        };
        mockGame.creatures = [];
        mockGame.turn = 1;

        // Setup mock creature with required data
        const creatureData: Unit & {
            x: number;
            y: number;
            team: PlayerID;
            temp: boolean;
            display: {
                width: 108;
                height: 200;
                'offset-x': 0;
                'offset-y': -164;
            };
        } = {
            id: 0,
            name: "Dark Priest",
            playable: true,
            level: "-",
            realm: "-",
            size: 1,
            stats: {
                health: 100,
                regrowth: 1,
                endurance: 60,
                energy: 100,
                meditation: 25,
                initiative: 50,
                offense: 3,
                defense: 3,
                movement: 2,
                pierce: 2,
                slash: 2,
                crush: 2,
                shock: 2,
                burn: 2,
                frost: 2,
                poison: 2,
                sonic: 2,
                mental: 30
            },
            animation: {
                walk_speed: 500
            },
            display: {
                width: 108,
                height: 200,
                'offset-x': 0,
                'offset-y': -164
            },
            ability_info: [
                {
                    title: 'Plasma Field',
                    desc: 'Protects from most harmful abilities when the unit is not currently active.',
                    info: '-1 plasma for each countered attack.',
                    upgrade: '9 pure damage counter hit.',
                    costs: {
                        plasma: 1,
                        special: 'per countered attack'
                    },
                    requirements: {
                        plasma: 1
                    }
                },
                {
                    title: 'Electro Shocker',
                    desc: 'Does shock damage to a nearby unit. More effective versus larger enemies.',
                    info: '12 shock damage × unit hexagon size.',
                    upgrade: 'The range is increased to 4.',
                    damages: {
                        shock: '12 × creature size'
                    },
                    costs: {
                        energy: 20
                    }
                },
                {
                    title: 'Disruptor Beam',
                    desc: 'Does pure damage to a nearby unit, based on its missing health points.',
                    info: 'Plasma cost is equal to the unit size.',
                    upgrade: 'Minimum 40 pure damage.',
                    requirements: {
                        plasma: 2,
                        energy: 20
                    },
                    damages: {
                        pure: '25 + missing health'
                    },
                    costs: {
                        energy: 20,
                        plasma: 'target unit size'
                    }
                },
                {
                    title: 'Godlet Printer',
                    desc: 'Materializes a unit within 4 hexagons that will serve and obey given orders.',
                    info: "Plasma cost equals unit's size + level.",
                    upgrade: 'Range becomes 6 hexagons.',
                    costs: {
                        energy: 20,
                        plasma: 'unit size + level'
                    }
                }
            ],
            x: 0,
            y: 0,
            team: 0 as PlayerID,
            temp: false
        };

        mockCreature = new Creature(creatureData, mockGame) as jest.Mocked<Creature>;
        mockCreature.id = 1;
        mockCreature.abilities = [];

        // Setup mock ability
        mockAbility = new Ability(mockCreature, 0, mockGame) as jest.Mocked<Ability>;
        mockAbility.damages = {
            pierce: 10,
            slash: 5
        };
        mockAbility.effects = [];

        // Setup mock effect
        mockEffect = new Effect(
            'Frozen',
            mockCreature,
            mockCreature,
            'onStartPhase',
            {
                effectFn: () => {},
                requireFn: () => true,
                alterations: {},
                turnLifetime: 1,
                deleteTrigger: 'onStartOfRound',
                stackable: true
            },
            mockGame
        ) as jest.Mocked<Effect>;

        // Initialize manager
        manager = new ThreatAnalyticsManager(mockGame);
    });

    describe('Event Handling', () => {
        it('should register event listeners on initialization', () => {
            expect(mockGame.signals.creature.add).toHaveBeenCalledTimes(3);
        });

        it('should analyze ability threats when ability is used', () => {
            const payload = {
                ability: mockAbility,
                creature: mockCreature
            };

            // Simulate ability used event
            mockGame.signals.creature.add.mock.calls[0][0]('abilityUsed', payload);

            // Get the profile and verify it was updated
            const profile = manager.getUnitProfile(mockCreature.id);
            expect(profile).toBeDefined();
            expect(profile.threatHistory.length).toBeGreaterThan(0);
        });

        it('should record damage events', () => {
            const damage = {
                attacker: mockCreature,
                damages: {
                    pierce: 15,
                    slash: 10
                }
            };

            const payload = {
                target: mockCreature,
                damage
            };

            // Simulate damage event
            mockGame.signals.creature.add.mock.calls[1][0]('damage', payload);

            // Verify damage was recorded
            const profile = manager.getUnitProfile(mockCreature.id);
            expect(profile).toBeDefined();
            expect(profile.threatHistory.length).toBeGreaterThan(0);
            expect(profile.threatHistory[0].threatResult.damage).toBe(25);
        });

        it('should record control effects', () => {
            const payload = {
                creature: mockCreature,
                effect: mockEffect
            };

            // Simulate effect attach event
            mockGame.signals.creature.add.mock.calls[2][0]('effectAttach', payload);

            // Verify effect was recorded
            const profile = manager.getUnitProfile(mockCreature.id);
            expect(profile).toBeDefined();
            expect(profile.threatHistory.length).toBeGreaterThan(0);
            expect(profile.threatHistory[0].threatResult.controlEffects.frozen).toBe(true);
        });
    });

    describe('Threat Analysis', () => {
        it('should identify positional weaknesses', () => {
            // Simulate bad positioning
            const mockThreatResult = {
                totalDamage: 0,
                controlEffects: {
                    frozen: false,
                    cryostasis: false,
                    dizzy: false,
                    immobilize: false,
                    trap: false,
                    delayed: false,
                    hindered: false,
                    materializationSickness: false,
                    noActionPossible: false
                },
                range: 1,
                hexesCount: 1,
                controlContext: {
                    positionThreat: {
                        adjacentMeleeUnits: 2,
                        rangedUnitsInRange: 1,
                        nearestAllyDistance: 3,
                        nearHazards: true,
                        movementConstraints: {
                            blockedDirections: 4,
                            cornerTrapped: true,
                            sizeLimited: false
                        },
                        boardPosition: {
                            isOnEdge: true,
                            distanceFromCenter: 3,
                            zoneControl: {
                                friendlyZones: 1,
                                enemyZones: 3,
                                contestedZones: 2
                            }
                        },
                        threatSynergy: {
                            surroundLevel: 4,
                            meleeRangedCombo: true,
                            crossfire: 3
                        }
                    },
                    unitState: {
                        currentHealth: 50,
                        maxHealth: 100,
                        healthPercentage: 50,
                        currentEnergy: 25,
                        maxEnergy: 50,
                        meditation: 5,
                        possibleAbilities: [],
                        usedAbilities: [],
                        fatigueState: {
                            isFatigued: false,
                            endurance: 50,
                            maxEndurance: 50,
                            protectedFromFatigue: false
                        },
                        offensiveCapability: {
                            offense: 3,
                            defense: 3,
                            initiative: 50,
                            masteries: {
                                pierce: 2,
                                slash: 2,
                                crush: 2,
                                shock: 2,
                                burn: 2,
                                frost: 2,
                                poison: 2,
                                sonic: 2,
                                mental: 30
                            }
                        }
                    },
                    tacticalState: {
                        turnsUntilAction: 2,
                        escapeRoutesCount: 1,
                        incomingDamage: 30,
                        plasmaAvailable: false,
                        movementOptions: {
                            totalSpaces: 3,
                            safeSpaces: 1,
                            optimalSpaces: 0
                        },
                        queueState: {
                            nextActiveEnemy: 2,
                            alliesBeforeEnemy: 0,
                            queueAdvantage: false
                        },
                        resourceState: {
                            teamPlasma: 0,
                            enemyPlasma: 2,
                            plasmaAdvantage: false
                        },
                        abilityTiming: {
                            criticalAbilitiesUsed: [],
                            comboSetupPotential: false,
                            counterplayAvailable: false
                        }
                    }
                }
            };

            for (let i = 0; i < 3; i++) {
                manager['recordThreatSnapshot']({
                    timestamp: Date.now(),
                    turnNumber: mockGame.turn,
                    roundNumber: 1,
                    targetId: mockCreature.id,
                    sourceId: 2,
                    threatResult: mockThreatResult
                });
            }

            const vulnerabilities = manager.getUnitVulnerabilities(mockCreature.id);
            expect(vulnerabilities).toContain('Poor positioning');
        });
    });

    describe('Pattern Detection', () => {
        it('should detect control + damage combo patterns', () => {
            // Simulate control + damage pattern
            const damage = {
                attacker: mockCreature,
                damages: {
                    pierce: 15
                }
            };

            for (let i = 0; i < 3; i++) {
                // Add control effect
                const effectPayload = {
                    creature: mockCreature,
                    effect: mockEffect
                };
                mockGame.signals.creature.add.mock.calls[2][0]('effectAttach', effectPayload);

                // Add damage
                const damagePayload = {
                    target: mockCreature,
                    damage
                };
                mockGame.signals.creature.add.mock.calls[1][0]('damage', damagePayload);
            }

            const patterns = manager.getThreatPatterns();
            const controlDamagePattern = patterns.find(p => p.pattern === 'Control + Damage Combo');
            expect(controlDamagePattern).toBeDefined();
            expect(controlDamagePattern.frequency).toBeGreaterThan(0);
        });
    });
}); 