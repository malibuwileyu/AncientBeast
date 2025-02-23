import { Creature } from '../../../creature';
import { Ability } from '../../../ability';
import { Effect } from '../../../effect';

interface Position {
    x: number;
    y: number;
}

export class ThreatLogger {
    private static formatHeader(category: string, source: Creature): string {
        return `[ThreatAnalytics][${category}] Unit: ${source.name} (ID: ${source.id})`;
    }

    public static logMovementAnalysis(creature: Creature, from: Position, to: Position, analysis: any): void {
        console.group(`[ThreatAnalytics][Movement] ${creature.name} (ID: ${creature.id})`);
        
        // Basic movement info
        console.log('Movement:', {
            startPosition: analysis.startPosition ? `(${analysis.startPosition.x}, ${analysis.startPosition.y})` : 'Unknown',
            from: `(${from.x}, ${from.y})`,
            to: `(${to.x}, ${to.y})`,
            distance: Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)),
            totalDistance: analysis.startPosition ? 
                Math.max(
                    Math.abs(to.x - analysis.startPosition.x),
                    Math.abs(to.y - analysis.startPosition.y)
                ) : undefined
        });

        // Position quality
        console.group('Position Analysis:');
        console.log('Before:', {
            escapeRoutes: analysis.before?.escapeRoutes || 0,
            nearbyThreats: analysis.before?.threats || 0,
            zoneControl: analysis.before?.controlledZones || 0
        });
        console.log('After:', {
            escapeRoutes: analysis.after?.escapeRoutes || 0,
            nearbyThreats: analysis.after?.threats || 0,
            zoneControl: analysis.after?.controlledZones || 0
        });
        console.groupEnd();

        // Movement purpose
        if (analysis.purpose) {
            console.log('Purpose:', analysis.purpose);
        }

        // Strategic impact
        console.group('Strategic Impact:');
        console.log('Position Quality:', analysis.positionImprovement ? 'Improved' : 'Maintained/Decreased');
        console.log('Zone Control:', {
            gained: analysis.zonesGained || 0,
            lost: analysis.zonesLost || 0,
            contested: analysis.zonesContested || 0
        });
        console.log('Board Control:', {
            centerDistance: analysis.distanceFromCenter,
            isOnEdge: analysis.isOnEdge,
            threatRange: analysis.inThreatRange || []
        });

        if (analysis.tacticalAdvantage) {
            console.group('Tactical Advantage:');
            console.log('Value:', analysis.tacticalAdvantage.value.toFixed(2));
            console.log('Factors:', analysis.tacticalAdvantage.factors);
            console.log('Details:', analysis.tacticalAdvantage.details);
            console.groupEnd();
        }

        if (analysis.betterMoves && analysis.betterMoves.length > 0) {
            console.group('Better Moves Available:');
            analysis.betterMoves.slice(0, 10).forEach((move: any, index: number) => {
                console.log(`${index + 1}:`, {
                    position: `(${move.position.x}, ${move.position.y})`,
                    quality: move.quality.toFixed(2),
                    reason: move.reason
                });
            });
            if (analysis.betterMoves.length > 10) {
                console.log(`... and ${analysis.betterMoves.length - 10} more options`);
            }
            console.groupEnd();
        }

        // Resource state
        if (analysis.resources) {
            console.group('Resource State:');
            console.log('Energy:', {
                current: `${(analysis.resources.efficiency.energy.usage * 100).toFixed(1)}%`,
                regen: `${(analysis.resources.efficiency.energy.regeneration * 100).toFixed(1)}%`,
                forecast: analysis.resources.forecast.energyForecast
            });
            console.log('Plasma:', {
                efficiency: `${(analysis.resources.efficiency.plasma.usage * 100).toFixed(1)}%`,
                advantage: analysis.resources.efficiency.plasma.advantage.toFixed(2),
                forecast: analysis.resources.forecast.plasmaForecast
            });
            console.log('Endurance:', {
                usage: `${(analysis.resources.efficiency.endurance.usage * 100).toFixed(1)}%`,
                risk: `${(analysis.resources.efficiency.endurance.risk * 100).toFixed(1)}%`,
                fatigue: analysis.resources.forecast.fatigueForecast ? 'Likely' : 'Unlikely'
            });
            if (analysis.resources.suggestions.immediate.length > 0) {
                console.log('Immediate Suggestions:', analysis.resources.suggestions.immediate);
            }
            if (analysis.resources.suggestions.strategic.length > 0) {
                console.log('Strategic Suggestions:', analysis.resources.suggestions.strategic);
            }
            console.groupEnd();
        }

        console.groupEnd();
    }

    public static logAbilityAnalysis(
        source: Creature,
        ability: Ability,
        analysis: {
            ability: any;
            threat: any;
            effects?: any;
            state?: {
                before: any;
                after: any;
            };
            target?: {
                id: number;
                name: string;
                position: Position;
            };
            result?: {
                success: boolean;
                actualDamage?: number;
                appliedEffects?: string[];
            };
        }
    ): void {
        console.group(`[ThreatAnalytics][Ability] ${source.name} used ${ability.title}`);

        // Target information if available
        if (analysis.target) {
            console.log('Target:', {
                name: analysis.target.name,
                id: analysis.target.id,
                position: analysis.target.position
            });
        }

        // Effects and costs
        if (analysis.effects) {
            console.group('Effects:');
            console.log('Type:', {
                damage: analysis.effects.damage,
                movement: analysis.effects.movement,
                control: analysis.effects.control,
                buff: analysis.effects.buff
            });
            console.log('Costs:', analysis.effects.costs);
            console.log('Resource Changes:', {
                energy: analysis.effects.resourceChanges?.energy || 0,
                plasma: analysis.effects.resourceChanges?.plasma || 0,
                endurance: analysis.effects.resourceChanges?.endurance || 0
            });
            console.groupEnd();
        }

        // State changes
        if (analysis.state) {
            console.group('State Changes:');
            console.log('Resources:', {
                energy: {
                    before: analysis.state.before.energy.current,
                    after: analysis.state.after.energy.current,
                    efficiency: ((analysis.state.after.energy.current / analysis.state.before.energy.current) * 100).toFixed(1) + '%'
                },
                plasma: source.player ? {
                    team: source.player.plasma,
                    total: analysis.state.after.energy.current,
                    efficiency: ((source.player.plasma / analysis.state.after.energy.current) * 100).toFixed(1) + '%'
                } : 'N/A'
            });
            console.log('Unit State:', {
                before: analysis.state.before,
                after: analysis.state.after
            });
            console.groupEnd();
        }

        // Ability analysis
        console.group('Ability Analysis:');
        console.log('Offensive Impact:', analysis.ability.offensiveImpact);
        console.log('Target Analysis:', analysis.ability.targetAnalysis);
        
        // Add combo potential
        if (analysis.ability.comboPotential) {
            console.log('Combo Potential:', {
                followUps: analysis.ability.comboPotential.followUpAbilities || [],
                synergies: analysis.ability.comboPotential.teamSynergies || []
            });
        }
        console.groupEnd();

        // Threat analysis
        console.group('Threat Analysis:');
        console.log('Threat Level:', analysis.threat.level || 'Low');
        console.log('Threat Type:', analysis.threat.type || 'None');
        console.log('Range:', analysis.threat.range);
        console.log('Details:', analysis.threat.details);
        console.groupEnd();

        // Result if available
        if (analysis.result) {
            console.group('Result:');
            console.log('Success:', analysis.result.success);
            if (analysis.result.actualDamage !== undefined) {
                console.log('Actual Damage:', analysis.result.actualDamage);
            }
            if (analysis.result.appliedEffects) {
                console.log('Applied Effects:', analysis.result.appliedEffects);
            }
            console.groupEnd();
        }

        console.groupEnd();
    }

    public static logDamageAnalysis(source: Creature, target: Creature, analysis: any): void {
        console.log(`${this.formatHeader('Damage', source)}
            Target: ${target.name} (ID: ${target.id})
            Team: ${source.team} -> ${target.team}
            ${this.formatAnalysis(analysis)}`);
    }

    public static logEffectAnalysis(source: Creature, target: Creature, effect: Effect, analysis: any): void {
        console.log(`${this.formatHeader('Effect', source)}
            Effect: ${effect.name}
            Target: ${target.name} (ID: ${target.id})
            Team: ${target.team}
            ${this.formatAnalysis(analysis)}`);
    }

    public static logSummonAnalysis(summoner: Creature, summonedCreature: Creature, analysis: {
        summonerProfile: any;
        summonedProfile: any;
        position: { x: number; y: number };
        ability: string;
    }): void {
        // Start a collapsible group
        console.group(`[ThreatAnalytics][Summon] ${summoner.name} (ID: ${summoner.id}) -> ${summonedCreature.name} (ID: ${summonedCreature.id})`);

        // Log essential info
        console.log('Basic Info:', {
            ability: analysis.ability,
            position: analysis.position,
            team: `${summoner.team} -> ${summonedCreature.team}`
        });

        // Log summoner profile summary (only relevant parts)
        console.log('Summoner Status:', {
            type: analysis.summonerProfile.unitType,
            abilities: analysis.summonerProfile.abilities.size,
            strengths: Object.entries(analysis.summonerProfile.strengths)
                .filter(([_, value]) => value)
                .map(([key]) => key),
            vulnerabilities: Object.entries(analysis.summonerProfile.vulnerabilities)
                .filter(([_, value]) => value)
                .map(([key]) => key)
        });

        // Log summoned creature profile summary
        console.log('Summoned Unit Status:', {
            type: analysis.summonedProfile.unitType,
            abilities: analysis.summonedProfile.abilities.size,
            strengths: Object.entries(analysis.summonedProfile.strengths)
                .filter(([_, value]) => value)
                .map(([key]) => key),
            vulnerabilities: Object.entries(analysis.summonedProfile.vulnerabilities)
                .filter(([_, value]) => value)
                .map(([key]) => key)
        });

        // End the group
        console.groupEnd();
    }

    public static logPatternDetection(unitType: string, unitId: number, patterns: any[]): void {
        console.group(`[ThreatAnalytics][Pattern] ${unitType || 'Unknown Unit'} (ID: ${unitId})`);
        
        if (patterns.length === 0) {
            console.log('No significant patterns detected');
        } else {
            patterns.forEach(pattern => {
                console.group(`Pattern: ${pattern.pattern}`);
                console.log('Frequency:', pattern.frequency.toFixed(2));
                console.log('Effectiveness:', pattern.effectiveness.toFixed(2));
                console.log('Counter Measures:', pattern.counterMeasures.join(', '));
                console.groupEnd();
            });
        }
        
        console.groupEnd();
    }

    public static logResourceState(creature: Creature, state: {
        current: {
            energy: number;
            endurance: number;
            plasma: number;
        };
        team?: {
            totalPlasma: number;
            plasmaEfficiency: number;
        };
        turnUsage: {
            energy: number;
            endurance: number;
            plasma: number;
        };
        analysis: {
            efficiency: {
                energy: {
                    usage: number;
                    regeneration: number;
                    waste: number;
                };
                plasma: {
                    usage: number;
                    teamShare: number;
                    advantage: number;
                };
                endurance: {
                    usage: number;
                    recovery: number;
                    risk: number;
                };
            };
            timing: {
                energyTiming: number;
                plasmaTiming: number;
                enduranceTiming: number;
            };
            forecast: {
                energyForecast: number;
                plasmaForecast: number;
                fatigueForecast: boolean;
            };
            suggestions: {
                immediate: string[];
                strategic: string[];
            };
        };
    }): void {
        // Skip logging if creature or stats are not properly initialized
        if (!creature || !creature.stats || !creature.stats.energy || !creature.stats.endurance) {
            console.debug('[ThreatAnalytics][Resources] Skipping resource logging - creature not fully initialized');
            return;
        }

        console.group(`[ThreatAnalytics][Resources] ${creature.name} (ID: ${creature.id})`);
        
        try {
            console.log('Current State:', {
                energy: `${state.current.energy}/${creature.stats.energy} (${((state.current.energy / creature.stats.energy) * 100).toFixed(1)}%)`,
                endurance: `${state.current.endurance}/${creature.stats.endurance} (${((state.current.endurance / creature.stats.endurance) * 100).toFixed(1)}%)`,
                plasma: state.current.plasma
            });

            // Only log team resources if team data is available
            if (state.team) {
                console.log('Team Resources:', {
                    plasma: {
                        total: state.team.totalPlasma,
                        efficiency: `${(state.team.plasmaEfficiency * 100).toFixed(1)}%`
                    }
                });
            }

            console.log('Turn Usage:', {
                energy: state.turnUsage.energy,
                endurance: state.turnUsage.endurance,
                plasma: state.turnUsage.plasma
            });

            console.group('Resource Analysis');
            
            console.log('Efficiency:', {
                energy: {
                    usage: `${(state.analysis.efficiency.energy.usage * 100).toFixed(1)}%`,
                    regeneration: `${(state.analysis.efficiency.energy.regeneration * 100).toFixed(1)}%`,
                    waste: `${(state.analysis.efficiency.energy.waste * 100).toFixed(1)}%`
                },
                plasma: {
                    usage: `${(state.analysis.efficiency.plasma.usage * 100).toFixed(1)}%`,
                    teamShare: `${(state.analysis.efficiency.plasma.teamShare * 100).toFixed(1)}%`,
                    advantage: state.analysis.efficiency.plasma.advantage.toFixed(2)
                },
                endurance: {
                    usage: `${(state.analysis.efficiency.endurance.usage * 100).toFixed(1)}%`,
                    recovery: `${(state.analysis.efficiency.endurance.recovery * 100).toFixed(1)}%`,
                    risk: `${(state.analysis.efficiency.endurance.risk * 100).toFixed(1)}%`
                }
            });

            console.log('Timing Quality:', {
                energy: `${(state.analysis.timing.energyTiming * 100).toFixed(1)}%`,
                plasma: `${(state.analysis.timing.plasmaTiming * 100).toFixed(1)}%`,
                endurance: `${(state.analysis.timing.enduranceTiming * 100).toFixed(1)}%`
            });

            console.log('Forecast:', {
                energy: state.analysis.forecast.energyForecast,
                plasma: state.analysis.forecast.plasmaForecast,
                fatigue: state.analysis.forecast.fatigueForecast ? 'Likely' : 'Unlikely'
            });

            if (state.analysis.suggestions.immediate.length > 0) {
                console.log('Immediate Suggestions:', state.analysis.suggestions.immediate);
            }
            if (state.analysis.suggestions.strategic.length > 0) {
                console.log('Strategic Suggestions:', state.analysis.suggestions.strategic);
            }

            console.groupEnd(); // Resource Analysis
        } catch (error) {
            console.warn('[ThreatAnalytics][Resources] Error logging resource state:', error);
        } finally {
            console.groupEnd(); // Main group
        }
    }

    private static formatAnalysis(analysis: any): string {
        return Object.entries(analysis)
            .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
            .join('\n            ');
    }

    private static formatPatterns(patterns: any[]): string {
        return patterns
            .map(p => `- ${p.pattern}: Frequency=${p.frequency}, Effectiveness=${p.effectiveness}`)
            .join('\n            ');
    }
} 