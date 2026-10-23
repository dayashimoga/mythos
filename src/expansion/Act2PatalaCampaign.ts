import { MissionDefinition, DialogueNodeData } from '../narrative/NarrativeTypes';

export const ACT2_PATALA_MISSIONS: MissionDefinition[] = [
  {
    id: 'M2_1_DESCENT_TO_PATALA',
    act: 2,
    chapter: 2,
    title: 'Descent into the Basalt Trench',
    description: 'Brave the crumbling basalt chasms leading deep into the subterranean depths of Patala.',
    prerequisites: ['M1_5_CALDERA_CONFRONTATION'],
    objectives: [
      {
        id: 'OBJ_2_1_1',
        description: 'Navigate the basalt chasm using the Vedic Harpoon grapple',
        type: 'EXPLORE_LOCATION',
        targetLocation: { x: 300, y: 150, radius: 100 },
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 200,
      unlockedRealms: ['PATALA_ABYSS'],
      loreText: 'The basalt walls echo with the ancient hissing of the serpent kings.',
    },
  },
  {
    id: 'M2_2_SERPENTS_CROSSING',
    act: 2,
    chapter: 2,
    title: 'Venom River Crossing',
    description: 'Cross the boiling acidic venom channels without succumbing to the toxic mist.',
    prerequisites: ['M2_1_DESCENT_TO_PATALA'],
    objectives: [
      {
        id: 'OBJ_2_2_1',
        description: 'Defeat 4 Naga Venom-Spitters guarding the causeway',
        type: 'DEFEAT_TARGET',
        targetTag: 'enemy_naga_spitter',
        targetCount: 4,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 250,
      loreText: 'Venom from the rivers of Patala was once used to forge celestial arrows.',
    },
  },
  {
    id: 'M2_3_VASUKIS_COUNCIL',
    act: 2,
    chapter: 2,
    title: 'Audience with King Vasuki',
    description: 'Seek parley with the elder serpent king Vasuki in the Obsidian Hall.',
    prerequisites: ['M2_2_SERPENTS_CROSSING'],
    objectives: [
      {
        id: 'OBJ_2_3_1',
        description: 'Converse with King Vasuki and uncover Shesha’s madness',
        type: 'INTERACT_NPC',
        targetTag: 'npc_vasuki',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 150,
      storyFlags: { FLAG_VASUKI_ALLIANCE: true },
    },
  },
  {
    id: 'M2_4_SHADOW_ILLUSION',
    act: 2,
    chapter: 2,
    title: 'Trial of the Shadow Sorcerers',
    description: 'Dispel the subterranean illusions woven by the Naga shadow weavers.',
    prerequisites: ['M2_3_VASUKIS_COUNCIL'],
    objectives: [
      {
        id: 'OBJ_2_4_1',
        description: 'Vanquish 2 Shadow Illusionists and dissolve their mirages',
        type: 'DEFEAT_TARGET',
        targetTag: 'enemy_naga_illusionist',
        targetCount: 2,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 300,
    },
  },
  {
    id: 'M2_5_SHESHAS_ECHO',
    act: 2,
    chapter: 2,
    title: 'The Tormented Coil',
    description: 'Confront Shesha’s Tormented Echo at the subterranean abyssal core and restore balance to Patala.',
    prerequisites: ['M2_4_SHADOW_ILLUSION'],
    objectives: [
      {
        id: 'OBJ_2_5_1',
        description: 'Subdue Shesha’s Tormented Echo',
        type: 'DEFEAT_TARGET',
        targetTag: 'boss_sheshas_echo',
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      },
    ],
    rewards: {
      essence: 800,
      storyFlags: { FLAG_ACT2_COMPLETE: true },
      loreText: 'Shesha rests in tranquility, his cosmic weight once more steadying the realms.',
    },
  },
];

export const ACT2_DIALOGUES: DialogueNodeData[] = [
  {
    id: 'NODE_VASUKI_GREETING',
    speaker: 'King Vasuki',
    speakerRole: 'Serpent Sovereign',
    portraitColor: '#00ff88',
    expression: 'neutral',
    text: 'A mortal wielding the Astra in the depths of Patala? Tell me, Veer—do you come to quench our venom or stoke our rage?',
    choices: [
      {
        id: 'CHOICE_VASUKI_PEACE',
        text: 'I seek only to calm Shesha’s agony and cleanse the corruption.',
        targetNodeId: 'NODE_VASUKI_PEACE',
        affinityImpact: { karmic: 10 },
      },
      {
        id: 'CHOICE_VASUKI_DEFIANCE',
        text: 'Nothing will stand between me and the restoration of the cosmic balance.',
        targetNodeId: 'NODE_VASUKI_WRATH',
        affinityImpact: { karmic: -5 },
      },
    ],
  },
  {
    id: 'NODE_VASUKI_PEACE',
    speaker: 'King Vasuki',
    speakerRole: 'Serpent Sovereign',
    portraitColor: '#00ff88',
    expression: 'determined',
    text: 'Noble words. The primordial serpent’s tears have turned to bile. Take this harpoon cable—reach his throne before the venom consumes all.',
    isTerminal: true,
  },
  {
    id: 'NODE_VASUKI_WRATH',
    speaker: 'King Vasuki',
    speakerRole: 'Serpent Sovereign',
    portraitColor: '#ffaa00',
    expression: 'wrathful',
    text: 'Spoken like a true child of Agni. May your fire not burn away your reason when Shesha rears his thousand fangs.',
    isTerminal: true,
  },
];
