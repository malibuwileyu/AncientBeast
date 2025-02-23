import { Movement } from '../creature';

export type UnitSize = 1 | 2 | 3;
export type UnitDisplayInfo = {
	width: number;
	height: number;
	'offset-x': number;
	'offset-y': number;
};

type Stats = {
	health: number;
	regrowth: number;
	endurance: number;
	energy: number;
	meditation: number;
	initiative: number;
	offense: number;
	defense: number;
	movement: number;
	pierce: number;
	slash: number;
	crush: number;
	shock: number;
	burn: number;
	frost: number;
	poison: number;
	sonic: number;
	mental: number;
};

export interface UnitData {
	id: number;
	name: string;
	playable: boolean;
	level: number | string;
	realm: string;
	size: UnitSize;
	stats: Stats;
	animation: { walk_speed: number };
	type?: string;
	drop?: { name: string } & Partial<Stats>;
	movementType?: Movement;
	display?: UnitDisplayInfo;
	set?: 'α' | 'β';
	cost: number;  // Make cost required again since we have the mapping

	ability_info: readonly {
		title: string;
		desc: string;
		info: string;
		upgrade?: string;
		affectedByMatSickness?: number;
		details?: readonly string[];
		effects?: readonly {
			special?: string;
			regrowth?: number;
			offense?: number;
			defense?: number;
			frost?: number;
		}[];
		maxCharge?: number;
		requirements?: { plasma: number; energy?: number };
		damages?: {
			special?: string;
			shock?: number | string;
			pure?: number | string;
			pierce?: number;
			slash?: number;
			crush?: number;
			burn?: number;
			poison?: number;
			frost?: number | string;
			mental?: number;
			sonic?: number;
		};
		bonus_damages?: { frost: number; pierce: number };
		damages1?: { burn?: number; pierce?: number; poison?: number };
		costs?: { plasma?: number | string; special?: string; energy?: number; movement?: string };
		range?: { regular: number; upgraded: number; minimum?: number };
		animation_data?: { duration: number; delay: number };
	}[];
}

export type DeepMutable<T> = {
    -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U>
        ? DeepMutable<U>[]
        : T[P] extends object
        ? DeepMutable<T[P]>
        : T[P]
};

export type UnitDataReadonly = typeof unitData[number];
export type UnitDataMutable = DeepMutable<UnitData>;

