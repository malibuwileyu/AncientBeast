export type Role = 'Damage' | 'Control' | 'Support' | 'Tank';
export type Playstyle = 'Aggressive' | 'Defensive' | 'Utility' | 'Flexible';

export interface UnitProfile {
    // Basic Info
    id: number;
    name: string;
    type: string;
    realm: string;
    size: number;
    cost?: number;

    // Efficiency Rating (1-50, lower is better)
    comprehensiveEfficiency: number;

    // Role Classification
    roles: {
        primary: Role;
        secondary?: Role;
        playstyle: Playstyle;
        AIReasoningPlaystyleContext: string;
    };

    // Combat Metrics
    combatMetrics: {
        damageOutput: {
            burstPotential: number;     // 0-1 scale
            sustainedDamage: number;    // 0-1 scale
            areaEffect: number;         // 0-1 scale
            targetSelection: number;    // 0-1 scale (ability to choose targets)
        };
        controlPower: {
            immobilization: number;     // 0-1 scale
            displacement: number;       // 0-1 scale
            debuffs: number;           // 0-1 scale
            zoneControl: number;       // 0-1 scale
        };
        survivability: {
            healthPool: number;         // 0-1 scale relative to other units
            defensiveAbilities: number; // 0-1 scale
            mobilityOptions: number;    // 0-1 scale
            recoveryPotential: number;  // 0-1 scale
        };
        utility: {
            resourceGeneration: number; // 0-1 scale
            teamSupport: number;       // 0-1 scale
            mapControl: number;        // 0-1 scale
            comboEnablement: number;   // 0-1 scale
        };
    };

    // Resource Management
    resourceProfile: {
        energyUsage: {
            optimal: number;           // Optimal energy level to maintain
            critical: number;          // Critical threshold for abilities
            regeneration: number;      // Base regeneration rate
        };
        plasmaUsage?: {               // Only for Dark Priest
            defensive: number;         // Plasma to keep for defense
            offensive: number;         // Plasma to use for attacks
        };
        enduranceManagement: {
            safeThreshold: number;     // Safe endurance level
            riskThreshold: number;     // Risk level for fatigue
            recoveryPriority: number;  // Priority for recovery (0-1)
        };
    };

    // Positioning
    positioningProfile: {
        optimalRange: number;          // Preferred distance from enemies
        formationPlacement: {
            frontline: number;         // 0-1 suitability for frontline
            midline: number;           // 0-1 suitability for midline
            backline: number;          // 0-1 suitability for backline
        };
        zonePreferences: {
            center: number;            // 0-1 preference for center
            flank: number;             // 0-1 preference for flanks
            defensive: number;         // 0-1 preference for defensive positions
        };
    };

    // Ability Usage
    abilityProfile: {
        [abilityName: string]: {
            priority: number;          // 0-1 base priority
            energyThreshold: number;   // Minimum energy to consider
            setupRequired: boolean;    // Needs positioning/resources setup
            comboFollowup: string[];   // Abilities that combo after this
            comboPrecursor: string[];  // Abilities that combo before this
            conditions: {              // When to use/avoid
                use: string[];
                avoid: string[];
            };
        };
    };

    // Matchups
    matchupProfile: {
        strongAgainst: Array<{
            type: string;
            reason: string;
            priority: number;         // 0-1 targeting priority
        }>;
        weakAgainst: Array<{
            type: string;
            reason: string;
            counterplay: string[];    // How to handle this matchup
        }>;
    };

    // Team Synergies
    synergyProfile: {
        pairs: Array<{
            unit: string;
            synergy: string;
            strength: number;         // 0-1 synergy strength
        }>;
        formations: Array<{
            units: string[];
            strategy: string;
            effectiveness: number;    // 0-1 formation effectiveness
        }>;
    };
} 