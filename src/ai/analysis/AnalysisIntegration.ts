import { WeightSystem } from '../weights/WeightSystem';
import { ThreatAnalyzer, ThreatAssessment, ThreatType, ThreatDetails } from '../../metrics/analysis/ThreatAnalyzer';
import { PositionAnalyzer } from '../../metrics/analysis/PositionAnalyzer';
import { ResourceAnalyzer } from '../../metrics/analysis/resource/ResourceAnalyzer';
import { PatternAnalyzer } from '../../metrics/analysis/PatternAnalyzer';
import { GameState } from '../../game/GameState';
import { UnitProfile } from '../types/UnitProfile';
import { ThreatAnalysis, ThreatPattern } from '../../metrics/analysis/types';
import { PositionQuality } from '../../metrics/analysis/PositionAnalyzer';
import { ResourceAnalysis } from '../../metrics/analysis/resource/ResourceAnalyzer';
import { ProfileManager } from '../../metrics/analysis/ProfileManager';
import Game from '../../game';
import { Creature } from '../../creature';
import { StateCapture } from '../../metrics/StateCapture';

export interface AnalysisResult {
    threatLevel: number;          // 0-1 scale
    positionQuality: number;      // 0-1 scale
    resourceEfficiency: number;   // 0-1 scale
    patternConfidence: number;    // 0-1 scale
    weightModifiers: {
        tactical: number;
        strategic: number;
        situational: number;
    };
}

export class AnalysisIntegration {
    private weightSystem: WeightSystem;
    private threatAnalyzer: ThreatAnalyzer;
    private positionAnalyzer: PositionAnalyzer;
    private resourceAnalyzer: ResourceAnalyzer;
    private patternAnalyzer: PatternAnalyzer;
    private profileManager: ProfileManager;
    private game: Game;
    private stateCapture: StateCapture;

    constructor(
        weightSystem: WeightSystem,
        threatAnalyzer: ThreatAnalyzer,
        positionAnalyzer: PositionAnalyzer,
        resourceAnalyzer: ResourceAnalyzer,
        patternAnalyzer: PatternAnalyzer,
        profileManager: ProfileManager,
        game: Game
    ) {
        this.weightSystem = weightSystem;
        this.threatAnalyzer = threatAnalyzer;
        this.positionAnalyzer = positionAnalyzer;
        this.resourceAnalyzer = resourceAnalyzer;
        this.patternAnalyzer = patternAnalyzer;
        this.profileManager = profileManager;
        this.game = game;
        this.stateCapture = new StateCapture(game);
    }

    public async analyzeGameState(
        gameState: GameState,
        profile: UnitProfile
    ): Promise<AnalysisResult> {
        const unit = gameState.getUnitByProfile(profile);
        if (!unit) {
            throw new Error(`Unit not found for profile: ${profile.name}`);
        }

        // Get the Creature instance from the game
        const creature = this.game.creatures.find(c => c.id === unit.id);
        if (!creature) {
            throw new Error(`Creature not found for unit: ${unit.id}`);
        }

        // Get the unit's threat profile
        const threatProfile = this.profileManager.getOrCreateUnitProfile(creature);

        // Convert GameState to TurnState
        const turnState = this.stateCapture.captureTurnState(this.game.turn);

        // Get analysis from each analyzer
        const threatAssessments = this.threatAnalyzer.analyzeThreatLevel(creature, turnState);
        const threatAnalysis = this.convertToThreatAnalysis(threatAssessments);
        const positionQuality = this.positionAnalyzer.evaluatePosition(creature);
        const resourceAnalysis = this.resourceAnalyzer.analyzeResourceUsage(creature);
        const patterns = this.patternAnalyzer.detectThreatPatterns(threatProfile);

        // Calculate base metrics
        const threatLevel = this.calculateThreatLevel(threatAnalysis);
        const positionScore = this.calculatePositionQuality(positionQuality);
        const resourceEfficiency = this.calculateResourceEfficiency(resourceAnalysis);
        const patternConfidence = this.calculatePatternConfidence(patterns);

        // Calculate weight modifiers based on analysis
        const weightModifiers = this.calculateWeightModifiers({
            threatLevel,
            positionQuality: positionScore,
            resourceEfficiency,
            patternConfidence,
            threatAnalysis,
            positionAnalysis: positionQuality,
            resourceAnalysis,
            patterns
        });

        // Apply modifiers to weight system
        this.applyWeightModifiers(weightModifiers);

        return {
            threatLevel,
            positionQuality: positionScore,
            resourceEfficiency,
            patternConfidence,
            weightModifiers
        };
    }

