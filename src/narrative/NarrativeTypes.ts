export type MissionStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type ObjectiveType =
  | 'EXPLORE_LOCATION'
  | 'COLLECT_SHARD'
  | 'DEFEAT_TARGET'
  | 'INTERACT_NPC'
  | 'CONSECRATE_ALTAR'
  | 'CHOOSE_DIALOGUE'
  | 'SURVIVE_DURATION';

export interface MissionObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isOptional?: boolean;
  targetLocation?: { x: number; y: number; radius: number };
  targetTag?: string;
}

export interface MissionReward {
  essence: number;
  unlockedAbilities?: string[];
  unlockedRealms?: string[];
  storyFlags?: Record<string, boolean | number | string>;
  loreText?: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  chapter: number;
  act: number;
  description: string;
  prerequisites: string[]; // List of Mission IDs that must be completed
  objectives: MissionObjective[];
  rewards: MissionReward;
  dialogueIntroId?: string;
  dialogueCompleteId?: string;
  onCompleteFlags?: Record<string, boolean | number | string>;
}

export interface DialogueChoice {
  id: string;
  text: string;
  targetNodeId: string;
  requiredFlag?: string;
  requiredValue?: boolean | number | string;
  onSelectAction?: (flags: Record<string, any>) => void;
  affinityImpact?: {
    tara?: number;
    vanara?: number;
    karmic?: number;
  };
}

export interface DialogueNodeData {
  id: string;
  speaker: string;
  speakerRole: string;
  portraitColor: string;
  portraitAssetId?: string;
  expression?: 'neutral' | 'focused' | 'determined' | 'surprised' | 'sorrowful' | 'wrathful';
  text: string;
  voiceCue?: 'oracle_gentle' | 'guardian_firm' | 'scout_chatter' | 'titan_rumble';
  choices?: DialogueChoice[];
  nextNodeId?: string;
  isTerminal?: boolean;
}

export interface NarrativeSaveState {
  version: '2.0.0';
  timestamp: number;
  activeMissionId: string | null;
  completedMissionIds: string[];
  objectiveProgress: Record<string, Record<string, number>>;
  storyFlags: Record<string, boolean | number | string>;
  relationships: {
    taraAffinity: number;
    vanaraTrust: number;
    karmicBalance: number;
  };
  dialogueHistory: string[];
  unlockedCutscenes: string[];
  checksum: string;
}
