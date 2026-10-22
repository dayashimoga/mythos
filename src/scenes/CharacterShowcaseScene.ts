import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { CharacterRig } from '../animation/CharacterRig';
import { CharacterDefinitions } from '../animation/CharacterDefinitions';
import { Vector2D } from '../physics/Vector2D';

export class CharacterShowcaseScene implements IScene {
  public readonly id = 'CharacterShowcaseScene';
  private engine!: IGameEngine;

  public activeRigIndex = 0;
  public rigs: CharacterRig[] = [];
  public isPaused = false;
  public timeScale = 1.0;
  public locomotionSpeed = 0.0; // 0 = idle, 0.5 = walk, 1.0 = run

  public animEvalTimeMs = 0;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.initRigs();
  }

  public initRigs(): void {
    this.rigs = [
      CharacterDefinitions.createVeerRig(),
      CharacterDefinitions.createDeviTaraRig(),
      CharacterDefinitions.createRakshasaRig(),
      CharacterDefinitions.createVanaraScoutRig(),
    ];

    // Center in world
    for (const rig of this.rigs) {
      rig.position.set(0, 40);
    }
  }

  public getActiveRig(): CharacterRig {
    return this.rigs[this.activeRigIndex];
  }

  public onExit(): void {}

  public update(dt: number): void {
    const t0 = performance.now();
    const rig = this.getActiveRig();

    if (!this.isPaused) {
      // Set parameters
      rig.timeScale = this.timeScale;
      rig.stateMachine.setFloat('speed', this.locomotionSpeed);
      rig.update(dt);
    }

    this.animEvalTimeMs = performance.now() - t0;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    renderer.clear('#0A0E1A');

    renderer.beginWorldPass();

    // 1. Studio Grid & Measurement Platform
    this.renderStudioPlatform(ctx);

    // 2. Render Active Character Rig
    const rig = this.getActiveRig();
    rig.render(renderer);

    renderer.endWorldPass();

    // 3. Studio Inspector Overlay & Controls HUD
    this.renderInspectorUI(renderer);
  }

  private renderStudioPlatform(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Background Radial Studio Glow
    const glow = ctx.createRadialGradient(0, 0, 40, 0, 0, 420);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
    glow.addColorStop(0.6, 'rgba(18, 24, 38, 0.4)');
    glow.addColorStop(1, 'rgba(10, 14, 26, 0.95)');
    ctx.fillStyle = glow;
    ctx.fillRect(-600, -400, 1200, 800);

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -500; x <= 500; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, -350);
      ctx.lineTo(x, 350);
      ctx.stroke();
    }
    for (let y = -350; y <= 350; y += 50) {
      ctx.beginPath();
      ctx.moveTo(-500, y);
      ctx.lineTo(500, y);
      ctx.stroke();
    }

    // Pedestal Floor Line
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-180, 40);
    ctx.lineTo(180, 40);
    ctx.stroke();

    ctx.restore();
  }

  private renderInspectorUI(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const rig = this.getActiveRig();

    ctx.save();

    // Top Title Bar
    ctx.fillStyle = 'rgba(18, 24, 38, 0.85)';
    ctx.fillRect(20, 20, 520, 130);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 520, 130);

    renderer.drawText(
      'CHARACTER ANIMATION & RIG STUDIO (PHASE 2)',
      36,
      44,
      'bold 14px "Cinzel", sans-serif',
      '#FFD166'
    );

    const characterNames = [
      'Veer (Solar Guardian)',
      'Devi Tara (Astral Goddess)',
      'Stone Rakshasa (Heavy Brute)',
      'Vanara Void-Scout (Agile Stalker)',
    ];

    renderer.drawText(
      `Active Model: [ ${this.activeRigIndex + 1} ] ${characterNames[this.activeRigIndex]}`,
      36,
      68,
      '12px monospace',
      '#FFFFFF'
    );

    const stateName = rig.stateMachine.currentState?.name ?? 'None';
    renderer.drawText(
      `State: ${stateName} | Speed: ${this.locomotionSpeed.toFixed(2)} | TimeScale: ${this.timeScale.toFixed(2)}x`,
      36,
      88,
      '12px monospace',
      '#00E5FF'
    );

    renderer.drawText(
      `Bones: ${rig.skeleton.getBoneCount()} | Debug: ${rig.showDebugBones ? 'ON' : 'OFF'} | Aim IK: ${rig.isAimIKEnabled ? 'ON' : 'OFF'} | CPU: ${(this.animEvalTimeMs * 1000).toFixed(1)} µs`,
      36,
      108,
      '12px monospace',
      '#06D6A0'
    );

    renderer.drawText(
      `Status: ${this.isPaused ? 'PAUSED' : 'PLAYING'} | Transition: ${(rig.stateMachine.transitionProgress * 100).toFixed(0)}%`,
      36,
      128,
      '12px monospace',
      '#FFB703'
    );

    // Controls Help Card (Bottom)
    ctx.fillStyle = 'rgba(18, 24, 38, 0.85)';
    ctx.fillRect(20, 590, 1240, 110);
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 590, 1240, 110);

    renderer.drawText('STUDIO CONTROLS:', 36, 612, 'bold 12px "Cinzel", sans-serif', '#FFD166');
    renderer.drawText(
      '[ 1-4 ] Switch Character   |   [ W / S ] Locomotion Speed (Idle / Walk / Run)   |   [ K ] Trigger Melee Slash   |   [ Space ] Dash',
      36,
      634,
      '11px monospace',
      '#FFFFFF'
    );
    renderer.drawText(
      '[ B ] Toggle Skeletal Bones   |   [ I ] Toggle Aim IK (Mouse Cursor)   |   [ P ] Play / Pause   |   [ - / = ] Adjust Time Scale',
      36,
      654,
      '11px monospace',
      '#FFFFFF'
    );
    renderer.drawText(
      '[ ESC ] Return to Title Menu   |   [ G ] Ground Slam (Rakshasa)   |   [ M ] Blessing Mudra (Devi Tara)   |   [ H ] Hurt Flinch',
      36,
      674,
      '11px monospace',
      '#00E5FF'
    );

    ctx.restore();
  }

  public handleInput(input: InputManager): void {
    if (input.isActionJustPressed('PAUSE')) {
      this.engine.getSceneManager().switchTo('SplashScene');
      return;
    }

    const rig = this.getActiveRig();

    // Mouse Aim Target for Aim IK
    const mousePos = input.getMouseWorldPosition(this.engine.getRenderer().getCamera());
    rig.aimTarget = new Vector2D(mousePos.x, mousePos.y);

    // Character Switching
    // Handled via keyboard listeners or virtual triggers
    // Movement / Speed adjustments
    if (input.isActionHeld('MOVE_UP') || input.isActionJustPressed('MOVE_UP')) {
      this.locomotionSpeed = Math.min(1.0, this.locomotionSpeed + 0.1);
    }
    if (input.isActionHeld('MOVE_DOWN') || input.isActionJustPressed('MOVE_DOWN')) {
      this.locomotionSpeed = Math.max(0.0, this.locomotionSpeed - 0.1);
    }

    // Action Triggers
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      rig.stateMachine.setTrigger('trigger_slash');
      this.engine.getAudio().playMeleeSlash();
    }
    if (input.isActionJustPressed('DASH')) {
      rig.stateMachine.setTrigger('trigger_dash');
      this.engine.getAudio().playDash();
    }
    if (input.isActionJustPressed('ATTACK')) {
      rig.stateMachine.setTrigger('trigger_slam');
      this.engine.getAudio().playShockwave();
    }
  }

  public selectCharacter(index: number): void {
    if (index >= 0 && index < this.rigs.length) {
      this.activeRigIndex = index;
    }
  }

  public toggleBones(): boolean {
    const rig = this.getActiveRig();
    rig.showDebugBones = !rig.showDebugBones;
    return rig.showDebugBones;
  }

  public toggleAimIK(): boolean {
    const rig = this.getActiveRig();
    rig.isAimIKEnabled = !rig.isAimIKEnabled;
    return rig.isAimIKEnabled;
  }

  public toggleFootIK(): boolean {
    const rig = this.getActiveRig();
    rig.isFootIKEnabled = !rig.isFootIKEnabled;
    return rig.isFootIKEnabled;
  }
}
