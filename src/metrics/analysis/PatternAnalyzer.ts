import { ThreatLogger } from './logging/ThreatLogger';
import { UnitThreatProfile, ThreatPattern } from './types';

export class PatternAnalyzer {
    public detectThreatPatterns(profile: UnitThreatProfile): ThreatPattern[] {
        const patterns = this.analyzePatterns(profile);
        if (patterns.length > 0) {
            ThreatLogger.logPatternDetection(profile.unitType, profile.unitId, patterns);
        }
        return patterns;
    }

    private analyzePatterns(profile: UnitThreatProfile): ThreatPattern[] {
        const patterns: ThreatPattern[] = [];
        const recentHistory = profile.threatHistory.slice(-10); // Look at last 10 actions
        
        // Analyze damage patterns
        const damagePatterns = this.analyzeDamagePatterns(recentHistory);
        patterns.push(...damagePatterns);
        
        // Analyze control patterns
        const controlPatterns = this.analyzeControlPatterns(recentHistory);
        patterns.push(...controlPatterns);

        // Filter out low frequency patterns
        return patterns.filter(pattern => pattern.frequency > 0.3);
    }

    private analyzeDamagePatterns(history: UnitThreatProfile['threatHistory']): ThreatPattern[] {
        const patterns: ThreatPattern[] = [];

        // High damage pattern
        const highDamageCount = history.filter(t => t.threatResult.damage > 20).length;
        if (highDamageCount >= 3) {
            patterns.push({
                pattern: 'High Damage Output',
                frequency: highDamageCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'damage'),
                counterMeasures: ['Increase defense', 'Keep distance', 'Use damage reduction abilities']
            });
        }

