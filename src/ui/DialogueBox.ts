import { IRenderer } from '../render/CanvasRenderer';

export interface DialogueNode {
  speaker: string;
  speakerRole: string;
  portraitColor: string;
  text: string;
}

export class DialogueBox {
  private dialogues: DialogueNode[] = [];
  private currentIndex = 0;
  private displayedCharacters = 0;
  private typewriterTimer = 0;
  private charSpeed = 0.02; // seconds per char
  private isFinishedCurrentNode = false;
  private onCompleteCallback: (() => void) | null = null;

  public start(dialogues: DialogueNode[], onComplete?: () => void): void {
    this.dialogues = dialogues;
    this.currentIndex = 0;
    this.displayedCharacters = 0;
    this.typewriterTimer = 0;
    this.isFinishedCurrentNode = false;
    this.onCompleteCallback = onComplete || null;
  }

  public update(dt: number): void {
    if (this.currentIndex >= this.dialogues.length) return;

    const node = this.dialogues[this.currentIndex];
    if (this.displayedCharacters < node.text.length) {
      this.typewriterTimer += dt;
      while (this.typewriterTimer >= this.charSpeed && this.displayedCharacters < node.text.length) {
        this.displayedCharacters++;
        this.typewriterTimer -= this.charSpeed;
      }
      if (this.displayedCharacters >= node.text.length) {
        this.isFinishedCurrentNode = true;
      }
    } else {
      this.isFinishedCurrentNode = true;
    }
  }

  public advance(): boolean {
    if (this.currentIndex >= this.dialogues.length) return false;

    const node = this.dialogues[this.currentIndex];
    if (!this.isFinishedCurrentNode) {
      // Instantly finish line
      this.displayedCharacters = node.text.length;
      this.isFinishedCurrentNode = true;
      return true;
    }

    this.currentIndex++;
    this.displayedCharacters = 0;
    this.isFinishedCurrentNode = false;

    if (this.currentIndex >= this.dialogues.length) {
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return false; // ended
    }
    return true;
  }

  public isActive(): boolean {
    return this.currentIndex < this.dialogues.length;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive()) return;

    const ctx = renderer.getContext();
    const vp = renderer.getViewport();
    const node = this.dialogues[this.currentIndex];

    ctx.save();

    const boxWidth = Math.min(840, vp.width - 48);
    const boxHeight = 150;
    const boxX = (vp.width - boxWidth) / 2;
    const boxY = vp.height - boxHeight - 32;

    // Outer glow glass box
    ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Speaker Portrait Frame
    const portraitSize = 70;
    const portraitX = boxX + 24;
    const portraitY = boxY + (boxHeight - portraitSize) / 2;

    ctx.fillStyle = '#121824';
    ctx.strokeStyle = node.portraitColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(portraitX, portraitY, portraitSize, portraitSize, 8);
    ctx.fill();
    ctx.stroke();

    // Speaker Sigil / Icon
    ctx.fillStyle = node.portraitColor;
    ctx.beginPath();
    ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // Speaker Name & Role Banner
    renderer.drawText(
      node.speaker.toUpperCase(),
      portraitX + portraitSize + 20,
      boxY + 32,
      'bold 16px "Cinzel", Georgia, serif',
      '#FFD166'
    );
    renderer.drawText(
      `[ ${node.speakerRole} ]`,
      portraitX + portraitSize + 20,
      boxY + 48,
      'italic 11px sans-serif',
      '#A0AAB8'
    );

    // Dialogue Body Text
    const visibleText = node.text.substring(0, this.displayedCharacters);
    this.renderWrappedText(
      ctx,
      visibleText,
      portraitX + portraitSize + 20,
      boxY + 76,
      boxWidth - portraitSize - 60,
      20
    );

    // Continue Prompt
    if (this.isFinishedCurrentNode) {
      renderer.drawText(
        'Press Space / Click to continue ▼',
        boxX + boxWidth - 24,
        boxY + boxHeight - 16,
        '11px sans-serif',
        '#FFB703',
        'right'
      );
    }

    ctx.restore();
  }

  private renderWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#F8F9FA';
    ctx.textAlign = 'left';

    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        ctx.fillText(currentLine, x, currentY);
        currentLine = word + ' ';
        currentY += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, x, currentY);
  }
}
