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
import { ThreatLogger } from './logging/ThreatLogger';
import { Hex } from '../../utility/hex';
import { ThreatPattern } from './types';
import { ResourceAnalyzer } from './resource/ResourceAnalyzer';

export class ThreatAnalyticsManager {
    private threatAnalyzer: ThreatAnalyzer;
    private abilityAnalyzer: AbilityAnalyzer;
    private positionAnalyzer: PositionAnalyzer;
    private unitStateAnalyzer: UnitStateAnalyzer;
    private patternAnalyzer: PatternAnalyzer;
    private profileManager: ProfileManager;
    private eventRecorder: EventRecorder;
    private cacheManager: CacheManager;
    private resourceAnalyzer: ResourceAnalyzer;
    private initialized: boolean = false;

    constructor(private game: Game) {
        console.log('[ThreatAnalyticsManager] Constructor start');
        console.log('[ThreatAnalyticsManager] Initialize method type before binding:', typeof this.initialize);
        console.log('[ThreatAnalyticsManager] Initialize method:', this.initialize);
        
        try {
            this.initializeAnalyzers();
            this.setupEventListeners();
            console.log('[ThreatAnalyticsManager] Constructor completed successfully');
            console.log('[ThreatAnalyticsManager] Initialize method type after setup:', typeof this.initialize);
            console.log('[ThreatAnalyticsManager] Initialize method after setup:', this.initialize);
            console.log('[ThreatAnalyticsManager] Initialized flag:', this.initialized);
        } catch (error) {
            console.error('[ThreatAnalyticsManager] Constructor error:', error);
            throw error;
        }
    }

    private initializeAnalyzers(): void {
        try {
            console.log('[ThreatAnalyticsManager] Starting analyzer initialization');
            
            // Initialize analyzers in dependency order
            this.cacheManager = new CacheManager();
            this.positionAnalyzer = new PositionAnalyzer(this.game);
            this.patternAnalyzer = new PatternAnalyzer();
            
            // Initialize analyzers that need game reference
            this.threatAnalyzer = new ThreatAnalyzer(this.game);
            this.abilityAnalyzer = new AbilityAnalyzer(this.game);
            this.unitStateAnalyzer = new UnitStateAnalyzer(this.game);
            this.profileManager = new ProfileManager(this.game);
            this.eventRecorder = new EventRecorder(this.game);
            this.resourceAnalyzer = new ResourceAnalyzer(this.game);

            // Bind initialize method
            console.log('[ThreatAnalyticsManager] Initialize method before binding:', this.initialize);
            this.initialize = this.initialize.bind(this);
            console.log('[ThreatAnalyticsManager] Initialize method after binding:', this.initialize);
            
            this.initialized = true;
            console.log('[ThreatAnalyticsManager] All analyzers initialized successfully');
        } catch (error) {
            console.error('[ThreatAnalyticsManager] Error initializing analyzers:', error);
            throw error;
        }
    }

    public initialize(gameId?: string): void {
        console.log('[ThreatAnalyticsManager] Initialize called with gameId:', gameId);
        console.log('[ThreatAnalyticsManager] Initialize method type at call time:', typeof this.initialize);
        console.log('[ThreatAnalyticsManager] Initialize method at call time:', this.initialize);
        console.log('[ThreatAnalyticsManager] Initialized flag at call time:', this.initialized);
        console.log('[ThreatAnalyticsManager] Game reference exists:', Boolean(this.game));
        
        if (!this.initialized) {
            console.error('[ThreatAnalyticsManager] Not properly initialized');
            return;
        }

        if (!this.game) {
            console.warn('[ThreatAnalyticsManager] Game reference missing');
            return;
        }

        try {
            // Initialize profiles for all existing creatures
            const creatures = this.game.creatures
                .filter((c): c is Creature => c !== undefined && !c.dead);
            
            console.log('[ThreatAnalyticsManager] Initializing profiles for', creatures.length, 'creatures');
            
            creatures.forEach(creature => {
                const profile = this.profileManager.getOrCreateUnitProfile(creature);
                this.profileManager.updateUnitProfile(creature, {
                    ...profile,
                    threatHistory: [{
                        timestamp: Date.now(),
                        turnNumber: this.game.turn,
                        roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
                        targetId: creature.id,
                        sourceId: creature.id,
                        threatResult: {
                            damage: 0,
                            controlEffects: {},
                            range: 1,
                            hexesAffected: 1
                        }
                    }]
                });
            });

            ThreatLogger.logPatternDetection(gameId || 'Game', 0, []);
            console.log('[ThreatAnalyticsManager] Initialize completed successfully');
        } catch (error) {
            console.error('[ThreatAnalyticsManager] Error during initialization:', error);
            throw error;
        }
    }

