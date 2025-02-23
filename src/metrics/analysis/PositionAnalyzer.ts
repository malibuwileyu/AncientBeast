import { Creature } from '../../creature';
import { Ability } from '../../ability';
import { Hex } from '../../utility/hex';
import { Team } from '../../utility/team';
import Game from '../../game';

export interface PositionQuality {
    value: number;  // 0-1 scale
    factors: {
        safety: number;
        control: number;
        mobility: number;
        tactical: number;
    };
    details: {
        escapeRoutes: number;
        nearbyThreats: number;
        controlledZones: number;
        contestedZones: number;
        centerProximity: number;
        allySupport: number;
    };
}

export interface TacticalAdvantage {
    value: number;  // -1 to 1 scale (negative means disadvantage)
    factors: {
        positional: number;
        numerical: number;
        resource: number;
        momentum: number;
    };
    details: {
        zoneControl: number;
        threatBalance: number;
        resourceState: number;
        initiativeState: number;
    };
}

export interface MovementEvaluation {
    quality: PositionQuality;
    advantage: TacticalAdvantage;
    improvement: number;  // -1 to 1 scale
    suggestedMoves: Array<{
        position: { x: number; y: number };
        quality: number;
        reason: string;
    }>;
}

export class PositionAnalyzer {
    private activatedCreatureStartPosition: Map<number, { x: number; y: number }> = new Map();

    constructor(private game: Game) {}

    public trackActivation(creature: Creature): void {
        // Store initial position immediately on activation
        this.activatedCreatureStartPosition.set(creature.id, { x: creature.x, y: creature.y });
        console.log('[PositionAnalyzer] Stored initial position for creature:', {
            id: creature.id,
            name: creature.name,
            position: { x: creature.x, y: creature.y }
        });
    }

    public getStartPosition(creature: Creature): { x: number; y: number } | undefined {
        return this.activatedCreatureStartPosition.get(creature.id);
    }

    public clearStartPosition(creature: Creature): void {
        this.activatedCreatureStartPosition.delete(creature.id);
    }

    public isInRange(source: Creature, target: Creature, range: number): boolean {
        return Math.max(
            Math.abs(source.x - target.x),
            Math.abs(source.y - target.y)
        ) <= range;
    }

    public countEscapeRoutes(target: Creature): number {
        const movementRange = target.stats.movement;
        const reachableHexes = target.adjacentHexes(movementRange);
        
        // Filter hexes based on safety
        return reachableHexes.filter(hex => {
            // Check if hex is valid for movement
            if (!this.isValidMovementHex(hex, target)) {
                return false;
            }

            // Check if hex is safe from nearby threats
            return this.isHexSafe(hex, target);
        }).length;
    }

    public willBlockEscapeRoutes(source: Creature, target: Creature, ability: Ability): boolean {
        const escapeRoutes = this.countEscapeRoutes(target);
        if (escapeRoutes <= 1) return false; // Already blocked

        // Get ability's affected hexes
        const affectedHexes = this.getAbilityAffectedHexes(ability, source);
        
        // Count remaining escape routes if ability is used
        const remainingRoutes = this.countRemainingEscapeRoutes(target, affectedHexes);
        
        return remainingRoutes <= 1;
    }

    public willTrapTarget(source: Creature, target: Creature, ability: Ability): boolean {
        // Check if ability has immobilizing effects
        const hasImmobilize = ability.effects?.some(effect => 
            effect.special?.toLowerCase().includes('immobilize') ||
            effect.special?.toLowerCase().includes('root') ||
            effect.special?.toLowerCase().includes('trap')
        );

        if (!hasImmobilize) return false;

        // Get surrounding threats
        const surroundingThreats = this.countSurroundingThreats(target);
        
        // Target is considered trapped if immobilized with 2+ threats nearby
        return surroundingThreats >= 2;
    }

