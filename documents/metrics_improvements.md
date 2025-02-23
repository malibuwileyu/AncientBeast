## Threat Analysis Improvements
- [ ] Expand control effect detection
  - [ ] Add delayed/hindered status
  - [ ] Add materializationSickness
  - [ ] Add noActionPossible
  - [ ] Add cryostasis (enhanced frozen)
- [ ] Add threat metrics
  - [ ] Resource cost (energy/plasma requirements)
  - [ ] Mobility impact (push/pull/teleport)
  - [ ] Combo potential (ability synergies)
  - [ ] Zone control (area denial)
  - [ ] Buff/debuff strength
  - [ ] Summoning capabilities
  - [ ] Counter potential (retaliation/reactive abilities)

## Unit Analysis Improvements

### Capability Analysis
- [ ] Analyze unit movement patterns
  - [ ] Track rolling/charging abilities
  - [ ] Identify teleport capabilities
  - [ ] Map jump/leap abilities
  - [ ] Analyze push/pull effects
  - [ ] Calculate effective reach

### Target Priority Analysis
- [ ] Identify high-value targets
  - [ ] Dark Priest vulnerability assessment
  - [ ] Support unit positioning
  - [ ] Key ability carrier threats
  - [ ] Resource-rich targets
  - [ ] Strategic position holders

### Unit Role Classification
- [ ] Categorize unit roles
  - [ ] Assassin (high mobility, target elimination)
  - [ ] Controller (movement impairment, zone denial)
  - [ ] Support (buffs, healing, resource generation)
  - [ ] Tank (damage absorption, space control)
  - [ ] Hybrid (mixed capabilities)

### Threat Vector Analysis
- [ ] Map unit-specific threat patterns
  - [ ] Movement-based threats (rolling, charging)
  - [ ] Range-based threats (projectiles, beams)
  - [ ] Area-control threats (traps, zones)
  - [ ] Time-delayed threats (delayed abilities)
  - [ ] Resource-drain threats (energy/plasma depletion)

### Counter Strategy Mapping
- [ ] Develop unit-specific counters
  - [ ] Position-based counters
  - [ ] Ability-based counters
  - [ ] Resource-based counters
  - [ ] Team composition counters
  - [ ] Timing-based counters

### Required Analyzer Updates

#### UnitAnalyzer (New)
- [ ] Create dedicated unit analysis system
  - [ ] Movement pattern recognition
  - [ ] Ability combo detection
  - [ ] Role identification
  - [ ] Threat pattern mapping
  - [ ] Counter suggestion generation

#### ThreatAnalyzer Updates
- [ ] Integrate unit-specific threats
  - [ ] Add movement pattern threats
  - [ ] Include ability combo threats
  - [ ] Consider role-based threats
  - [ ] Track target priority threats

#### PositionAnalyzer Updates
- [ ] Add unit capability consideration
  - [ ] Update danger zones based on abilities
  - [ ] Consider movement patterns in safety calculation
  - [ ] Adjust threat ranges for special movements
  - [ ] Include combo potential in position evaluation

### Implementation Priority
1. Basic Unit Role Classification
2. Movement Pattern Analysis
3. Threat Vector Mapping
4. Target Priority System
5. Counter Strategy Development
6. Advanced Combo Detection

### Technical Requirements
- [ ] Efficient pattern recognition
- [ ] Fast threat vector calculation
- [ ] Real-time role assessment
- [ ] Performance-optimized combo detection
- [ ] Memory-efficient pattern storage

### Documentation Needs
- [ ] Document unit roles and classifications
- [ ] Explain threat vector calculations
- [ ] Detail counter strategy mapping
- [ ] Provide combo detection examples
- [ ] Include threat pattern visualizations

### Testing Requirements
- [ ] Unit role classification tests
- [ ] Movement pattern recognition tests
- [ ] Threat vector calculation tests
- [ ] Target priority assessment tests
- [ ] Counter strategy validation tests

## Technical Improvements
- [x] Implement proper state serialization
- [ ] Add state validation
- [x] Add error handling for state capture
- [ ] Add performance metrics for state capture
- [ ] Implement state diffing to reduce data size
- [x] Consolidate game logs into single storage object per game

## Documentation Needs
- [ ] Document state capture timing
- [ ] Document state structure
- [ ] Document action tracking
- [ ] Document technical limitations
- [ ] Add examples of state capture output

## Testing Requirements
- [ ] Add unit tests for state capture
- [ ] Add integration tests for metrics system
- [ ] Add performance tests
- [ ] Add validation tests
- [ ] Add example state snapshots for testing

## Summon Analysis Improvements

### Space Occupation Analysis
- [ ] Track hex occupation by summoned units
  - [ ] Single hex occupation for normal units
  - [ ] Multi-hex occupation for larger units
  - [ ] Update available movement spaces
  - [ ] Update pathing calculations
  - [ ] Track escape route changes

### Zone Control Analysis
- [ ] Analyze zone control changes from summons
  - [ ] Calculate new controlled zones
  - [ ] Update threat maps for both teams
  - [ ] Track safe movement path changes
  - [ ] Analyze contested zone changes
  - [ ] Monitor team territory shifts

### Strategic Position Analysis
- [ ] Evaluate strategic impact of summon positions
  - [ ] Identify choke point creation/removal
  - [ ] Analyze path blocking/enabling
  - [ ] Assess team formation impacts
  - [ ] Evaluate potential synergies
  - [ ] Track tactical option changes

### Required Analyzer Updates

#### PositionAnalyzer
- [ ] Update position calculations for new units
  - [ ] Consider summoned unit in escape routes
  - [ ] Update movement constraints
  - [ ] Recalculate board position metrics
  - [ ] Update threat proximity calculations

#### ThreatAnalyzer
- [ ] Include summons in threat assessment
  - [ ] Calculate immediate threat from summon
  - [ ] Assess potential future threats
  - [ ] Evaluate combined threat scenarios
  - [ ] Update team threat levels

#### New BoardStateAnalyzer
- [ ] Create new analyzer for board state tracking
  - [ ] Track zone control changes
  - [ ] Monitor board position evolution
  - [ ] Analyze territory control
  - [ ] Track strategic point control
  - [ ] Evaluate board state balance

### Implementation Priority
1. Space Occupation Analysis (Immediate Impact)
2. PositionAnalyzer Updates (Movement Effects)
3. ThreatAnalyzer Updates (Threat Assessment)
4. Zone Control Analysis (Strategic Impact)
5. BoardStateAnalyzer Creation (Long-term Tracking)
6. Strategic Position Analysis (Advanced Features)

### Technical Requirements
- [ ] Efficient hex occupation tracking
- [ ] Real-time threat map updates
- [ ] Fast path recalculation
- [ ] Memory-efficient state tracking
- [ ] Performance-optimized analysis

### Documentation Needs
- [ ] Document summon analysis methods
- [ ] Explain threat calculation changes
- [ ] Detail zone control metrics
- [ ] Provide strategic analysis guide
- [ ] Include example scenarios

### Testing Requirements
- [ ] Unit tests for space occupation
- [ ] Integration tests for analyzers
- [ ] Performance tests for updates
- [ ] Scenario-based testing
- [ ] Edge case validation

Note: This list will be updated as new requirements or improvements are identified. 