    private convertToThreatAnalysis(assessments: ThreatAssessment[]): ThreatAnalysis[] {
        return assessments.map(assessment => {
            // Get the target creature
            const targetCreature = this.game.creatures.find(c => c.id === assessment.targetId);
            if (!targetCreature) {
                throw new Error(`Target creature not found: ${assessment.targetId}`);
            }

            const analysis: ThreatAnalysis = {
                effectiveThreat: assessment.threatLevel,
                damageEstimate: assessment.details.damageEstimate || 0,
                controlImpact: assessment.details.controlDuration || 0,
                positionalThreat: assessment.threatType === 'positioning' ? 1 : 0,
                resourceThreat: assessment.threatType === 'resource' ? 1 : 0,
                details: {
                    willKill: assessment.details.damageEstimate >= targetCreature.health,
                    willDisable: assessment.threatType === 'control',
                    willTrapTarget: assessment.threatType === 'zone',
                    willForceMovement: assessment.threatType === 'positioning',
                    synergiesWithTeam: false // TODO: Implement team synergy detection
                }
            };
            return analysis;
        });
    }

    private calculateThreatLevel(threatAnalysis: ThreatAnalysis[]): number {
        // Normalize threat level to 0-1 scale
        // Use the highest threat level from all threats
        return Math.min(1, Math.max(0,
            Math.max(...threatAnalysis.map(t => t.effectiveThreat))
        ));
    }

    private calculatePositionQuality(positionQuality: PositionQuality): number {
        // Already normalized to 0-1 scale by PositionAnalyzer
        return positionQuality.value;
    }

    private calculateResourceEfficiency(resourceAnalysis: ResourceAnalysis): number {
        // Normalize resource efficiency to 0-1 scale
        return Math.min(1, Math.max(0,
            (resourceAnalysis.efficiency.energy.usage * 0.4) +
            (resourceAnalysis.efficiency.endurance.usage * 0.3) +
            (resourceAnalysis.efficiency.plasma.usage * 0.3)
        ));
    }

    private calculatePatternConfidence(patterns: ThreatPattern[]): number {
        // Normalize pattern confidence to 0-1 scale
        if (patterns.length === 0) return 0;
        
        // Average the pattern frequencies
        const avgFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length;
        return Math.min(1, avgFrequency);
    }

    private calculateWeightModifiers(data: any): {
        tactical: number;
        strategic: number;
        situational: number;
    } {
        // Calculate tactical modifier based on immediate situation
        const tactical = this.calculateTacticalModifier(data);

        // Calculate strategic modifier based on long-term patterns
        const strategic = this.calculateStrategicModifier(data);

        // Calculate situational modifier based on current state
        const situational = this.calculateSituationalModifier(data);

        return { tactical, strategic, situational };
    }

    private calculateTacticalModifier(data: any): number {
        return Math.min(2, Math.max(0.5,
            1 + (
                (data.threatLevel * 0.4) +
                ((1 - data.positionQuality) * 0.3) +
                ((1 - data.resourceEfficiency) * 0.3)
            )
        ));
    }

    private calculateStrategicModifier(data: any): number {
        return Math.min(2, Math.max(0.5,
            1 + (
                (data.patternConfidence * 0.4) +
                (data.positionAnalysis.factors.control * 0.3) +
                (data.resourceAnalysis.efficiency.energy.regeneration * 0.3)
            )
        ));
    }

    private calculateSituationalModifier(data: any): number {
        return Math.min(2, Math.max(0.5,
            1 + (
                (data.threatAnalysis[0]?.details.willKill ? 0.4 : 0) +
                (data.positionAnalysis.factors.safety < 0.3 ? 0.3 : 0) +
                (data.resourceAnalysis.efficiency.endurance.risk > 0.7 ? 0.3 : 0)
            )
        ));
    }

    private applyWeightModifiers(modifiers: {
        tactical: number;
        strategic: number;
        situational: number;
    }) {
        // Apply tactical modifiers
        this.weightSystem.adjustWeight(['tactical', 'damage', 'burst'], 
            this.weightSystem.getWeight(['tactical', 'damage', 'burst']) * modifiers.tactical);
        this.weightSystem.adjustWeight(['tactical', 'positioning', 'safety'],
            this.weightSystem.getWeight(['tactical', 'positioning', 'safety']) * modifiers.tactical);

        // Apply strategic modifiers
        this.weightSystem.adjustWeight(['strategic', 'mapControl', 'center'],
            this.weightSystem.getWeight(['strategic', 'mapControl', 'center']) * modifiers.strategic);
        this.weightSystem.adjustWeight(['strategic', 'tempo', 'initiative'],
            this.weightSystem.getWeight(['strategic', 'tempo', 'initiative']) * modifiers.strategic);

        // Apply situational modifiers
        this.weightSystem.adjustWeight(['situational', 'health', 'critical'],
            this.weightSystem.getWeight(['situational', 'health', 'critical']) * modifiers.situational);
        this.weightSystem.adjustWeight(['situational', 'position', 'trapped'],
            this.weightSystem.getWeight(['situational', 'position', 'trapped']) * modifiers.situational);
    }
} 