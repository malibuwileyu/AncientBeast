export interface DecisionWeights {
    // Tactical Weights (Short-term)
    tactical: {
        damage: {
            burst: number;           // Weight for burst damage potential
            sustained: number;       // Weight for sustained damage
            aoe: number;            // Weight for area damage
            finishing: number;       // Weight for kill potential
        };
        control: {
            immobilize: number;     // Weight for movement control
            zone: number;           // Weight for zone control
            debuff: number;         // Weight for debuffing
            denial: number;         // Weight for resource denial
        };
        positioning: {
            safety: number;         // Weight for safe positioning
            threat: number;         // Weight for threatening positions
            objective: number;      // Weight for objective control
            support: number;        // Weight for team support positions
        };
        resources: {
            energy: number;         // Weight for energy efficiency
            plasma: number;         // Weight for plasma usage
            endurance: number;      // Weight for endurance management
        };
    };

    // Strategic Weights (Long-term)
    strategic: {
        teamComp: {
            synergy: number;        // Weight for team synergies
            coverage: number;       // Weight for team role coverage
            formation: number;      // Weight for formation maintenance
        };
        mapControl: {
            center: number;         // Weight for center control
            zones: number;          // Weight for zone control
            mobility: number;       // Weight for movement control
        };
        resourceControl: {
            generation: number;     // Weight for resource generation
            denial: number;         // Weight for resource denial
            efficiency: number;     // Weight for resource efficiency
        };
        tempo: {
            initiative: number;     // Weight for initiative control
            pressure: number;       // Weight for maintaining pressure
            recovery: number;       // Weight for recovery phases
        };
    };

    // Situational Multipliers
    situational: {
        health: {
            critical: number;       // Multiplier when health is critical
            healthy: number;        // Multiplier when health is high
        };
        energy: {
            low: number;           // Multiplier when energy is low
            high: number;          // Multiplier when energy is high
        };
        position: {
            trapped: number;       // Multiplier when position is poor
            dominant: number;      // Multiplier when position is strong
        };
        momentum: {
            winning: number;       // Multiplier when winning
            losing: number;        // Multiplier when losing
        };
    };
} 