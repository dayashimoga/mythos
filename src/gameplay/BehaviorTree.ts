export enum NodeStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RUNNING = 'RUNNING',
}

export class Blackboard {
  private data: Map<string, unknown> = new Map();

  public set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  public get<T>(key: string, defaultValue?: T): T {
    if (this.data.has(key)) {
      return this.data.get(key) as T;
    }
    return defaultValue as T;
  }

  public has(key: string): boolean {
    return this.data.has(key);
  }

  public delete(key: string): boolean {
    return this.data.delete(key);
  }

  public clear(): void {
    this.data.clear();
  }
}

export abstract class BehaviorNode {
  public readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  public abstract tick(blackboard: Blackboard, dt: number): NodeStatus;
  public reset?(): void;
}

/**
 * Executes child nodes sequentially. Fails if any child fails.
 */
export class SequenceNode extends BehaviorNode {
  private children: BehaviorNode[];
  private currentChildIndex = 0;

  constructor(id: string, children: BehaviorNode[] = []) {
    super(id);
    this.children = children;
  }

  public addChild(node: BehaviorNode): this {
    this.children.push(node);
    return this;
  }

  public tick(blackboard: Blackboard, dt: number): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const status = this.children[this.currentChildIndex].tick(blackboard, dt);
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }
      if (status === NodeStatus.FAILURE) {
        this.reset();
        return NodeStatus.FAILURE;
      }
      this.currentChildIndex++;
    }

    this.reset();
    return NodeStatus.SUCCESS;
  }

  public reset(): void {
    this.currentChildIndex = 0;
    for (const child of this.children) {
      if (child.reset) child.reset();
    }
  }
}

/**
 * Ticks children until one succeeds. Fails if all children fail.
 */
export class SelectorNode extends BehaviorNode {
  private children: BehaviorNode[];
  private currentChildIndex = 0;

  constructor(id: string, children: BehaviorNode[] = []) {
    super(id);
    this.children = children;
  }

  public addChild(node: BehaviorNode): this {
    this.children.push(node);
    return this;
  }

  public tick(blackboard: Blackboard, dt: number): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const status = this.children[this.currentChildIndex].tick(blackboard, dt);
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }
      if (status === NodeStatus.SUCCESS) {
        this.reset();
        return NodeStatus.SUCCESS;
      }
      this.currentChildIndex++;
    }

    this.reset();
    return NodeStatus.FAILURE;
  }

  public reset(): void {
    this.currentChildIndex = 0;
    for (const child of this.children) {
      if (child.reset) child.reset();
    }
  }
}

/**
 * Inverts SUCCESS to FAILURE and FAILURE to SUCCESS.
 */
export class InverterNode extends BehaviorNode {
  private child: BehaviorNode;

  constructor(id: string, child: BehaviorNode) {
    super(id);
    this.child = child;
  }

  public tick(blackboard: Blackboard, dt: number): NodeStatus {
    const status = this.child.tick(blackboard, dt);
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return NodeStatus.RUNNING;
  }

  public reset(): void {
    if (this.child.reset) this.child.reset();
  }
}

/**
 * Enforces a cooldown duration between successful executions.
 */
export class CooldownNode extends BehaviorNode {
  private child: BehaviorNode;
  private cooldownDuration: number;
  private timer = 0;

  constructor(id: string, cooldownDuration: number, child: BehaviorNode) {
    super(id);
    this.cooldownDuration = cooldownDuration;
    this.child = child;
  }

  public tick(blackboard: Blackboard, dt: number): NodeStatus {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer > 0) {
        return NodeStatus.FAILURE;
      }
    }

    const status = this.child.tick(blackboard, dt);
    if (status === NodeStatus.SUCCESS) {
      this.timer = this.cooldownDuration;
    }
    return status;
  }

  public reset(): void {
    this.timer = 0;
    if (this.child.reset) this.child.reset();
  }
}

/**
 * Checks a boolean condition predicate.
 */
export class ConditionNode extends BehaviorNode {
  private predicate: (blackboard: Blackboard) => boolean;

  constructor(id: string, predicate: (blackboard: Blackboard) => boolean) {
    super(id);
    this.predicate = predicate;
  }

  public tick(blackboard: Blackboard, _dt = 0): NodeStatus {
    return this.predicate(blackboard) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/**
 * Executes a custom action callback.
 */
export class ActionNode extends BehaviorNode {
  private action: (blackboard: Blackboard, dt: number) => NodeStatus;

  constructor(id: string, action: (blackboard: Blackboard, dt: number) => NodeStatus) {
    super(id);
    this.action = action;
  }

  public tick(blackboard: Blackboard, dt: number): NodeStatus {
    return this.action(blackboard, dt);
  }
}
