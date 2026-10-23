import {
  MissionDefinition,
  MissionObjective,
  MissionReward,
  MissionStatus,
  NarrativeSaveState,
  ObjectiveType,
} from './NarrativeTypes';

export class QuestManager {
  private missions: Map<string, MissionDefinition> = new Map();
  private statuses: Map<string, MissionStatus> = new Map();
  private activeMissionId: string | null = null;
  private storyFlags: Map<string, boolean | number | string> = new Map();

  public relationships = {
    taraAffinity: 0,
    vanaraTrust: 0,
    karmicBalance: 0,
  };

  public dialogueHistory: string[] = [];
  public unlockedCutscenes: string[] = [];

  // Listeners / Event callbacks
  public onMissionActivated?: (mission: MissionDefinition) => void;
  public onObjectiveUpdated?: (missionId: string, objective: MissionObjective) => void;
  public onMissionCompleted?: (mission: MissionDefinition, reward: MissionReward) => void;
  public onMissionFailed?: (mission: MissionDefinition) => void;

  constructor(missions: MissionDefinition[] = []) {
    this.registerMissions(missions);
  }

  public registerMissions(missions: MissionDefinition[]): void {
    for (const m of missions) {
      this.missions.set(m.id, m);
      if (!this.statuses.has(m.id)) {
        this.statuses.set(m.id, m.prerequisites.length === 0 ? 'AVAILABLE' : 'LOCKED');
      }
    }
  }

  public getMission(id: string): MissionDefinition | undefined {
    return this.missions.get(id);
  }

  public getAllMissions(): MissionDefinition[] {
    return Array.from(this.missions.values());
  }

  public getMissionStatus(id: string): MissionStatus {
    return this.statuses.get(id) || 'LOCKED';
  }

  public getActiveMission(): MissionDefinition | null {
    if (!this.activeMissionId) return null;
    return this.missions.get(this.activeMissionId) || null;
  }

  public canActivateMission(id: string): boolean {
    const mission = this.missions.get(id);
    if (!mission) return false;

    const currentStatus = this.statuses.get(id);
    if (currentStatus === 'COMPLETED' || currentStatus === 'ACTIVE') return false;

    // Verify all prerequisites are COMPLETED
    for (const prereqId of mission.prerequisites) {
      if (this.statuses.get(prereqId) !== 'COMPLETED') {
        return false;
      }
    }
    return true;
  }

  public startMission(id: string): boolean {
    if (!this.canActivateMission(id)) return false;

    const mission = this.missions.get(id)!;
    this.statuses.set(id, 'ACTIVE');
    this.activeMissionId = id;

    // Reset objective progress for this mission
    for (const obj of mission.objectives) {
      obj.currentCount = 0;
      obj.isCompleted = false;
    }

    if (this.onMissionActivated) {
      this.onMissionActivated(mission);
    }
    return true;
  }

  public updateObjectiveProgress(
    missionId: string,
    objectiveId: string,
    amount = 1
  ): boolean {
    const mission = this.missions.get(missionId);
    if (!mission || this.statuses.get(missionId) !== 'ACTIVE') return false;

    const obj = mission.objectives.find((o) => o.id === objectiveId);
    if (!obj || obj.isCompleted) return false;

    obj.currentCount = Math.min(obj.targetCount, obj.currentCount + amount);

    if (obj.currentCount >= obj.targetCount) {
      obj.isCompleted = true;
    }

    if (this.onObjectiveUpdated) {
      this.onObjectiveUpdated(missionId, obj);
    }

    // Check if all non-optional objectives are satisfied
    const allRequiredDone = mission.objectives
      .filter((o) => !o.isOptional)
      .every((o) => o.isCompleted);

    if (allRequiredDone) {
      this.completeMission(missionId);
    }

    return true;
  }

  public triggerObjectiveEvent(type: ObjectiveType, targetTag?: string, amount = 1): void {
    if (!this.activeMissionId) return;

    const mission = this.missions.get(this.activeMissionId);
    if (!mission) return;

    for (const obj of mission.objectives) {
      if (!obj.isCompleted && obj.type === type) {
        if (!obj.targetTag || obj.targetTag === targetTag) {
          this.updateObjectiveProgress(mission.id, obj.id, amount);
        }
      }
    }
  }

  public completeMission(id: string): boolean {
    const mission = this.missions.get(id);
    if (!mission || this.statuses.get(id) !== 'ACTIVE') return false;

    this.statuses.set(id, 'COMPLETED');
    if (this.activeMissionId === id) {
      this.activeMissionId = null;
    }

    // Apply completion flags
    if (mission.onCompleteFlags) {
      for (const [k, v] of Object.entries(mission.onCompleteFlags)) {
        this.setFlag(k, v);
      }
    }

    // Check and unlock dependent missions
    for (const other of this.missions.values()) {
      if (this.statuses.get(other.id) === 'LOCKED' && this.canActivateMission(other.id)) {
        this.statuses.set(other.id, 'AVAILABLE');
      }
    }

    if (this.onMissionCompleted) {
      this.onMissionCompleted(mission, mission.rewards);
    }
    return true;
  }

