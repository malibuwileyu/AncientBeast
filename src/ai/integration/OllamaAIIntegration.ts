// @ts-ignore
import OpenAI from 'openai';
import { GameState } from '../../game/GameState';
import { UnitProfile, Role, Playstyle } from '../types/UnitProfile';
import { ThreatAnalysis, PositionAnalysis, PatternAnalysis } from '../../metrics/analysis/types';
import { ResourceAnalysis } from '../../metrics/analysis/resource/ResourceAnalyzer';
import AbolishedProfile from '../profiles/json/Abolished.json';
import BountyHunterProfile from '../profiles/json/BountyHunter.json';
import CyberWolfProfile from '../profiles/json/CyberWolf.json';
import DarkPriestProfile from '../profiles/json/DarkPriest.json';
import GoldenWyrmProfile from '../profiles/json/GoldenWyrm.json';
import GumbleProfile from '../profiles/json/Gumble.json';
import HeadlessProfile from '../profiles/json/Headless.json';
import ImpalerProfile from '../profiles/json/Impaler.json';
import MagmaSpawnProfile from '../profiles/json/MagmaSpawn.json';
import NightmareProfile from '../profiles/json/Nightmare.json';
import NutcaseProfile from '../profiles/json/Nutcase.json';
import ScavengerProfile from '../profiles/json/Scavenger.json';
import SnowBunnyProfile from '../profiles/json/SnowBunny.json';
import StomperProfile from '../profiles/json/Stomper.json';
import SwineThugProfile from '../profiles/json/SwineThug.json';
import UncleFungusProfile from '../profiles/json/UncleFungus.json';
import VehemothProfile from '../profiles/json/Vehemoth.json';
import GameRules from '../docs/game_rules.json';

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

// Type assertion function to ensure profile matches UnitProfile interface
function assertUnitProfile(profile: any): UnitProfile {
    // Ensure roles have correct types
    if (profile.roles) {
        profile.roles.primary = profile.roles.primary as Role;
        if (profile.roles.secondary) {
            profile.roles.secondary = profile.roles.secondary as Role;
        }
        profile.roles.playstyle = profile.roles.playstyle as Playstyle;
    }

    // Handle special case for Dark Priest's comprehensiveEfficiency
    if (profile.name === 'Dark Priest' && profile.comprehensiveEfficiency === '--') {
        profile.comprehensiveEfficiency = -1; // Use -1 to represent non-summonable
    }

    return profile as UnitProfile;
}

export interface AIDecision {
    selectedOption: number;
    confidence: number;
    reasoning: string[];
    alternatives: number[];
}

interface CompositeAction {
    steps: Array<{
        type: 'move' | 'ability';
        data: any;
    }>;
    expectedOutcome: {
        damage?: number;
        control?: number;
        positioning?: number;
        outcome?: string;
        resourceCost: {
            energy: number;
            endurance: number;
            plasma?: number;
        };
    };
    reasoning: string[];
}

interface FilteredOptions {
    actions: CompositeAction[];
    reasoning: string[];
    filterCriteria: string[];
}

interface OllamaResponse {
    response: string;
}

interface OllamaRequestOptions {
    temperature: number;
    top_k: number;
    top_p: number;
    num_predict: number;
    stop: string[];
}

export class OllamaAIIntegration {
    private openai: OpenAI;
    private gameRules: typeof GameRules;
    private unitProfiles: UnitProfile[];

    constructor() {
        const origin = window.location.origin;
        
        this.openai = new OpenAI({
            baseURL: `${origin}/ollama`,
            apiKey: 'ollama',
            dangerouslyAllowBrowser: true
        });

        this.gameRules = GameRules;
        this.unitProfiles = [
            AbolishedProfile, BountyHunterProfile, CyberWolfProfile,
            DarkPriestProfile, GoldenWyrmProfile, GumbleProfile,
            HeadlessProfile, ImpalerProfile, MagmaSpawnProfile,
            NightmareProfile, NutcaseProfile, ScavengerProfile,
            SnowBunnyProfile, StomperProfile, SwineThugProfile,
            UncleFungusProfile, VehemothProfile
        ].map(assertUnitProfile);
    }