export const unitData = [
	{
		id: 0,
		name: 'Dark Priest',
		playable: true,
		level: '-',
		realm: '-',
		size: 1,
		stats: {
			health: 100,
			regrowth: 1,
			endurance: 60,
			energy: 100,
			meditation: 25,
			initiative: 50,
			offense: 3,
			defense: 3,
			movement: 2,
			pierce: 2,
			slash: 2,
			crush: 2,
			shock: 2,
			burn: 2,
			frost: 2,
			poison: 2,
			sonic: 2,
			mental: 30,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 108,
			height: 200,
			'offset-x': 0,
			'offset-y': -164,
		},
		ability_info: [
			{
				title: 'Plasma Field',
				desc: 'Protects from most harmful abilities when the unit is not currently active.',
				info: '-1 plasma for each countered attack.',
				upgrade: '9 pure damage counter hit.',
				costs: {
					plasma: 1,
					special: 'per countered attack',
				},
				requirements: {
					plasma: 1,
				},
			},
			{
				title: 'Electro Shocker',
				desc: 'Does shock damage to a nearby unit. More effective versus larger enemies.',
				info: '12 shock damage × unit hexagon size.',
				upgrade: 'The range is increased to 4.',
				damages: {
					shock: '12 × creature size',
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Disruptor Beam',
				desc: 'Does pure damage to a nearby unit, based on its missing health points.',
				info: 'Plasma cost is equal to the unit size.',
				upgrade: 'Minimum 40 pure damage.',
				requirements: {
					plasma: 2,
					energy: 20,
				},
				damages: {
					pure: '25 + missing health',
				},
				costs: {
					energy: 20,
					plasma: 'target unit size',
				},
			},
			{
				title: 'Godlet Printer',
				desc: 'Materializes a unit within 4 hexagons that will serve and obey given orders.',
				info: "Plasma cost equals unit's size + level.",
				upgrade: 'Range becomes 6 hexagons.',
				costs: {
					energy: 20,
					plasma: 'unit size + level',
				},
			},
		],
		cost: 0,  // Dark Priest has no cost
	},
	{
		id: 1,
		name: 'Bounty Hunter',
		playable: true,
		level: 2,
		realm: 'A',
		size: 1,
		set: 'α',
		stats: {
			health: 100,
			regrowth: 2,
			endurance: 35,
			energy: 115,
			meditation: 14,
			initiative: 110,
			offense: 12,
			defense: 5,
			movement: 2,
			pierce: 5,
			slash: 2,
			crush: 3,
			shock: 5,
			burn: 2,
			frost: 6,
			poison: 4,
			sonic: 5,
			mental: 8,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 108,
			height: 200,
			'offset-x': 0,
			'offset-y': -164,
		},
		ability_info: [
			{
				title: 'Personal Space',
				desc: 'Gains bonus stat points if there is an adjacent enemy unit when turn starts.',
				info: '50% offense and movement increase.',
				upgrade: 'Bonus is increased to 100%.',
			},
			{
				title: 'Sword Slitter',
				desc: 'Swift attack on any nearby enemy unit.',
				info: 'Hit does 15 slash and 10 piece damage.',
				upgrade: 'Performs extra hit if it can kill.',
				damages: {
					pierce: 15,
					slash: 10,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Pistol Shot',
				desc: 'Delivers a medium ranged shot that can damage target up to 6 hexagons away.',
				info: '20 pierce damage in any of 6 directions.',
				upgrade: 'Can be used twice per round.',
				damages: {
					pierce: 20,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Rifle Assassin',
				desc: 'Very powerful long range attack that can strike up to 12 hexagons distance.',
				info: '40 pierce damage in any of 6 directions.',
				upgrade: 'Half damage piercing effect.',
				damages: {
					pierce: 40,
				},
				costs: {
					energy: 35,
				},
			},
		],
		cost: 0,  // Bounty Hunter has no cost
	},
	{
		id: 2,
		name: 'Razorback',
		playable: false,
		level: 6,
		realm: 'G',
		size: 3,
		set: 'α',
		stats: {
			health: 223,
			regrowth: 8,
			endurance: 40,
			energy: 120,
			meditation: 6,
			initiative: 100,
			offense: 14,
			defense: 5,
			movement: 7,
			pierce: 8,
			slash: 8,
			crush: 6,
			shock: 10,
			burn: 9,
			frost: 5,
			poison: 6,
			sonic: 3,
			mental: 3,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Back Stabs',
				desc: 'Reduces some damage from behind and also harms rear melee attackers.',
				info: '30% rear damage reduction & return.',
				upgrade: 'test',
			},
			{
				title: 'Metallic Claws',
				desc: 'Shreds nearby foe using its razor nails.',
				info: '10 pierce + 10 slash damage on strike.',
				upgrade: 'test',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Morning Star',
				desc: 'Whips out its scepter like tail to bluntly punish a foe that is within 3 hexagons.',
				info: '15 pierce + 15 crush damage on strike.',
				upgrade: 'test',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Diving Shredder',
				desc: 'Dives 6 empty hexagons or more while damaging side units from nearby rows.',
				info: 'Does 10 slash damage to each hexagon.',
				upgrade: '5 extra slash damage per hit.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Razorback has no cost
	},
	{
		id: 3,
		name: 'Uncle Fungus',
		playable: true,
		level: 3,
		realm: 'G',
		size: 2,
		set: 'α',
		stats: {
			health: 113,
			regrowth: 4,
			endurance: 36,
			energy: 55,
			meditation: 45,
			initiative: 90,
			offense: 12,
			defense: 4,
			movement: 2,
			pierce: 5,
			slash: 5,
			crush: 5,
			shock: 3,
			burn: 4,
			frost: 6,
			poison: 12,
			sonic: 5,
			mental: 3,
		},
		drop: {
			name: 'frog leg',
			energy: 10,
			movement: 1,
		},
		display: {
			width: 165,
			height: 195,
			'offset-x': 2,
			'offset-y': -142,
		},
		animation: {
			walk_speed: 360,
		},
		ability_info: [
			{
				title: 'Toxic Spores',
				desc: 'Any melee range enemy attackers will have their regrowth stat reduced a bit.',
				info: '-1 regrowth stat debuff that can stack.',
				upgrade: 'Hitting a foe will debuff too.',
				effects: [
					{
						regrowth: -1,
					},
				],
			},
			{
				title: 'Supper Chomp',
				desc: 'Takes a huge bite out of nearby foe, restoring the same amount of health.',
				info: '20 pierce damage, as regrowth too.',
				upgrade: 'Instant healing until full.',
				effects: [
					{
						special: '100% of damage as %regrowth%',
					},
				],
				damages: {
					pierce: 20,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Frogger Jump',
				desc: 'Leaps in straight line over any traps, gaining bonus offense after jumping.',
				info: '+25 offense for next hit after landing.',
				upgrade: 'Leaps units or jumps twice.',
				effects: [
					{
						offense: 25,
					},
				],
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Sabre Kick',
				desc: 'Strikes a nearby foe using feet claws, doing nice versatile physical damage.',
				info: '18 pierce + 12 slash + 6 crush damage.',
				upgrade: 'Adds 1 hexagon knockback.',
				damages: {
					pierce: 18,
					slash: 12,
					crush: 6,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Uncle Fungus has no cost
	},
	{
		id: 4,
		name: 'Infernal',
		playable: true,
		level: 2,
		realm: 'L',
		size: 3,
		set: 'α',
		stats: {
			health: 124,
			regrowth: 4,
			endurance: 70,
			energy: 90,
			meditation: 25,
			initiative: 46,
			offense: 7,
			defense: 12,
			movement: 2,
			pierce: 9,
			slash: 9,
			crush: 9,
			shock: 9,
			burn: 10,
			frost: 0,
			poison: 10,
			sonic: 4,
			mental: 0,
		},
		drop: {
			name: 'apple',
			health: 10,
			energy: 5,
			poison: 3,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			height: 158,
			width: 206,
			'offset-y': -121,
			'offset-x': 28,
		},
		ability_info: [
			{
				title: 'Boiling Point',
				desc: 'Leaves 2 puddles of hot lava under, lasting 1 round or until stepped on.',
				info: '10 burn damage for each hexagon.',
				upgrade: 'Will last until stepped on.',
				damages: {
					burn: 10,
				},
			},
			{
				title: 'Pulverizing Hit',
				desc: 'Smacks a foe with its very heavy hand, gaining bonus damage with every hit.',
				info: '6 crush damage + 4 burn each strike.',
				upgrade: '2 stacks if hitting same foe.',
				damages: {
					crush: 6,
					burn: 4,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Intense Prayer',
				desc: 'Causes the ground to really heat up, wreaking fierce havoc in area ahead.',
				info: '10 burn damage over all 8 hexagons.',
				upgrade: 'It can spawn hot lava traps.',
				damages: {
					special: '10%burn%over 8 hexagons',
				},
				damages1: {
					burn: 10,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Molten Hurl',
				desc: 'Bowls itself into first inline foe, while destroying all the traps along the way.',
				info: '10 crush + 5 burn damage & movement.',
				upgrade: 'Can mow down multiple foes.',
				damages: {
					crush: 10,
					burn: 5,
				},
				effects: [
					{
						special: 'travels toward inline unit',
					},
				],
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Infernal has no cost
	},
	{
		id: 5,
		name: 'Impaler',
		playable: true,
		level: 5,
		realm: 'S',
		size: 3,
		set: 'α',
		stats: {
			health: 190,
			regrowth: 13,
			endurance: 37,
			energy: 131,
			meditation: 31,
			initiative: 60,
			offense: 13,
			defense: 7,
			movement: 4,
			pierce: 5,
			slash: 2,
			crush: 4,
			shock: 20,
			burn: 3,
			frost: 18,
			poison: 18,
			sonic: 6,
			mental: 10,
		},
		drop: {
			name: 'fish',
			initiative: 5,
			frost: 5,
		},
		animation: {
			walk_speed: 200,
		},
		display: {
			width: 225,
			height: 212,
			'offset-x': 28,
			'offset-y': -181,
		},
		ability_info: [
			{
				title: 'Electrified Hair',
				desc: 'Converts up to 1/4 of incoming shock damage into missing energy points.',
				info: 'Conversion happens even if fatigued.',
				upgrade: 'Overflowing energy heals.',
				effects: [
					{
						special: 'Converts ~25%%shock% into%energy%',
					},
				],
			},
			{
				title: 'Hasted Javelin',
				desc: 'Horn attack that restores all depleted movement points if it damages target.',
				info: '30 pierce damage & resets movement.',
				upgrade: 'Hit gains 10 poison damage.',
				damages: {
					special: '30%pierce%& movement reset',
				},
				damages1: {
					pierce: 30,
					poison: 10,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Poisonous Vine',
				desc: 'Tangles a foe within 2 radius for a turn, causing it some damage if it will move.',
				info: '25 poison damage triggered if moving.',
				upgrade: 'The vine will last indefinitely.',
				effects: [
					{
						special: '25 poison damage if moving',
					},
				],
				damages: {
					poison: 25,
				},
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Chain Lightning',
				desc: 'Releases a lightning bolt that will arch, shocking multiple adjacent creatures.',
				info: '20 shock damage that can arch nearby.',
				upgrade: 'The arches will not kill allies.',
				damages: {
					shock: 20,
				},
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Impaler has no cost
	},
	{
		id: 6,
		name: 'Vehemoth',
		playable: true,
		level: 7,
		realm: 'S',
		size: 3,
		set: 'α',
		stats: {
			health: 245,
			regrowth: 1,
			endurance: 90,
			energy: 80,
			meditation: 25,
			initiative: 35,
			offense: 9,
			defense: 18,
			movement: 3,
			pierce: 14,
			slash: 14,
			crush: 14,
			shock: 6,
			burn: 3,
			frost: 25,
			poison: 10,
			sonic: 4,
			mental: 15,
		},
		drop: {
			name: 'snow flake',
			meditation: 5,
			frost: 10,
		},
		display: {
			width: 240,
			height: 240,
			'offset-x': 15,
			'offset-y': -210,
		},
		animation: {
			walk_speed: 350,
		},
		ability_info: [
			{
				title: 'Lamellar Body',
				desc: 'Gains extra defense and frost mastery with every sloth unit on the battlefield.',
				info: '2 defense & 2 frost for every sloth unit.',
				upgrade: 'Gains 2 regrowth stat as well.',
				effects: [
					{
						defense: 2,
						frost: 2,
					},
				],
			},
			{
				title: 'Flat Frons',
				desc: 'Smashes a nearby foe with its big head. Shatters frozen target below 50 health.',
				info: '16 crush + 10 frost damage each attack.',
				upgrade: 'Can charge to knockback foe.',
				details: [
					'Targets that are 49 health points or less will be basically be dealth pure damage.',
					'The charge and knockback can be performed inline based on current movement points.',
					'If the target unit can be knocked back, the effect will occur before the unit dies.',
				],
				damages: {
					crush: 16,
					frost: 10,
					pure: 49,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Flake Convertor',
				desc: 'Fatigued inline target within 5 range will get frozen and skip turn if not hit.',
				info: 'Frost mastery difference as damage.',
				upgrade: "Hits don't break the effect.",
				details: [
					'Unable to do any frost damage to targets that have a higher frost mastery than him.',
				],
				damages: {
					frost: 0,
				},
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Falling Arrow',
				desc: 'Performs 4 hexagon range attack that does extra damage to lower level units.',
				info: '20 pierce + 3 frost per level difference.',
				upgrade: 'Adds 2 bonus pierce per level.',
				details: [
					'Up to 12 pierce and 18 frost damage will be granted if hitting a level 1 target.',
					'This ability works inline and diagonally, forward or behind, within given range.',
				],
				damages: {
					pierce: 20,
					frost: 0,
				},
				bonus_damages: {
					frost: 3,
					pierce: 2,
				},
				costs: {
					energy: 35,
				},
			},
		],
		cost: 0,  // Vehemoth has no cost
	},
	{
		id: 7,
		name: 'Abolished',
		playable: true,
		level: 7,
		realm: 'P',
		size: 3,
		set: 'α',
		stats: {
			health: 234,
			regrowth: 5,
			endurance: 26,
			energy: 156,
			meditation: 46,
			initiative: 110,
			offense: 7,
			defense: 6,
			movement: 2,
			pierce: 4,
			slash: 4,
			crush: 4,
			shock: 4,
			burn: 10,
			frost: 2,
			poison: 2,
			sonic: 6,
			mental: 8,
		},
		drop: {
			name: 'radish',
			health: 1,
			burn: 5,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 270,
			height: 277,
			'offset-x': 0,
			'offset-y': -235,
		},
		ability_info: [
			{
				title: 'Burning Spirit',
				desc: "Hits reduce the target's burn mastery.",
				info: '-1 burn mastery each successful strike.',
				upgrade: '1 burn mastery to self on hit.',
			},
			{
				title: 'Fiery Touch',
				desc: 'Scratches and burns an enemy unit, able to reach up to 3 hexagons away.',
				info: '15 slash + 15 burn damage per attack.',
				upgrade: '6 range for the burn damage.',
				damages: {
					slash: 15,
					burn: 15,
				},
				costs: {
					energy: 30,
				},
				range: {
					regular: 3,
					upgraded: 6,
				},
			},
			{
				title: 'Bonfire Spring',
				desc: 'Relocates within 6 hexagons range, leaving a firewall in the old location.',
				info: '3 x 10 burn damage per each hexagon.',
				upgrade: 'Increased range each usage.',
				effects: [
					{
						special: '10 %burn% damage per hex',
					},
				],
				damages: {
					burn: 10,
				},
				costs: {
					energy: 40,
				},
			},
			{
				title: 'Greater Pyre',
				desc: 'Meditates for a short period while causing burns to all adjacent units.',
				info: '20 burn damage nearby, hurts allies.',
				upgrade: '+10 burn bonus damage.',
				damages: {
					burn: 20,
				},
				costs: {
					energy: 60,
				},
			},
		],
		cost: 0,  // Abolished has no cost
	},
	{
		id: 8,
		name: 'Horn Head',
		playable: false,
		level: 5,
		realm: 'W',
		size: 2,
		set: 'α',
		stats: {
			health: 205,
			regrowth: 11,
			endurance: 100,
			energy: 80,
			meditation: 10,
			initiative: 100,
			offense: 12,
			defense: 8,
			movement: 6,
			pierce: 6,
			slash: 6,
			crush: 6,
			shock: 2,
			burn: 2,
			frost: 2,
			poison: 2,
			sonic: 10,
			mental: 0,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Life Support',
				desc: 'Can act one more turn after being killed.',
				info: '',
			},
			{
				title: 'Knuckle Nib',
				desc: 'Smashes ringed head into a foe.',
				info: '8 pierce + 8 slash + 8 crush damage',
			},
			{
				title: 'Meat Sickle',
				desc: "Drags a foe, doing bonus damage if it doesn't have any movement points.",
				info: '5 pierce damage per hexagon moved',
				upgrade: '',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Dual Swipe',
				desc: 'Slaps frontal units with both claws.',
				info: '15 slash + 15 crush damage per hit',
				upgrade: '',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Horn Head has no cost
	},
	{
		id: 9,
		name: 'Knightmare',
		playable: true,
		level: 4,
		realm: 'S',
		size: 2,
		set: 'α',
		stats: {
				health: 175,
				regrowth: 2,
				endurance: 70,
				energy: 93,
				meditation: 39,
				initiative: 40,
				offense: 10,
				defense: 10,
				movement: 1,
				pierce: 5,
				slash: 4,
				crush: 3,
				shock: 2,
				burn: 1,
				frost: 10,
				poison: 5,
				sonic: 5,
				mental: 15,
		},
		drop: {
			name: 'milk bottle',
			health: 5,
			energy: 5,
			offense: 5,
			defense: 5,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 170,
			height: 250,
			'offset-x': 5,
			'offset-y': -215,
		},
		ability_info: [
			{
				title: 'Frigid Tower',
				desc: 'Constantly increases offense and defense for every turn not moving.',
				info: '+5 frost and defense every round.',
				upgrade: '+5 offense stat per turn.',
				effects: [
					{
						special: '(5%offense%, 5%defense%) each turn',
					},
				],
				maxCharge: 10,
			},
			{
				title: 'Icy Talons',
				desc: 'Scratches nearby foe using claws, lowering frost stat with every hit.',
				info: '6 slash + 6 frost damage, -1 frost.',
				upgrade: '6 pierce vs smaller foes.',
				effects: [
					{
						special: '-1%frost%, stackable',
					},
				],
				damages: {
					slash: 6,
					frost: 6,
					pierce: 6,
				},
				costs: {
					energy: 13,
				},
			},
			{
				title: 'Sudden Uppercut',
				desc: 'Sucker punches a nearby enemy using limb, making him delay the next turn.',
				info: '10 crush + 10 frost damage and delay.',
				upgrade: '-10 defense until it will act.',
				damages: {
					crush: 10,
					frost: 10,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Icicle Spear',
				desc: 'Launches an ice shard that can pierce through up to six hexagons distance.',
				info: '10 pierce + 6 diminishing frost per hit.',
				upgrade: 'Can penetrate until blocked.',
				damages: {
					pierce: 10,
					frost: '6 diminishing',
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Knightmare has no cost
	},
	{
		id: 10,
		name: 'Troglodyte',
		playable: false,
		level: 4,
		realm: 'P',
		size: 3,
		set: 'α',
		stats: {
			health: 110,
			regrowth: 2,
			endurance: 60,
			energy: 90,
			meditation: 2,
			initiative: 10,
			offense: 7,
			defense: 5,
			movement: 3,
			pierce: 3,
			slash: 3,
			crush: 3,
			shock: 3,
			burn: 3,
			frost: 3,
			poison: 3,
			sonic: 10,
			mental: 20,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Fearsome Look',
				desc: 'Makes nearby attackers believe that they get damaged back in the process.',
				info: '10 mental damage per each melee hit.',
				upgrade: 'Does 5 pierce damage as well.',
			},
			{
				title: 'Tongue Poke',
				desc: 'Hits nearby foe, crushing it if melee or pierces it if it is one hexagon distant.',
				info: '20 pierce or crush damage on attack',
				upgrade: 'Strikes second foe if killing.',
				damages: {
					pierce: 20,
					crush: 10,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Subliminal Shout',
				desc: 'Shock waves that affect a large area, doing less damage the further away.',
				info: '10 sonic damage over 15 hexagons.',
				upgrade: '',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Psychic Blast',
				desc: 'Focuses the power of mind in order to attack foes up to 4 hexagons distance.',
				info: '18 mental damage over 7 hexagons.',
				upgrade: '',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Troglodyte has no cost
	},
	{
		id: 11,
		name: 'Toxic Shroom',
		playable: false,
		level: 1,
		realm: 'G',
		size: 1,
		set: 'α',
		stats: {
			health: 45,
			regrowth: 10,
			endurance: 20,
			energy: 70,
			meditation: 6,
			initiative: 20,
			offense: 3,
			defense: 5,
			movement: 4,
			pierce: 2,
			slash: 2,
			crush: 4,
			shock: 1,
			burn: 2,
			frost: 5,
			poison: 10,
			sonic: 1,
			mental: 5,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Travel Waypoint',
				desc: 'Transfers to any location that is within movement range and also has roots on.',
				info: 'The action will take 1 movement point.',
				upgrade: 'Gains unlimited travel range.',
				details: ['Toxic Shroom can only travel between own or allied roots.'],
			},
			{
				title: 'Cap Knock',
				desc: 'Bumps its large cap into any nearby foe, damaging him and also pushing if little.',
				info: '10 crush damage + knockback if small.',
				upgrade: 'Strikes opposite side foe too.',
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Noxious Fumes',
				desc: 'Releases several toxic clouds that can be inhaled, persisting for two rounds.',
				info: '10 adjacent poison damage for 2 turns.',
				upgrade: '+1 round cloud persistency.',
				details: [
					'Toxic Shroom is immune to all fumes, but will destroy them when passing through.',
					'New fumes will completely override old ones when using this ability adjacent.',
				],
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Curling Roots',
				desc: 'Creates a small area of vines under self that alter the energy of all units on top.',
				info: '±6 energy points when own turn starts.',
				upgrade: 'Bonus for each spot affected.',
				costs: {
					energy: 20,
				},
			},
		],
		cost: 0,  // Toxic Shroom has no cost
	},
	{
		id: 12,
		name: 'Snow Bunny',
		playable: true,
		level: 1,
		realm: 'S',
		size: 1,
		set: 'α',
		stats: {
			health: 55,
			regrowth: 4,
			endurance: 20,
			energy: 75,
			meditation: 25,
			initiative: 35,
			offense: 2,
			defense: 1,
			movement: 2,
			pierce: 2,
			slash: 2,
			crush: 3,
			shock: 3,
			burn: 1,
			frost: 8,
			poison: 0,
			sonic: 0,
			mental: 0,
		},
		drop: {
			name: 'carrot',
			health: 4,
			energy: 2,
			initiative: 10,
			poison: 3,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 95,
			height: 135,
			'offset-x': -5,
			'offset-y': -100,
		},
		ability_info: [
			{
				title: 'Bunny Hop',
				desc: 'Moves away one hexagon from first enemy that comes nearby frontally.',
				info: 'Works only once every game round.',
				upgrade: 'Can leap twice each round.',
				affectedByMatSickness: 1,
			},
			{
				title: 'Big Pliers',
				desc: 'Dents nearby foe using his big teeth, doing a small mixture of damage to it.',
				info: '4 pierce + 6 slash + 8 crush hit damage.',
				upgrade: 'Pure damage vs frozen foes.',
				damages: {
					pierce: 4,
					slash: 6,
					crush: 8,
				},
				costs: {
					energy: 18,
				},
			},
			{
				title: 'Blowing Wind',
				desc: 'Pushes away any unit for several hexagons, depending on its size.',
				info: 'Range = 5 hexagons - creature size.',
				upgrade: 'No penalty vs frozen foes.',
				effects: [
					{
						special: 'Range = 5 hexagons - creature size.',
					},
				],
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Freezing Spit',
				desc: 'Spits distant target with cold saliva. Bonus damage is based on distance.',
				info: '10 frost + 3 crush damage / hexagon.',
				upgrade: 'Freezes foe at melee range.',
				damages: {
					crush: 0,
					frost: 10,
				},
				costs: {
					energy: 25,
				},
			},
		],
		cost: 0,  // Snow Bunny has no cost
	},
	{
		id: 13,
		name: 'Swampler',
		playable: false,
		level: 2,
		realm: 'G',
		size: 1,
		set: 'α',
		stats: {
			health: 75,
			regrowth: 5,
			endurance: 60,
			energy: 70,
			meditation: 20,
			initiative: 65,
			offense: 2,
			defense: 4,
			movement: 3,
			pierce: 2,
			slash: 2,
			crush: 2,
			shock: 2,
			burn: 2,
			frost: 2,
			poison: 8,
			sonic: 3,
			mental: 1,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Natural Habitat',
				desc: 'Initial spot will become a swamp home.',
				info: '+15 Poison mastery bonus while inside',
			},
			{
				title: 'Rabid Nip',
				desc: 'Sink poisonous teeth into nearby foe.',
				info: '10 pierce + 6 poison damage on attack',
				damages: {
					pierce: 10,
					poison: 6,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Bad Breath',
				desc: "Stinks up to three adjacent enemies, doing extra damage if they're facing.",
				info: '10 poison damage, double if towards',
				damages: {
					poison: 10,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Goo Sneeze',
				desc: 'Expels contagious toxin on distant foe, spreading to others that get too close.',
				info: '15 poison damage, can spread around',
				damages: {
					poison: 15,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Swampler has no cost
	},
	{
		id: 14,
		name: 'Gumble',
		playable: true,
		level: 1,
		realm: 'P',
		size: 1,
		set: 'α',
		stats: {
				health: 70,
				regrowth: 5,
				endurance: 50,
				energy: 70,
				meditation: 43,
				initiative: 35,
				offense: 4,
				defense: 6,
				movement: 3,
				pierce: 8,
				slash: 3,
				crush: 8,
				shock: 3,
				burn: 2,
				frost: 3,
				poison: 8,
				sonic: 12,
				mental: 4,
		},
		drop: {
			name: 'cherry',
			health: 1,
			energy: 1,
			mental: 4,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 95,
			height: 115,
			'offset-x': -10,
			'offset-y': -75,
		},
		ability_info: [
			{
				title: 'Gooey Body',
				desc: 'Receives bonus pierce, slash and crush masteries based on remaining health.',
				info: '3 bonus points each for every 7 health.',
				upgrade: 'Health threshold becomes 5.',
			},
			{
				title: 'Gummy Mallet',
				desc: 'Fully transforms himself into a large hammer to strike down nearby foes.',
				info: '10 crush damage done to 7 hexagons.',
				upgrade: 'Double damage to enemies.',
				damages: {
					crush: 10,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Royal Seal',
				desc: 'Sticks chewing gum nearby to hinder any passing unit for a complete turn.',
				info: 'Does not affect self but affects allies.',
				upgrade: 'Can leap within 3 hexagons.',
				effects: [
					{
						special: '%movement% is set to 0 for a turn.',
					},
				],
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Boom Box',
				desc: 'Turns belly into a speaker, blasting one distant enemy, pushing it back a notch.',
				info: '20 sonic damage + 10 crush if adjacent.',
				upgrade: "+10 sonic if it can't push foe.",
				damages: {
					special: '20%sonic%+ 10%crush%if melee',
				},
				effects: [
					{
						special: 'One hexagon knockback.',
					},
				],
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Gumble has no cost
	},
	{
		id: 15,
		name: 'Cycloper',
		playable: false,
		level: 3,
		realm: 'W',
		size: 2,
		set: 'α',
		stats: {
			health: 60,
			regrowth: 1,
			endurance: 10,
			energy: 60,
			meditation: 20,
			initiative: 30,
			offense: 3,
			defense: 2,
			movement: 3,
			pierce: 2,
			slash: 2,
			crush: 2,
			shock: 2,
			burn: 2,
			frost: 2,
			poison: 2,
			sonic: 7,
			mental: 7,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Explosive End',
				desc: 'Instantly self detonates upon death, dealing damage to all adjacent units.',
				info: '10 burn + 10 crush + 10 sonic damage.',
				upgrade: 'Detonates only nearby foes.',
			},
			{
				title: 'Optic Burst',
				desc: 'Zaps a foe with the laser cannon eye. Does bigger damage at closer range.',
				info: '15 burn damage -1 for each hexagon.',
				upgrade: '+10 crush damage if melee.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Tractor Beam',
				desc: 'Pulls a distant unit several hexagons closer, depending on its overall size.',
				info: 'distance = 4 hexagons - creature size.',
				upgrade: 'Removed unit size penalty.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Power Charge',
				desc: 'Causes the next ability to deal double damage or have increased efficiency.',
				info: 'The buff expires before the next turn.',
				upgrade: 'Charge is usable next round.',
				costs: {
					energy: 20,
				},
			},
		],
		cost: 0,  // Cycloper has no cost
	},
	{
		id: 16,
		name: 'Vulcan',
		playable: false,
		level: 5,
		realm: 'L',
		size: 2,
		set: 'α',
		stats: {
			health: 155,
			regrowth: 2,
			endurance: 65,
			energy: 84,
			meditation: 4,
			initiative: 35,
			offense: 7,
			defense: 11,
			movement: 2,
			pierce: 8,
			slash: 8,
			crush: 8,
			shock: 8,
			burn: 10,
			frost: 0,
			poison: 5,
			sonic: 3,
			mental: 0,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Ragnarok Day',
				desc: 'Before dying, bombards the whole battlefield after one complete round.',
				info: '5 crush + 15 burn damage to all units.',
				upgrade: 'Does double damage now.',
			},
			{
				title: 'Frying Stare',
				desc: "Stares and splashes a nearby foe unit. Reduces the target's burn stat by two.",
				info: '20 burn damage & -2 burn stat debuff.',
				upgrade: '-10 burn stat to inline enemy.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Volcanic Artillery',
				desc: 'Fires 3 rocks will hit target spots with 100 delay, damaging units or ground.',
				info: '10 crush + 5 burn damage or fissures.',
				upgrade: 'Total damage is now doubled.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Violent Fissures',
				desc: 'Stomps the hexagons under, creating fissures and also erupts existing ones.',
				info: '10 burn damage to all units on fissures.',
				upgrade: 'Surrounded spots also crack.',
				costs: {
					energy: 25,
				},
			},
		],
		cost: 0,  // Vulcan has no cost
	},
	{
		id: 17,
		name: 'Spikes',
		playable: false,
		level: 6,
		realm: 'E',
		size: 2,
		set: 'α',
		stats: {
			health: 211,
			regrowth: 2,
			endurance: 80,
			energy: 70,
			meditation: 20,
			initiative: 45,
			offense: 15,
			defense: 23,
			movement: 5,
			pierce: 12,
			slash: 12,
			crush: 12,
			shock: 10,
			burn: 8,
			frost: 8,
			poison: 10,
			sonic: 8,
			mental: 0,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Spiked Fence',
				desc: 'Melee attackers get severly punished, receiving some of the damage as well.',
				info: '1/4 melee damage returned (piercing).',
				upgrade: 'Half melee damage returned.',
			},
			{
				title: 'Trident Forehead',
				desc: 'Pokes nearby foe with its forehead, 200% damage if hitting same spot.',
				info: '15 pierce damage done per attack.',
				upgrade: '300% spot bonus damage.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Crocodile Clip',
				desc: 'Bite cripples nearby foe for one turn, increasing ability energy cost by 25%.',
				info: '10% of target total health as damage.',
				upgrade: '50% increase of energy cost.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Circular Saw',
				desc: 'Travels in a straight line up to seven hexagons, cutting through all units.',
				info: '12 pierce + 12 slash damage on hit.',
				upgrade: 'Can return to initial spot.',
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Spikes has no cost
	},
	{
		id: 18,
		name: 'Sarcophag',
		playable: false,
		level: 7,
		realm: 'W',
		size: 3,
		set: 'α',
		stats: {
			health: 217,
			regrowth: 0,
			endurance: 30,
			energy: 90,
			meditation: 0,
			initiative: 10,
			offense: 6,
			defense: 8,
			movement: 2,
			pierce: 45,
			slash: 20,
			crush: 35,
			shock: 30,
			burn: 23,
			frost: 27,
			poison: 50,
			sonic: 15,
			mental: 35,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Already Dead',
				desc: 'Instead of getting fatigued, unit gains most of the energy used in the attack.',
				info: "Restores 80% of the attack's energy.",
				upgrade: 'Resists 1 fatal blow / round.',
			},
			{
				title: 'Sharp Forehead',
				desc: 'Punctures nearby foe using the horns, lowering its regrowth with each strike.',
				info: '33 pierce damage, -9 regrowth debuff.',
				upgrade: 'Gains those points if nearby.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Distant Grasp',
				desc: 'Holds a unit in place for a round, only being able to escape by using abilities.',
				info: 'range = 7 hexagons - target unit level.',
				upgrade: 'Also does 16 pierce damage.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Ivory Stakes',
				desc: 'Creates a three hit obstacle within five range that can be used to attack foes.',
				info: 'Can attack nearby enemy for 10 pierce.',
				upgrade: '+5 pierce damage per combo.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Sarcophag has no cost
	},
	{
		id: 19,
		name: 'Miss Creeper',
		playable: false,
		level: 4,
		realm: 'G',
		size: 1,
		set: 'α',
		stats: {
			health: 165,
			regrowth: 3,
			endurance: 33,
			energy: 80,
			meditation: 3,
			initiative: 80,
			offense: 17,
			defense: 4,
			movement: 1,
			pierce: 6,
			slash: 6,
			crush: 6,
			shock: 1,
			burn: 1,
			frost: 1,
			poison: 5,
			sonic: 5,
			mental: 9,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Muscous Pillar',
				desc: 'Any nearby killed units restore health based on their own total amount pool.',
				info: '5% of maximum health stat recovery.',
				upgrade: 'Doubles the recovery bonus.',
			},
			{
				title: 'Carving Nails',
				desc: 'Claw swipe gesture on a nearby foe.',
				info: '12 pierce + 12 slash damage on strike',
				upgrade: '+4 pierce & +4 slash bonus.',
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Fatal Attraction',
				desc: 'Causes a target foe within 6 hexagons to approach her at the start of its turn.',
				info: 'Ability does not work on summoners.',
				upgrade: '+4 hexagons bonus range.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Tendril Feet',
				desc: 'All nearby foes have their movement restrained and take a bit of damage.',
				info: '20 crush damage and no movement.',
				upgrade: 'Disables ability upgrades.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Miss Creeper has no cost
	},
	{
		id: 20,
		name: 'Kraken',
		playable: false,
		level: 6,
		realm: 'S',
		size: 3,
		set: 'α',
		stats: {
				health: 220,
				regrowth: 5,
				endurance: 55,
				energy: 50,
				meditation: 4,
				initiative: 65,
				offense: 10,
				defense: 6,
				movement: 3,
				pierce: 5,
				slash: 7,
				crush: 6,
				shock: 8,
				burn: 1,
				frost: 20,
				poison: 5,
				sonic: 15,
				mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'High Voltage',
				desc: 'Melee attackers receive damage for every hit and also lose energy points.',
				info: '5 shock damage that depletes energy.',
			},
			{
				title: 'Suction Cups',
				desc: 'Crushes a frontal foe while draining a small amount of its maximum health.',
				info: '30 crush damage, 3 health transfered.',
			},
			{
				title: 'Hunting Net',
				desc: 'Drags closer up to 3 distant units that are aligned on different parallel rows.',
				info: 'Pull = 7 hexagons range - unit number',
			},
			{
				title: 'Nitrogen Shower',
				desc: 'Sprinkles a large frontal area with liquid nitrogen, doing cold damage.',
				info: '35 frost damage over 7 hexagons.',
			},
		],
		cost: 0,  // Kraken has no cost
	},
	{
		id: 21,
		name: 'Flayed',
		playable: false,
		level: 4,
		realm: 'W',
		size: 2,
		set: 'β',
		stats: {
			health: 200,
			regrowth: 20,
			endurance: 38,
			energy: 60,
			meditation: 5,
			initiative: 60,
			offense: 17,
			defense: 10,
			movement: 4,
			pierce: 5,
			slash: 5,
			crush: 5,
			shock: 4,
			burn: 3,
			frost: 2,
			poison: 0,
			sonic: 3,
			mental: 2,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Half Full',
				desc: 'Can regenerate health up to double. Maximum health is still the initial one.',
				info: '',
			},
			{
				title: 'Limb Scythe',
				desc: 'Slashes a nearby foe, causing it to hemorrhage, losing health if moving.',
				info: '15 slash damage, -5 health / hexagon',
				damages: {
					slash: 15,
				},
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Sangvine Puke',
				desc: "Target's regrowth becomes lowered if it's a foe or increased if it's an ally.",
				info: '+/- 20 regrowth change for a round',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Symbiotic Tumor',
				desc: 'Engulfs body into a meat cocoon. Current turn is ended by this ability.',
				info: '200% bonus defense and regrowth',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Flayed has no cost
	},
	{
		id: 22,
		name: 'Asher',
		playable: false,
		level: 1,
		realm: 'L',
		size: 2,
		set: 'α',
		stats: {
			health: 65,
			regrowth: 1,
			endurance: 15,
			energy: 60,
			meditation: 30,
			initiative: 10,
			offense: 3,
			defense: 5,
			movement: 1,
			pierce: 3,
			slash: 3,
			crush: 3,
			shock: 6,
			burn: 8,
			frost: 4,
			poison: 5,
			sonic: 1,
			mental: 1,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 185,
			height: 124,
			'offset-x': 0,
			'offset-y': -80,
		},
		ability_info: [
			{
				title: 'Heat Haze',
				desc: 'Nearby foes have their offense stat reduced, dealing way less damage.',
				info: '-25% offensive debuff while adjacent.',
				upgrade: 'Hits on them do 3 extra burn.',
			},
			{
				title: 'Glowing Eye',
				desc: 'Fries any targeted nearby foe, can also hit the smaller ones from sides as well.',
				info: '15 burn adjacent damage, any target.',
				upgrade: "Destroys target's initiative.",
				damages: {
					burn: 15,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Covert Strike',
				desc: 'Reaches any foe within 5 hexagons by digging with its tentacles, surprising it.',
				info: '21 pierce damage, 1/4 defense ignored.',
				upgrade: "Depletes target's movement.",
				damages: {
					pierce: 21,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Crashing Globe',
				desc: 'Catapults a flaming orb at any selected inline target, leaving it without cover.',
				info: '20 crush damage + 10 burn per strike.',
				upgrade: "Nullifies target's meditation.",
				damages: {
					crush: 20,
					burn: 10,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Asher has no cost
	},
	{
		id: 23,
		name: 'Metalist',
		playable: false,
		level: 3,
		realm: 'L',
		size: 2,
		set: 'α',
		stats: {
			health: 115,
			regrowth: 3,
			endurance: 65,
			energy: 60,
			meditation: 30,
			initiative: 40,
			offense: 5,
			defense: 7,
			movement: 3,
			pierce: 4,
			slash: 4,
			crush: 4,
			shock: 6,
			burn: 8,
			frost: 1,
			poison: 7,
			sonic: 3,
			mental: 7,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Protective Vest',
				desc: 'Removes all negative effects received from other units at beginning of turn.',
				info: 'Constantly purges any debuff effects.',
				upgrade: 'Becomes immune to debuffs.',
			},
			{
				title: 'Spiked Cudgel',
				desc: 'Transform hand into a deadly weapon, hitting a nearby foe, works all around.',
				info: '18 pierce + 7 crush damage per strike.',
				upgrade: '25% regrowth debuff, 1 turn.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Penetrating Drill',
				desc: 'Punctures nearby enemy to damage it some more or to harm foes beyond it.',
				info: '10 pierce damage done to 3 hexagons.',
				upgrade: 'Ignores 75% of defense stat.',
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Pointe Technique',
				desc: 'Leaps on top of medium or large enemy within 6 range, staying there if killing it.',
				info: 'The target unit takes 30 pierce damage.',
				upgrade: 'Range becomes 10 hexagons.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Metalist has no cost
	},
	{
		id: 24,
		name: 'Living Armor',
		playable: false,
		level: 6,
		realm: 'A',
		size: 2,
		set: 'α',
		stats: {
			health: 199,
			regrowth: 10,
			endurance: 100,
			energy: 150,
			meditation: 10,
			initiative: 10,
			offense: 15,
			defense: 22,
			movement: 2,
			pierce: 15,
			slash: 14,
			crush: 12,
			shock: 1,
			burn: 3,
			frost: 4,
			poison: 10,
			sonic: 1,
			mental: 20,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'First Aid',
				desc: '1/5 regrowth works even if fatigued. Works with the current modified stat.',
				info: 'Applies to nearby allied units as well.',
				upgrade: '4 health recovery is assured.',
			},
			{
				title: 'Iron Fist',
				desc: "Punches a nearby foe with it's heavy armored hand, leaving quite a mark.",
				info: '20 crush damage, -5 defense debuff.',
				upgrade: '-5 meditation debuff too.',
				damages: {
					crush: 20,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Bloody Greed',
				desc: 'Powerful sword penetrating attack, affecting multiple inline hexagons.',
				info: '20 pierce damage over 2 hexagons.',
				upgrade: '3 hexagons area damage.',
				damages: {
					pierce: 20,
				},
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Foot Tromp',
				desc: 'Stomps the ground, causing nearby units to have their next turn delayed.',
				info: 'This offers a huge tactical advantage.',
				upgrade: 'It will not affect allied units.',
				costs: {
					energy: 33,
				},
			},
		],
		cost: 0,  // Living Armor has no cost
	},
	{
		id: 25,
		name: 'Mr. Stitches',
		playable: false,
		level: 1,
		realm: 'E',
		size: 1,
		set: 'α',
		stats: {
			health: 100,
			regrowth: 0,
			endurance: 1,
			energy: 70,
			meditation: 10,
			initiative: 130,
			offense: 2,
			defense: 2,
			movement: 5,
			pierce: 10,
			slash: 0,
			crush: 10,
			shock: 14,
			burn: 0,
			frost: 10,
			poison: 10,
			sonic: 10,
			mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Self Sewing',
				desc: 'Partially repairs itself if not taking any damage at all for a whole game round.',
				info: '10% of total health recovered / round',
			},
			{
				title: 'Razor Blade',
				desc: 'Slices a nearby foe, keeping a sample.',
				info: '15 slash damage on every single strike',
				damages: {
					slash: 15,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Terrifying Stance',
				desc: 'Causes a nearby foe to not be able to target Mr. Stitches directly for a turn.',
				info: '',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Voodoo Doll',
				desc: 'Stabs itself, doing mental damage to any of the previously attacked units.',
				info: '20 mental damage to sampled foes',
				damages: {
					mental: 20,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Mr. Stitches has no cost
	},
	{
		id: 26,
		name: 'Moss Hound',
		playable: false,
		level: 7,
		realm: 'G',
		size: 3,
		set: 'α',
		stats: {
			health: 256,
			regrowth: 8,
			endurance: 64,
			energy: 90,
			meditation: 10,
			initiative: 65,
			offense: 12,
			defense: 14,
			movement: 3,
			pierce: 10,
			slash: 10,
			crush: 10,
			shock: 10,
			burn: 3,
			frost: 2,
			poison: 5,
			sonic: 1,
			mental: 0,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Immortal Wood',
				desc: 'Resurrects itself the next round if no units are sitting on top of the corpse.',
				info: 'Each time it will have 50% less health.',
				upgrade: 'Corpse will persist 3 rounds.',
			},
			{
				title: 'Stalagmite Teeth',
				desc: 'Pierces nearby unit with its denture, striking larger targets multiple times.',
				info: '10 pierce damage, can do up to 2 hits.',
				upgrade: '+1 one more maximum hit.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Waterfall Cannon',
				desc: 'Powerful jet of water that damages & pushes back, has a 3 hexagons range.',
				info: '20 knocking crush damage, up to 2 hits.',
				upgrade: '+2 hexagons range increase.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Thorny Weed',
				desc: 'Nasty ivy grows at a free spot up to 5 hexagons away, waiting for a foe prey.',
				info: '9 pierce + 9 poison & 1 round entangle.',
				upgrade: 'Target unit for entangle only.',
				costs: {
					energy: 35,
				},
			},
		],
		cost: 0,  // Moss Hound has no cost
	},
	{
		id: 27,
		name: 'Blue Shrimp',
		playable: false,
		level: 2,
		realm: 'S',
		size: 3,
		set: 'α',
		stats: {
			health: 95,
			regrowth: 3,
			endurance: 52,
			energy: 60,
			meditation: 8,
			initiative: 20,
			offense: 1,
			defense: 1,
			movement: 3,
			pierce: 1,
			slash: 1,
			crush: 1,
			shock: 1,
			burn: 1,
			frost: 1,
			poison: 1,
			sonic: 1,
			mental: 2,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Evolved Organs',
				desc: 'Recovers 30% of health lost only from the last hit taken when the turn starts.',
				info: 'This ability also works when fatigued.',
				upgrade: 'Up to 50% health recovered.',
			},
			{
				title: 'Squidish Head',
				desc: 'Chews on a nearby enemy, stealing its meditation stat points for a single turn.',
				info: '25 crush damage and meditation steal.',
				upgrade: 'Stolen points bypass fatigue.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Amazing Lasso',
				desc: 'Binds together with a nearby enemy, denying it to move apart too far away.',
				info: 'Up to 3 hexagons maximum distance.',
				upgrade: 'Works against abilities too.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Cloned Embryo',
				desc: 'Creates an exact duplicate of current self that has the initiative stat linked.',
				info: 'Can be used on a clone to switch to it.',
				upgrade: 'Switching costs no energy.',
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Blue Shrimp has no cost
	},
	{
		id: 28,
		name: 'Stomper',
		playable: true,
		level: 3,
		realm: 'E',
		size: 2,
		set: 'α',
		stats: {
			health: 135,
			regrowth: 5,
			endurance: 100,
			energy: 96,
			meditation: 32,
			initiative: 10,
			offense: 10,
			defense: 16,
			movement: 3,
			pierce: 10,
			slash: 10,
			crush: 10,
			shock: 10,
			burn: 10,
			frost: 10,
			poison: 10,
			sonic: 5,
			mental: 0,
		},
		drop: {
			name: 'bread',
			health: 5,
			endurance: 5,
			energy: 5,
		},
		animation: {
			walk_speed: 400,
		},
		display: {
			width: 180,
			height: 176,
			'offset-x': -3,
			'offset-y': -140,
		},
		ability_info: [
			{
				title: 'Tankish Build',
				desc: 'This unit becomes more durable as it gains one bonus defense every round.',
				info: 'Maximum defense bonus capped at 40.',
				upgrade: 'Two when no damage taken.',
			},
			{
				title: 'Seismic Stomp',
				desc: "Deals damage to an inline or diagonal target that's distant up to 3 hexagons.",
				info: '14 crush + 14 sonic damage on strike.',
				upgrade: 'Attack can now bypass stuff.',
				damages: {
					crush: 14,
					sonic: 14,
				},
				costs: {
					energy: 31,
				},
			},
			{
				title: 'Stone Grinder',
				desc: 'Stampedes over a row of units until space is found or is brutally created.',
				info: '10 crush damage to every hexagon.',
				upgrade: 'Only stops at destination.',
				damages: {
					crush: 10,
				},
				costs: {
					energy: 32,
				},
			},
			{
				title: 'Earth Shaker',
				desc: 'Smashes front limbs into the ground, delaying all units over the area ahead.',
				info: 'Delays units over all 8 hexagons area.',
				upgrade: 'Delayed units will skip turn.',
				costs: {
					energy: 33,
				},
			},
		],
		cost: 0,  // Stomper has no cost
	},
	{
		id: 29,
		name: 'Gilded Maiden',
		playable: false,
		level: 5,
		realm: 'A',
		size: 1,
		set: 'α',
		stats: {
			health: 100,
			regrowth: 4,
			endurance: 25,
			energy: 105,
			meditation: 35,
			initiative: 40,
			offense: 11,
			defense: 17,
			movement: 4,
			pierce: 10,
			slash: 10,
			crush: 10,
			shock: 0,
			burn: 8,
			frost: 6,
			poison: 4,
			sonic: 3,
			mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Midas Blessing',
				desc: 'Every 5th melee hit taken, the attacking unit is turned to gold for a whole round.',
				info: 'Units remain golden even if attacked.',
				upgrade: 'Own attacks can turn to gold.',
			},
			{
				title: 'Ruby Sceptre',
				desc: 'Pokes nearby foe using the neat staff. This attack has 1 hex extended reach.',
				info: '12 crush + 5 pure damage per attack.',
				upgrade: 'Regains up to 5 health on hit.',
				damages: {
					crush: 12,
					pure: 5,
				},
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Winged Sphere',
				desc: 'Heals an ally or damages an enemy that is at the target location after one round.',
				info: '30 heal for ally or burn damage to a foe.',
				upgrade: '5 area damage / heal on miss.',
				damages: {
					burn: 30,
				},
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Searing Light',
				desc: 'Conjures an energy beam that causes multiple burning hits to first unit met.',
				info: '2 hits x 13 burn damage every attack',
				upgrade: 'One extra burn damage hit.',
				damages: {
					burn: 15,
				},
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Gilded Maiden has no cost
	},
	{
		id: 30,
		name: 'Papa Eggplant',
		playable: false,
		level: 5,
		realm: 'G',
		size: 2,
		set: 'α',
		stats: {
			health: 193,
			regrowth: 8,
			endurance: 55,
			energy: 80,
			meditation: 8,
			initiative: 60,
			offense: 5,
			defense: 6,
			movement: 2,
			pierce: 5,
			slash: 4,
			crush: 5,
			shock: 3,
			burn: 2,
			frost: 2,
			poison: 14,
			sonic: 3,
			mental: 7,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Small Version',
				desc: 'Spawns a little hungry eggplant that chases nearest foe and then attacks.',
				info: 'Grows into an adult if it kills two foes.',
				upgrade: 'Needs only one kill or drop.',
			},
			{
				title: 'Having Dinner',
				desc: 'Bites a nearby foe, regaining a small number of maximum health each hit.',
				info: '15 pierce damage & 5% health regain.',
				upgrade: '+10 poison damage on hit.',
				damages: {
					pierce: 15,
				},
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Oral Snake',
				desc: 'Drags nearby an inline unit up to five hexagons distance while damaging it.',
				info: '12 pierce + 8 poison damage on strike.',
				upgrade: 'Extra 4 poison per hexagon.',
				damages: {
					pierce: 12,
					poison: 8,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Flower Fury',
				desc: 'Uses pony tail to whip and poison all adjacent units that strayed too close.',
				info: '10 slash + 10 poison damage around.',
				upgrade: 'Triggers again when killing.',
				damages: {
					slash: 10,
					poison: 10,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Papa Eggplant has no cost
	},
	{
		id: 31,
		name: 'Cyber Wolf',
		playable: true,
		level: 3,
		realm: 'A',
		size: 2,
		set: 'α',
		stats: {
			health: 140,
			regrowth: 5,
			endurance: 75,
			energy: 60,
			meditation: 25,
			initiative: 60,
			offense: 7,
			defense: 9,
			movement: 2,
			pierce: 9,
			slash: 9,
			crush: 9,
			shock: 4,
			burn: 4,
			frost: 7,
			poison: 8,
			sonic: 4,
			mental: 5,
		},
		drop: {
			name: 'fang',
			offense: 10,
			defense: 5,
		},
		display: {
			width: 160,
			height: 210,
			'offset-x': 15,
			'offset-y': -165,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Bad Doggie',
				desc: "Bites an adjacent inline enemy that's unfortunate to be there at turn start.",
				info: '12 pierce damage + 10 crush damage.',
				upgrade: 'Also bites before turn ends.',
				affectedByMatSickness: 1,
				damages: {
					pierce: 12,
					crush: 10,
				},
			},

			{
				title: 'Metal Hand',
				desc: 'Harms nearby foe by using one of the two fearsome prosthetic heavy limbs.',
				info: '12 crush + 8 shock damage per attack.',
				upgrade: 'Steals up to 8 energy points.',
				damages: {
					crush: 12,
					shock: 8,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Rocket Launcher',
				desc: 'Fires up to 3 missiles that travel long distances, striking individual targets.',
				info: '10 crush + 10 burn damage per rocket.',
				upgrade: 'Energy cost is reduced by 10.',
				damages: {
					crush: 10,
					burn: 10,
				},
				costs: {
					energy: 40,
				},
			},
			{
				title: 'Target Locking',
				desc: "Two of the rockets that didn't hit this round are redirected to a new target.",
				info: 'This attack counts as a single strike.',
				upgrade: 'All rockets are being used.',
				damages: {
					crush: 10,
					burn: 10,
				},
				costs: {
					energy: 10,
				},
			},
		],
		cost: 0,  // Cyber Wolf has no cost
	},
	{
		id: 32,
		name: 'Deep Beauty',
		playable: false,
		level: 3,
		realm: 'S',
		size: 2,
		set: 'α',
		stats: {
			health: 120,
			regrowth: 21,
			endurance: 40,
			energy: 60,
			meditation: 10,
			initiative: 30,
			offense: 5,
			defense: 5,
			movement: 2,
			pierce: 4,
			slash: 1,
			crush: 2,
			shock: 2,
			burn: 0,
			frost: 10,
			poison: 8,
			sonic: 4,
			mental: 12,
		},
		animation: {
			walk_speed: 300,
		},
		ability_info: [
			{
				title: 'Sea Horse',
				desc: 'Meditation stat will be highly increased if being at full health, restoring energy.',
				info: '15 extra meditation points if full health.',
				upgrade: 'Can now fully restore energy.',
			},
			{
				title: 'Sea Serpent',
				desc: 'Hits a nearby area using its large tail, doing area damage over 2 hexagons.',
				info: '8 pierce + 8 frost damage, has 2 range.',
				upgrade: 'Increased area & range by 1.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Tsunami Surge',
				desc: 'Unleashes a very powerful water wave that will travel inline to hit first target.',
				info: '16 crush + 16 frost damage done inline.',
				upgrade: 'Will continue if it kills target.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Mirror Image',
				desc: 'Creates a duplicate of an unit that will only have 1 health and die after a turn.',
				info: "Usable within target's adjacent space.",
				upgrade: 'Lasts until original unit dies.',
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Deep Beauty has no cost
	},
	{
		id: 33,
		name: 'Golden Wyrm',
		playable: true,
		level: 7,
		realm: 'A',
		size: 3,
		set: 'α',
		stats: {
			health: 225,
			regrowth: 5,
			endurance: 25,
			energy: 125,
			meditation: 25,
			initiative: 100,
			offense: 25,
			defense: 24,
			movement: 2,
			pierce: 20,
			slash: 20,
			crush: 20,
			shock: 5,
			burn: 20,
			frost: 5,
			poison: 10,
			sonic: 15,
			mental: 15,
		},
		drop: {
			name: 'lemon',
			energy: 15,
			movement: 1,
			initiative: 10,
			shock: 5,
		},
		animation: {
			walk_speed: 450,
		},
		display: {
			width: 335,
			height: 275,
			'offset-x': -40,
			'offset-y': -240,
		},
		ability_info: [
			{
				title: 'Battle Cry',
				desc: 'Roars at the beginning of the turn if took any damage in previous round.',
				info: '30 sonic damage to adjacent units.',
				upgrade: 'Only roars if nearby foes.',
			},
			{
				title: 'Executioner Axe',
				desc: "Slashes a nearby foe, instantly killing it if it's under a certain health threshold.",
				info: '30 slash damage, 45 health threshold.',
				upgrade: 'Usable again on killing strike.',
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Dragon Flight',
				desc: 'Travels to a nearby location passing over obstacles at no movement cost.',
				info: 'Flies to location within 10 hexagons.',
				upgrade: '+25 offense if hitting next.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Visible Stigmata',
				desc: 'Rapidly transfers up to 50 health points to a nearby allied unit, this is non lethal.',
				info: 'Usage requires being at least 51 health.',
				upgrade: '+10 regrowth bonus each use.',
				costs: {
					energy: 25,
				},
			},
		],
		cost: 0,  // Golden Wyrm has no cost
	},
	{
		id: 34,
		name: 'Royal Guard',
		playable: false,
		level: 2,
		realm: 'P',
		size: 2,
		set: 'α',
		stats: {
			health: 125,
			regrowth: 4,
			endurance: 90,
			energy: 60,
			meditation: 10,
			initiative: 30,
			offense: 9,
			defense: 13,
			movement: 2,
			pierce: 10,
			slash: 10,
			crush: 10,
			shock: 10,
			burn: 10,
			frost: 10,
			poison: 10,
			sonic: 10,
			mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Fearsome Unit',
				desc: 'Nearby foes have their offense and defense reduced for a full round.',
				info: '-25% offense and defense debuff',
			},
			{
				title: 'Wrist Scimitar',
				desc: 'Slashes a nearby foe using its blade, disturbing its energy regeneration.',
				info: '25 slash damage, 1 meditation debuff',
				damages: {
					slash: 25,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Force Display',
				desc: 'Switches the places of two nearby side units that are the same hexagonal size.',
				info: '8 crush damage to both swapped units',
				damages: {
					crush: 8,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Belt Swat',
				desc: 'Pokes all the frontal nearby units, knocking them back one hexagon.',
				info: '20 crush damage plus knockback',
				damages: {
					crush: 20,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Royal Guard has no cost
	},
	{
		id: 35,
		name: 'Greedy Knight',
		playable: false,
		level: 4,
		realm: 'A',
		size: 1,
		set: 'α',
		stats: {
			health: 100,
			regrowth: 3,
			endurance: 40,
			energy: 70,
			meditation: 3,
			initiative: 70,
			offense: 14,
			defense: 19,
			movement: 3,
			pierce: 9,
			slash: 9,
			crush: 9,
			shock: 0,
			burn: 5,
			frost: 5,
			poison: 2,
			sonic: 1,
			mental: 7,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Bronze Armor',
				desc: 'All incoming pierce, slash and crush types of damage are greatly reduced.',
				info: '+15% physical resistance to damage.',
				upgrade: 'Double physical resistance.',
			},
			{
				title: 'Brass Mace',
				desc: 'Does versatile damage to nearby foe.',
				info: '11 pierce + 10 crush + 9 slash damage.',
				upgrade: '+3 damage for each source.',
				damages: {
					pierce: 11,
					crush: 10,
					slash: 9,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Lion Thrust',
				desc: 'Runs very fast towards an inline foe for up to 5 hexagons, greatly terrorizing it.',
				info: '20 mental damage when reaching foe.',
				upgrade: '20% extra offense / hexagon.',
				damages: {
					mental: 20,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Defensive Stance',
				desc: 'Will be extra vigilant, better protecting himself from attacks until the next turn.',
				info: 'Reduces 9 damage from incoming hits.',
				upgrade: 'Will stop penetrating attacks.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Greedy Knight has no cost
	},
	{
		id: 36,
		name: 'Vertigo',
		playable: false,
		level: 4,
		realm: 'E',
		size: 2,
		set: 'α',
		stats: {
			health: 170,
			regrowth: 6,
			endurance: 60,
			energy: 145,
			meditation: 10,
			initiative: 50,
			offense: 1,
			defense: 11,
			movement: 3,
			pierce: 3,
			slash: 3,
			crush: 3,
			shock: 2,
			burn: 2,
			frost: 2,
			poison: 6,
			sonic: 8,
			mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Pestilence Bug',
				desc: 'All drops within 4 hexagons range are being picked at the beginning of turn.',
				info: '',
			},
			{
				title: 'Gnarled Staff',
				desc: 'Pokes nearby foe using wooden staff.',
				info: '15 crush damage, -5 crush stat debuff.',
				damages: {
					crush: 15,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Rock Shard',
				desc: 'Causes an obstable to erupt at an empty location within 6 hexagons.',
				info: 'It can be destroyed with only 2 hits.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Furious Twister',
				desc: 'Summons tornado that travels inline every round, bashing first creature.',
				info: '20 crush damage, 4 hexagons push.',
				damages: {
					crush: 20,
				},
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Vertigo has no cost
	},
	{
		id: 37,
		name: 'Swine Thug',
		playable: true,
		level: 1,
		realm: 'A',
		size: 1,
		set: 'α',
		stats: {
			health: 90,
			regrowth: 3,
			endurance: 45,
			energy: 75,
			meditation: 25,
			initiative: 45,
			offense: 6,
			defense: 8,
			movement: 3,
			pierce: 7,
			slash: 7,
			crush: 7,
			shock: 6,
			burn: 3,
			frost: 3,
			poison: 2,
			sonic: 2,
			mental: 2,
		},
		drop: {
			name: 'meat',
			health: 15,
			endurance: 3,
			energy: 5,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			height: 190,
			width: 140,
			'offset-y': -150,
			'offset-x': -21,
		},
		ability_info: [
			{
				title: 'Spa Goggles',
				desc: 'Gains temporary bonus regrowth and defense when staying in a mud bath.',
				info: '+5 regrowth & defense while in mud.',
				upgrade: 'Doubles both stat bonuses.',
				effects: [
					{
						regrowth: 5,
						defense: 5,
					},
				],
			},
			{
				title: 'Baseball Baton',
				desc: 'Bashes baseball bat into a nearby foe, crushing it and pushing it 1 hexagon.',
				info: '25 crush damage on hit & knockback.',
				upgrade: 'Causes target to mud slide.',
				damages: {
					crush: 25,
				},
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Ground Ball',
				desc: 'Strikes a mud boulder towards a foe. Usable within one of the 3 inline rows.',
				info: '15 crush + 5 burn damage on each hit.',
				upgrade: '-1 meditation stat debuffed.',
				damages: {
					crush: 15,
					burn: 5,
				},
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Mud Bath',
				desc: 'Orders a pile of mud over any hexagon, slowing any other units that walk over.',
				info: '-1 movement point, on free spot or self.',
				upgrade: '10 energy cost if used on self.',
				effects: [
					{
						special: '-1 %movement%',
					},
				],
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Swine Thug has no cost
	},
	{
		id: 38,
		name: 'Crystalis',
		playable: false,
		level: 4,
		realm: 'L',
		size: 2,
		set: 'α',
		stats: {
			health: 150,
			regrowth: 5,
			endurance: 40,
			energy: 95,
			meditation: 10,
			initiative: 30,
			offense: 5,
			defense: 16,
			movement: 2,
			pierce: 5,
			slash: 5,
			crush: 5,
			shock: 5,
			burn: 10,
			frost: 3,
			poison: 2,
			sonic: 2,
			mental: 7,
		},
		animation: {
			walk_speed: 600,
		},
		ability_info: [
			{
				title: 'Crossed Bones',
				desc: 'Blocks one melee frontal hit per round, nicely reducing the incoming damage.',
				info: 'Blocked attacks do 40% less damage.',
				upgrade: 'Blocks 2 attacks per round.',
			},
			{
				title: 'Shark Aggression',
				desc: 'Bytes a nearby foe, lowering its total maximum health with every single hit.',
				info: '10 pierce damage, ten health debuff.',
				upgrade: 'Charges 2 hexagons at foe.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Crystal Therapy',
				desc: 'Grows adjacent minerals that will buff regrowth & meditation of nearby units.',
				info: '1 regrowth + 1 meditation per crystal.',
				upgrade: 'Can improve existing crystal.',
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Charring Flame',
				desc: '8 range attack that damages the first encountered targets over three rows.',
				info: '15 burn damage done on 3 paralel lines.',
				upgrade: 'It now improves crystals hit.',
				costs: {
					energy: 40,
				},
			},
		],
		cost: 0,  // Crystalis has no cost
	},
	{
		id: 39,
		name: 'Headless',
		playable: true,
		level: 4,
		realm: 'W',
		size: 2,
		set: 'α',
		stats: {
			health: 145,
			regrowth: 7,
			endurance: 34,
			energy: 78,
			meditation: 26,
			initiative: 18,
			offense: 11,
			defense: 6,
			movement: 5,
			pierce: 4,
			slash: 4,
			crush: 4,
			shock: 5,
			burn: 0,
			frost: 0,
			poison: 0,
			sonic: 8,
			mental: 0,
		},
		drop: {
			name: 'yellow pepper',
			health: 3,
			regrowth: 2,
			energy: 4,
		},
		display: {
			width: 175,
			height: 215,
			'offset-x': 4,
			'offset-y': -180,
		},
		animation: {
			walk_speed: 300,
		},
		ability_info: [
			{
				title: 'Larva Infest',
				desc: 'Strikes any rear foe at start & end of turn, infesting it with a big parasite.',
				info: '-5 endurance stat debuff, stackable.',
				upgrade: 'Instantly fatigues enemy.',
				effects: [
					{
						special: '-5 %endurance% debuff, stackable.',
					},
				],
			},
			{
				title: 'Cartilage Dagger',
				desc: 'Hits nearby unit using frontal blade. Double damage if the foe is fatigued.',
				info: '11 pierce damage × 2 vs fatigued foe.',
				upgrade: 'Extra endurance is damage.',
				damages: {
					special: '11%pierce% × 2 if target is fatigued.',
				},
				costs: {
					energy: 16,
				},
			},
			{
				title: 'Whip Move',
				desc: 'Grasps a distant unit, pulling close to each other based on their relative size.',
				info: 'Between 2 and 6 hexagons pull range.',
				upgrade: '+2 maximum range increase.',
				effects: [
					{
						special: '2 to 6 hexagons pull range.',
					},
				],
				costs: {
					energy: 20,
				},
				range: {
					minimum: 3,
					regular: 6,
					upgraded: 8,
				},
			},
			{
				title: 'Boomerang Tool',
				desc: 'Forms a new weapon out of blades and throws it away 5 hexagons, returning.',
				info: '10 slash damage over 15 hexagons x 2.',
				upgrade: '+3 hexagons increased area.',
				damages: {
					special: '10%slash%, hits 2 times.',
				},
				costs: {
					energy: 24,
				},
			},
		],
		cost: 0,  // Headless has no cost
	},
	{
		id: 40,
		name: 'Nutcase',
		playable: true,
		level: 2,
		realm: 'E',
		size: 2,
		set: 'α',
		stats: {
			health: 85,
			regrowth: 3,
			endurance: 30,
			energy: 80,
			meditation: 33,
			initiative: 120,
			offense: 6,
			defense: 9,
			movement: 5,
			pierce: 7,
			slash: 9,
			crush: 10,
			shock: 8,
			burn: 7,
			frost: 6,
			poison: 5,
			sonic: 4,
			mental: 2,
		},
		drop: {
			name: 'nut',
			defense: 6,
			pierce: 2,
			slash: 2,
			crush: 2,
		},
		display: {
			width: 155,
			height: 210,
			'offset-x': 20,
			'offset-y': -175,
		},
		animation: {
			walk_speed: 360,
		},
		ability_info: [
			{
				title: 'Tentacle Bush',
				desc: 'Grabs hold of all the melee attackers, making them unable to move that turn.',
				info: 'Becomes unmovable by most abilities.',
				upgrade: '+5 energy to foe ability cost.',
			},
			{
				title: 'Hammer Time',
				desc: 'Nails a nearby unit using its hard head, making it take extra damage if moving.',
				info: '10 crush + 10 pierce damage & pinning.',
				upgrade: 'Attacks up to 3 frontal foes.',
				damages: {
					crush: 10,
					pierce: 10,
				},
				costs: {
					energy: 24,
				},
				effects: [
					{
						special: '10 %pierce% if moving',
					},
				],
			},
			{
				title: 'War Horn',
				desc: 'Charges towards an inline foe, doing a bit of extra damage based on distance.',
				info: '11 pierce damage + 1 bonus / hexagon.',
				upgrade: 'Can also push the target foe.',
				damages: {
					pierce: 11,
				},
				costs: {
					energy: 26,
				},
			},
			{
				title: 'Fishing Hook',
				desc: 'Throws over a nearby foe, swapping places if it is small or medium sized.',
				info: '12 pierce + 12 crush damage & swap.',
				upgrade: 'Can also swap large units.',
				damages: {
					pierce: 12,
					crush: 12,
				},
				costs: {
					energy: 29,
				},
			},
		],
		cost: 0,  // Nutcase has no cost
	},
	{
		id: 41,
		name: 'Mangler',
		playable: false,
		level: 1,
		realm: 'W',
		size: 1,
		set: 'α',
		stats: {
			health: 90,
			regrowth: 4,
			endurance: 30,
			energy: 90,
			meditation: 25,
			initiative: 12,
			offense: 4,
			defense: 3,
			movement: 3,
			pierce: 12,
			slash: 4,
			crush: 4,
			shock: 3,
			burn: 4,
			frost: 2,
			poison: 12,
			sonic: 9,
			mental: 20,
		},
		animation: {
			walk_speed: 450,
		},
		ability_info: [
			{
				title: 'Hypnotic Light',
				desc: 'Causes inline foe within 5 hexagons to come towards at the start of the turn.',
				info: 'Enemy will be compeled to approach.',
				upgrade: 'Frontal foes can not attack.',
			},
			{
				title: 'Sucker Punch',
				desc: 'Eyes are actually punches, taking a nearby foe by surprise the first time.',
				info: '9 crush damage, triple the first time.',
				upgrade: 'Can be used twice per round.',
			},
			{
				title: 'Hell Mouth',
				desc: 'Either bites an adjacent foe or creates a nasty spiky trap nearby on the ground.',
				info: '16 pierce damage, -5 regrowth debuff.',
				upgrade: 'Debuffs stack while fatigued.',
			},
			{
				title: 'Girly Sprint',
				desc: 'Gains 5 movement points and can run through traps without triggering them.',
				info: "+4 movement, doesn't trigger traps.",
				upgrade: '+2 more movement points.',
			},
		],
		cost: 0,  // Mangler has no cost
	},
	{
		id: 42,
		name: 'Batmadillo',
		playable: false,
		level: 7,
		realm: 'E',
		size: 3,
		set: 'α',
		stats: {
			health: 222,
			regrowth: 4,
			endurance: 66,
			energy: 90,
			meditation: 30,
			initiative: 80,
			offense: 24,
			defense: 25,
			movement: 1,
			pierce: 15,
			slash: 15,
			crush: 15,
			shock: 10,
			burn: 10,
			frost: 5,
			poison: 5,
			sonic: 20,
			mental: 20,
		},
		drop: {
			name: 'change',
			health: 10,
			energy: 3,
		},
		animation: {
			walk_speed: 450,
		},
		display: {
			width: 95,
			height: 135,
			'offset-x': 0,
			'offset-y': 0,
		},
		ability_info: [
			{
				title: 'Arm Shield',
				desc: 'Reduces a fixed number of damage points from incoming basic attacks.',
				info: '10 damage points attack reduction.',
				upgrade: 'Reduces from all abilities.',
			},
			{
				title: 'Mega Slicer',
				desc: 'Slashes nearby foe using the claws. Target loses 3 defense permanently.',
				info: '30 slash damage & defense debuff.',
				upgrade: 'The debuff can now stack.',
				damages: {
					slash: 30,
				},
				costs: {
					energy: 30,
				},
			},
			{
				title: 'Screaming Bat',
				desc: 'Flying fiend attack that will damage every single hexagon of current row.',
				info: '10 sonic plus 9 mental to whole row.',
				upgrade: 'Can also target side lanes.',
				damages: {
					sonic: 10,
					mental: 9,
				},
				costs: {
					energy: 35,
				},
			},
			{
				title: 'Eclipsing Leap',
				desc: 'Catapults itself to strike any enemy that has 3 inline hexagons available.',
				info: '18 pierce + 18 crush damage on hit.',
				upgrade: '+18 slash damage added.',
				damages: {
					pierce: 18,
					crush: 18,
				},
				costs: {
					energy: 55,
				},
			},
		],
		cost: 0,  // Batmadillo has no cost
	},
	{
		id: 43,
		name: 'Volpyr',
		playable: false,
		level: 7,
		realm: 'L',
		size: 3,
		set: 'α',
		stats: {
			health: 210,
			regrowth: 10,
			endurance: 10,
			energy: 160,
			meditation: 30,
			initiative: 140,
			offense: 16,
			defense: 15,
			movement: 5,
			pierce: 5,
			slash: 5,
			crush: 5,
			shock: 8,
			burn: 15,
			frost: 3,
			poison: 6,
			sonic: 3,
			mental: 4,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Hot Ashes',
				desc: 'If killed, leaves ashes behind that will reiginite it back to life if not stomped.',
				info: '1/3 hitpoints & energy for each stack.',
				upgrade: 'Full energy when it revives.',
			},
			{
				title: 'Little Kindle',
				desc: 'Releases a bonfire that will chase the closest foe at a low movement speed.',
				info: '25 burn damage and 3 hexagons move.',
				upgrade: '+2 more Kindle movement.',
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Blazing Waves',
				desc: 'Launches two burning streams which will scorch all the units they encounter.',
				info: '30 burn damage over 8 hexagons area.',
				upgrade: 'The attack becomes multi-hit.',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Extra Motion',
				desc: 'The lust drives it to do double effort, acting again at the end of the round.',
				info: "This is usable if unit wasn't delayed.",
				upgrade: 'If killed it will die after turn.',
				costs: {
					energy: 50,
				},
			},
		],
		cost: 0,  // Volpyr has no cost
	},
	{
		id: 44,
		name: 'Scavenger',
		playable: true,
		level: 3,
		realm: 'P',
		size: 2,
		set: 'α',
		stats: {
			health: 80,
			regrowth: 2,
			endurance: 30,
			energy: 106,
			meditation: 30,
			initiative: 70,
			offense: 1,
			defense: 8,
			movement: 9,
			pierce: 7,
			slash: 7,
			crush: 3,
			shock: 5,
			burn: 7,
			frost: 7,
			poison: 8,
			sonic: 6,
			mental: 6,
		},
		drop: {
			name: 'feather',
			initiative: 15,
			movement: 1,
			defense: 2,
		},
		movementType: 'hover',
		animation: {
			walk_speed: 180,
		},
		display: {
			width: 195,
			height: 205,
			'offset-x': 0,
			'offset-y': -160,
		},
		ability_info: [
			{
				title: 'Wing Feathers',
				desc: 'Can fly to available locations within movement range, avoiding all traps.',
				info: 'Safely travel towards new locations.',
				upgrade: 'Flight over all units as well.',
			},
			{
				title: 'Slicing Pounce',
				desc: 'Slashes nearby foe using its claws.',
				info: '12 slash damage done every strike.',
				upgrade: '-1 offense debuff per hit.',
				damages: {
					slash: 12,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Escort Service',
				desc: 'Carries over a frontal or rear small or medium unit to a free inline location.',
				info: 'Distance based on movement points.',
				upgrade: 'Can also move large units.',
				costs: {
					energy: 0,
					movement: '1-2 points per hexagon',
				},
				animation_data: {
					duration: 500,
					delay: 500,
				},
			},
			{
				title: 'Deadly Toxin',
				desc: 'Bites a nearby enemy and poisons it, taking damage every turn until dead.',
				info: '12 pierce & 8 poison damage per turn.',
				upgrade: 'Poison damages since bite.',
				damages: {
					pierce: 12,
					poison: 8,
				},
				costs: {
					energy: 46,
				},
			},
		],
		cost: 0,  // Scavenger has no cost
	},
	{
		id: 45,
		name: 'Chimera',
		playable: true,
		level: 6,
		realm: 'P',
		size: 3,
		set: 'α',
		stats: {
			health: 182,
			regrowth: 12,
			endurance: 38,
			energy: 96,
			meditation: 48,
			initiative: 40,
			offense: 7,
			defense: 5,
			movement: 4,
			pierce: 8,
			slash: 8,
			crush: 8,
			shock: 4,
			burn: 6,
			frost: 8,
			poison: 8,
			sonic: 15,
			mental: 12,
		},
		drop: {
			name: 'bat wing',
			initiative: 5,
			movement: 2,
			sonic: 4,
		},
		animation: {
			walk_speed: 500,
		},
		display: {
			width: 300,
			height: 220,
			'offset-x': -12,
			'offset-y': -183,
		},
		ability_info: [
			{
				title: 'Cyclic Duality',
				desc: 'Even when becoming fatigued, can still recharge up to half of meditation stat.',
				info: 'This works with the existing unit stats.',
				upgrade: 'Half regrowth regeneration.',
			},
			{
				title: 'Tooth Fairy',
				desc: 'Both heads sink their teeth into a nearby enemy target, damaging it.',
				info: '16 crush damage, single hit attack.',
				upgrade: 'This attack will hit twice.',
				damages: {
					crush: 16,
				},
				costs: {
					energy: 32,
				},
			},
			{
				title: 'Disturbing Sound',
				desc: "Sings a very powerful musical note that doesn't get stopped by any dying units.",
				info: '21 sonic damage that continues on kill.',
				upgrade: '+9 sonic damage when killing.',
				damages: {
					sonic: 21,
				},
				costs: {
					energy: 31,
				},
			},
			{
				title: 'Battering Ram',
				desc: 'Knocks a nearby unit up to 3 hexagons, launching it into the next one and so on.',
				info: '15 crush damage & push that diminish.',
				upgrade: 'Consistent damage and push.',
				damages: {
					crush: 15,
				},
				costs: {
					energy: 33,
				},
			},
		],
		cost: 0,  // Chimera has no cost
	},
	{
		id: 46,
		name: 'Scorpius',
		playable: false,
		level: 5,
		realm: 'E',
		size: 2,
		set: 'α',
		stats: {
				health: 186,
				regrowth: 4,
				endurance: 80,
				energy: 70,
				meditation: 20,
				initiative: 30,
				offense: 8,
				defense: 21,
				movement: 4,
				pierce: 10,
				slash: 10,
				crush: 8,
				shock: 9,
				burn: 2,
				frost: 2,
				poison: 9,
				sonic: 2,
				mental: 1,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Palm Tree',
				desc: 'This unit prefers to hide underground, revealing only the tail most of the time.',
				info: 'Becomes immovable by enemy abilities.',
				upgrade: 'Clears 1 debuff stack per turn.',
			},
			{
				title: 'Crab Pincer',
				desc: 'Powerful attack done on a nearby foe.',
				info: '10 pierce + 10 crush damage on strike.',
				upgrade: '-1 offense stackable debuff.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Stinger Venom',
				desc: 'Pokes any foe within 2 hexagons range, piercing and poisoning it for two turns.',
				info: '10 pierce + 20 poison damage 2 rounds.',
				upgrade: 'Ignores half of defense stat.',
				costs: {
					energy: 25,
				},
			},
			{
				title: 'Imbricated Scales',
				desc: 'Launches a projectile that can split on impact, dealing 1/2 damage each side.',
				info: '30 pierce damage, 10 pierce sideways.',
				upgrade: 'Both split shards penetrate.',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Scorpius has no cost
	},
	{
		id: 47,
		name: 'Aegis',
		playable: false,
		level: 5,
		realm: 'P',
		size: 3,
		set: 'α',
		stats: {
			health: 160,
			regrowth: 6,
			endurance: 110,
			energy: 70,
			meditation: 15,
			initiative: 20,
			offense: 8,
			defense: 20,
			movement: 3,
			pierce: 7,
			slash: 7,
			crush: 7,
			shock: 1,
			burn: 4,
			frost: 1,
			poison: 1,
			sonic: 1,
			mental: 8,
		},
		animation: {
			walk_speed: 400,
		},
		ability_info: [
			{
				title: 'Hard Headed',
				desc: 'Frontal attacks cause way less damage.',
				info: '10 points frontal hit damage reduction',
				upgrade: '',
			},
			{
				title: 'Lash Master',
				desc: 'Slashes nearby foe using tongue, reducing its initiative for two turns.',
				info: '20 slash damage & -20 initiative stat',
			},
			{
				title: 'Double Slap',
				desc: 'Strikes up to two frontal nearby units that are positioned next to each other.',
				info: '20 crush damage to each unit being hit',
				upgrade: '',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Meteor Slam',
				desc: 'Regurgitates a sphere and throws it at any location within 8 hexagons range.',
				info: '20 crush + 10 burn damage per strike',
				upgrade: '',
				costs: {
					energy: 30,
				},
			},
		],
		cost: 0,  // Aegis has no cost
	},
	{
		id: 48,
		name: 'Satyr',
		playable: false,
		level: 6,
		realm: 'W',
		size: 3,
		set: 'α',
		stats: {
				health: 214,
				regrowth: 4,
				endurance: 60,
				energy: 80,
				meditation: 5,
				initiative: 40,
				offense: 9,
				defense: 8,
				movement: 3,
				pierce: 5,
				slash: 6,
				crush: 7,
				shock: 7,
				burn: 5,
				frost: 5,
				poison: 4,
				sonic: 3,
				mental: 10,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Hard Headed',
					desc: 'Frontal attacks cause way less damage.',
					info: '10 points frontal hit damage reduction',
					upgrade: '',
			},
			{
				title: 'Stiff Scissors',
				desc: 'Stabs up to two nearby diagonal units.',
				info: '15 pierce damage, 2 diagonal targets',
				upgrade: '',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Flying Cleaver',
				desc: 'Jumps over a nearby creature, slicing it with its large abdominal bone hatchet.',
				info: '20 slash damage to the leaped over unit',
				upgrade: '',
				costs: {
					energy: 20,
				},
			},
			{
				title: 'Demon Hoof',
				desc: 'Bashes nearby foe, pushing it back a couple hexagons, based on its size.',
				info: '25 crush damage, up to 3 hexes push',
				upgrade: '',
				costs: {
					energy: 25,
				},
			},
		],
		cost: 0,  // Satyr has no cost
	},
	{
		id: 49,
		name: 'Lavamander',
		playable: false,
		level: 6,
		realm: 'L',
		size: 3,
		set: 'α',
		stats: {
			health: 180,
			regrowth: 2,
			endurance: 25,
			energy: 90,
			meditation: 6,
			initiative: 30,
			offense: 4,
			defense: 4,
			movement: 3,
			pierce: 2,
			slash: 2,
			crush: 2,
			shock: 3,
			burn: 7,
			frost: 1,
			poison: 2,
			sonic: 1,
			mental: 5,
		},
		animation: {
			walk_speed: 500,
		},
		ability_info: [
			{
				title: 'Gore Lusting',
				desc: 'Each successful hit increases both the offense and burn stats a single point.',
				info: '1 offense stat & 1 burn mastery on hit.',
				upgrade: 'The bonus is tripled on kills.',
			},
			{
				title: 'Crimson Kiss',
				desc: 'Bites a nearby foe, greatly weakening its defence capability for a single turn.',
				info: '10 pierce damage & -10 defense debuff.',
				upgrade: '-1 more defense debuff / hit.',
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Unfriendly Fire',
				desc: 'Spits a projectile three hexagons away that can further bounce along the path.',
				info: '15 burn damage + 5 bonus / leaped unit.',
				upgrade: 'Double damage for direct hit.',
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Flaming Paw',
				desc: 'Strikes up to three frontal enemy units, attacking multiple times if less targets.',
				info: '9 slash + 9 burn damage, up to 3 strikes.',
				upgrade: 'Extra strike done to split foes.',
				costs: {
					energy: 20,
				},
			},
		],
		cost: 0,  // Lavamander has no cost
	},
	{
		id: 50,
		name: 'Shadow Leech',
		playable: false,
		level: 2,
		realm: 'W',
		size: 1,
		set: 'α',
		stats: {
			health: 50,
			regrowth: 0,
			endurance: 0,
			energy: 40,
			meditation: 15,
			initiative: 25,
			offense: 5,
			defense: 5,
			movement: 6,
			pierce: 6,
			slash: 6,
			crush: 6,
			shock: 4,
			burn: 4,
			frost: 4,
			poison: 5,
			sonic: 0,
			mental: 10,
		},
		animation: {
			walk_speed: 600,
		},
		ability_info: [
			{
				title: 'Ethereal Shape',
				desc: 'Passes through any obstacles and also takes only half of the incoming damage.',
				info: 'Will not be able to stop over obstacles.',
				upgrade: 'Causes delay to enemy units.',
			},
			{
				title: 'Starving Palms',
				desc: 'Bites nearby foe by using its own hand, stealing the energy points cost from it.',
				info: '12 pierce damage & 10 energy transfer.',
				upgrade: 'Attack also transfers health.',
				damages: {
					pierce: 12,
				},
				costs: {
					energy: 10,
				},
			},
			{
				title: 'Sleeping Mummy',
				desc: 'Causes a foe within 5 hexagons to skip its next turn if not taking any damage.',
				info: 'Can not target any enemy summoners.',
				upgrade: '13 mental damage if awaken.',
				damages: {
					mental: 13,
				},
				costs: {
					energy: 15,
				},
			},
			{
				title: 'Shadow Warrior',
				desc: 'Transforms the shadow of a combatant into a self clone until one of them dies.',
				info: 'All the stats are linked with the master.',
				upgrade: 'Targets can regain shadows.',
				costs: {
					energy: 25,
				},
			},
		],
		cost: 0,  // Shadow Leech has no cost
	},
] as const as readonly UnitData[];
