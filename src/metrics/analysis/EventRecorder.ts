import { Creature } from '../../creature';
import { Effect } from '../../effect';
import Game from '../../game';
import { ThreatSnapshot } from './types';
import { AbilityAnalyzer } from './AbilityAnalyzer';
import { Hex } from '../../utility/hex';
import { Ability } from '../../ability';

export class EventRecorder {
    private game: Game;
    private damageHistory: Map<string, { damage: number; timestamp: number }[]>;
    private controlHistory: Map<string, { effect: string; timestamp: number }[]>;
    private abilityAnalyzer: AbilityAnalyzer;

    constructor(game: Game) {
        this.game = game;
        this.damageHistory = new Map();
        this.controlHistory = new Map();
        this.abilityAnalyzer = new AbilityAnalyzer(game);
    }

    public recordDamageEvent(source: Creature, target: Creature, damages: Record<string, number>): ThreatSnapshot {
        const totalDamage = Object.values(damages).reduce((sum, val) => {
            const damage = typeof val === 'number' ? val : 0;
            return sum + damage;
        }, 0);

        console.log(`[EventRecorder] Recording damage event:
            Source: ${source.name} (ID: ${source.id})
            Target: ${target.name} (ID: ${target.id})
            Damage: ${totalDamage}`);

        // Record in damage history
        const damageKey = `${source.id}-${target.id}`;
        const history = this.damageHistory.get(damageKey) || [];
        const damageEvent = {
            damage: totalDamage,
            timestamp: Date.now()
        };
        history.push(damageEvent);
        this.damageHistory.set(damageKey, history);

        // Create a threat snapshot for this damage event
        const lastUsedAbility = source.abilities.find(a => a.used);
        if (!lastUsedAbility) {
            return this.createBasicThreatSnapshot(source.id, target.id, totalDamage);
        }

        const threatResult = this.abilityAnalyzer.analyzeAbility(lastUsedAbility);
        threatResult.damage = totalDamage; // Use actual damage dealt

        return {
            timestamp: Date.now(),
            turnNumber: this.game.turn,
            roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
            targetId: target.id,
            sourceId: source.id,
            threatResult
        };
    }

    public recordControlEffect(source: Creature, effect: Effect): ThreatSnapshot {
        console.log(`[EventRecorder] Recording control effect:
            Source: ${source.name} (ID: ${source.id})
            Effect: ${effect.name}`);

        // Record in control history
        const controlKey = `${source.id}-${effect.name}`;
        const history = this.controlHistory.get(controlKey) || [];
        const controlEvent = {
            effect: effect.name,
            timestamp: Date.now()
        };
        history.push(controlEvent);
        this.controlHistory.set(controlKey, history);

        // Create a threat snapshot for this control effect
        const lastUsedAbility = source.abilities.find(a => a.used);
        if (!lastUsedAbility) {
            // Check if target is a creature
            if (effect.target instanceof Creature) {
                return this.createBasicThreatSnapshot(source.id, effect.target.id, 0);
            }
            // If target is a hex, use source id as target (self-effect)
            return this.createBasicThreatSnapshot(source.id, source.id, 0);
        }

        const threatResult = this.abilityAnalyzer.analyzeAbility(lastUsedAbility);

        // Check if target is a creature
        const targetId = effect.target instanceof Creature ? effect.target.id : source.id;

        return {
            timestamp: Date.now(),
            turnNumber: this.game.turn,
            roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
            targetId,
            sourceId: source.id,
            threatResult
        };
    }

    private createBasicThreatSnapshot(sourceId: number, targetId: number, damage: number): ThreatSnapshot {
        return {
            timestamp: Date.now(),
            turnNumber: this.game.turn,
            roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
            targetId,
            sourceId,
            threatResult: {
                damage,
                controlEffects: {},
                range: 1,
                hexesAffected: 1
            }
        };
    }

    public getDamageHistory(sourceId: number, targetId: number): { damage: number; timestamp: number }[] {
        return this.damageHistory.get(`${sourceId}-${targetId}`) || [];
    }

    public getControlHistory(sourceId: number, effectName: string): { effect: string; timestamp: number }[] {
        return this.controlHistory.get(`${sourceId}-${effectName}`) || [];
    }

    public recordAbilityUsage(source: Creature, ability: Ability): void {
        console.log(`[EventRecorder] Recording ability usage:
            Source: ${source.name} (ID: ${source.id})
            Ability: ${ability.title}`);

        // Analyze ability and create snapshot
        const threatResult = this.abilityAnalyzer.analyzeAbility(ability);
        const snapshot = {
            timestamp: Date.now(),
            turnNumber: this.game.turn,
            roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
            targetId: source.id,
            sourceId: source.id,
            threatResult
        };

        // Update profile if needed
        if (this.game.threatAnalyticsManager) {
            const profile = this.game.threatAnalyticsManager.getUnitProfile(source.id);
            if (profile) {
                profile.abilities.set(ability.title, threatResult);
            }
        }
    }

    public recordMovement(source: Creature, from: { x: number; y: number }, to: { x: number; y: number }): void {
        // Determine movement source
        const isAbilityMovement = source.abilities.some(a => 
            a.used && (
                a.title.toLowerCase().includes('move') ||
                a.title.toLowerCase().includes('teleport') ||
                a.title.toLowerCase().includes('jump') ||
                a.title.toLowerCase().includes('dash') ||
                a.title.toLowerCase().includes('charge')
            )
        );

        const usedAbility = isAbilityMovement ? 
            source.abilities.find(a => a.used)?.title : 
            undefined;

        console.log(`[EventRecorder] Recording movement:
            Source: ${source.name} (ID: ${source.id})
            From: (${from.x}, ${from.y}) to (${to.x}, ${to.y})
            Type: ${isAbilityMovement ? `Ability (${usedAbility})` : 'Normal Movement'}`);
    }

    public recordSummonEvent(summoner: Creature, summonedCreature: Creature, ability: Ability): void {
        console.log(`[EventRecorder] Recording summon event:
            Summoner: ${summoner.name} (ID: ${summoner.id})
            Summoned: ${summonedCreature.name} (ID: ${summonedCreature.id})
            Ability: ${ability.title}
            Position: (${summonedCreature.x}, ${summonedCreature.y})`);

        // If we have a ThreatAnalyticsManager, update the profile
        if (this.game.threatAnalyticsManager) {
            const profile = this.game.threatAnalyticsManager.getUnitProfile(summoner.id);
            if (profile) {
                profile.abilities.set(ability.title, {
                    damage: 0,
                    controlEffects: {},
                    range: ability.range ? ability.range.regular : 1,
                    hexesAffected: 1,
                    summonedUnit: {
                        id: summonedCreature.id,
                        type: summonedCreature.type,
                        position: { x: summonedCreature.x, y: summonedCreature.y }
                    }
                });
            }
        }
    }
} 