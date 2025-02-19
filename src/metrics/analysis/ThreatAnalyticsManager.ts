import { Creature } from '../../creature';
import { Ability } from '../../ability';
import { AbilityThreatAnalyzer } from './AbilityThreatAnalyzer';
import Game from '../../game';
import { Effect } from '../../effect';

interface ThreatSnapshot {
    timestamp: number;
    turnNumber: number;
    roundNumber: number;
    targetId: number;
    sourceId: number;
    threatResult: AbilityThreatResult;
}

interface UnitThreatProfile {
    unitId: number;
    unitType: string;
    threatHistory: ThreatSnapshot[];
    vulnerabilities: {
        controlVulnerable: boolean;
        damageThreatened: boolean;
        positionallyWeak: boolean;
        resourceStarved: boolean;
    };
    strengths: {
        controlResistant: boolean;
        survivalRate: number;
        positionalControl: boolean;
        resourceEfficient: boolean;
    };
    abilities: Map<string, AbilityThreatResult>;
    totalDamageDealt: number;
    damageTargets: Map<number, number>;
    controlEffectsApplied: Map<string, number>;
}

interface ThreatPattern {
    pattern: string;                   // Description of the threat pattern
    frequency: number;                 // How often it occurs
    effectiveness: number;             // How effective it is
    counterMeasures: string[];        // Possible ways to counter
}

interface AbilityThreatResult {
    damage: number;
    controlEffects: {
        frozen?: boolean;
        cryostasis?: boolean;
        dizzy?: boolean;
        immobilize?: boolean;
        trap?: boolean;
        delayed?: boolean;
        hindered?: boolean;
        materializationSickness?: boolean;
        noActionPossible?: boolean;
    };
    range: number;
    hexesAffected: number;
    hexesCount?: number;
}

export class ThreatAnalyticsManager {
    private game: Game;
    private threatAnalyzer: AbilityThreatAnalyzer;
    private threatHistory: ThreatSnapshot[] = [];
    private unitProfiles: Map<number, UnitThreatProfile> = new Map();
    private threatPatterns: ThreatPattern[] = [];
    private damageHistory: Map<string, { damage: number; timestamp: number }[]> = new Map();
    private controlHistory: Map<string, { effect: string; timestamp: number }[]> = new Map();

    constructor(game: Game) {
        console.log('[ThreatAnalyticsManager] Initializing...');
        this.game = game;
        this.threatAnalyzer = new AbilityThreatAnalyzer();
        this.threatHistory = [];
        this.unitProfiles = new Map();
        this.threatPatterns = [];
        this.damageHistory = new Map();
        this.controlHistory = new Map();

        // Debug all signals
        this.game.signals.creature.add((message: string, payload: any) => {
            console.log(`[ThreatAnalyticsManager] Signal received: ${message}`, payload);
        });

        // Ability usage
        this.game.signals.creature.add((message: string, payload: any) => {
            if (message === 'ability') {
                console.log('[ThreatAnalyticsManager] Ability signal detected:', payload);
                if (payload.creature && payload.ability) {
                    this.analyzeAbilityThreat(payload.creature, payload.ability, payload.target);
                }
            }
        });

        // Damage events
        this.game.signals.creature.add((message: string, payload: any) => {
            if (message === 'damage') {
                console.log('[ThreatAnalyticsManager] Damage signal detected:', payload);
                if (payload.creature && payload.target && payload.damage) {
                    this.recordDamageEvent(payload.creature, payload.target, payload.damage);
                }
            }
        });

        // Effect events
        this.game.signals.creature.add((message: string, payload: any) => {
            if (message === 'effect') {
                console.log('[ThreatAnalyticsManager] Effect signal detected:', payload);
                if (payload.creature && payload.effect) {
                    this.recordControlEffect(payload.creature, payload.effect);
                }
            }
        });

        console.log('[ThreatAnalyticsManager] Event listeners initialized');
    }

