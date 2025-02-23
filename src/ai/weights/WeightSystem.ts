import { DecisionWeights } from '../types/DecisionWeights';
import { GameState } from '../../game/GameState';
import { UnitProfile } from '../types/UnitProfile';

export class WeightSystem {
    private baseWeights: DecisionWeights;
    private currentWeights: DecisionWeights;
    private situationalModifiers: Map<string, number>;

    constructor() {
        this.initializeBaseWeights();
        this.currentWeights = this.cloneWeights(this.baseWeights);
        this.situationalModifiers = new Map();
    }

    private initializeBaseWeights() {
        this.baseWeights = {
            tactical: {
                damage: {
                    burst: 0.7,      // High priority for burst opportunities
                    sustained: 0.5,   // Medium priority for sustained damage
                    aoe: 0.6,        // Medium-high for area damage
                    finishing: 0.8    // Very high for securing kills
                },
                control: {
                    immobilize: 0.6,  // Medium-high for lockdown
                    zone: 0.7,        // High for zone control
                    debuff: 0.5,      // Medium for debuffs
                    denial: 0.4       // Medium-low for resource denial
                },
                positioning: {
                    safety: 0.8,      // Very high for survival
                    threat: 0.6,      // Medium-high for pressure
                    objective: 0.7,   // High for objective control
                    support: 0.5      // Medium for team support
                },
                resources: {
                    energy: 0.7,      // High for energy management
                    plasma: 0.6,      // Medium-high for plasma (when applicable)
                    endurance: 0.5    // Medium for endurance
                }
            },
            strategic: {
                teamComp: {
                    synergy: 0.6,     // Medium-high for team synergies
                    coverage: 0.5,    // Medium for role coverage
                    formation: 0.7    // High for formation maintenance
                },
                mapControl: {
                    center: 0.7,      // High for center control
                    zones: 0.6,       // Medium-high for zone control
                    mobility: 0.5     // Medium for mobility control
                },
                resourceControl: {
                    generation: 0.6,   // Medium-high for resource generation
                    denial: 0.4,      // Medium-low for denial
                    efficiency: 0.7    // High for efficiency
                },
                tempo: {
                    initiative: 0.7,   // High for initiative control
                    pressure: 0.6,     // Medium-high for pressure
                    recovery: 0.5      // Medium for recovery phases
                }
            },
            situational: {
                health: {
                    critical: 1.5,     // 50% increase when health critical
                    healthy: 0.8       // 20% decrease when healthy
                },
                energy: {
                    low: 1.3,         // 30% increase when energy low
                    high: 0.9         // 10% decrease when energy high
                },
                position: {
                    trapped: 1.4,     // 40% increase when position poor
                    dominant: 0.8     // 20% decrease when position strong
                },
                momentum: {
                    winning: 0.9,     // 10% decrease when winning
                    losing: 1.2       // 20% increase when losing
                }
            }
        };
    }

    private cloneWeights(weights: DecisionWeights): DecisionWeights {
        return JSON.parse(JSON.stringify(weights));
    }

    public adjustWeight(path: string[], value: number) {
        let target: any = this.currentWeights;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]];
        }
        target[path[path.length - 1]] = Math.max(0, Math.min(1, value));
    }

    public resetWeights() {
        this.currentWeights = this.cloneWeights(this.baseWeights);
        this.situationalModifiers.clear();
    }

    public calculateSituationalMultiplier(
        gameState: GameState,
        profile: UnitProfile
    ): number {
        let multiplier = 1.0;
        const unit = gameState.getUnitByProfile(profile);
        if (!unit) return multiplier;

        // Health-based modifiers
        const healthPercent = unit.health / unit.maxHealth;
        if (healthPercent < 0.3) {
            multiplier *= this.baseWeights.situational.health.critical;
        } else if (healthPercent > 0.8) {
            multiplier *= this.baseWeights.situational.health.healthy;
        }

        // Energy-based modifiers
        const energyPercent = unit.energy / unit.maxEnergy;
        if (energyPercent < 0.3) {
            multiplier *= this.baseWeights.situational.energy.low;
        } else if (energyPercent > 0.8) {
            multiplier *= this.baseWeights.situational.energy.high;
        }

        // Position-based modifiers (to be implemented with PositionAnalyzer)
        // Momentum-based modifiers (to be implemented with game state analysis)

        return multiplier;
    }

    public getWeight(path: string[]): number {
        let value: any = this.currentWeights;
        for (const key of path) {
            value = value[key];
        }
        return value as number;
    }

    public validateWeights(): boolean {
        const validateObject = (obj: any): boolean => {
            for (const key in obj) {
                if (typeof obj[key] === 'number') {
                    // Allow situational multipliers to be > 1
                    const isMultiplier = key === 'critical' || key === 'low' || 
                                       key === 'trapped' || key === 'losing';
                    if (!isMultiplier && (obj[key] < 0 || obj[key] > 1)) {
                        console.warn(`Invalid weight value for ${key}: ${obj[key]}`);
                        return false;
                    }
                } else if (typeof obj[key] === 'object') {
                    if (!validateObject(obj[key])) return false;
                }
            }
            return true;
        };

        return validateObject(this.currentWeights);
    }

    public getWeightAnalytics() {
        return {
            tacticalBalance: this.calculateCategoryBalance('tactical'),
            strategicBalance: this.calculateCategoryBalance('strategic'),
            situationalImpact: this.calculateSituationalImpact(),
            activeModifiers: Array.from(this.situationalModifiers.entries())
        };
    }

    private calculateCategoryBalance(category: 'tactical' | 'strategic'): number {
        const weights = this.currentWeights[category];
        let sum = 0;
        let count = 0;

        const processObject = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'number') {
                    sum += obj[key];
                    count++;
                } else if (typeof obj[key] === 'object') {
                    processObject(obj[key]);
                }
            }
        };

        processObject(weights);
        return count > 0 ? sum / count : 0;
    }

    private calculateSituationalImpact(): number {
        return Array.from(this.situationalModifiers.values())
            .reduce((acc, val) => acc * val, 1);
    }

    public getBaseWeights(): DecisionWeights {
        return this.cloneWeights(this.baseWeights);
    }

    public getCurrentWeights(): DecisionWeights {
        return this.cloneWeights(this.currentWeights);
    }

    public setWeights(weights: DecisionWeights): void {
        if (this.validateWeights()) {
            this.currentWeights = this.cloneWeights(weights);
        }
    }
} 