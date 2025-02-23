import { UnitProfile } from './types/UnitProfile';
import { Creature } from '../creature';
import Game from '../game';

// Import all JSON profiles
import AbolishedProfile from './profiles/json/Abolished.json';
import BountyHunterProfile from './profiles/json/BountyHunter.json';
import CyberWolfProfile from './profiles/json/CyberWolf.json';
import DarkPriestProfile from './profiles/json/DarkPriest.json';
import GoldenWyrmProfile from './profiles/json/GoldenWyrm.json';
import GumbleProfile from './profiles/json/Gumble.json';
import HeadlessProfile from './profiles/json/Headless.json';
import ImpalerProfile from './profiles/json/Impaler.json';
import MagmaSpawnProfile from './profiles/json/MagmaSpawn.json';
import NightmareProfile from './profiles/json/Nightmare.json';
import NutcaseProfile from './profiles/json/Nutcase.json';
import ScavengerProfile from './profiles/json/Scavenger.json';
import SnowBunnyProfile from './profiles/json/SnowBunny.json';
import StomperProfile from './profiles/json/Stomper.json';
import SwineThugProfile from './profiles/json/SwineThug.json';
import UncleFungusProfile from './profiles/json/UncleFungus.json';
import VehemothProfile from './profiles/json/Vehemoth.json';

// Add unit cost mapping at the top of the file after imports
const UNIT_COSTS: Record<string, number> = {
    'Dark Priest': 0,
    'Snow Bunny': 2,
    'Nutcase': 4,
    'Scavenger': 5,
    'Nightmare': 6,
    'Stomper': 5,
    'Swine Thug': 2,
    'Uncle Fungus': 5,
    'Vehemoth': 10
};

export class ProfileManager {
    private profiles: Map<string, UnitProfile> = new Map();
    private game: Game;

    constructor(game: Game) {
        this.game = game;
        this.initializeProfiles();
    }

    private initializeProfiles() {
        // Add all unit profiles
        const allProfiles = [
            AbolishedProfile,
            BountyHunterProfile,
            CyberWolfProfile,
            DarkPriestProfile,
            GoldenWyrmProfile,
            GumbleProfile,
            HeadlessProfile,
            ImpalerProfile,
            MagmaSpawnProfile,
            NightmareProfile,
            NutcaseProfile,
            ScavengerProfile,
            SnowBunnyProfile,
            StomperProfile,
            SwineThugProfile,
            UncleFungusProfile,
            VehemothProfile
        ] as UnitProfile[];

        allProfiles.forEach(profile => {
            this.profiles.set(profile.name, profile);
        });
    }

    public getProfile(creature: Creature): UnitProfile | undefined {
        return this.profiles.get(creature.name);
    }

