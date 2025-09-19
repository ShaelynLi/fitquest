# FitQuest Pet Evolution System Documentation

## Overview
FitQuest features a comprehensive pet collection and evolution system inspired by classic digital pets (Tamagotchi) and creature collection games. Each pet evolves through stages based on user activity, creating a strong motivation loop for fitness and nutrition goals.

## Evolution Stages

### 1. Young Stage (Egg)
- **Starting Point**: All pets begin as eggs
- **Duration**: Level 1-9
- **Appearance**: 🥚 (Egg emoji)
- **Requirements**: Basic interaction and care
- **XP Source**: Tapping, basic interactions

### 2. Adult Stage (Hatched)
- **Evolution Trigger**: Reach Level 10
- **Duration**: Level 10-19
- **Appearance**: 🐣 (Hatching emoji)
- **Requirements**: Regular workouts + nutrition logging
- **XP Source**: Running activities, meal logging, daily consistency

### 3. Ultimate Stage (Fully Grown)
- **Evolution Trigger**: Reach Level 20
- **Duration**: Level 20+
- **Appearance**: 🐥 (Grown creature)
- **Requirements**: Sustained high activity, quest completion
- **XP Source**: Major achievements, quest completion, evolution bonuses

## Pet Collection Series

### Phase 1: Basic Series (Initial Launch)
**Simple progression system with 3 stages per species**

1. **Basic Pet**
   - Young: 🥚 → Adult: 🐣 → Ultimate: 🐥

### Phase 2: Animal Series (Planned)
**Real-world animals with fitness themes**

1. **Canine Line**
   - Young: 🥚 → Adult: 🐶 → Ultimate: 🐕‍🦺 (Service Dog)

2. **Feline Line**
   - Young: 🥚 → Adult: 🐱 → Ultimate: 🦁 (Lion)

3. **Avian Line**
   - Young: 🥚 → Adult: 🐦 → Ultimate: 🦅 (Eagle)

4. **Aquatic Line**
   - Young: 🥚 → Adult: 🐠 → Ultimate: 🐋 (Whale)

### Phase 3: Pokemon-Inspired Series (Future)
**Classic Pokemon evolution chains adapted for fitness**

1. **Electric Type**
   - Young: ⚡🥚 → Adult: ⚡🐭 → Ultimate: ⚡🐁 (Pikachu → Raichu style)

2. **Fire Type**
   - Young: 🔥🥚 → Adult: 🔥🦎 → Ultimate: 🔥🐉 (Charmander line style)

3. **Water Type**
   - Young: 💧🥚 → Adult: 💧🐢 → Ultimate: 💧🐲 (Squirtle line style)

### Phase 4: Minecraft Series (Future)
**Blocky, pixelated creatures matching game aesthetic**

1. **Overworld Creatures**
   - Young: 🟫🥚 → Adult: 🟫🐷 → Ultimate: 🟫👑 (Pig King)
   - Young: 🟩🥚 → Adult: 🟩🐄 → Ultimate: 🟩🥩 (Super Cow)

2. **Nether Creatures**
   - Young: 🔥🥚 → Adult: 🔥👹 → Ultimate: 🔥👺 (Blaze evolution)

### Phase 5: Supernatural Series (Future)
**Mystical and fantasy creatures**

1. **Mythical Line**
   - Young: ✨🥚 → Adult: ✨🦄 → Ultimate: ✨🐉 (Unicorn → Dragon)

2. **Celestial Line**
   - Young: 🌟🥚 → Adult: 🌟👼 → Ultimate: 🌟🕊️ (Angel evolution)

## Evolution Mechanics

### XP Requirements
- **Level 1-9**: 100 XP per level (Young stage)
- **Level 10-19**: 200 XP per level (Adult stage)
- **Level 20+**: 500 XP per level (Ultimate stage)

### XP Sources
1. **Pet Interaction**: +10 XP (tap to play)
2. **Workout Completion**: +50 XP
3. **Daily Meal Logging**: +25 XP
4. **Quest Completion**: +100 XP
5. **Achievement Unlock**: +200 XP
6. **Evolution Bonus**: +500 XP

### Status Meters Impact on Evolution
- **Energy** (⚡): Tied to workout frequency
- **Health** (❤️): Tied to nutrition quality
- **Happiness** (😊): Tied to interaction and quest completion

Low status meters can slow evolution or require special care before advancement.

## Collection System

### Rarity Tiers
1. **Common**: Basic animals, easy evolution requirements
2. **Rare**: Special conditions (streak achievements, seasonal events)
3. **Epic**: Multiple species mastery required
4. **Legendary**: Ultimate fitness achievements

### Unlocking New Species
- **Series Progression**: Complete all stages of current series
- **Achievement Based**: Specific fitness milestones
- **Seasonal Events**: Limited-time collection opportunities
- **Quest Rewards**: Story-driven unlocks

## Integration with Fitness Features

### Running → Energy
- Daily runs increase Energy meter
- Energy affects evolution speed
- Low energy slows XP gain

### Nutrition → Health
- Consistent meal logging improves Health
- Balanced macros boost Health meter
- Health affects evolution success rate

### Consistency → Happiness
- Daily app usage increases Happiness
- Quest completion provides major Happiness boosts
- Happiness affects unlock rates for rare species

## Implementation Priority

### MVP (Current)
- [x] Basic 3-stage evolution system
- [x] Simple XP progression
- [x] Tap interaction mechanics
- [x] Status meter integration

### Phase 2 (Next Sprint)
- [ ] Animal series implementation
- [ ] Enhanced evolution conditions
- [ ] Collection tracking system
- [ ] Achievement integration

### Phase 3 (Future)
- [ ] Pokemon-inspired series
- [ ] Advanced evolution branches
- [ ] Breeding/fusion mechanics
- [ ] Social collection features

## Technical Notes

### Data Structure
```javascript
const pet = {
  id: 'unique-id',
  species: 'basic', // basic, canine, feline, etc.
  stage: 'young', // young, adult, ultimate
  level: 5,
  xp: 750,
  maxXp: 1000,
  evolution_requirements: {
    min_level: 10,
    min_energy: 70,
    min_health: 80,
    special_conditions: []
  }
}
```

### Evolution Triggers
- Level-based progression (primary)
- Status meter thresholds (secondary)
- Achievement unlocks (special)
- Time-based conditions (seasonal)

This system creates a compelling progression loop that directly ties fitness activities to meaningful pet development, encouraging sustained engagement with the app's health features.