    private setupEventListeners(): void {
        // Ability usage events
        this.game.signals.creature.add((message: string, payload: any) => {
            // Debug log to see what events are being fired
            console.log('[ThreatAnalyticsManager] Event received:', message, payload);

            switch (message) {
                case 'abilityUsed':
                case 'abilityuse':  // Add this case to catch ability usage
                    this.handleAbilityUsed(payload);
                    break;
                case 'damage':
                    this.handleDamage(payload);
                    break;
                case 'effectAttach':
                    this.handleEffectAttach(payload);
                    break;
                case 'activate':
                    this.handleActivate(payload.creature);
                    break;
                case 'abilityend':
                    console.log('[ThreatAnalyticsManager] Ability end detected:', {
                        creature: payload.creature?.name,
                        id: payload.creature?.id,
                        abilities: payload.creature?.abilities?.map(a => ({
                            title: a.title,
                            used: a.used
                        }))
                    });
                    // Find the ability that was just used
                    if (payload.creature) {
                        const usedAbility = payload.creature.abilities.find(a => a.used);
                        if (usedAbility) {
                            // Handle the ability usage
                            this.handleAbilityUsed({
                                creature: payload.creature,
                                ability: usedAbility
                            });
                        }
                    }
                    break;
                case 'summon':
                case 'onCreatureSummon':
                    console.log('[ThreatAnalyticsManager] Summon event detected:', payload);
                    if (payload.creature) {
                        // For onCreatureSummon, the summoner is the active creature
                        const summoner = this.game.activeCreature;
                        const ability = summoner?.abilities.find(a => a.used);
                        if (summoner && ability) {
                            this.handleSummon({
                                creature: payload.creature,
                                summoner: summoner,
                                ability: ability
                            });
                        }
                    } else {
                        this.handleSummon(payload);
                    }
                    break;
                case 'movementComplete':
                    if (payload.creature && payload.hex) {
                        const from = { x: payload.creature.x, y: payload.creature.y };
                        const to = { x: payload.hex.x, y: payload.hex.y };
                        
                        console.log('[ThreatAnalyticsManager] Movement Complete:', {
                            creature: payload.creature.name,
                            id: payload.creature.id,
                            from,
                            to,
                            hex: payload.hex
                        });
                        
                        this.handleMovement(payload.creature, from, to);
                    }
                    break;
            }
        });
    }

