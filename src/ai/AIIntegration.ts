import { OllamaAIIntegration, AIDecision } from './integration/OllamaAIIntegration';
import { GameState } from '../game/GameState';
import { UnitProfile } from './types/UnitProfile';
import { ThreatAnalysis, PositionAnalysis, PatternAnalysis } from '../metrics/analysis/types';
import { ResourceAnalysis } from '../metrics/analysis/resource/ResourceAnalyzer';

export class AIIntegration {
    private ollamaIntegration: OllamaAIIntegration;

    constructor() {
        this.ollamaIntegration = new OllamaAIIntegration();
    }

    public async getDecision(input: {
        gameState: GameState;
        unitProfile: UnitProfile;
        analysis: {
            threat: ThreatAnalysis;
            position: PositionAnalysis;
            resource: ResourceAnalysis;
            pattern: PatternAnalysis;
        };
        options: Array<{
            type: 'move' | 'ability';
            data: any;
            preliminaryScore: number;
        }>;
    }): Promise<AIDecision> {
        return this.ollamaIntegration.getDecision(
            input.gameState,
            input.unitProfile,
            input.analysis,
            input.options
        );
    }
} 