    public willForceMovement(ability: Ability): boolean {
        return ability.effects?.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            return special.includes('push') || 
                   special.includes('pull') || 
                   special.includes('teleport') ||
                   special.includes('swap');
        }) || false;
    }

    public checkTeamSynergies(source: Creature, target: Creature, ability: Ability): boolean {
        // Get nearby allies
        const nearbyAllies = this.getNearbyAllies(source);
        if (nearbyAllies.length === 0) return false;

        // Check for synergistic effects
        return this.hasTeamSynergy(ability, nearbyAllies);
    }

    private isValidMovementHex(hex: Hex, creature: Creature): boolean {
        // Check if hex exists and is not occupied
        if (!hex || hex.creature) return false;

        // Check for obstacles or hazards
        if (hex.trap || hex.drop) return false;

        // Check if creature size fits
        if (creature.size > 1) {
            const sizeRange = Math.floor(creature.size / 2);
            for (let dx = -sizeRange; dx <= sizeRange; dx++) {
                for (let dy = -sizeRange; dy <= sizeRange; dy++) {
                    const checkHex = creature.game.grid.hexes[hex.y + dy]?.[hex.x + dx];
                    if (!checkHex || checkHex.creature || checkHex.trap || checkHex.drop) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private isHexSafe(hex: Hex, creature: Creature): boolean {
        // Get adjacent hexes to check for threats
        const adjacentHexes = creature.adjacentHexes(1);
        
        // Check each adjacent hex for enemy threats
        return !adjacentHexes.some(adjHex => {
            if (!adjHex.creature) return false;
            return adjHex.creature.team !== creature.team;
        });
    }

    private getAbilityAffectedHexes(ability: Ability, source: Creature): Hex[] {
        if (!ability._getTarget) return [];

        const directions = [1, 1, 1, 1, 1, 1]; // All directions
        return ability._getTarget(directions) || [];
    }

    private countRemainingEscapeRoutes(target: Creature, blockedHexes: Hex[]): number {
        const movementRange = target.stats.movement;
        const reachableHexes = target.adjacentHexes(movementRange);
        
        return reachableHexes.filter(hex => {
            // Check if hex is valid and not blocked by ability
            if (!this.isValidMovementHex(hex, target)) return false;
            if (blockedHexes.some(blocked => blocked.x === hex.x && blocked.y === hex.y)) return false;

            return this.isHexSafe(hex, target);
        }).length;
    }

    private countSurroundingThreats(target: Creature): number {
        const adjacentHexes = target.adjacentHexes(2); // Check 2 hex radius
        let threatCount = 0;

        adjacentHexes.forEach(hex => {
            if (!hex.creature) return;
            if (hex.creature.team === target.team) return;

            // Weight melee units higher
            const distance = Math.max(
                Math.abs(hex.creature.x - target.x),
                Math.abs(hex.creature.y - target.y)
            );
            threatCount += distance === 1 ? 2 : 1;
        });

        return threatCount;
    }

    private getNearbyAllies(source: Creature): Creature[] {
        const nearbyHexes = source.adjacentHexes(3); // Check 3 hex radius
        const allies: Creature[] = [];

        nearbyHexes.forEach(hex => {
            if (!hex.creature) return;
            if (hex.creature.id === source.id) return;
            if (hex.creature.team === source.team) {
                allies.push(hex.creature);
            }
        });

        return allies;
    }

    private hasTeamSynergy(ability: Ability, allies: Creature[]): boolean {
        // Check for buff/support effects
        const isSupport = ability.effects?.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            return special.includes('buff') || 
                   special.includes('heal') || 
                   special.includes('shield') ||
                   special.includes('protect');
        });

        if (isSupport) return true;

        // Check for combo potential with ally abilities
        return allies.some(ally => {
            return ally.abilities.some(allyAbility => {
                return this.checkAbilityCombo(ability, allyAbility);
            });
        });
    }

    private checkAbilityCombo(ability1: Ability, ability2: Ability): boolean {
        // Check for damage amplification
        const hasDamageAmp = ability1.effects?.some(effect => 
            effect.special?.toLowerCase().includes('vulnerable') ||
            effect.special?.toLowerCase().includes('weakness')
        );

        // Check for control effects that enable combos
        const hasSetup = ability1.effects?.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            return special.includes('trap') ||
                   special.includes('immobilize') ||
                   special.includes('pull') ||
                   special.includes('push');
        });

        // Check if second ability can capitalize on the setup
        const canFollowUp = Boolean(ability2.damages) || ability2.effects?.some(effect => {
            const special = effect.special?.toLowerCase() || '';
            return special.includes('execute') ||
                   special.includes('bonus') ||
                   special.includes('chain');
        });

        return (hasDamageAmp || hasSetup) && canFollowUp;
    }

    public evaluatePosition(creature: Creature): PositionQuality {
        const escapeRoutes = this.countEscapeRoutes(creature);
        const nearbyThreats = this.countNearbyThreats(creature);
        const controlledZones = this.countControlledZones(creature);
        const contestedZones = this.countContestedZones(creature);
        const centerProximity = this.calculateCenterProximity(creature);
        const allySupport = this.calculateAllySupport(creature);

        // Calculate factor scores (0-1 scale)
        const safety = Math.min(1, escapeRoutes / 6) * (1 - Math.min(1, nearbyThreats / 4));
        const control = (controlledZones - contestedZones) / Math.max(1, controlledZones + contestedZones);
        const mobility = escapeRoutes / 8; // Normalize by maximum possible escape routes
        const tactical = (centerProximity + allySupport) / 2;

        return {
            value: (safety * 0.4 + control * 0.3 + mobility * 0.2 + tactical * 0.1),
            factors: { safety, control, mobility, tactical },
            details: {
                escapeRoutes,
                nearbyThreats,
                controlledZones,
                contestedZones,
                centerProximity,
                allySupport
            }
        };
    }

    public evaluateMovement(creature: Creature, from: { x: number; y: number }, to: { x: number; y: number }): MovementEvaluation {
        // Store current position
        const currentX = creature.x;
        const currentY = creature.y;

        // Temporarily move creature to evaluate positions
        creature.x = from.x;
        creature.y = from.y;
        const beforeQuality = this.evaluatePosition(creature);
        const beforeAdvantage = this.calculateTacticalAdvantage(creature);

        creature.x = to.x;
        creature.y = to.y;
        const afterQuality = this.evaluatePosition(creature);
        const afterAdvantage = this.calculateTacticalAdvantage(creature);

        // Restore original position
        creature.x = currentX;
        creature.y = currentY;

        // Calculate improvement (-1 to 1 scale)
        const improvement = afterQuality.value - beforeQuality.value;

        // Find better moves
        const suggestedMoves = this.findBetterMoves(creature, from, afterQuality.value);

        return {
            quality: afterQuality,
            advantage: afterAdvantage,
            improvement,
            suggestedMoves
        };
    }

    private calculateTacticalAdvantage(creature: Creature): TacticalAdvantage {
        // Calculate zone control
        const teamZones = this.countTeamControlledZones(creature.team);
        const enemyZones = this.countTeamControlledZones((creature.team + 1) % 2);
        const zoneControl = (teamZones - enemyZones) / Math.max(1, teamZones + enemyZones);

        // Calculate threat balance
        const teamThreats = this.countTeamThreats(creature.team);
        const enemyThreats = this.countTeamThreats((creature.team + 1) % 2);
        const threatBalance = (teamThreats - enemyThreats) / Math.max(1, teamThreats + enemyThreats);

        // Calculate resource state
        const teamResources = this.calculateTeamResources(creature.team);
        const enemyResources = this.calculateTeamResources((creature.team + 1) % 2);
        const resourceState = (teamResources - enemyResources) / Math.max(1, teamResources + enemyResources);

        // Calculate initiative state
        const initiativeState = this.calculateInitiativeAdvantage(creature.team);

        // Calculate factor scores
        const positional = zoneControl;
        const numerical = threatBalance;
        const resource = resourceState;
        const momentum = initiativeState;

        return {
            value: (positional * 0.4 + numerical * 0.3 + resource * 0.2 + momentum * 0.1),
            factors: { positional, numerical, resource, momentum },
            details: { zoneControl, threatBalance, resourceState, initiativeState }
        };
    }

    private findBetterMoves(creature: Creature, from: { x: number; y: number }, currentQuality: number): Array<{ position: { x: number; y: number }; quality: number; reason: string }> {
        const betterMoves: Array<{ position: { x: number; y: number }; quality: number; reason: string }> = [];
        const reachableHexes = creature.adjacentHexes(creature.stats.movement);

        reachableHexes.forEach(hex => {
            if (!this.isValidMovementHex(hex, creature)) return;

            // Temporarily move creature to evaluate position
            const originalX = creature.x;
            const originalY = creature.y;
            creature.x = hex.x;
            creature.y = hex.y;

            const quality = this.evaluatePosition(creature).value;
            if (quality > currentQuality) {
                betterMoves.push({
                    position: { x: hex.x, y: hex.y },
                    quality,
                    reason: this.explainPositionImprovement(from, { x: hex.x, y: hex.y }, creature)
                });
            }

            // Restore original position
            creature.x = originalX;
            creature.y = originalY;
        });

        // Sort by quality descending
        return betterMoves.sort((a, b) => b.quality - a.quality);
    }

    private countTeamControlledZones(team: number): number {
        return this.game.grid.hexes.flat().filter(hex => 
            hex.creature?.team === team || this.isHexControlledByTeam(hex, team)
        ).length;
    }

    private countTeamThreats(team: number): number {
        return this.game.creatures
            .filter(c => c.team === team && !c.dead)
            .reduce((sum, c) => sum + this.calculateThreatValue(c), 0);
    }

    private calculateTeamResources(team: number): number {
        return this.game.creatures
            .filter(c => c.team === team && !c.dead)
            .reduce((sum, c) => sum + (c.energy / c.stats.energy) + (c.health / c.stats.health), 0);
    }

    private calculateInitiativeAdvantage(team: number): number {
        const queue = this.game.queue.queue;
        const teamPositions = queue
            .map((c, i) => ({ creature: c, position: i }))
            .filter(item => item.creature.team === team);
        const averagePosition = teamPositions.reduce((sum, item) => sum + item.position, 0) / teamPositions.length;
        return 1 - (averagePosition / queue.length); // 1 = best (early in queue), 0 = worst (late in queue)
    }

    private calculateThreatValue(creature: Creature): number {
        return (creature.health / creature.stats.health) * // Health percentage
               (creature.energy / creature.stats.energy) * // Energy percentage
               (creature.stats.offense / 10) * // Offensive capability
               (1 + creature.abilities.filter(a => !a.used).length / 4); // Available abilities bonus
    }

    private calculateCenterProximity(creature: Creature): number {
        const centerX = Math.floor(this.game.grid.hexes[0].length / 2);
        const centerY = Math.floor(this.game.grid.hexes.length / 2);
        const maxDistance = Math.max(centerX, centerY);
        const distance = Math.max(
            Math.abs(creature.x - centerX),
            Math.abs(creature.y - centerY)
        );
        return 1 - (distance / maxDistance); // 1 = at center, 0 = at edge
    }

    private calculateAllySupport(creature: Creature): number {
        const nearbyAllies = this.game.creatures
            .filter(c => c.team === creature.team && c !== creature && !c.dead)
            .filter(c => Math.max(
                Math.abs(c.x - creature.x),
                Math.abs(c.y - creature.y)
            ) <= 2)
            .length;
        return Math.min(1, nearbyAllies / 3); // Normalize to 0-1, max benefit from 3 nearby allies
    }

    private countNearbyThreats(creature: Creature): number {
        return this.game.creatures
            .filter(c => c.team !== creature.team && !c.dead)
            .filter(c => Math.max(
                Math.abs(c.x - creature.x),
                Math.abs(c.y - creature.y)
            ) <= 2)
            .length;
    }

    private isHexControlledByTeam(hex: Hex, team: number): boolean {
        const adjacentCreatures = this.game.creatures
            .filter(c => !c.dead && c.team === team)
            .filter(c => Math.max(
                Math.abs(c.x - hex.x),
                Math.abs(c.y - hex.y)
            ) <= 1);
        return adjacentCreatures.length > 0;
    }

    private explainPositionImprovement(from: { x: number; y: number }, to: { x: number; y: number }, creature: Creature): string {
        const reasons: string[] = [];

        // Check if moving away from threats
        if (this.countNearbyThreats(creature) < this.countThreatsAtPosition(from, creature)) {
            reasons.push("Reduces nearby threats");
        }

        // Check if improving escape routes
        const currentEscapes = this.countEscapeRoutes(creature);
        creature.x = from.x;
        creature.y = from.y;
        const previousEscapes = this.countEscapeRoutes(creature);
        creature.x = to.x;
        creature.y = to.y;
        if (currentEscapes > previousEscapes) {
            reasons.push("Increases escape options");
        }

        // Check if improving center control
        if (this.calculateCenterProximity(creature) > this.calculateCenterProximityAtPosition(from)) {
            reasons.push("Better board position");
        }

        // Check if improving ally support
        if (this.calculateAllySupport(creature) > this.calculateAllySupportAtPosition(from, creature)) {
            reasons.push("Better ally support");
        }

        return reasons.length > 0 ? reasons.join(", ") : "Generally better position";
    }

    private countThreatsAtPosition(pos: { x: number; y: number }, creature: Creature): number {
        const originalX = creature.x;
        const originalY = creature.y;
        creature.x = pos.x;
        creature.y = pos.y;
        const threats = this.countNearbyThreats(creature);
        creature.x = originalX;
        creature.y = originalY;
        return threats;
    }

    private calculateCenterProximityAtPosition(pos: { x: number; y: number }): number {
        const centerX = Math.floor(this.game.grid.hexes[0].length / 2);
        const centerY = Math.floor(this.game.grid.hexes.length / 2);
        const maxDistance = Math.max(centerX, centerY);
        const distance = Math.max(
            Math.abs(pos.x - centerX),
            Math.abs(pos.y - centerY)
        );
        return 1 - (distance / maxDistance);
    }

    private calculateAllySupportAtPosition(pos: { x: number; y: number }, creature: Creature): number {
        const nearbyAllies = this.game.creatures
            .filter(c => c.team === creature.team && c !== creature && !c.dead)
            .filter(c => Math.max(
                Math.abs(c.x - pos.x),
                Math.abs(c.y - pos.y)
            ) <= 2)
            .length;
        return Math.min(1, nearbyAllies / 3);
    }

    private countControlledZones(creature: Creature): number {
        return this.game.grid.hexes
            .flat()
            .filter(hex => 
                hex.creature?.team === creature.team || 
                this.isHexControlledByTeam(hex, creature.team)
            ).length;
    }

    private countContestedZones(creature: Creature): number {
        return this.game.grid.hexes
            .flat()
            .filter(hex => {
                const controllingTeam = hex.creature?.team;
                if (controllingTeam === undefined) return false;
                
                // Check if any enemy units are adjacent to this hex
                const hasEnemyAdjacent = this.game.creatures
                    .filter(c => !c.dead && c.team !== controllingTeam)
                    .some(c => Math.max(
                        Math.abs(c.x - hex.x),
                        Math.abs(c.y - hex.y)
                    ) <= 1);
                
                return hasEnemyAdjacent;
            }).length;
    }
} 