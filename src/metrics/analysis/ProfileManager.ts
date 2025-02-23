import { Creature } from '../../creature';
import Game from '../../game';
import { UnitThreatProfile, AbilityThreatResult } from './types';
import { AbilityAnalyzer } from './AbilityAnalyzer';
import { PositionAnalyzer } from './PositionAnalyzer';

export class ProfileManager {
    private game: Game;
    private unitProfiles: Map<number, UnitThreatProfile>;
    private abilityAnalyzer: AbilityAnalyzer;
    private positionAnalyzer: PositionAnalyzer;

    constructor(game: Game) {
        this.game = game;
        this.unitProfiles = new Map();
        this.abilityAnalyzer = new AbilityAnalyzer(game);
        this.positionAnalyzer = new PositionAnalyzer(game);
    }

    public getOrCreateUnitProfile(source: Creature): UnitThreatProfile {
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

    public updateUnitProfile(source: Creature, profile: UnitThreatProfile): void {
        const existingProfile = this.getOrCreateUnitProfile(source);
        
        // Update the profile with new data
        Object.assign(existingProfile, profile);
        
        // Add a new threat snapshot if there's an ability
        const ability = source.abilities[0];
        if (ability) {
            const threatResult = this.abilityAnalyzer.analyzeAbility(ability);
            existingProfile.threatHistory.push({
                timestamp: Date.now(),
                turnNumber: this.game.turn,
                roundNumber: Math.floor(this.game.turn / this.game.creatures.length),
                targetId: source.id,
                sourceId: source.id,
                threatResult
            });
        }
        
        this.updateVulnerabilities(existingProfile);
        this.updateStrengths(existingProfile);
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

        // Resource vulnerability
        profile.vulnerabilities.resourceStarved = this.checkResourceStatus(profile.unitId);
    }

    private updateStrengths(profile: UnitThreatProfile): void {
        const creature = this.game.creatures.find(c => c.id === profile.unitId);
        if (!creature) return;

        // Control resistance
        profile.strengths.controlResistant = creature.stats.defense > 5;

        // Survival rate based on health management
        const healthHistory = profile.threatHistory
            .slice(-10)
            .map(t => t.threatResult.damage);
        const averageDamageTaken = healthHistory.length > 0 ? 
            healthHistory.reduce((sum, dmg) => sum + dmg, 0) / healthHistory.length : 0;
        profile.strengths.survivalRate = Math.max(0, 1 - (averageDamageTaken / creature.stats.health));

        // Position control based on ability ranges and movement
        const hasRangedAbilities = creature.abilities.some(a => 
            a.range && (a.range.regular > 1 || a.range.upgraded > 1)
        );
        profile.strengths.positionalControl = hasRangedAbilities && creature.stats.movement > 2;

        // Resource efficiency
        profile.strengths.resourceEfficient = this.checkResourceEfficiency(profile.unitId);
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

    public getProfile(unitId: number): UnitThreatProfile | undefined {
        return this.unitProfiles.get(unitId);
    }
} 