import { DialogueChoice, DialogueNodeData } from './NarrativeTypes';
import { IRenderer } from '../render/CanvasRenderer';
import { AssetManager } from '../assets/AssetManager';
import { ASSET_IDS } from '../assets/AssetManifest';

export class DialogueTree {
  private nodes: Map<string, DialogueNodeData> = new Map();
  private currentNodeId: string | null = null;
  private displayedCharacters = 0;
  private typewriterTimer = 0;
  private charSpeed = 0.022; // 22ms per char
  private isLineComplete = false;
  public isAwaitingChoice = false;

  public getIsAwaitingChoice(): boolean {
    return this.isAwaitingChoice;
  }

  public onNodeChange?: (node: DialogueNodeData) => void;
  public onChoiceSelected?: (choice: DialogueChoice) => void;
  public onDialogueComplete?: () => void;
  public onPlayVoiceCue?: (cue?: string) => void;

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

    if (this.onPlayVoiceCue && node.voiceCue) {
      this.onPlayVoiceCue(node.voiceCue);
    }

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

  public handlePointerDown(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number,
    storyFlags: Record<string, any> = {}
  ): boolean {
    const node = this.getCurrentNode();
    if (!node) return false;

    const boxWidth = Math.min(840, viewportWidth - 60);
    const boxHeight = 150;
    const boxX = (viewportWidth - boxWidth) / 2;
    const boxY = viewportHeight - boxHeight - 24;

    if (this.isAwaitingChoice && node.choices) {
      const choices = this.getAvailableChoices(storyFlags);
      const choiceStartY = boxY - (choices.length * 38) - 10;

      for (let i = 0; i < choices.length; i++) {
        const cY = choiceStartY + i * 38;
        if (
          screenX >= boxX + 20 &&
          screenX <= boxX + boxWidth - 20 &&
          screenY >= cY &&
          screenY <= cY + 32
        ) {
          return this.selectChoice(i, storyFlags);
        }
      }
      return false;
    }

    // If clicking dialogue box or anywhere on screen, advance
    if (
      screenX >= boxX &&
      screenX <= boxX + boxWidth &&
      screenY >= boxY &&
      screenY <= boxY + boxHeight
    ) {
      return this.advance();
    }

    return false;
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

    // Background Container with Vedic ornamental border
    ctx.fillStyle = 'rgba(10, 16, 28, 0.94)';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(boxX, boxY, boxWidth, boxHeight, 10);
      ctx.fill();
    } else {
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.stroke();

    // Subtle inner golden border
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, boxY + 4, boxWidth - 8, boxHeight - 8);

    // Speaker Portrait Frame (80x80)
    const portraitSize = 80;
    const portraitX = boxX + 16;
    const portraitY = boxY + 16;
    const pCenterX = portraitX + portraitSize / 2;
    const pCenterY = portraitY + portraitSize / 2;
    const pRadius = portraitSize / 2 - 2;

    // Portrait backplate
    ctx.fillStyle = node.portraitColor || '#0F172A';
    ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);

    // Determine character asset ID
    let assetId = node.portraitAssetId;
    if (!assetId) {
      const sp = node.speaker.toLowerCase();
      if (sp.includes('tara')) assetId = ASSET_IDS.CHAR_DEVI_TARA;
      else if (sp.includes('veer')) assetId = ASSET_IDS.CHAR_VEER;
      else if (sp.includes('kapi') || sp.includes('vanara')) assetId = ASSET_IDS.CHAR_VANARA_KAPI;
      else if (sp.includes('sthula') || sp.includes('rakshasa')) assetId = ASSET_IDS.CHAR_STONE_RAKSHASA;
      else if (sp.includes('mahisha')) assetId = ASSET_IDS.CHAR_MAHISHASURA;
    }

    const portraitTexture = assetId ? AssetManager.getInstance().getTexture(assetId) : null;
    const isImageReady =
      portraitTexture &&
      (portraitTexture as any).complete !== false &&
      (portraitTexture as any).naturalWidth !== 0;

    // Expression Halo Glow
    let haloColor = 'rgba(217, 119, 6, 0.4)';
    if (node.expression === 'sorrowful') haloColor = 'rgba(56, 189, 248, 0.45)';
    else if (node.expression === 'wrathful') haloColor = 'rgba(239, 68, 68, 0.5)';
    else if (node.expression === 'determined') haloColor = 'rgba(245, 158, 11, 0.5)';
    else if (node.expression === 'focused') haloColor = 'rgba(16, 185, 129, 0.45)';

    const haloGrad = ctx.createRadialGradient(pCenterX, pCenterY, pRadius * 0.7, pCenterX, pCenterY, pRadius + 8);
    haloGrad.addColorStop(0, haloColor);
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(pCenterX, pCenterY, pRadius + 8, 0, Math.PI * 2);
    ctx.fill();

    if (isImageReady && portraitTexture && typeof ctx.drawImage === 'function') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pCenterX, pCenterY, pRadius, 0, Math.PI * 2);
      if (typeof ctx.clip === 'function') {
        ctx.clip();
      }

      // Center-crop draw the portrait
      const img = portraitTexture as HTMLImageElement;
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const cropSize = Math.min(srcW, srcH);
      const cropX = (srcW - cropSize) / 2;
      const cropY = (srcH - cropSize) * 0.15; // Focus on face/upper bust

      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, portraitX, portraitY, portraitSize, portraitSize);
      ctx.restore();
    } else {
      // Fallback stylized monogram & vector plate
      ctx.fillStyle = node.portraitColor || '#1E293B';
      ctx.beginPath();
      ctx.arc(pCenterX, pCenterY, pRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "Cinzel", Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.speaker.charAt(0), pCenterX, pCenterY);
      ctx.textBaseline = 'alphabetic';
    }

    // Double Golden Rim with concentric ornamental border
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pCenterX, pCenterY, pRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pCenterX, pCenterY, pRadius - 3, 0, Math.PI * 2);
    ctx.stroke();

    // Speaker Name & Role
    const textStartX = portraitX + portraitSize + 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 15px "Cinzel", Outfit, sans-serif';
    ctx.fillText(node.speaker.toUpperCase(), textStartX, boxY + 28);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(node.speakerRole, textStartX, boxY + 44);

    // Expression Badge
    if (node.expression) {
      const roleWidth = ctx.measureText(node.speakerRole).width;
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'italic 10px Inter, sans-serif';
      ctx.fillText(`[ ${node.expression.toUpperCase()} ]`, textStartX + roleWidth + 12, boxY + 44);
    }

    // Typewritten Text Body
    const currentText = node.text.substring(0, this.displayedCharacters);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '14px Inter, sans-serif';

    // Word Wrap
    const maxWidth = boxWidth - portraitSize - 50;
    const words = currentText.split(' ');
    let line = '';
    let lineY = boxY + 70;
    const lineHeight = 21;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, textStartX, lineY);
        line = words[n] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, textStartX, lineY);

    // Branching Choices Display
    if (this.isAwaitingChoice && node.choices) {
      const choices = node.choices;
      const choiceStartY = boxY - (choices.length * 38) - 10;

      choices.forEach((choice, idx) => {
        const cY = choiceStartY + idx * 38;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX + 20, cY, boxWidth - 40, 32, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD166';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`[ ${idx + 1} ]  ${choice.text}`, boxX + 35, cY + 21);
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
