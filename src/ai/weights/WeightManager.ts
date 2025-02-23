import { DecisionWeights } from '../types/DecisionWeights';
import { WeightSystem } from './WeightSystem';
import { UnitProfile } from '../types/UnitProfile';
import { Role, Playstyle } from '../types/UnitProfile';

interface WeightAnalytics {
    tacticalBalance: number;
    strategicBalance: number;
    situationalImpact: number;
    activeModifiers: [string, number][];
    averagePerformance?: number;
    performanceTrend?: number;
}

export class WeightManager {
    private weightSystem: WeightSystem;
    private roleWeights: Map<Role, DecisionWeights>;
    private playstyleWeights: Map<Playstyle, DecisionWeights>;
    private performanceHistory: Array<{
        profile: string;
        weights: DecisionWeights;
        performance: number;
    }>;

    constructor() {
        this.weightSystem = new WeightSystem();
        this.roleWeights = new Map();
        this.playstyleWeights = new Map();
        this.performanceHistory = [];
        this.initializeRoleWeights();
        this.initializePlaystyleWeights();
    }

    private initializeRoleWeights() {
        // Damage role weights
        this.roleWeights.set('Damage', {
            ...this.weightSystem.getBaseWeights(),
            tactical: {
                ...this.weightSystem.getBaseWeights().tactical,
                damage: {
                    burst: 0.9,
                    sustained: 0.8,
                    aoe: 0.7,
                    finishing: 0.9
                }
            }
        });

        // Control role weights
        this.roleWeights.set('Control', {
            ...this.weightSystem.getBaseWeights(),
            tactical: {
                ...this.weightSystem.getBaseWeights().tactical,
                control: {
                    immobilize: 0.9,
                    zone: 0.8,
                    debuff: 0.7,
                    denial: 0.6
                }
            }
        });

        // Support role weights
        this.roleWeights.set('Support', {
            ...this.weightSystem.getBaseWeights(),
            tactical: {
                ...this.weightSystem.getBaseWeights().tactical,
                positioning: {
                    safety: 0.9,
                    threat: 0.4,
                    objective: 0.6,
                    support: 0.9
                }
            }
        });

        // Tank role weights
        this.roleWeights.set('Tank', {
            ...this.weightSystem.getBaseWeights(),
            tactical: {
                ...this.weightSystem.getBaseWeights().tactical,
                positioning: {
                    safety: 0.7,
                    threat: 0.8,
                    objective: 0.8,
                    support: 0.6
                }
            }
        });
    }

    private initializePlaystyleWeights() {
        // Aggressive playstyle weights
        this.playstyleWeights.set('Aggressive', {
            ...this.weightSystem.getBaseWeights(),
            strategic: {
                ...this.weightSystem.getBaseWeights().strategic,
                tempo: {
                    initiative: 0.9,
                    pressure: 0.8,
                    recovery: 0.4
                }
            }
        });

        // Defensive playstyle weights
        this.playstyleWeights.set('Defensive', {
            ...this.weightSystem.getBaseWeights(),
            strategic: {
                ...this.weightSystem.getBaseWeights().strategic,
                mapControl: {
                    center: 0.8,
                    zones: 0.9,
                    mobility: 0.7
                }
            }
        });

        // Utility playstyle weights
        this.playstyleWeights.set('Utility', {
            ...this.weightSystem.getBaseWeights(),
            strategic: {
                ...this.weightSystem.getBaseWeights().strategic,
                resourceControl: {
                    generation: 0.9,
                    denial: 0.7,
                    efficiency: 0.8
                }
            }
        });

        // Flexible playstyle weights - balanced approach
        this.playstyleWeights.set('Flexible', {
            ...this.weightSystem.getBaseWeights(),
            strategic: {
                ...this.weightSystem.getBaseWeights().strategic,
                teamComp: {
                    synergy: 0.8,
                    coverage: 0.8,
                    formation: 0.8
                }
            }
        });
    }

    public switchToProfile(profile: UnitProfile): void {
        // Get base weights for role and playstyle
        const roleWeights = this.roleWeights.get(profile.roles.primary);
        const playstyleWeights = this.playstyleWeights.get(profile.roles.playstyle);
        
        if (!roleWeights || !playstyleWeights) {
            throw new Error(`Invalid role or playstyle in profile: ${profile.name}`);
        }

        // Merge weights with priority to role-specific weights
        const mergedWeights = this.mergeWeights(roleWeights, playstyleWeights);
        
        // Apply the merged weights to the weight system
        this.weightSystem.setWeights(mergedWeights);
    }

    private mergeWeights(primary: DecisionWeights, secondary: DecisionWeights, primaryWeight: number = 0.7): DecisionWeights {
        // Deep merge with default 70-30 split favoring primary weights
        const merged = JSON.parse(JSON.stringify(primary));
        
        const mergeValues = (target: any, source: any, weight: number) => {
            for (const key in source) {
                if (typeof source[key] === 'number') {
                    target[key] = (primary[key] * weight) + 
                                (secondary[key] * (1 - weight));
                } else if (typeof source[key] === 'object') {
                    mergeValues(target[key], source[key], weight);
                }
            }
        };

        mergeValues(merged, secondary, primaryWeight);
        return merged;
    }

    public recordPerformance(profile: string, weights: DecisionWeights, performance: number): void {
        this.performanceHistory.push({ profile, weights, performance });
        
        // Keep history manageable
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }

        // Trigger optimization if we have enough data
        if (this.performanceHistory.length >= 10) {
            this.optimizeWeights(profile);
        }
    }

    private optimizeWeights(profile: string): void {
        const profileHistory = this.performanceHistory.filter(h => h.profile === profile);
        if (profileHistory.length < 5) return;

        // Find best performing weights
        const bestPerformance = profileHistory.reduce((best, current) => {
            return current.performance > best.performance ? current : best;
        });

        // Gradually adjust weights towards best performing configuration
        const currentWeights = this.weightSystem.getCurrentWeights();
        const optimizedWeights = this.mergeWeights(currentWeights, bestPerformance.weights, 0.8);
        
        this.weightSystem.setWeights(optimizedWeights);
    }

    public getWeightAnalytics(): WeightAnalytics {
        const analytics = this.weightSystem.getWeightAnalytics() as WeightAnalytics;
        
        // Add performance metrics
        if (this.performanceHistory.length > 0) {
            const recentPerformance = this.performanceHistory.slice(-10);
            analytics.averagePerformance = recentPerformance.reduce(
                (sum, entry) => sum + entry.performance, 0
            ) / recentPerformance.length;
            
            analytics.performanceTrend = this.calculatePerformanceTrend();
        }

        return analytics;
    }

    private calculatePerformanceTrend(): number {
        if (this.performanceHistory.length < 10) return 0;

        const recent = this.performanceHistory.slice(-10);
        const firstHalf = recent.slice(0, 5);
        const secondHalf = recent.slice(-5);

        const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.performance, 0) / 5;
        const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.performance, 0) / 5;

        return secondAvg - firstAvg; // Positive means improving, negative means declining
    }

    public getWeightSystem(): WeightSystem {
        return this.weightSystem;
    }
} 