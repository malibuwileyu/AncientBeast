import { Ability } from '../../ability';
import { getPointFacade } from '../../utility/pointfacade';
import { Creature } from '../../creature';
import { Hex } from '../../utility/hex';

// Control effect severity rankings (higher = more threatening)
export enum ControlSeverity {
    MINOR = 1,      // Minor inconvenience (e.g., slight delay)
    MODERATE = 2,   // Moderate impact (e.g., hindered movement)
    SEVERE = 3,     // Severe impact (e.g., immobilize, trap)
    CRITICAL = 4    // Complete control loss (e.g., frozen + nearby threats)
}

export interface ControlContext {
    positionThreat: {
        adjacentMeleeUnits: number;    // Number of melee units that can attack
        rangedUnitsInRange: number;    // Number of ranged units that can attack
        nearestAllyDistance: number;   // Distance to closest friendly unit
        nearHazards: boolean;          // Proximity to traps or drops
        movementConstraints: {         // Factors limiting movement
            blockedDirections: number; // Number of blocked cardinal directions
            cornerTrapped: boolean;    // Whether unit is trapped in a corner
            sizeLimited: boolean;      // Whether unit size limits available positions
        };
        boardPosition: {
            isOnEdge: boolean;         // Limited movement options on board edge
            distanceFromCenter: number; // Strategic value/vulnerability
            zoneControl: {
                friendlyZones: number;  // Number of hexes controlled by allies
                enemyZones: number;     // Number of hexes controlled by enemies
                contestedZones: number; // Number of contested hexes
            };
        };
        threatSynergy: {
            meleeRangedCombo: boolean; // Threatened by both melee and ranged
            crossfire: number;         // Number of directions being threatened from
            surroundLevel: number;     // Degree of encirclement (0-6 directions)
        };
    };
    
    unitState: {
        currentHealth: number;         // Absolute health value
        maxHealth: number;            // Maximum health pool
        healthPercentage: number;     // Current health percentage
        currentEnergy: number;        // Current energy value
        maxEnergy: number;           // Maximum energy pool
        meditation: number;          // Energy regen per turn
        possibleAbilities: {         // Abilities that could be used
            id: number;
            name: string;
            energyCost: number;
        }[];
        usedAbilities: {            // Abilities already used
            id: number;
            name: string;
        }[];
        fatigueState: {
            isFatigued: boolean;      // Current fatigue status
            endurance: number;        // Current endurance
            maxEndurance: number;     // Max endurance
            protectedFromFatigue: boolean;
        };
        offensiveCapability: {
            offense: number;          // Offense stat
            defense: number;          // Defense stat
            initiative: number;       // Initiative stat
            masteries: {             // Damage type masteries
                pierce: number;
                slash: number;
                crush: number;
                shock: number;
                burn: number;
                frost: number;
                poison: number;
                sonic: number;
                mental: number;
            };
        };
    };
    
    tacticalState: {
        turnsUntilAction: number;     // Turns before next action
        escapeRoutesCount: number;    // Number of safe movement options
        incomingDamage: number;       // Projected damage from threats
        plasmaAvailable: boolean;     // Whether plasma can be used
        movementOptions: {            // Detailed movement analysis
            totalSpaces: number;      // Total spaces unit could move to
            safeSpaces: number;       // Spaces outside of enemy threat range
            optimalSpaces: number;    // Spaces that improve position
        };
        queueState: {
            nextActiveEnemy: number;    // Turns until next enemy acts
            alliesBeforeEnemy: number;  // Allies that act before next enemy
            queueAdvantage: boolean;    // Whether queue position is favorable
        };
        resourceState: {
            teamPlasma: number;         // Team's total plasma
            enemyPlasma: number;        // Enemy team's plasma
            plasmaAdvantage: boolean;   // Whether team has plasma advantage
        };
        abilityTiming: {
            criticalAbilitiesUsed: string[];  // Key abilities on cooldown
            comboSetupPotential: boolean;     // Can set up ability combos
            counterplayAvailable: boolean;     // Has defensive options
        };
    };
}

export interface AbilityThreatResult {
    totalDamage: number;
    controlEffects: {
        frozen: boolean;
        cryostasis: boolean;  // Enhanced version of frozen
        dizzy: boolean;
        immobilize: boolean;
        trap: boolean;
        delayed: boolean;     // Turn delay
        hindered: boolean;    // Delayed from attack
        materializationSickness: boolean;
        noActionPossible: boolean;
    };
    controlContext?: ControlContext; // Added situational analysis
    range: number;
    hexesCount: number;
}