    private analyzeAbilityThreat(source: Creature, ability: Ability, target?: Creature) {
        console.log(`[ThreatAnalyticsManager] Analyzing ability threat:
            Source: ${source.name} (ID: ${source.id})
            Ability: ${ability.title}
            Target: ${target ? `${target.name} (ID: ${target.id})` : 'No target'}`);

        // Get ability range - use _getHexRange if available, otherwise estimate from ability data
        let range = 1; // Default melee range
        let hexesAffected = 1; // Default single target

        if (typeof ability._getHexRange === 'function') {
            const hexRange = ability._getHexRange(true);
            range = hexRange.length;
            hexesAffected = hexRange.length;
        } else if (ability.range) {
            range = typeof ability.range === 'number' ? ability.range : ability.range.regular || 1;
        }

        // If ability has a specific target area calculation
        if (typeof ability._getHexes === 'function') {
            const targetHexes = ability._getHexes();
            hexesAffected = Array.isArray(targetHexes) ? targetHexes.length : 1;
        }

        const threatResult = {
            damage: this.calculateDamageThreat(ability),
            controlEffects: this.identifyControlEffects(ability),
            range: range,
            hexesAffected: hexesAffected
        };

        console.log('[ThreatAnalyticsManager] Threat analysis result:', threatResult);

        // Update unit profile
        const profile = this.getOrCreateUnitProfile(source);
        profile.abilities = profile.abilities || new Map();
        profile.abilities.set(ability.title, threatResult);
        this.updateUnitProfile(source, profile);

        console.log(`[ThreatAnalyticsManager] Updated unit profile for ${source.name}:`, profile);
    }

    private recordDamageEvent(source: Creature, target: Creature, damage: number) {
        console.log(`[ThreatAnalyticsManager] Recording damage event:
            Source: ${source.name} (ID: ${source.id})
            Target: ${target.name} (ID: ${target.id})
            Damage: ${damage}`);

        const damageKey = `${source.id}-${target.id}`;
        const history = this.damageHistory.get(damageKey) || [];
        history.push({ damage, timestamp: Date.now() });
        this.damageHistory.set(damageKey, history);

        // Update threat profile
        const profile = this.getOrCreateUnitProfile(source);
        profile.totalDamageDealt += damage;
        profile.damageTargets.set(target.id, (profile.damageTargets.get(target.id) || 0) + damage);
        this.updateUnitProfile(source, profile);

        console.log(`[ThreatAnalyticsManager] Updated damage history for ${source.name} -> ${target.name}:`, history);
    }

    private recordControlEffect(source: Creature, effect: Effect) {
        console.log(`[ThreatAnalyticsManager] Recording control effect:
            Source: ${source.name} (ID: ${source.id})
            Effect: ${effect.name}
            Duration: ${effect.turnLifetime || 'Permanent'}`);

        const controlKey = `${source.id}-${effect.name}`;
        const history = this.controlHistory.get(controlKey) || [];
        history.push({ effect: effect.name, timestamp: Date.now() });
        this.controlHistory.set(controlKey, history);

        // Update threat profile
        const profile = this.getOrCreateUnitProfile(source);
        profile.controlEffectsApplied.set(
            effect.name,
            (profile.controlEffectsApplied.get(effect.name) || 0) + 1
        );
        this.updateUnitProfile(source, profile);

        console.log(`[ThreatAnalyticsManager] Updated control history for ${source.name}:`, history);
    }

    private detectThreatPatterns(profile: UnitThreatProfile): void {
        console.log(`[ThreatAnalyticsManager] Detecting threat patterns for ${profile.unitType} (ID: ${profile.unitId})`);
        
        // Analyze damage patterns
        const damagePatterns = this.analyzeDamagePatterns(profile);
        
        // Analyze control patterns
        const controlPatterns = this.analyzeControlPatterns(profile);
        
        // Log significant patterns (frequency > 0.3)
        const significantPatterns = [...damagePatterns, ...controlPatterns]
            .filter(pattern => pattern.frequency > 0.3);
        
        if (significantPatterns.length > 0) {
            console.log(`[ThreatAnalyticsManager] Significant patterns detected for ${profile.unitType} (ID: ${profile.unitId}):`, 
                significantPatterns);
        }
    }