        // Burst damage pattern
        const burstDamageCount = this.detectBurstDamagePatterns(history);
        if (burstDamageCount > 0) {
            patterns.push({
                pattern: 'Burst Damage',
                frequency: burstDamageCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'burst'),
                counterMeasures: ['Spread units', 'Use defensive cooldowns early', 'Counter-engage after burst']
            });
        }

        // Sustained damage pattern
        const sustainedDamageCount = this.detectSustainedDamagePatterns(history);
        if (sustainedDamageCount > 0) {
            patterns.push({
                pattern: 'Sustained Damage',
                frequency: sustainedDamageCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'sustained'),
                counterMeasures: ['Focus healing', 'Rotate defensive abilities', 'Disengage when possible']
            });
        }

        return patterns;
    }

    private analyzeControlPatterns(history: UnitThreatProfile['threatHistory']): ThreatPattern[] {
        const patterns: ThreatPattern[] = [];

        // Control chain pattern
        const controlChainCount = this.detectControlChains(history);
        if (controlChainCount > 0) {
            patterns.push({
                pattern: 'Control Chain',
                frequency: controlChainCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'control'),
                counterMeasures: ['Use crowd control breaks', 'Maintain distance', 'Counter with immunity abilities']
            });
        }

        // Control + Damage combo pattern
        const comboCount = this.detectControlDamageCombo(history);
        if (comboCount > 0) {
            patterns.push({
                pattern: 'Control + Damage Combo',
                frequency: comboCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'combo'),
                counterMeasures: ['Save defensive cooldowns', 'Position defensively', 'Counter-engage after combo']
            });
        }

        // Area control pattern
        const areaControlCount = this.detectAreaControl(history);
        if (areaControlCount > 0) {
            patterns.push({
                pattern: 'Area Control',
                frequency: areaControlCount / history.length,
                effectiveness: this.calculateEffectiveness(history, 'area'),
                counterMeasures: ['Split forces', 'Use mobility abilities', 'Control alternate zones']
            });
        }

        return patterns;
    }

    private detectBurstDamagePatterns(history: UnitThreatProfile['threatHistory']): number {
        let burstCount = 0;
        for (let i = 1; i < history.length; i++) {
            const currentDamage = history[i].threatResult.damage;
            const previousDamage = history[i - 1].threatResult.damage;
            if (currentDamage > previousDamage * 2 && currentDamage > 30) {
                burstCount++;
            }
        }
        return burstCount;
    }

    private detectSustainedDamagePatterns(history: UnitThreatProfile['threatHistory']): number {
        let sustainedCount = 0;
        let consecutiveDamage = 0;
        
        for (let i = 0; i < history.length; i++) {
            if (history[i].threatResult.damage > 10) {
                consecutiveDamage++;
                if (consecutiveDamage >= 3) {
                    sustainedCount++;
                }
            } else {
                consecutiveDamage = 0;
            }
        }
        return sustainedCount;
    }

    private detectControlChains(history: UnitThreatProfile['threatHistory']): number {
        let chainCount = 0;
        let consecutiveControl = 0;

        for (let i = 0; i < history.length; i++) {
            const hasControl = Object.values(history[i].threatResult.controlEffects).some(effect => effect);
            if (hasControl) {
                consecutiveControl++;
                if (consecutiveControl >= 2) {
                    chainCount++;
                }
            } else {
                consecutiveControl = 0;
            }
        }
        return chainCount;
    }

    private detectControlDamageCombo(history: UnitThreatProfile['threatHistory']): number {
        let comboCount = 0;
        
        for (let i = 1; i < history.length; i++) {
            const currentSnapshot = history[i];
            const previousSnapshot = history[i - 1];
            
            const hasControl = Object.values(currentSnapshot.threatResult.controlEffects).some(effect => effect);
            const hasDamage = currentSnapshot.threatResult.damage > 15;
            const hadControlPreviously = Object.values(previousSnapshot.threatResult.controlEffects).some(effect => effect);
            
            if ((hasControl && hasDamage) || (hadControlPreviously && hasDamage)) {
                comboCount++;
            }
        }
        return comboCount;
    }

    private detectAreaControl(history: UnitThreatProfile['threatHistory']): number {
        return history.filter(snapshot => 
            snapshot.threatResult.hexesAffected > 2 &&
            Object.values(snapshot.threatResult.controlEffects).some(effect => effect)
        ).length;
    }

    private calculateEffectiveness(history: UnitThreatProfile['threatHistory'], patternType: string): number {
        const recentHistory = history.slice(-10);
        
        switch (patternType) {
            case 'damage':
                return this.calculateDamageEffectiveness(recentHistory);
            case 'burst':
                return this.calculateBurstEffectiveness(recentHistory);
            case 'sustained':
                return this.calculateSustainedEffectiveness(recentHistory);
            case 'control':
                return this.calculateControlEffectiveness(recentHistory);
            case 'combo':
                return this.calculateComboEffectiveness(recentHistory);
            case 'area':
                return this.calculateAreaEffectiveness(recentHistory);
            default:
                return 0.5;
        }
    }

    private calculateDamageEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        const totalDamage = history.reduce((sum, snapshot) => sum + snapshot.threatResult.damage, 0);
        const averageDamage = totalDamage / history.length;
        return Math.min(averageDamage / 50, 1); // Normalize to 0-1 range
    }

    private calculateBurstEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        const burstDamage = history.reduce((max, snapshot) => 
            Math.max(max, snapshot.threatResult.damage), 0);
        return Math.min(burstDamage / 100, 1);
    }

    private calculateSustainedEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        const damageValues = history.map(snapshot => snapshot.threatResult.damage);
        const variance = this.calculateVariance(damageValues);
        const averageDamage = damageValues.reduce((sum, val) => sum + val, 0) / damageValues.length;
        return Math.min((averageDamage / 30) * (1 - variance / 100), 1);
    }

    private calculateControlEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        const controlDuration = history.reduce((sum, snapshot) => 
            sum + (Object.values(snapshot.threatResult.controlEffects).filter(effect => effect).length), 0);
        return Math.min(controlDuration / (history.length * 2), 1);
    }

    private calculateComboEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        let maxComboEffect = 0;
        
        for (let i = 1; i < history.length; i++) {
            const current = history[i];
            const previous = history[i - 1];
            
            const hasControl = Object.values(current.threatResult.controlEffects).some(effect => effect);
            const hasDamage = current.threatResult.damage > 15;
            
            if (hasControl && hasDamage) {
                maxComboEffect = Math.max(maxComboEffect, 
                    (current.threatResult.damage / 100) + 
                    (Object.values(current.threatResult.controlEffects).filter(effect => effect).length / 3)
                );
            }
        }
        
        return Math.min(maxComboEffect, 1);
    }

    private calculateAreaEffectiveness(history: UnitThreatProfile['threatHistory']): number {
        const maxAreaEffect = history.reduce((max, snapshot) => 
            Math.max(max, snapshot.threatResult.hexesAffected / 6), 0);
        return Math.min(maxAreaEffect, 1);
    }

    private calculateVariance(numbers: number[]): number {
        const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
        const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
        return squareDiffs.reduce((sum, val) => sum + val, 0) / numbers.length;
    }
} 