export class AbilityThreatAnalyzer {
    public analyzeAbility(ability: Ability, target?: Creature): AbilityThreatResult {
        const baseAnalysis: AbilityThreatResult = {
            totalDamage: this.calculateTotalDamage(ability),
            controlEffects: this.analyzeControlEffects(ability),
            range: this.calculateRange(ability),
            hexesCount: this.calculateHexCount(ability)
        };

        // Add situational control analysis if we have a target
        if (target && this.hasControlEffects(baseAnalysis.controlEffects)) {
            baseAnalysis.controlContext = this.analyzeControlContext(ability, target, baseAnalysis.controlEffects);
        }

        return baseAnalysis;
    }

    private hasControlEffects(effects: AbilityThreatResult['controlEffects']): boolean {
        return Object.values(effects).some(effect => effect);
    }

    private calculateTotalDamage(ability: Ability): number {
        const damages = ability.damages;
        if (!damages) return 0;

        return Object.values(damages)
            .filter(damage => typeof damage === 'number')
            .reduce((sum, damage) => sum + damage, 0);
    }

    private analyzeControlEffects(ability: Ability): AbilityThreatResult['controlEffects'] {
        const effects = ability.effects || [];
        const special = effects.map(effect => effect.special?.toLowerCase() || '');

        // Check for effects that make target unmovable
        const hasImmobilize = special.some(s => 
            s.includes('immobilize') || 
            s.includes('root') || 
            s.includes('cannot move')
        );

        // Check for frozen and its enhanced version (cryostasis)
        const hasFrozen = special.some(s => s.includes('frozen'));
        const hasCryostasis = hasFrozen && special.some(s => s.includes('cryostasis'));

        return {
            frozen: hasFrozen,
            cryostasis: hasCryostasis,
            dizzy: special.some(s => s.includes('dizzy')),
            immobilize: hasImmobilize,
            trap: special.some(s => s.includes('trap')),
            delayed: special.some(s => s.includes('delay')),
            hindered: special.some(s => s.includes('hinder')),
            materializationSickness: special.some(s => s.includes('materializationsickness')),
            noActionPossible: special.some(s => s.includes('noaction'))
        };
    }

    private analyzeControlContext(
        ability: Ability, 
        target: Creature, 
        effects: AbilityThreatResult['controlEffects']
    ): ControlContext {
        return {
            positionThreat: this.analyzePositionThreat(target),
            unitState: this.analyzeUnitState(target),
            tacticalState: this.analyzeTacticalState(target, effects)
        };
    }