    public validateProfile(profile: UnitProfile): boolean {
        // Validate all numeric values are between 0 and 1
        const validateMetrics = (obj: any): boolean => {
            for (const key in obj) {
                if (typeof obj[key] === 'number') {
                    if (key !== 'id' && key !== 'size' && key !== 'optimalRange' && 
                        key !== 'optimal' && key !== 'critical' && key !== 'regeneration' &&
                        key !== 'safeThreshold' && key !== 'riskThreshold' && 
                        key !== 'energyThreshold' && key !== 'defensive' && key !== 'offensive') {
                        if (obj[key] < 0 || obj[key] > 1) {
                            console.warn(`Invalid metric value for ${key}: ${obj[key]}`);
                            return false;
                        }
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (!validateMetrics(obj[key])) return false;
                }
            }
            return true;
        };

        // Validate required fields
        if (!profile.name || !profile.type || !profile.roles.primary) {
            console.warn('Missing required fields in profile');
            return false;
        }

        // Skip numeric validation for Dark Priest's special efficiency
        if (profile.name !== 'Dark Priest') {
            // Validate metrics
            if (!validateMetrics(profile.combatMetrics)) {
                console.warn('Invalid combat metrics');
                return false;
            }

            // Validate ability profile
            for (const ability in profile.abilityProfile) {
                const abilityData = profile.abilityProfile[ability];
                if (abilityData.priority < 0 || abilityData.priority > 1) {
                    console.warn(`Invalid priority for ability ${ability}`);
                    return false;
                }
            }
        }

        return true;
    }

    public updateProfile(creature: Creature, updates: Partial<UnitProfile>) {
        const currentProfile = this.getProfile(creature);
        if (!currentProfile) return;

        const updatedProfile = {
            ...currentProfile,
            ...updates
        } as UnitProfile;

        if (this.validateProfile(updatedProfile)) {
            this.profiles.set(creature.name, updatedProfile);
        }
    }

    public getProfileAnalytics(creature: Creature) {
        const profile = this.getProfile(creature);
        if (!profile) return null;

        // Skip analytics for Dark Priest
        if (profile.name === 'Dark Priest') {
            return {
                combatRole: {
                    primary: profile.roles.primary,
                    secondary: profile.roles.secondary,
                    playstyle: profile.roles.playstyle
                },
                strengthMetrics: null,
                resourceEfficiency: null,
                positioningPreference: this.calculatePositioningPreference(profile),
                teamContribution: null
            };
        }

        return {
            combatRole: {
                primary: profile.roles.primary,
                secondary: profile.roles.secondary,
                playstyle: profile.roles.playstyle
            },
            strengthMetrics: {
                damage: this.calculateDamageStrength(profile),
                control: this.calculateControlStrength(profile),
                survival: this.calculateSurvivalStrength(profile),
                utility: this.calculateUtilityStrength(profile)
            },
            resourceEfficiency: this.calculateResourceEfficiency(profile),
            positioningPreference: this.calculatePositioningPreference(profile),
            teamContribution: this.calculateTeamContribution(profile)
        };
    }

    private calculateDamageStrength(profile: UnitProfile): number {
        const { damageOutput } = profile.combatMetrics;
        return (
            damageOutput.burstPotential * 0.4 +
            damageOutput.sustainedDamage * 0.3 +
            damageOutput.areaEffect * 0.2 +
            damageOutput.targetSelection * 0.1
        );
    }

    private calculateControlStrength(profile: UnitProfile): number {
        const { controlPower } = profile.combatMetrics;
        return (
            controlPower.immobilization * 0.3 +
            controlPower.displacement * 0.2 +
            controlPower.debuffs * 0.2 +
            controlPower.zoneControl * 0.3
        );
    }

    private calculateSurvivalStrength(profile: UnitProfile): number {
        const { survivability } = profile.combatMetrics;
        return (
            survivability.healthPool * 0.3 +
            survivability.defensiveAbilities * 0.3 +
            survivability.mobilityOptions * 0.2 +
            survivability.recoveryPotential * 0.2
        );
    }

    private calculateUtilityStrength(profile: UnitProfile): number {
        const { utility } = profile.combatMetrics;
        return (
            utility.resourceGeneration * 0.3 +
            utility.teamSupport * 0.3 +
            utility.mapControl * 0.2 +
            utility.comboEnablement * 0.2
        );
    }

    private calculateResourceEfficiency(profile: UnitProfile): number {
        // Base efficiency on resource thresholds and management
        const energyEfficiency = (profile.resourceProfile.energyUsage.optimal - 
            profile.resourceProfile.energyUsage.critical) / 100;
        
        const enduranceEfficiency = (profile.resourceProfile.enduranceManagement.safeThreshold -
            profile.resourceProfile.enduranceManagement.riskThreshold) / 60;

        return (energyEfficiency * 0.6 + enduranceEfficiency * 0.4);
    }

    private calculatePositioningPreference(profile: UnitProfile): {
        preferredLine: 'frontline' | 'midline' | 'backline';
        zonePreference: 'center' | 'flank' | 'defensive';
    } {
        const { formationPlacement, zonePreferences } = profile.positioningProfile;
        
        // Determine preferred line
        const lines = [
            { name: 'frontline' as const, value: formationPlacement.frontline },
            { name: 'midline' as const, value: formationPlacement.midline },
            { name: 'backline' as const, value: formationPlacement.backline }
        ];
        const preferredLine = lines.reduce((prev, curr) => 
            curr.value > prev.value ? curr : prev
        ).name;

        // Determine zone preference
        const zones = [
            { name: 'center' as const, value: zonePreferences.center },
            { name: 'flank' as const, value: zonePreferences.flank },
            { name: 'defensive' as const, value: zonePreferences.defensive }
        ];
        const zonePreference = zones.reduce((prev, curr) => 
            curr.value > prev.value ? curr : prev
        ).name;

        return { preferredLine, zonePreference };
    }

    private calculateTeamContribution(profile: UnitProfile): number {
        // Calculate based on utility and synergy effectiveness
        const utilityScore = this.calculateUtilityStrength(profile);
        const synergyScore = profile.synergyProfile.pairs.reduce(
            (sum, pair) => sum + pair.strength, 0
        ) / profile.synergyProfile.pairs.length;

        return (utilityScore * 0.6 + synergyScore * 0.4);
    }

    public calculateComprehensiveEfficiency(profile: UnitProfile): number {
        if (profile.name === 'Dark Priest') return -1; // Special case

        // Damage output score (0-1)
        const damageScore = (
            profile.combatMetrics.damageOutput.burstPotential * 0.4 +
            profile.combatMetrics.damageOutput.sustainedDamage * 0.3 +
            profile.combatMetrics.damageOutput.areaEffect * 0.2 +
            profile.combatMetrics.damageOutput.targetSelection * 0.1
        );

        // Control power score (0-1)
        const controlScore = (
            profile.combatMetrics.controlPower.immobilization * 0.3 +
            profile.combatMetrics.controlPower.displacement * 0.2 +
            profile.combatMetrics.controlPower.debuffs * 0.2 +
            profile.combatMetrics.controlPower.zoneControl * 0.3
        );

        // Survivability score (0-1)
        const survivalScore = (
            profile.combatMetrics.survivability.healthPool * 0.4 +
            profile.combatMetrics.survivability.defensiveAbilities * 0.3 +
            profile.combatMetrics.survivability.mobilityOptions * 0.2 +
            profile.combatMetrics.survivability.recoveryPotential * 0.1
        );

        // Utility score (0-1)
        const utilityScore = (
            profile.combatMetrics.utility.resourceGeneration * 0.3 +
            profile.combatMetrics.utility.teamSupport * 0.3 +
            profile.combatMetrics.utility.mapControl * 0.2 +
            profile.combatMetrics.utility.comboEnablement * 0.2
        );

        // Cost efficiency (inverse of cost, normalized to 0-1 scale where 10 cost = 0.1 efficiency)
        const cost = UNIT_COSTS[profile.name] || 5; // Default to 5 if cost not found
        const costEfficiency = Math.max(0, 1 - (cost / 100));

        // Calculate final score (0-50 scale)
        const rawScore = (
            damageScore * 15 +      // Damage potential (max 15)
            controlScore * 10 +     // Control impact (max 10)
            survivalScore * 10 +    // Survivability (max 10)
            utilityScore * 10 +     // Utility value (max 10)
            costEfficiency * 5      // Cost efficiency (max 5)
        );

        // Round to nearest integer
        return Math.round(rawScore);
    }
} 