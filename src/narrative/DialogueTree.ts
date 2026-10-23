import { DialogueChoice, DialogueNodeData } from './NarrativeTypes';
import { IRenderer } from '../render/CanvasRenderer';

export class DialogueTree {
  private nodes: Map<string, DialogueNodeData> = new Map();
  private currentNodeId: string | null = null;
  private displayedCharacters = 0;
  private typewriterTimer = 0;
  private charSpeed = 0.022; // 22ms per char
  private isLineComplete = false;
  private isAwaitingChoice = false;

  public onNodeChange?: (node: DialogueNodeData) => void;
  public onChoiceSelected?: (choice: DialogueChoice) => void;
  public onDialogueComplete?: () => void;

  constructor(nodes: DialogueNodeData[] = []) {
    this.registerNodes(nodes);
  }

  public registerNodes(nodes: DialogueNodeData[]): void {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }

  public addNode(node: DialogueNodeData): void {
    this.nodes.set(node.id, node);
  }

  public getNode(id: string): DialogueNodeData | undefined {
    return this.nodes.get(id);
  }

  public start(initialNodeId: string): boolean {
    const node = this.nodes.get(initialNodeId);
    if (!node) {
      console.warn(`[DialogueTree] Node not found: ${initialNodeId}`);
      return false;
    }

    this.currentNodeId = initialNodeId;
    this.displayedCharacters = 0;
    this.typewriterTimer = 0;
    this.isLineComplete = false;
    this.isAwaitingChoice = false;

    if (this.onNodeChange) {
      this.onNodeChange(node);
    }
    return true;
  }

  public getCurrentNode(): DialogueNodeData | null {
    if (!this.currentNodeId) return null;
    return this.nodes.get(this.currentNodeId) || null;
  }

  public isActive(): boolean {
    return this.currentNodeId !== null;
  }

  public isWaitingForChoice(): boolean {
    return this.isAwaitingChoice;
  }

  public getAvailableChoices(storyFlags: Record<string, any> = {}): DialogueChoice[] {
    const node = this.getCurrentNode();
    if (!node || !node.choices) return [];

    return node.choices.filter((choice) => {
      if (!choice.requiredFlag) return true;
      const val = storyFlags[choice.requiredFlag];
      return val === choice.requiredValue;
    });
  }

  public update(dt: number): void {
    const node = this.getCurrentNode();
    if (!node) return;

    if (!this.isLineComplete) {
      this.typewriterTimer += dt;
      while (this.typewriterTimer >= this.charSpeed && this.displayedCharacters < node.text.length) {
        this.displayedCharacters++;
        this.typewriterTimer -= this.charSpeed;
      }

      if (this.displayedCharacters >= node.text.length) {
        this.isLineComplete = true;
        if (node.choices && node.choices.length > 0) {
          this.isAwaitingChoice = true;
        }
      }
    }
  }

  public advance(): boolean {
    const node = this.getCurrentNode();
    if (!node) return false;

    // 1. If line is still typing, finish typing instantly
    if (!this.isLineComplete) {
      this.displayedCharacters = node.text.length;
      this.isLineComplete = true;
      if (node.choices && node.choices.length > 0) {
        this.isAwaitingChoice = true;
      }
      return true;
    }

    // 2. If awaiting branching choice, advance() cannot auto-skip; user must select a choice
    if (this.isAwaitingChoice) {
      return false;
    }

    // 3. Move to next node or finish
    if (node.nextNodeId && this.nodes.has(node.nextNodeId)) {
      return this.start(node.nextNodeId);
    } else {
      this.finish();
      return false;
    }
  }

  public selectChoice(choiceIndex: number, storyFlags: Record<string, any> = {}): boolean {
    if (!this.isAwaitingChoice) return false;

    const available = this.getAvailableChoices(storyFlags);
    if (choiceIndex < 0 || choiceIndex >= available.length) return false;

    const choice = available[choiceIndex];

    if (choice.onSelectAction) {
      choice.onSelectAction(storyFlags);
    }

    if (this.onChoiceSelected) {
      this.onChoiceSelected(choice);
    }

    this.isAwaitingChoice = false;
    return this.start(choice.targetNodeId);
  }

  public finish(): void {
    this.currentNodeId = null;
    this.displayedCharacters = 0;
    this.isLineComplete = false;
    this.isAwaitingChoice = false;

    if (this.onDialogueComplete) {
      this.onDialogueComplete();
    }
  }

  public render(renderer: IRenderer): void {
    const node = this.getCurrentNode();
    if (!node) return;

    const ctx = renderer.getContext();
    const vp = renderer.getViewport();

    ctx.save();
    // Fixed screen coordinates
    const cam = renderer.getCamera();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    const boxWidth = Math.min(840, vp.width - 60);
    const boxHeight = 150;
    const boxX = (vp.width - boxWidth) / 2;
    const boxY = vp.height - boxHeight - 24;

    // Background Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Speaker Portrait Frame
    const portraitSize = 74;
    const portraitX = boxX + 18;
    const portraitY = boxY + 18;

    ctx.fillStyle = node.portraitColor;
    ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(portraitX, portraitY, portraitSize, portraitSize);

    // Initial Letter of Speaker
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.speaker.charAt(0), portraitX + portraitSize / 2, portraitY + 48);

    // Speaker Name & Role
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText(node.speaker.toUpperCase(), portraitX + portraitSize + 18, boxY + 30);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(node.speakerRole, portraitX + portraitSize + 18, boxY + 46);

    // Expression Badge
    if (node.expression) {
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'italic 10px Inter, sans-serif';
      ctx.fillText(`[ ${node.expression} ]`, portraitX + portraitSize + 18 + ctx.measureText(node.speakerRole).width + 12, boxY + 46);
    }

    // Typewritten Text Body
    const currentText = node.text.substring(0, this.displayedCharacters);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '14px Inter, sans-serif';

    // Word Wrap
    const maxWidth = boxWidth - portraitSize - 60;
    const words = currentText.split(' ');
    let line = '';
    let lineY = boxY + 74;
    const lineHeight = 20;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, portraitX + portraitSize + 18, lineY);
        line = words[n] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, portraitX + portraitSize + 18, lineY);

    // Branching Choices Display
    if (this.isAwaitingChoice && node.choices) {
      const choices = node.choices;
      const choiceStartY = boxY - (choices.length * 36) - 10;

      choices.forEach((choice, idx) => {
        const cY = choiceStartY + idx * 36;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX + 20, cY, boxWidth - 40, 30, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD166';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`[ ${idx + 1} ]  ${choice.text}`, boxX + 35, cY + 20);
      });
    } else {
      // Advance prompt
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('[ SPACE / CLICK ] Advance', boxX + boxWidth - 18, boxY + boxHeight - 12);
    }

    ctx.restore();
  }
}