    private analyzePositionThreat(target: Creature): ControlContext['positionThreat'] {
        const adjacentHexes = target.adjacentHexes(2); // 2 hex radius
        let meleeCount = 0;
        let rangedCount = 0;
        let nearestAllyDist = Infinity;
        let hasHazards = false;
        
        // Track blocked directions
        let blockedDirections = 0;
        const directions = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1]];
        let cornerBlocked = 0;
        
        // Track threat directions and surround status
        const threatDirections = new Set<string>();
        let surroundCount = 0;
        
        // Track zone control
        let friendlyZones = 0;
        let enemyZones = 0;
        let contestedZones = 0;
        
        // Check each hex in range
        adjacentHexes.forEach(hex => {
            // Check for hazards
            if (hex.trap || hex.drop) {
                hasHazards = true;
            }

            // Count enemy units and track threat directions
            const creatures = hex.creature ? [hex.creature] : [];
            creatures.forEach(creature => {
                if (!creature) return;
                
                const distance = Math.max(
                    Math.abs(creature.x - target.x),
                    Math.abs(creature.y - target.y)
                );
                
                const direction = Math.atan2(creature.y - target.y, creature.x - target.x);
                const directionKey = Math.round(direction * 4 / Math.PI) * Math.PI / 4;

                if (creature.team !== target.team) {
                    // Classify as melee or ranged based on their abilities
                    const hasMeleeAbility = creature.abilities.some(a => 
                        !a.used && a.range && a.range.regular === 1
                    );
                    if (distance === 1 && hasMeleeAbility) {
                        meleeCount++;
                        surroundCount++;
                        threatDirections.add(directionKey.toString());
                    } else {
                        rangedCount++;
                        threatDirections.add(directionKey.toString());
                    }
                } else if (creature.id !== target.id) {
                    // Track nearest ally
                    nearestAllyDist = Math.min(nearestAllyDist, distance);
                }
            });

            // Track zone control
            if (hex.creature) {
                if (hex.creature.team === target.team) {
                    friendlyZones++;
                } else {
                    enemyZones++;
                }
                // Check if hex is contested
                const adjacentToHex = target.adjacentHexes(1);
                const hasEnemyAdjacent = adjacentToHex.some(adjHex => {
                    const creatures = getPointFacade().getCreaturesAt(adjHex);
                    return creatures.some(c => c && c.team !== hex.creature.team);
                });
                if (hasEnemyAdjacent) {
                    contestedZones++;
                }
            }
        });

        // Check for blocked directions and corner trapping
        directions.forEach(([dx, dy]) => {
            const checkHex = target.game.grid.hexes[target.y + dy]?.[target.x + dx];
            if (!checkHex || checkHex.creature || checkHex.trap || checkHex.drop) {
                blockedDirections++;
                if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                    cornerBlocked++;
                }
            }
        });

        // Calculate board position metrics
        const grid = target.game.grid;
        const isOnEdge = target.x === 0 || target.y === 0 || 
                        !grid.hexes[target.y + 1] || !grid.hexes[target.y][target.x + 1];
        const centerX = Math.floor(grid.hexes[0].length / 2);
        const centerY = Math.floor(grid.hexes.length / 2);
        const distanceFromCenter = Math.max(
            Math.abs(target.x - centerX),
            Math.abs(target.y - centerY)
        );

        // Check if unit size limits available positions
        const sizeLimited = target.size > 1 && blockedDirections > 2;

        return {
            adjacentMeleeUnits: meleeCount,
            rangedUnitsInRange: rangedCount,
            nearestAllyDistance: nearestAllyDist === Infinity ? -1 : nearestAllyDist,
            nearHazards: hasHazards,
            movementConstraints: {
                blockedDirections,
                cornerTrapped: cornerBlocked >= 2,
                sizeLimited
            },
            boardPosition: {
                isOnEdge,
                distanceFromCenter,
                zoneControl: {
                    friendlyZones,
                    enemyZones,
                    contestedZones
                }
            },
            threatSynergy: {
                meleeRangedCombo: meleeCount > 0 && rangedCount > 0,
                crossfire: threatDirections.size,
                surroundLevel: surroundCount
            }
        };
    }

    private analyzeUnitState(target: Creature): ControlContext['unitState'] {
        const possibleAbilities = [];
        const usedAbilities = [];

        // Categorize abilities
        target.abilities.forEach(ability => {
            if (ability.used) {
                usedAbilities.push({
                    id: ability.id,
                    name: ability.title
                });
            } else if (ability.require && ability.require()) {
                possibleAbilities.push({
                    id: ability.id,
                    name: ability.title,
                    energyCost: ability.requirements?.energy || 0
                });
            }
        });

        return {
            currentHealth: target.health,
            maxHealth: target.stats.health,
            healthPercentage: (target.health / target.stats.health) * 100,
            currentEnergy: target.energy,
            maxEnergy: target.stats.energy,
            meditation: target.stats.meditation,
            possibleAbilities,
            usedAbilities,
            fatigueState: {
                isFatigued: target.isFatigued(),
                endurance: target.endurance,
                maxEndurance: target.stats.endurance,
                protectedFromFatigue: target.protectedFromFatigue
            },
            offensiveCapability: {
                offense: target.stats.offense,
                defense: target.stats.defense,
                initiative: target.stats.initiative,
                masteries: {
                    pierce: target.stats.pierce,
                    slash: target.stats.slash,
                    crush: target.stats.crush,
                    shock: target.stats.shock,
                    burn: target.stats.burn,
                    frost: target.stats.frost,
                    poison: target.stats.poison,
                    sonic: target.stats.sonic,
                    mental: target.stats.mental
                }
            }
        };
    }

    private analyzeTacticalState(
        target: Creature,
        effects: AbilityThreatResult['controlEffects']
    ): ControlContext['tacticalState'] {
        // Calculate turns until next action based on queue position
        const queue = target.game.queue.queue;
        const currentIndex = queue.findIndex(c => c.id === target.id);
        const turnsUntilAction = currentIndex;

        // Find next enemy action and allies before it
        let nextEnemyIndex = queue.findIndex((c, i) => 
            i > currentIndex && c.team !== target.team
        );
        if (nextEnemyIndex === -1) {
            nextEnemyIndex = queue.findIndex(c => c.team !== target.team);
        }
        
        const alliesBeforeEnemy = queue
            .slice(currentIndex + 1, nextEnemyIndex)
            .filter(c => c.team === target.team)
            .length;

        // Calculate escape routes (reusing existing method)
        const escapeRoutes = this.countEscapeOptions(target, effects);

        // Calculate incoming damage (reusing existing method but with health pool consideration)
        let incomingDamage = this.calculatePotentialDamage(target, effects);
        
        // Adjust damage threat based on health pools
        const nearbyCreatures = target.adjacentHexes(2)
            .map(hex => hex.creature)
            .filter(c => c && c.team !== target.team);
        
        nearbyCreatures.forEach(creature => {
            if (creature.stats.health > target.stats.health * 1.5) {
                // Increase perceived damage threat if enemy has significantly larger health pool
                incomingDamage *= 1.25;
            }
        });

        // Calculate movement options
        const movementRange = effects.hindered ? 1 : 
                             effects.immobilize ? 0 : 
                             target.stats.movement;
        
        const reachableHexes = target.adjacentHexes(movementRange);
        const allSpaces = this.filterValidSpacesForSize(reachableHexes, target);
        const safeSpaces = this.filterSafeSpaces(allSpaces, target);
        const optimalSpaces = this.filterOptimalSpaces(safeSpaces, target);

        // Calculate plasma state
        const teamPlasma = target.player.plasma;
        const enemyPlasma = target.game.players
            .filter(p => p.id !== target.player.id)
            .reduce((total, p) => total + p.plasma, 0);

        // Analyze ability timing
        const criticalAbilities = target.abilities
            .filter(a => a.used && (a.damages || a.effects))
            .map(a => a.title);
        
        const hasDefensiveOptions = target.abilities.some(a => 
            !a.used && a.effects?.some(e => 
                e.special?.toLowerCase().includes('shield') ||
                e.special?.toLowerCase().includes('dodge')
            )
        );

        const hasComboSetup = target.abilities.some(a => 
            !a.used && a.effects?.some(e => 
                e.special?.toLowerCase().includes('trap') ||
                e.special?.toLowerCase().includes('buff')
            )
        );

        return {
            turnsUntilAction: Math.max(0, turnsUntilAction),
            escapeRoutesCount: escapeRoutes,
            incomingDamage,
            plasmaAvailable: target.hasCreaturePlayerGotPlasma(),
            movementOptions: {
                totalSpaces: allSpaces.length,
                safeSpaces: safeSpaces.length,
                optimalSpaces: optimalSpaces.length
            },
            queueState: {
                nextActiveEnemy: nextEnemyIndex - currentIndex,
                alliesBeforeEnemy,
                queueAdvantage: alliesBeforeEnemy > 0
            },
            resourceState: {
                teamPlasma,
                enemyPlasma,
                plasmaAdvantage: teamPlasma > enemyPlasma
            },
            abilityTiming: {
                criticalAbilitiesUsed: criticalAbilities,
                comboSetupPotential: hasComboSetup,
                counterplayAvailable: hasDefensiveOptions
            }
        };
    }

    private calculateControlSeverity(effects: AbilityThreatResult['controlEffects']): ControlSeverity {
        if (effects.cryostasis || effects.noActionPossible) {
            return ControlSeverity.CRITICAL;
        }
        if (effects.frozen || effects.immobilize || effects.trap) {
            return ControlSeverity.SEVERE;
        }
        if (effects.dizzy || effects.delayed || effects.materializationSickness) {
            return ControlSeverity.MODERATE;
        }
        if (effects.hindered) {
            return ControlSeverity.MINOR;
        }
        return ControlSeverity.MINOR;
    }

    private countNearbyThreats(target: Creature): number {
        // Get all creatures in adjacent hexes
        const adjacentHexes = target.adjacentHexes(2); // Check 2 hex radius
        let threatCount = 0;

        adjacentHexes.forEach(hex => {
            const creatures = getPointFacade().getCreaturesAt(hex);
            creatures.forEach(creature => {
                if (creature && creature.team !== target.team) {
                    // Weight melee units higher when adjacent
                    const distance = Math.max(
                        Math.abs(creature.x - target.x),
                        Math.abs(creature.y - target.y)
                    );
                    threatCount += distance === 1 ? 2 : 1;
                }
            });
        });

        return threatCount;
    }

    private calculatePotentialDamage(target: Creature, effects: AbilityThreatResult['controlEffects']): number {
        let potentialDamage = 0;
        const adjacentHexes = target.adjacentHexes(2);

        adjacentHexes.forEach(hex => {
            const creatures = getPointFacade().getCreaturesAt(hex);
            creatures.forEach(creature => {
                if (creature && creature.team !== target.team) {
                    // Sum up all available ability damages
                    creature.abilities.forEach(ability => {
                        if (ability.damages && !ability.used) {
                            potentialDamage += this.calculateTotalDamage(ability);
                        }
                    });
                }
            });
        });

        // Multiply damage potential based on control severity
        if (effects.cryostasis || effects.noActionPossible) {
            potentialDamage *= 2; // Most dangerous - can't do anything
        } else if (effects.frozen || effects.immobilize) {
            potentialDamage *= 1.5; // Can't move but might act
        }

        return potentialDamage;
    }

    private countEscapeOptions(target: Creature, effects: AbilityThreatResult['controlEffects']): number {
        if (effects.cryostasis || effects.noActionPossible || effects.frozen) {
            return 0; // No escape possible
        }

        // Get all hexes that could be reached after control
        const reachableHexes = target.adjacentHexes(
            effects.hindered ? 1 : 
            effects.immobilize ? 0 : 
            target.stats.movement
        );

        // Filter hexes based on safety (no enemies adjacent)
        return reachableHexes.filter(hex => {
            // Get hexes adjacent to this potential escape hex
            const adjacentToHex = target.adjacentHexes(1);
            return !adjacentToHex.some(adjHex => {
                const creatures = getPointFacade().getCreaturesAt(adjHex);
                return creatures.some(c => c && c.team !== target.team);
            });
        }).length;
    }

    private estimateControlDuration(effects: AbilityThreatResult['controlEffects']): number {
        if (effects.cryostasis) return 3; // Typically longest
        if (effects.frozen) return 2;
        if (effects.immobilize || effects.trap) return 2;
        if (effects.dizzy || effects.delayed) return 1;
        if (effects.hindered) return 1;
        return 1; // Default duration
    }

    private calculateRange(ability: Ability): number {
        if (ability.range) {
            return ability.isUpgraded() ? 
                (ability.range.upgraded || ability.range.regular) : 
                ability.range.regular;
        }
        return 1; // Default to melee range
    }

    private calculateHexCount(ability: Ability): number {
        // Get the ability's target pattern using _getTarget
        if (ability._getTarget) {
            const directions = [1, 1, 1, 1, 1, 1]; // All directions
            const pattern = ability._getTarget(directions);
            if (pattern && pattern.length > 0) {
                return pattern.length;
            }
        }
        return 1; // Single target if no pattern
    }

    private filterValidSpacesForSize(hexes: Hex[], target: Creature): Hex[] {
        // Filter hexes based on unit size
        return hexes.filter(hex => {
            if (target.size === 1) return true;
            
            // Check if all required hexes for the unit size are available
            const sizeRange = Math.floor(target.size / 2);
            for (let dx = -sizeRange; dx <= sizeRange; dx++) {
                for (let dy = -sizeRange; dy <= sizeRange; dy++) {
                    const checkHex = target.game.grid.hexes[hex.y + dy]?.[hex.x + dx];
                    if (!checkHex || checkHex.creature || checkHex.trap || checkHex.drop) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    private filterSafeSpaces(hexes: Hex[], target: Creature): Hex[] {
        return hexes.filter(hex => {
            const adjacentToHex = target.adjacentHexes(1);
            return !adjacentToHex.some(adjHex => {
                const creatures = getPointFacade().getCreaturesAt(adjHex);
                return creatures.some(c => c && c.team !== target.team);
            });
        });
    }

    private filterOptimalSpaces(hexes: Hex[], target: Creature): Hex[] {
        return hexes.filter(hex => {
            // Consider a space optimal if it:
            // 1. Increases distance from threats
            // 2. Maintains or reduces distance to allies
            // 3. Provides better positioning for abilities
            const currentThreats = this.countNearbyThreats(target);
            const potentialThreats = this.countThreatsAtPosition(hex, target);
            return potentialThreats < currentThreats;
        });
    }

    private countThreatsAtPosition(hex: Hex, target: Creature): number {
        let threatCount = 0;
        const adjacentToHex = target.adjacentHexes(2);
        
        adjacentToHex.forEach(adjHex => {
            const creatures = getPointFacade().getCreaturesAt(adjHex);
            creatures.forEach(creature => {
                if (creature && creature.team !== target.team) {
                    const distance = Math.max(
                        Math.abs(creature.x - hex.x),
                        Math.abs(creature.y - hex.y)
                    );
                    threatCount += distance === 1 ? 2 : 1;
                }
            });
        });
        
        return threatCount;
    }
} 