    private isSummoningDecision(options: Array<{ type: string; data: any }>): boolean {
        return options.some(opt => {
            if (opt.type !== 'ability') return false;
            const abilityName = opt.data.name?.toLowerCase() || '';
            const abilityDesc = opt.data.description?.toLowerCase() || '';
            return (
                abilityName.includes('summon') ||
                abilityName.includes('materialize') ||
                abilityDesc.includes('summon') ||
                abilityDesc.includes('materialize') ||
                abilityName.includes('godlet printer')
            );
        });
    }

    private constructContext(includeUnits = false): string {
        let context = `Game Rules:\n${JSON.stringify(this.gameRules, null, 2)}`;
        
        if (includeUnits) {
            const relevantProfiles = this.unitProfiles.filter(profile => {
                const isDarkPriest = profile.name === 'Dark Priest';
                const isDarkPriestSynergy = profile.synergyProfile?.pairs?.some(
                    pair => pair.unit === 'Dark Priest'
                );
                return isDarkPriest || isDarkPriestSynergy;
            });

            context += `\n\nAvailable Units:\n${JSON.stringify(relevantProfiles, null, 2)}`;
            
            context += `\n\nUnit Selection Guidelines:
1. Consider team composition and synergies
2. Evaluate resource costs vs unit effectiveness
3. Match units against current threats
4. Consider positional advantages
5. Balance immediate vs long-term value`;
        }

        return context;
    }