    private handleAbilityUsed(event: { creature?: Creature; ability?: Ability }): void {
        if (!event.creature || !event.ability) return;

        const source = event.creature;
        const ability = event.ability;

        // Skip duplicate logging for summon abilities as they'll be handled by handleSummon
        if (ability.title === 'Godlet Printer') {
            return;
        }

        // Skip analysis for passive abilities
        const isPassive = this.isPassiveAbility(ability);
        if (isPassive) {
            console.log(`[ThreatAnalytics][Passive] ${source.name} passive ability ${ability.title} triggered`);
            return;
        }

        try {
            // Get ability analysis from AbilityAnalyzer
            const abilityAnalysis = this.abilityAnalyzer.analyzeAbilityUsage(source, ability);

            // Get threat analysis from ThreatAnalyzer
            const threatAnalysis = this.threatAnalyzer.analyzeThreatForTarget(source, ability, source);

            // Get unit state before and after ability use
            const beforeState = this.unitStateAnalyzer.analyzeUnitState(source);
            const beforePlasma = source.player ? source.player.plasma : 0;
            
            // Record ability usage
            this.eventRecorder.recordAbilityUsage(source, ability);

            // Get unit state after ability use
            const afterState = this.unitStateAnalyzer.analyzeUnitState(source);
            const afterPlasma = source.player ? source.player.plasma : 0;

            // Get resource analysis
            const resourceAnalysis = this.resourceAnalyzer.analyzeResourceUsage(source, ability);

            // Calculate resource changes
            const resourceChanges = {
                energy: afterState.energy.current - beforeState.energy.current,
                plasma: afterPlasma - beforePlasma,
                endurance: afterState.fatigue.endurance - beforeState.fatigue.endurance
            };

            // Special handling for Plasma Field
            if (ability.title === 'Plasma Field') {
                // Calculate potential damage mitigated based on plasma cost
                const plasmaCost = ability.costs?.plasma || 0;
                const damagePerPlasma = 9; // Base damage mitigation per plasma
                const potentialMitigation = typeof plasmaCost === 'number' ? plasmaCost * damagePerPlasma : 0;
                
                console.log(`[ThreatAnalytics][PlasmaField] ${source.name} (ID: ${source.id}):
                    Plasma Cost: ${plasmaCost}
                    Damage Mitigated: ${potentialMitigation}
                    Resource Changes: ${JSON.stringify(resourceChanges)}
                    Remaining Plasma: ${afterPlasma}
                    Mitigation Potential: ${afterPlasma * damagePerPlasma}
                    Resource Efficiency: ${resourceAnalysis.efficiency.plasma.usage.toFixed(2)}
                    Timing Quality: ${resourceAnalysis.timing.plasmaTiming.toFixed(2)}`);
                return;
            }

            // Get target information if available
            const target = ability._targets?.[0]?.creature;
            const targetInfo = target ? {
                id: target.id,
                name: target.name,
                position: { x: target.x, y: target.y }
            } : undefined;

            // Determine ability type and effects
            const abilityEffects = {
                damage: ability.damages ? Object.entries(ability.damages).map(([type, amount]) => `${type}: ${amount}`).join(', ') : 'none',
                movement: ability.title.toLowerCase().includes('move') || ability.title.toLowerCase().includes('teleport'),
                control: ability.effects?.some(e => e.special?.toLowerCase().includes('control') || e.special?.toLowerCase().includes('immobilize')) || false,
                buff: ability.effects?.some(e => e.special?.toLowerCase().includes('buff') || e.special?.toLowerCase().includes('heal')) || false,
                costs: ability.costs ? JSON.stringify(ability.costs) : 'none',
                resourceChanges
            };

            // Get combo potential
            const comboPotential = {
                followUpAbilities: source.abilities
                    .filter(a => !a.used && this.checkAbilityCombo(ability, a))
                    .map(a => a.title),
                teamSynergies: this.game.creatures
                    .filter((c): c is Creature => 
                        c !== undefined && 
                        !c.dead && 
                        c.team === source.team && 
                        c !== source
                    )
                    .filter(ally => 
                        ally.abilities.some(a => this.checkAbilityCombo(ability, a))
                    )
                    .map(ally => ally.name)
            };

            // Get result information
            const result = {
                success: true, // We'll need to implement actual success checking
                actualDamage: ability.damages ? 
                    Object.values(ability.damages)
                        .reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) : 
                    undefined,
                appliedEffects: ability.effects?.map(e => e.special || 'unknown').filter(Boolean)
            };

            // Log the analysis through ThreatLogger
            ThreatLogger.logAbilityAnalysis(source, ability, {
                ability: {
                    ...abilityAnalysis,
                    comboPotential
                },
                threat: threatAnalysis,
                effects: abilityEffects,
                state: {
                    before: beforeState,
                    after: afterState
                },
                target: targetInfo,
                result
            });

            // Log resource state with enhanced analysis - only include plasma for Dark Priest
            ThreatLogger.logResourceState(source, {
                current: {
                    energy: afterState.energy.current,
                    endurance: afterState.fatigue.endurance,
                    plasma: source.type.includes('Dark Priest') ? (source.player?.plasma || 0) : 0
                },
                team: source.type.includes('Dark Priest') ? {
                    totalPlasma: source.player?.plasma || 0,
                    plasmaEfficiency: resourceAnalysis.efficiency.plasma.usage
                } : undefined,
                turnUsage: {
                    energy: resourceChanges.energy,
                    endurance: resourceChanges.endurance,
                    plasma: resourceChanges.plasma
                },
                analysis: {
                    ...resourceAnalysis,
                    // Remove plasma-related suggestions for non-Dark Priest units
                    suggestions: {
                        immediate: source.type.includes('Dark Priest') ? 
                            resourceAnalysis.suggestions.immediate : 
                            resourceAnalysis.suggestions.immediate.filter(s => !s.toLowerCase().includes('plasma')),
                        strategic: source.type.includes('Dark Priest') ? 
                            resourceAnalysis.suggestions.strategic : 
                            resourceAnalysis.suggestions.strategic.filter(s => !s.toLowerCase().includes('plasma'))
                    }
                }
            });

        } catch (error) {
            console.error('[ThreatAnalyticsManager] Error analyzing ability:', {
                creature: source.name,
                ability: ability.title,
                error: error.message
            });
        }
    }

    private isPassiveAbility(ability: Ability): boolean {
        // List of known passive abilities
        const passiveAbilities = [
            'Toxic Spores',      // Uncle Fungus passive
            'Plasma Shield',     // Dark Priest passive
            'Regrowth',         // General passive healing
            'Meditation',       // Energy regeneration passive
            'Protection',       // Passive defense
            'Fatigue Shield'    // Passive fatigue protection
        ];

        // Check if it's a known passive
        if (passiveAbilities.includes(ability.title)) {
            return true;
        }

        // Check for passive indicators in the ability
        const hasPassiveIndicators = 
            // No costs usually indicates passive
            (!ability.costs || Object.keys(ability.costs).length === 0) &&
            // No damages usually indicates passive (unless it's a buff/heal)
            (!ability.damages || Object.keys(ability.damages).length === 0) &&
            // Effects that trigger automatically are usually passive
            ability.effects?.some(effect => 
                effect.special?.toLowerCase().includes('onstartphase') ||
                effect.special?.toLowerCase().includes('onendphase') ||
                effect.special?.toLowerCase().includes('onstartoround') ||
                effect.special?.toLowerCase().includes('ondamage') ||
                effect.special?.toLowerCase().includes('onheal')
            );

        return hasPassiveIndicators;
    }

    private handleDamage(event: { target?: Creature; damage?: { attacker?: Creature; damages?: Record<string, number> } }): void {
        if (!event.target || !event.damage?.damages || !event.damage.attacker) return;
        
        const analysis = this.threatAnalyzer.analyzeThreatForTarget(
            event.damage.attacker,
            null,
            event.target
        );
        
        // Record damage event
        this.eventRecorder.recordDamageEvent(event.damage.attacker, event.target, event.damage.damages);
        
        ThreatLogger.logDamageAnalysis(event.damage.attacker, event.target, analysis);
    }

    private handleEffectAttach(event: { creature?: Creature; effect?: Effect }): void {
        if (!event.creature || !event.effect) return;
        
        // For effects, we analyze the threat from the source creature
        const analysis = this.threatAnalyzer.analyzeThreatForTarget(
            event.effect.owner instanceof Creature ? event.effect.owner : event.creature,
            null,
            event.creature
        );

        // Record effect event
        this.eventRecorder.recordControlEffect(event.creature, event.effect);

        if (event.effect.owner instanceof Creature) {
            ThreatLogger.logEffectAnalysis(event.effect.owner, event.creature, event.effect, analysis);
        }
    }

    private handleActivate(creature: Creature): void {
        if (!creature) return;

        // Track initial position
        this.positionAnalyzer.trackActivation(creature);

        // Get current profile
        const profile = this.profileManager.getOrCreateUnitProfile(creature);

        // Analyze patterns using PatternAnalyzer
        const patterns = this.patternAnalyzer.detectThreatPatterns(profile);

        // Get unit state analysis
        const stateAnalysis = this.unitStateAnalyzer.analyzeUnitState(creature);

        // Update profile with new analyses
        this.profileManager.updateUnitProfile(creature, {
            ...profile,
            threatHistory: [
                ...profile.threatHistory,
                {
                    timestamp: Date.now(),
                    turnNumber: this.game.turn,
                    roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
                    targetId: creature.id,
                    sourceId: creature.id,
                    threatResult: {
                        damage: 0,
                        controlEffects: {},
                        range: 1,
                        hexesAffected: 1
                    }
                }
            ]
        });

        // Log activation analysis
        ThreatLogger.logPatternDetection(creature.type, creature.id, patterns);
    }

    private handleSummon(event: { creature?: Creature; summoner?: Creature; ability?: Ability }): void {
        if (!event.creature || !event.summoner || !event.ability) return;

        // First record the ability usage
        this.handleAbilityUsed({
            creature: event.summoner,
            ability: event.ability
        });

        // Get current profile of summoner
        const summonerProfile = this.profileManager.getOrCreateUnitProfile(event.summoner);

        // Initialize profile for summoned creature
        const summonedProfile = this.profileManager.getOrCreateUnitProfile(event.creature);

        // Record the summon event
        this.eventRecorder.recordSummonEvent(event.summoner, event.creature, event.ability);

        // Log the summon analysis
        ThreatLogger.logSummonAnalysis(event.summoner, event.creature, {
            summonerProfile,
            summonedProfile,
            position: { x: event.creature.x, y: event.creature.y },
            ability: event.ability.title
        });
    }

    private handleMovement(creature: Creature, from: { x: number; y: number }, to: { x: number; y: number }): void {
        // Skip analysis for forced movements or passive repositioning
        const isActiveMovement = creature === this.game.activeCreature && 
            !creature.abilities.some(ability => 
                ability.used && (
                    ability.effects?.some(effect => {
                        const special = effect.special?.toLowerCase() || '';
                        return special.includes('push') ||
                               special.includes('pull') ||
                               special.includes('teleport') ||
                               special.includes('swap');
                    })
                )
            );

        if (!isActiveMovement) {
            return;
        }

        // Use stored initial position if available
        const startPosition = this.positionAnalyzer.getStartPosition(creature);
        const actualFrom = startPosition || from;

        // Get full movement evaluation
        const evaluation = this.positionAnalyzer.evaluateMovement(creature, actualFrom, to);

        // Get resource analysis
        const resourceAnalysis = this.resourceAnalyzer.analyzeResourceUsage(creature);

        // Calculate strategic impact
        const analysis = {
            before: {
                escapeRoutes: evaluation.quality.details.escapeRoutes,
                threats: evaluation.quality.details.nearbyThreats,
                controlledZones: evaluation.quality.details.controlledZones
            },
            after: {
                escapeRoutes: evaluation.quality.details.escapeRoutes,
                threats: evaluation.quality.details.nearbyThreats,
                controlledZones: evaluation.quality.details.controlledZones
            },
            purpose: evaluation.suggestedMoves.length > 0 ? 
                `${evaluation.suggestedMoves[0].reason} (Quality: ${evaluation.quality.value.toFixed(2)})` : 
                'Maintaining position',
            positionImprovement: evaluation.improvement > 0,
            zonesGained: Math.max(0, evaluation.quality.details.controlledZones - evaluation.quality.details.contestedZones),
            zonesLost: Math.max(0, evaluation.quality.details.contestedZones - evaluation.quality.details.controlledZones),
            zonesContested: evaluation.quality.details.contestedZones,
            distanceFromCenter: 1 - evaluation.quality.details.centerProximity, // Convert to distance
            isOnEdge: evaluation.quality.details.centerProximity < 0.2, // Consider edge if far from center
            inThreatRange: this.getUnitsInThreatRange(creature),
            tacticalAdvantage: {
                value: evaluation.advantage.value,
                factors: evaluation.advantage.factors,
                details: evaluation.advantage.details
            },
            betterMoves: evaluation.suggestedMoves.slice(0, 10), // Limit to top 10 moves
            startPosition: startPosition, // Include the start position in analysis
            resources: resourceAnalysis // Include resource analysis
        };

        // Record movement event
        this.eventRecorder.recordMovement(creature, actualFrom, to);

        // Log the analysis
        ThreatLogger.logMovementAnalysis(creature, actualFrom, to, analysis);

        // Log resource state - only include plasma if it's the Dark Priest
        ThreatLogger.logResourceState(creature, {
            current: {
                energy: creature.energy,
                endurance: creature.endurance,
                plasma: creature.type.includes('Dark Priest') ? (creature.player?.plasma || 0) : 0
            },
            team: creature.type.includes('Dark Priest') ? {
                totalPlasma: creature.player?.plasma || 0,
                plasmaEfficiency: resourceAnalysis.efficiency.plasma.usage
            } : undefined,
            turnUsage: {
                energy: 0,
                endurance: 0,
                plasma: 0
            },
            analysis: {
                ...resourceAnalysis,
                // Remove plasma suggestions for non-Dark Priest units
                suggestions: {
                    immediate: creature.type.includes('Dark Priest') ? 
                        resourceAnalysis.suggestions.immediate : 
                        resourceAnalysis.suggestions.immediate.filter(s => !s.toLowerCase().includes('plasma')),
                    strategic: creature.type.includes('Dark Priest') ? 
                        resourceAnalysis.suggestions.strategic : 
                        resourceAnalysis.suggestions.strategic.filter(s => !s.toLowerCase().includes('plasma'))
                }
            }
        });

        // Clear cached analysis
        this.cacheManager.getCache('threat').delete(creature.id.toString());

        // If this is the last movement of the turn, clear the start position
        if (to.x === creature.x && to.y === creature.y) {
            this.positionAnalyzer.clearStartPosition(creature);
        }
    }

    private countControlledZones(creature: Creature): number {
        return this.game.grid.hexes
            .flat()
            .filter(hex => 
                hex.creature?.team === creature.team || 
                this.isHexControlled(hex, creature)
            ).length;
    }

    private countContestedZones(creature: Creature): number {
        return this.game.grid.hexes
            .flat()
            .filter(hex => this.isHexContested(hex, creature)).length;
    }

    private isHexControlled(hex: Hex, creature: Creature): boolean {
        const adjacentHexes = creature.adjacentHexes(1);
        return adjacentHexes.includes(hex);
    }

    private isHexContested(hex: Hex, creature: Creature): boolean {
        const adjacentCreatures = this.game.creatures
            .filter((c): c is Creature => 
                c !== undefined && 
                !c.dead && 
                Math.abs(c.x - hex.x) <= 1 && 
                Math.abs(c.y - hex.y) <= 1
            );
        
        return adjacentCreatures.some(c => c.team !== creature.team);
    }

    private calculateDistanceFromCenter(creature: Creature): number {
        const centerX = Math.floor(this.game.grid.hexes[0].length / 2);
        const centerY = Math.floor(this.game.grid.hexes.length / 2);
        return Math.max(
            Math.abs(creature.x - centerX),
            Math.abs(creature.y - centerY)
        );
    }

    private isOnBoardEdge(creature: Creature): boolean {
        return creature.x === 0 || 
               creature.y === 0 || 
               creature.x === this.game.grid.hexes[0].length - 1 || 
               creature.y === this.game.grid.hexes.length - 1;
    }

    private getUnitsInThreatRange(creature: Creature): Array<{id: number; name: string; distance: number}> {
        return this.game.creatures
            .filter((c): c is Creature => 
                c !== undefined && 
                !c.dead && 
                c.team !== creature.team
            )
            .map(enemy => ({
                id: enemy.id,
                name: enemy.name,
                distance: Math.max(
                    Math.abs(enemy.x - creature.x),
                    Math.abs(enemy.y - creature.y)
                )
            }))
            .filter(enemy => enemy.distance <= 2);
    }

    private determineMovementPurpose(
        creature: Creature, 
        from: { x: number; y: number }, 
        to: { x: number; y: number },
        beforeState: any,
        afterState: any
    ): string {
        if (from.x === to.x && from.y === to.y) {
            return 'No movement';
        }

        const purposes: string[] = [];

        // Check if moving away from threats
        if (afterState.threats < beforeState.threats) {
            purposes.push('Evading threats');
        }

        // Check if moving to better position
        if (afterState.escapeRoutes > beforeState.escapeRoutes) {
            purposes.push('Improving position');
        }

        // Check if moving towards center
        const beforeCenterDist = Math.max(
            Math.abs(from.x - Math.floor(this.game.grid.hexes[0].length / 2)),
            Math.abs(from.y - Math.floor(this.game.grid.hexes.length / 2))
        );
        const afterCenterDist = Math.max(
            Math.abs(to.x - Math.floor(this.game.grid.hexes[0].length / 2)),
            Math.abs(to.y - Math.floor(this.game.grid.hexes.length / 2))
        );
        if (afterCenterDist < beforeCenterDist) {
            purposes.push('Moving towards center');
        }

        // Check if moving towards allies
        const nearbyAlliesBefore = this.game.creatures
            .filter(c => c.team === creature.team && c !== creature)
            .filter(c => Math.max(Math.abs(c.x - from.x), Math.abs(c.y - from.y)) <= 2)
            .length;
        const nearbyAlliesAfter = this.game.creatures
            .filter(c => c.team === creature.team && c !== creature)
            .filter(c => Math.max(Math.abs(c.x - to.x), Math.abs(c.y - to.y)) <= 2)
            .length;
        if (nearbyAlliesAfter > nearbyAlliesBefore) {
            purposes.push('Grouping with allies');
        }

        return purposes.length > 0 ? purposes.join(', ') : 'Repositioning';
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

    public getUnitProfile(unitId: number) {
        return this.profileManager.getOrCreateUnitProfile(this.game.creatures.find(c => c.id === unitId));
    }

    public getUnitVulnerabilities(unitId: number): string[] {
        const profile = this.getUnitProfile(unitId);
        const vulnerabilities: string[] = [];

        // Check position-based vulnerabilities
        const recentHistory = profile.threatHistory.slice(-3);
        const hasPositionalWeakness = recentHistory.every(snapshot => 
            snapshot.threatResult.hexesAffected > 3 || // Large area affected
            snapshot.threatResult.range > 2 // Long range threat
        );
        if (hasPositionalWeakness) {
            vulnerabilities.push('Poor positioning');
        }

        // Check control vulnerabilities
        const controlVulnerable = recentHistory.filter(snapshot =>
            Object.values(snapshot.threatResult.controlEffects).some(effect => effect)
        ).length >= 2;
        if (controlVulnerable) {
            vulnerabilities.push('Vulnerable to control');
        }

        // Check damage vulnerabilities
        const highDamageCount = recentHistory.filter(snapshot =>
            snapshot.threatResult.damage > 20
        ).length;
        if (highDamageCount >= 2) {
            vulnerabilities.push('Takes high damage');
        }

        return vulnerabilities;
    }

    public getThreatPatterns(): ThreatPattern[] {
        // Collect all unit profiles
        const profiles = this.game.creatures
            .filter((c): c is Creature => c !== undefined)
            .map(c => this.getUnitProfile(c.id))
            .filter(profile => profile !== undefined);

        // Analyze patterns for each profile
        const patterns: ThreatPattern[] = [];
        profiles.forEach(profile => {
            if (profile) {
                const profilePatterns = this.patternAnalyzer.detectThreatPatterns(profile);
                patterns.push(...profilePatterns);
            }
        });

        // Combine and deduplicate patterns
        const uniquePatterns = new Map<string, ThreatPattern>();
        patterns.forEach(pattern => {
            if (!uniquePatterns.has(pattern.pattern) || 
                pattern.frequency > uniquePatterns.get(pattern.pattern)!.frequency) {
                uniquePatterns.set(pattern.pattern, pattern);
            }
        });

        return Array.from(uniquePatterns.values());
    }
} 