    private updateUnitProfile(source: Creature, profile: UnitThreatProfile): void {
        if (!this.unitProfiles.has(source.id)) {
            this.unitProfiles.set(source.id, {
                unitId: source.id,
                unitType: source.type,
                threatHistory: [],
                vulnerabilities: {
                    controlVulnerable: false,
                    damageThreatened: false,
                    positionallyWeak: false,
                    resourceStarved: false
                },
                strengths: {
                    controlResistant: false,
                    survivalRate: 1.0,
                    positionalControl: false,
                    resourceEfficient: false
                },
                abilities: new Map(),
                totalDamageDealt: 0,
                damageTargets: new Map(),
                controlEffectsApplied: new Map()
            });
        }

        const existingProfile = this.unitProfiles.get(source.id);
        if (existingProfile) {
            // Update the profile with new data
            Object.assign(existingProfile, profile);
            
            // Add a new threat snapshot
            const ability = source.abilities[0]; // Get first ability as example
            if (ability) {
                const range = typeof ability._getHexRange === 'function' ? 
                    ability._getHexRange(true).length : 1;
                
                const hexCount = typeof ability._getHexes === 'function' ? 
                    ability._getHexes().length : 1;

                existingProfile.threatHistory.push({
                    timestamp: Date.now(),
                    turnNumber: this.game.turn,
                    roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
                    targetId: source.id,
                    sourceId: source.id,
                    threatResult: {
                        damage: this.calculateDamageThreat(ability),
                        controlEffects: this.identifyControlEffects(ability),
                        range: range,
                        hexesAffected: hexCount,
                        hexesCount: hexCount
                    }
                });
            }
            
            this.updateVulnerabilities(existingProfile);
            this.updateStrengths(existingProfile);
        }
    }

    private updateVulnerabilities(profile: UnitThreatProfile): void {
        const recentThreats = profile.threatHistory.slice(-5); // Look at last 5 threats

        // Update control vulnerability
        const controlCount = recentThreats.filter(t => 
            Object.values(t.threatResult.controlEffects).some(effect => effect)
        ).length;
        profile.vulnerabilities.controlVulnerable = controlCount >= 2;

        // Update damage vulnerability
        const highDamageCount = recentThreats.filter(t =>
            t.threatResult.damage > 20 // Threshold for high damage
        ).length;
        profile.vulnerabilities.damageThreatened = highDamageCount >= 3;

        // Update positional vulnerability based on range and hexes affected
        const positionalThreats = recentThreats.filter(t =>
            t.threatResult.range > 2 && t.threatResult.hexesAffected > 1
        ).length;
        profile.vulnerabilities.positionallyWeak = positionalThreats >= 2;

        // Resource vulnerability is handled separately through game state
        profile.vulnerabilities.resourceStarved = this.checkResourceStatus(profile.unitId);
    }

    private updateStrengths(profile: UnitThreatProfile): void {
        const recentThreats = profile.threatHistory.slice(-5); // Look at last 5 threats

        // Control resistance
        const controlCount = recentThreats.filter(t => 
            Object.values(t.threatResult.controlEffects).some(effect => effect)
        ).length;
        profile.strengths.controlResistant = controlCount === 0;

        // Survival rate based on damage taken vs health
        const creature = this.game.creatures.find(c => c.id === profile.unitId);
        if (creature) {
            profile.strengths.survivalRate = creature.health / creature.stats.health;
        }

        // Positional control based on ability ranges and areas
        const positionalControl = profile.abilities.size > 0 && 
            Array.from(profile.abilities.values()).some(ability => 
                ability.range > 2 && ability.hexesAffected > 2
            );
        profile.strengths.positionalControl = positionalControl;

        // Resource efficiency is handled separately through game state
        profile.strengths.resourceEfficient = this.checkResourceEfficiency(profile.unitId);
    }