    private async makeOllamaRequest(prompt: string, options: Partial<OllamaRequestOptions> = {}): Promise<OllamaResponse> {
        const response = await fetch(`${window.location.origin}/ollama/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-r1:1.5b',
                prompt,
                stream: false,
                raw: false,
                options: {
                    temperature: options.temperature ?? 0.7,
                    top_k: options.top_k ?? 50,
                    top_p: options.top_p ?? 0.9,
                    num_predict: options.num_predict ?? 500,
                    stop: options.stop ?? ["Human:", "Assistant:"]
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        if (!data.response) {
            console.error('Unexpected response format:', data);
            throw new Error('Invalid response format from Ollama');
        }

        return data;
    }

    public async getDecision(
        gameState: GameState,
        profile: UnitProfile,
        analysis: {
            threat: ThreatAnalysis;
            position: PositionAnalysis;
            resource: ResourceAnalysis;
            pattern: PatternAnalysis;
        },
        options: Array<{
            type: 'move' | 'ability';
            data: any;
            preliminaryScore: number;
        }>
    ): Promise<AIDecision> {
        const prompt = this.constructPrompt(gameState, profile, analysis, options);
        const includeSummoningInfo = this.isSummoningDecision(options);
        
        try {
            console.log('Sending request to Ollama...');
            const data = await this.makeOllamaRequest(
                `${this.constructContext(includeSummoningInfo)}\n\nYou are an AI agent making tactical decisions in the Ancient Beast game. You are controlling a ${profile.roles.primary} unit with ${profile.roles.playstyle} playstyle.\n\n${prompt}`,
                {
                    temperature: 0.1,
                    num_predict: 1500,
                    stop: ["Human:", "Assistant:"]
                }
            );
            
            return this.parseResponse(data.response, options.length);
        } catch (error) {
            console.error("AI Decision Error:", error);
            return this.getFallbackDecision(options);
        }
    }

    private constructPrompt(
        gameState: GameState,
        profile: UnitProfile,
        analysis: {
            threat: ThreatAnalysis;
            position: PositionAnalysis;
            resource: ResourceAnalysis;
            pattern: PatternAnalysis;
        },
        options: Array<{
            type: 'move' | 'ability';
            data: any;
            preliminaryScore: number;
        }>
    ): string {
        return `
Current Game State:
- Turn: ${gameState.turn}
- Active Team: ${gameState.activeTeam}
- Unit: ${profile.name} (${profile.roles.primary} - ${profile.roles.playstyle})

Analysis:
- Threat Level: ${analysis.threat.effectiveThreat}
- Position Quality: ${analysis.position.value}
- Resource Status: Energy ${analysis.resource.efficiency.energy.usage}, Endurance ${analysis.resource.efficiency.endurance.usage}
- Pattern Confidence: ${analysis.pattern.confidence}

Available Options:
${options.map((opt, i) => `${i + 1}. ${opt.type}: ${JSON.stringify(opt.data)} (Score: ${opt.preliminaryScore})`).join('\n')}

Based on the unit's profile, current game state, and analysis, select the best option.
Use <think> tags to show your reasoning process and <answer> tags for your final decision.
Include the option number, confidence (0-1), and up to 2 alternative options.`;
    }

    private parseResponse(content: string, numOptions: number): AIDecision {
        try {
            const reasoningMatch = content.match(/<think>([\s\S]*?)<\/think>/);
            const reasoning = reasoningMatch ? reasoningMatch[1].trim().split('\n') : [];

            const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
            if (!answerMatch) {
                throw new Error("No answer found in response");
            }

            const answer = answerMatch[1].trim();
            
            const selectedOption = parseInt(answer.match(/option (\d+)/i)?.[1] || '1');
            const confidence = parseFloat(answer.match(/confidence: (0\.\d+)/)?.[1] || '0.7');
            const alternatives = (answer.match(/alternatives?:?\s*(\d+(?:\s*,\s*\d+)*)/i)?.[1] || '')
                .split(',')
                .map(n => parseInt(n.trim()))
                .filter(n => !isNaN(n) && n !== selectedOption && n <= numOptions);

            return {
                selectedOption: Math.min(Math.max(1, selectedOption), numOptions) - 1,
                confidence: Math.min(Math.max(0, confidence), 1),
                reasoning,
                alternatives: alternatives.length ? alternatives.map(n => n - 1) : []
            };
        } catch (error) {
            console.error("Response parsing error:", error);
            return this.getFallbackDecision({ numOptions });
        }
    }

    private getFallbackDecision(options: Array<{ type: 'move' | 'ability'; data: any; preliminaryScore: number; }> | { numOptions?: number } = { numOptions: 1 }): AIDecision {
        const numOptions = Array.isArray(options) ? options.length : (options.numOptions || 1);
        return {
            selectedOption: 0,
            confidence: 0.5,
            reasoning: ["Fallback decision due to processing error"],
            alternatives: numOptions > 1 ? [1] : []
        };
    }

    public async getResponse(prompt: string): Promise<string> {
        try {
            const data = await this.makeOllamaRequest(
                `${this.constructContext()}\n\nQuestion: ${prompt}`,
                {
                    temperature: 0.7,
                    num_predict: 150
                }
            );
            return data.response;
        } catch (error) {
            console.error('Error calling Ollama:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to get AI response: ${error.message}`);
            } else {
                throw new Error('Failed to get AI response: Unknown error');
            }
        }
    }

    public async getStrategicDecision(
        gameState: GameState,
        profile: UnitProfile,
        analysis: {
            threat: ThreatAnalysis;
            position: PositionAnalysis;
            resource: ResourceAnalysis;
            pattern: PatternAnalysis;
        },
        baseOptions: Array<{
            type: 'move' | 'ability';
            data: any;
            preliminaryScore: number;
        }>
    ): Promise<{
        recommendedActions: CompositeAction[];
        reasoning: string[];
    }> {
        const isSummoning = this.isSummoningDecision(baseOptions);
        const activeUnit = gameState.units.find(u => u.name === profile.name);
        const nearestEnemy = gameState.units
            .filter(u => u.id !== activeUnit?.id)
            .sort((a, b) => 
                Math.abs(a.position.x - (activeUnit?.position.x || 0)) + Math.abs(a.position.y - (activeUnit?.position.y || 0)) -
                (Math.abs(b.position.x - (activeUnit?.position.x || 0)) + Math.abs(b.position.y - (activeUnit?.position.y || 0)))
            )[0];
        
        try {
            console.log('Generating strategic recommendations...');
            const data = await this.makeOllamaRequest(
                `${this.constructContext(isSummoning)}

You are an AI advisor for the Ancient Beast game. Provide 3 strategic recommendations.

CRITICAL RULES:
1. Use XML tags for recommendations, not markdown formatting
2. Each recommendation must:
   - Use "Godlet Printer" as the action
   - Summon a DIFFERENT unit (no duplicate units across recommendations)
   - Place unit at valid coordinates near Dark Priest with a clear tactical purpose (defensive units in front, etc.)
   - Include clear reasoning about unit choice AND position
3. Coordinates and Range Limitations:
   - Dark Priest is at (${activeUnit?.position.x}, ${activeUnit?.position.y})
   - Movement range: 2 hexes from current position
   - Summon range: MAXIMUM 4 hexes from Dark Priest
   - If Dark Priest is at (0,4), valid summon coordinates are:
     * X: 0 to 4 only (cannot exceed 4 hex distance)
     * Y: 0 to 8 only (4 hexes up/down from position 4)
     * Example valid positions: (1,4), (2,4), (3,4), (4,4), (2,3), (2,5), etc.
   - Enemy is at (${nearestEnemy ? `${nearestEnemy.position.x}, ${nearestEnemy.position.y}` : 'None'})
   - Cannot summon at occupied positions: ${gameState.units.map(u => `(${u.position.x}, ${u.position.y})`).join(', ')}
   - IMPORTANT: Any position outside ±4 hexes from Dark Priest is INVALID

EXAMPLE FORMAT:
<think>
Dark Priest at (0,4) needs to establish defensive line against enemy at (14,4).
Valid summon range is limited to coordinates:
- X: 0-4 (max 4 hexes right from position 0)
- Y: 0-8 (max 4 hexes up/down from position 4)
Each recommendation must use a different unit and position.
</think>

<recommendation>
<title>Establish Defense with Snow Bunny</title>
<action>Godlet Printer</action>
<outcome>Summon Snow Bunny at (3,4)</outcome>
<resources>Energy: 20, Endurance: 10</resources>
<reasoning>Places Snow Bunny at (3,4), which is within the 4-hex summon range from Dark Priest while providing forward defense</reasoning>
</recommendation>

Current Situation:
- Dark Priest position: (${activeUnit?.position.x}, ${activeUnit?.position.y})
- Enemy position: ${nearestEnemy ? `(${nearestEnemy.position.x}, ${nearestEnemy.position.y})` : 'None'}
- Available plasma: ${gameState.units.find(u => u.name === "Dark Priest")?.energy || 0}
- Threat level: ${analysis.threat.effectiveThreat}

Available Units:
${this.unitProfiles
    .filter(p => p.synergyProfile?.pairs?.some(pair => pair.unit === 'Dark Priest') && p.name !== 'Dark Priest')
    .map(p => `- ${p.name} (Size: ${p.size}, Cost: ${UNIT_COSTS[p.name] || '??'}): ${p.roles.primary} - Synergy: ${p.synergyProfile.pairs.find(pair => pair.unit === 'Dark Priest')?.strength || 0}`)
    .join('\n')}

Provide exactly 3 recommendations using the XML format shown above. Use <think> only for your analysis, and <recommendation> for each recommendation.`,
                {
                    temperature: 0.1,
                    num_predict: 1500,
                    stop: ["Human:", "Assistant:"]
                }
            );

            const recommendations = this.parseRecommendations(data.response);
            
            return {
                recommendedActions: recommendations.map(rec => ({
                    steps: rec.actions.map(action => ({
                        type: action.toLowerCase().includes('move') ? 'move' : 'ability',
                        data: { description: action }
                    })),
                    expectedOutcome: {
                        outcome: rec.outcome,
                        resourceCost: this.parseResourceCost(rec.resources)
                    },
                    reasoning: [rec.reasoning]
                })),
                reasoning: recommendations.map(rec => `${rec.title}: ${rec.reasoning}`)
            };
        } catch (error) {
            console.error('Error getting strategic recommendations:', error);
            return {
                recommendedActions: [{
                    steps: [{
                        type: 'ability',
                        data: { description: 'Default action based on analysis' }
                    }],
                    expectedOutcome: {
                        resourceCost: {
                            energy: 0,
                            endurance: 0
                        }
                    },
                    reasoning: ['Error generating recommendations']
                }],
                reasoning: ['Error generating strategic recommendations']
            };
        }
    }

    private parseRecommendations(content: string): Array<{
        title: string;
        actions: string[];
        outcome: string;
        resources: string;
        reasoning: string;
    }> {
        console.log('Raw AI Response:', content);

        // First try to parse structured recommendation blocks
        const blockMatches = content.match(/<recommendation>[\s\S]*?<\/recommendation>/g);
        if (blockMatches) {
            return this.parseStructuredRecommendations(blockMatches);
        }

        // If no structured blocks found, try to parse numbered list format
        const listMatch = content.match(/\d+\.\s+[^\n]+/g);
        if (listMatch) {
            return this.parseListRecommendations(listMatch);
        }

        console.log('No valid recommendations found');
        return this.getFallbackRecommendations();
    }

    private parseStructuredRecommendations(blocks: string[]): Array<{
        title: string;
        actions: string[];
        outcome: string;
        resources: string;
        reasoning: string;
    }> {
        const recommendations: Array<{
            title: string;
            actions: string[];
            outcome: string;
            resources: string;
            reasoning: string;
        }> = [];

        blocks.forEach(block => {
            const cleanBlock = block.replace(/<\/?recommendation>/g, '').trim();

            const titleMatch = cleanBlock.match(/<title>(.*?)<\/title>/);
            const actionMatch = cleanBlock.match(/<action>(.*?)<\/action>/);
            const outcomeMatch = cleanBlock.match(/<outcome>(.*?)<\/outcome>/);
            const resourcesMatch = cleanBlock.match(/<resources>(.*?)<\/resources>/);
            const reasoningMatch = cleanBlock.match(/<reasoning>(.*?)<\/reasoning>/);

            if (titleMatch && actionMatch && outcomeMatch && resourcesMatch && reasoningMatch) {
                recommendations.push({
                    title: titleMatch[1].trim(),
                    actions: [actionMatch[1].trim()],
                    outcome: outcomeMatch[1].trim(),
                    resources: resourcesMatch[1].trim(),
                    reasoning: reasoningMatch[1].trim()
                });
            }
        });

        return recommendations;
    }

    private parseListRecommendations(items: string[]): Array<{
        title: string;
        actions: string[];
        outcome: string;
        resources: string;
        reasoning: string;
    }> {
        return items.map((item, index) => {
            const text = item.replace(/^\d+\.\s+/, '').trim();
            // Try to extract unit and position from the text
            const unitMatch = text.match(/(?:summon|use)\s+(?:a\s+)?(\w+(?:\s+\w+)?)/i);
            const posMatch = text.match(/at\s*\((\d+),\s*(\d+)\)/i);
            
            const unit = unitMatch ? unitMatch[1] : 'Unknown Unit';
            const pos = posMatch ? `(${posMatch[1]},${posMatch[2]})` : '(3,4)'; // Default position if none found

            return {
                title: `Strategic Option ${index + 1}`,
                actions: ['Godlet Printer'],
                outcome: `Summon ${unit} at ${pos}`,
                resources: unit.toLowerCase().includes('snow') ? 
                    'Energy: 20, Endurance: 10, Plasma: 15' :
                    'Energy: 20, Endurance: 10, Plasma: 30',
                reasoning: text
            };
        });
    }

    private getFallbackRecommendations(): Array<{
        title: string;
        actions: string[];
        outcome: string;
        resources: string;
        reasoning: string;
    }> {
        return [{
            title: 'Default Strategy',
            actions: ['Godlet Printer'],
            outcome: 'Summon Snow Bunny at (3,4)',
            resources: 'Energy: 20, Endurance: 10, Plasma: 15',
            reasoning: 'Fallback option when no specific recommendations available'
        }];
    }

    private parseResourceCost(resourceString: string): {
        energy: number;
        endurance: number;
    } {
        const costs = {
            energy: 0,
            endurance: 0
        };

        const energyMatch = resourceString.match(/energy[:\s]+(\d+)/i);
        const enduranceMatch = resourceString.match(/endurance[:\s]+(\d+)/i);

        if (energyMatch) costs.energy = parseInt(energyMatch[1]);
        if (enduranceMatch) costs.endurance = parseInt(enduranceMatch[1]);

        return costs;
    }
} 