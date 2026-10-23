import { Camera } from '../render/Camera';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { DialogueTree } from '../narrative/DialogueTree';

export interface CinematicShot {
  duration: number; // Duration of shot in seconds
  cameraTarget?: Vector2D;
  cameraZoom?: number;
  letterboxHeight?: number; // Target letterbox bar height (0 for gameplay, ~64 for cinematic)
  dialogueNodeId?: string;
  titleCard?: {
    title: string;
    subtitle?: string;
  };
  onShotStart?: () => void;
  onShotEnd?: () => void;
}

export type CinematicState = 'IDLE' | 'PLAYING' | 'WAITING_FOR_DIALOGUE' | 'FINISHED';

export class CinematicDirector {
  private shots: CinematicShot[] = [];
  private currentShotIndex = 0;
  private shotTimer = 0;
  private state: CinematicState = 'IDLE';

  // Smooth letterbox transition
  private currentLetterbox = 0;
  private targetLetterbox = 0;
  private letterboxSpeed = 160; // px/sec

  // Camera tracking
  private camera?: Camera;
  private dialogueTree?: DialogueTree;

  // Title Card Overlay
  private currentTitleCard: { title: string; subtitle?: string; alpha: number } | null = null;

  public onSequenceComplete?: () => void;

  constructor(camera?: Camera, dialogueTree?: DialogueTree) {
    this.camera = camera;
    this.dialogueTree = dialogueTree;
  }

  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  public setDialogueTree(dialogueTree: DialogueTree): void {
    this.dialogueTree = dialogueTree;
  }

  public isPlaying(): boolean {
    return this.state === 'PLAYING' || this.state === 'WAITING_FOR_DIALOGUE';
  }

  public playSequence(shots: CinematicShot[]): void {
    if (shots.length === 0) return;

    this.shots = shots;
    this.currentShotIndex = 0;
    this.shotTimer = 0;
    this.state = 'PLAYING';
    this.startShot(0);
  }

  private startShot(index: number): void {
    if (index >= this.shots.length) {
      this.finishSequence();
      return;
    }

    const shot = this.shots[index];
    this.shotTimer = shot.duration;
    this.targetLetterbox = shot.letterboxHeight !== undefined ? shot.letterboxHeight : 64;

    if (shot.cameraTarget && this.camera) {
      this.camera.setTarget(shot.cameraTarget);
    }

    if (shot.titleCard) {
      this.currentTitleCard = {
        title: shot.titleCard.title,
        subtitle: shot.titleCard.subtitle,
        alpha: 1.0,
      };
    } else {
      this.currentTitleCard = null;
    }

    if (shot.onShotStart) {
      shot.onShotStart();
    }

    // If shot includes a dialogue trigger, start it
    if (shot.dialogueNodeId && this.dialogueTree) {
      this.dialogueTree.start(shot.dialogueNodeId);
      this.state = 'WAITING_FOR_DIALOGUE';
      this.dialogueTree.onDialogueComplete = () => {
        this.state = 'PLAYING';
        this.nextShot();
      };
    } else {
      this.state = 'PLAYING';
    }
  }

  public update(dt: number): void {
    // Letterbox interpolation
    if (this.currentLetterbox !== this.targetLetterbox) {
      const step = this.letterboxSpeed * dt;
      if (this.currentLetterbox < this.targetLetterbox) {
        this.currentLetterbox = Math.min(this.targetLetterbox, this.currentLetterbox + step);
      } else {
        this.currentLetterbox = Math.max(this.targetLetterbox, this.currentLetterbox - step);
      }
    }

    // Title Card fade
    if (this.currentTitleCard) {
      this.currentTitleCard.alpha = Math.max(0, this.currentTitleCard.alpha - dt * 0.4);
    }

    if (this.state !== 'PLAYING') return;

    this.shotTimer -= dt;
    if (this.shotTimer <= 0) {
      this.nextShot();
    }
  }

  public nextShot(): void {
    if (this.currentShotIndex < this.shots.length) {
      const current = this.shots[this.currentShotIndex];
      if (current.onShotEnd) current.onShotEnd();
    }

    this.currentShotIndex++;
    if (this.currentShotIndex < this.shots.length) {
      this.startShot(this.currentShotIndex);
    } else {
      this.finishSequence();
    }
  }

  public skip(): void {
    if (!this.isPlaying()) return;
    this.finishSequence();
  }

  public finishSequence(): void {
    this.state = 'FINISHED';
    this.targetLetterbox = 0;
    this.currentTitleCard = null;

    if (this.dialogueTree && this.dialogueTree.isActive()) {
      this.dialogueTree.finish();
    }

    if (this.onSequenceComplete) {
      this.onSequenceComplete();
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const vp = renderer.getViewport();

    ctx.save();
    // Neutralize camera translation for screen space overlays
    const cam = renderer.getCamera();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    // 1. Cinematic Black Letterbox Bars
    if (this.currentLetterbox > 0) {
      ctx.fillStyle = '#05070B';
      // Top bar
      ctx.fillRect(0, 0, vp.width, this.currentLetterbox);
      // Bottom bar
      ctx.fillRect(0, vp.height - this.currentLetterbox, vp.width, this.currentLetterbox);

      // Gold Accent Edge Lines
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, this.currentLetterbox);
      ctx.lineTo(vp.width, this.currentLetterbox);
      ctx.moveTo(0, vp.height - this.currentLetterbox);
      ctx.lineTo(vp.width, vp.height - this.currentLetterbox);
      ctx.stroke();
    }

    // 2. Title Card Overlay
    if (this.currentTitleCard && this.currentTitleCard.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.currentTitleCard.alpha;

      ctx.font = 'bold 32px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#FFB703';
      ctx.textAlign = 'center';
      ctx.fillText(this.currentTitleCard.title, vp.width / 2, vp.height / 2 - 20);

      if (this.currentTitleCard.subtitle) {
        ctx.font = '600 15px "Cinzel", Georgia, serif';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(this.currentTitleCard.subtitle, vp.width / 2, vp.height / 2 + 16);
      }
      ctx.restore();
    }

    // 3. Skip Prompt
    if (this.isPlaying()) {
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.textAlign = 'right';
      ctx.fillText('Press [ ESC ] to Skip Cinematic', vp.width - 24, 28);
    }

    ctx.restore();
  }
}