  public failMission(id: string): boolean {
    const mission = this.missions.get(id);
    if (!mission || this.statuses.get(id) !== 'ACTIVE') return false;

    this.statuses.set(id, 'FAILED');
    if (this.activeMissionId === id) {
      this.activeMissionId = null;
    }

    if (this.onMissionFailed) {
      this.onMissionFailed(mission);
    }
    return true;
  }

  public setFlag(key: string, value: boolean | number | string): void {
    this.storyFlags.set(key, value);
  }

  public getFlag<T = boolean | number | string>(key: string, defaultValue?: T): T {
    if (this.storyFlags.has(key)) {
      return this.storyFlags.get(key) as unknown as T;
    }
    return defaultValue as T;
  }

  public modifyAffinity(delta: { tara?: number; vanara?: number; karmic?: number }): void {
    if (delta.tara) this.relationships.taraAffinity += delta.tara;
    if (delta.vanara) this.relationships.vanaraTrust += delta.vanara;
    if (delta.karmic) this.relationships.karmicBalance += delta.karmic;
  }

  public recordDialogue(nodeId: string): void {
    this.dialogueHistory.push(nodeId);
  }

  public exportSaveState(): NarrativeSaveState {
    const completedMissionIds = Array.from(this.statuses.entries())
      .filter(([_, status]) => status === 'COMPLETED')
      .map(([id]) => id);

    const objectiveProgress: Record<string, Record<string, number>> = {};
    for (const [mId, mission] of this.missions.entries()) {
      objectiveProgress[mId] = {};
      for (const obj of mission.objectives) {
        objectiveProgress[mId][obj.id] = obj.currentCount;
      }
    }

    const flags: Record<string, boolean | number | string> = {};
    for (const [k, v] of this.storyFlags.entries()) {
      flags[k] = v;
    }

    const raw: Omit<NarrativeSaveState, 'checksum'> = {
      version: '2.0.0',
      timestamp: Date.now(),
      activeMissionId: this.activeMissionId,
      completedMissionIds,
      objectiveProgress,
      storyFlags: flags,
      relationships: { ...this.relationships },
      dialogueHistory: [...this.dialogueHistory],
      unlockedCutscenes: [...this.unlockedCutscenes],
    };

    const checksum = this.calculateChecksum(raw);

    return {
      ...raw,
      checksum,
    };
  }

  public loadSaveState(state: NarrativeSaveState): boolean {
    if (!state || state.version !== '2.0.0') {
      console.warn('[QuestManager] Incompatible or invalid save state version');
      return false;
    }

    const calculated = this.calculateChecksum(state);
    if (calculated !== state.checksum) {
      console.warn('[QuestManager] Narrative save state checksum mismatch! State rejected.');
      return false;
    }

    // Restore completed missions
    for (const id of state.completedMissionIds) {
      this.statuses.set(id, 'COMPLETED');
    }

    // Restore active mission
    this.activeMissionId = state.activeMissionId;
    if (this.activeMissionId) {
      this.statuses.set(this.activeMissionId, 'ACTIVE');
    }

    // Restore objective counts
    for (const [mId, objs] of Object.entries(state.objectiveProgress)) {
      const mission = this.missions.get(mId);
      if (mission) {
        for (const [oId, count] of Object.entries(objs)) {
          const obj = mission.objectives.find((o) => o.id === oId);
          if (obj) {
            obj.currentCount = count;
            obj.isCompleted = obj.currentCount >= obj.targetCount;
          }
        }
      }
    }

    // Restore flags & relationships
    this.storyFlags.clear();
    for (const [k, v] of Object.entries(state.storyFlags)) {
      this.storyFlags.set(k, v);
    }

    this.relationships = { ...state.relationships };
    this.dialogueHistory = [...state.dialogueHistory];
    this.unlockedCutscenes = [...state.unlockedCutscenes];

    // Refresh availability
    for (const id of this.missions.keys()) {
      if (this.statuses.get(id) === 'LOCKED' && this.canActivateMission(id)) {
        this.statuses.set(id, 'AVAILABLE');
      }
    }

    return true;
  }

  private calculateChecksum(data: Omit<NarrativeSaveState, 'checksum'>): string {
    const str = `${data.version}:${data.activeMissionId}:${data.completedMissionIds.join(',')}:${data.relationships.taraAffinity}:${data.relationships.vanaraTrust}:${data.relationships.karmicBalance}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  public resetAll(): void {
    this.activeMissionId = null;
    this.storyFlags.clear();
    this.relationships = { taraAffinity: 0, vanaraTrust: 0, karmicBalance: 0 };
    this.dialogueHistory = [];
    this.unlockedCutscenes = [];

    for (const m of this.missions.values()) {
      this.statuses.set(m.id, m.prerequisites.length === 0 ? 'AVAILABLE' : 'LOCKED');
      for (const obj of m.objectives) {
        obj.currentCount = 0;
        obj.isCompleted = false;
      }
    }
  }
}
