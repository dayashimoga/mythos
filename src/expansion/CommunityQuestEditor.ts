export type QuestNodeType = 'START' | 'OBJECTIVE' | 'DIALOGUE_CHOICE' | 'REWARD_TERMINUS';

export interface QuestGraphNode {
  id: string;
  type: QuestNodeType;
  title: string;
  description: string;
  targetCount?: number;
  rewardKarma?: number;
  nextNodes: string[];
}

export interface ExportedQuestGraph {
  questId: string;
  questTitle: string;
  author: string;
  startNodeId: string;
  nodes: QuestGraphNode[];
  exportedAt: number;
}

export class CommunityQuestEditor {
  public questId: string;
  public questTitle: string;
  public author: string;
  public nodes = new Map<string, QuestGraphNode>();
  public startNodeId: string | null = null;

  constructor(questId = 'community_quest_01', questTitle = 'The Hermit of Dandaka', author = 'CommunityCreator') {
    this.questId = questId;
    this.questTitle = questTitle;
    this.author = author;
  }

  public addNode(node: QuestGraphNode): boolean {
    if (this.nodes.has(node.id)) return false;
    this.nodes.set(node.id, { ...node });
    if (node.type === 'START' && !this.startNodeId) {
      this.startNodeId = node.id;
    }
    return true;
  }

  public connectNodes(fromId: string, toId: string): boolean {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (!from || !to) return false;

    if (!from.nextNodes.includes(toId)) {
      from.nextNodes.push(toId);
    }
    return true;
  }

  public detectCycles(): boolean {
    // DFS cycle detection for DAG validation
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const neighborId of node.nextNodes) {
          if (!visited.has(neighborId)) {
            if (dfs(neighborId)) return true;
          } else if (recStack.has(neighborId)) {
            return true; // Cycle found!
          }
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }

    return false;
  }

  public exportGraph(): ExportedQuestGraph | null {
    if (!this.startNodeId || this.detectCycles()) {
      return null; // Invalid graph
    }

    return {
      questId: this.questId,
      questTitle: this.questTitle,
      author: this.author,
      startNodeId: this.startNodeId,
      nodes: Array.from(this.nodes.values()).map((n) => ({ ...n, nextNodes: [...n.nextNodes] })),
      exportedAt: Date.now(),
    };
  }

  public importGraph(graph: ExportedQuestGraph): boolean {
    this.questId = graph.questId;
    this.questTitle = graph.questTitle;
    this.author = graph.author;
    this.nodes.clear();
    this.startNodeId = graph.startNodeId;

    for (const n of graph.nodes) {
      this.nodes.set(n.id, { ...n });
    }

    return !this.detectCycles();
  }
}