    private calculateDamageThreat(ability: Ability): number {
        // Implementation of calculateDamageThreat method
        return 0; // Placeholder return, actual implementation needed
    }

    private identifyControlEffects(ability: Ability): AbilityThreatResult['controlEffects'] {
        // Implementation of identifyControlEffects method
        return {}; // Placeholder return, actual implementation needed
    }

    private analyzeDamagePatterns(profile: UnitThreatProfile): ThreatPattern[] {
        // Implementation of analyzeDamagePatterns method
        return []; // Placeholder return, actual implementation needed
    }

    private analyzeControlPatterns(profile: UnitThreatProfile): ThreatPattern[] {
        // Implementation of analyzeControlPatterns method
        return []; // Placeholder return, actual implementation needed
    }

    private getOrCreateUnitProfile(source: Creature): UnitThreatProfile {
        if (!this.unitProfiles.has(source.id)) {
            this.unitProfiles.set(source.id, {
                unitId: source.id,
                unitType: source.type,
                threatHistory: [],
                vulnerabilities: {
                    controlVulnerable: false,
                    damageThreatened: false,
                    positionallyWeak: false,
                    resourceStarved: false
                },
                strengths: {
                    controlResistant: false,
                    survivalRate: 1.0,
                    positionalControl: false,
                    resourceEfficient: false
                },
                abilities: new Map(),
                totalDamageDealt: 0,
                damageTargets: new Map(),
                controlEffectsApplied: new Map()
            });
        }
        return this.unitProfiles.get(source.id) as UnitThreatProfile;
    }

    // Public methods for accessing analytics
    public getUnitProfile(unitId: number): UnitThreatProfile | undefined {
        return this.unitProfiles.get(unitId);
    }

    public getThreatPatterns(): ThreatPattern[] {
        return this.threatPatterns;
    }

    public getRecentThreats(unitId: number, count: number = 5): ThreatSnapshot[] {
        return this.threatHistory
            .filter(t => t.targetId === unitId)
            .slice(-count);
    }

    public getUnitVulnerabilities(unitId: number): string[] {
        const profile = this.unitProfiles.get(unitId);
        if (!profile) return [];

        const vulnerabilities: string[] = [];
        if (profile.vulnerabilities.controlVulnerable) vulnerabilities.push("Vulnerable to control effects");
        if (profile.vulnerabilities.damageThreatened) vulnerabilities.push("Takes high damage");
        if (profile.vulnerabilities.positionallyWeak) vulnerabilities.push("Poor positioning");
        if (profile.vulnerabilities.resourceStarved) vulnerabilities.push("Resource management issues");
        return vulnerabilities;
    }

    public getUnitStrengths(unitId: number): string[] {
        const profile = this.unitProfiles.get(unitId);
        if (!profile) return [];

        const strengths: string[] = [];
        if (profile.strengths.controlResistant) strengths.push("Resistant to control");
        if (profile.strengths.survivalRate > 0.7) strengths.push("High survival rate");
        if (profile.strengths.positionalControl) strengths.push("Good positioning");
        if (profile.strengths.resourceEfficient) strengths.push("Efficient resource use");
        return strengths;
    }

    private checkResourceStatus(unitId: number): boolean {
        const creature = this.game.creatures.find(c => c.id === unitId);
        if (!creature) return false;

        // Check if energy is below 30%
        const energyStarved = creature.energy < creature.stats.energy * 0.3;
        
        // Check if health is below 40%
        const healthStarved = creature.health < creature.stats.health * 0.4;
        
        return energyStarved || healthStarved;
    }

    private checkResourceEfficiency(unitId: number): boolean {
        const creature = this.game.creatures.find(c => c.id === unitId);
        if (!creature) return false;

        // Check if energy is above 70%
        const energyEfficient = creature.energy > creature.stats.energy * 0.7;
        
        // Check if health is above 60%
        const healthEfficient = creature.health > creature.stats.health * 0.6;
        
        return energyEfficient && healthEfficient;
    }
} 