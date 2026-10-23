import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { CharacterRig } from '../animation/CharacterRig';
import { CharacterDefinitions } from '../animation/CharacterDefinitions';
import { Vector2D } from '../physics/Vector2D';
import { SacredGeometry } from '../render/SacredGeometry';

export interface StudioCharacterMetadata {
  id: string;
  name: string;
  title: string;
  archetype: string;
  signatureMove: string;
}

export class CharacterShowcaseScene implements IScene {
  public readonly id = 'CharacterShowcaseScene';
  private engine!: IGameEngine;

  public activeRigIndex = 0;
  public rigs: CharacterRig[] = [];
  public isPaused = false;
  public timeScale = 1.0;
  public locomotionSpeed = 0.0; // 0 = idle, 0.5 = walk, 1.0 = run

  // Interactive Camera Viewport Controls
  public panX = 0;
  public panY = 0;
  public zoom = 1.0;
  private isDragging = false;
  private lastDragMouseX = 0;
  private lastDragMouseY = 0;

  // Studio Lighting & Backdrop Presets
  public lightingPresetIndex = 0;
  public readonly lightingPresets = [
    { name: 'Studio Neutral', bg: '#0A0E1A', ring: 'rgba(0, 229, 255, 0.3)', floor: '#FFB703' },
    { name: 'Sanctum Dawn', bg: '#180E08', ring: 'rgba(255, 183, 3, 0.4)', floor: '#FFD166' },
    { name: 'Bhumi Forge', bg: '#1A0A0E', ring: 'rgba(239, 71, 111, 0.35)', floor: '#FB8500' },
    { name: 'Void Eclipse', bg: '#0B0716', ring: 'rgba(147, 51, 234, 0.4)', floor: '#C026D3' },
  ];

  // Overlay Toggles
  public showSockets = false;
  public showHitbox = false;
  public isDiagnosticsOpen = false;
  public isControlsHidden = false;

  // Diagnostics Performance
  public animEvalTimeMs = 0;

  public readonly charactersMeta: StudioCharacterMetadata[] = [
    {
      id: 'veer',
      name: 'Veer',
      title: 'Solar Guardian',
      archetype: 'Melee Fighter',
      signatureMove: 'Surya Slash & Prana Dash',
    },
    {
      id: 'devi_tara',
      name: 'Devi Tara',
      title: 'Celestial Sage',
      archetype: 'Astral Mage',
      signatureMove: 'Abhaya Mudra & Astral Float',
    },
    {
      id: 'stone_rakshasa',
      name: 'Stone Rakshasa',
      title: 'Basalt Juggernaut',
      archetype: 'Heavy Brute',
      signatureMove: 'Earth-Shaking Ground Slam',
    },
    {
      id: 'vanara_scout',
      name: 'Vanara Scout',
      title: 'Agile Stalker',
      archetype: 'Skirmisher',
      signatureMove: 'Orbit Skitter & Tail Leap',
    },
    {
      id: 'mahishasura',
      name: 'Mahishasura',
      title: 'Titan Asura Emperor',
      archetype: 'Titan Boss',
      signatureMove: 'Buffalo Charge & Overhead Mace Slam',
    },
  ];

  constructor() {
    this.initRigs();
  }

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    if (this.rigs.length === 0) {
      this.initRigs();
    }
    this.resetCamera();
  }

  public initRigs(): void {
    this.rigs = [
      CharacterDefinitions.createVeerRig(),
      CharacterDefinitions.createDeviTaraRig(),
      CharacterDefinitions.createRakshasaRig(),
      CharacterDefinitions.createVanaraScoutRig(),
      CharacterDefinitions.createMahishasuraRig(),
    ];

    // Center all characters on the measurement platform
    for (const rig of this.rigs) {
      rig.position.set(0, 40);
    }
  }

  public getActiveRig(): CharacterRig {
    if (this.rigs.length === 0) {
      this.initRigs();
    }
    return this.rigs[this.activeRigIndex] ?? this.rigs[0];
  }

  public onExit(): void {
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
  }

  public resetCamera(): void {
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
  }

  public update(dt: number): void {
    const t0 = performance.now();
    const rig = this.getActiveRig();

    if (!this.isPaused) {
      rig.timeScale = this.timeScale;
      rig.stateMachine.setFloat('speed', this.locomotionSpeed);
      rig.update(dt);
    }

    // Apply interactive studio camera viewport
    const camera = this.engine.getRenderer().getCamera();
    camera.setPosition(this.panX, this.panY);
    camera.setZoom(this.zoom);

    this.animEvalTimeMs = performance.now() - t0;
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const preset = this.lightingPresets[this.lightingPresetIndex];
    renderer.clear(preset.bg);

    renderer.beginWorldPass();

    // 1. Studio Lighting Preset Backdrop & Ground Pedestal
    this.renderStudioPlatform(ctx, preset);

    // 2. Render Active Character Rig
    const rig = this.getActiveRig();
    rig.render(renderer);

    // 3. Render Socket Gizmos if toggled
    if (this.showSockets) {
      this.renderSocketGizmos(ctx, rig);
    }

    // 4. Render Bounding Box / Hitbox
    if (this.showHitbox || rig.showDebugBones || this.engine.getDiagnostics().getShowColliders()) {
      const boxW = 84 * rig.scale;
      const boxH = 150 * rig.scale;
      const bounds = {
        x: rig.position.x - boxW / 2,
        y: rig.position.y - boxH,
        width: boxW,
        height: boxH,
      };
      renderer.drawAABB(bounds as any, '#00E5FF');
    }

    renderer.endWorldPass();

    // 5. Studio Interactive HUD & Inspector Controls
    this.renderStudioHUD(renderer);
  }

  private renderStudioPlatform(ctx: CanvasRenderingContext2D, preset: { bg: string; ring: string; floor: string }): void {
    ctx.save();

    // Radial Atmosphere Glow
    const glow = ctx.createRadialGradient(0, -20, 30, 0, -20, 480);
    glow.addColorStop(0, preset.ring);
    glow.addColorStop(0.55, 'rgba(18, 24, 38, 0.45)');
    glow.addColorStop(1, 'rgba(10, 14, 26, 0.96)');
    ctx.fillStyle = glow;
    ctx.fillRect(-700, -450, 1400, 900);

    // Measurement Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -600; x <= 600; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, -400);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = -400; y <= 400; y += 50) {
      ctx.beginPath();
      ctx.moveTo(-600, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }

    // Circular Sacred Mandala Studio Pedestal Floor
    SacredGeometry.drawMandala(ctx, 0, 40, 130, 12, performance.now() * 0.0003, preset.ring, 1.5);

    // Pedestal Horizon Stage Line
    ctx.strokeStyle = preset.floor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-220, 40);
    ctx.lineTo(220, 40);
    ctx.stroke();

    // Floor Measurement Ticks
    ctx.fillStyle = preset.floor;
    for (let tx = -200; tx <= 200; tx += 40) {
      ctx.fillRect(tx - 1, 38, 2, 8);
    }

    ctx.restore();
  }

  private renderSocketGizmos(ctx: CanvasRenderingContext2D, rig: CharacterRig): void {
    const sockets = ['socket_right_hand', 'socket_left_hand', 'socket_forehead', 'socket_chest', 'socket_bindi', 'socket_crown'];
    for (const sName of sockets) {
      const transform = rig.skeleton.getSocketTransform(sName);
      if (transform) {
        ctx.save();
        ctx.translate(transform.position.x, transform.position.y);
        ctx.rotate(transform.rotation);

        // Coordinate Axis Gizmo
        ctx.strokeStyle = '#EF476F'; // X Axis Red
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(16, 0);
        ctx.stroke();

        ctx.strokeStyle = '#06D6A0'; // Y Axis Green
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        ctx.stroke();

        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        ctx.fillText(sName.replace('socket_', ''), 6, -6);
        ctx.restore();
      }
    }
  }

  private renderStudioHUD(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    const rig = this.getActiveRig();
    const meta = this.charactersMeta[this.activeRigIndex];

    ctx.save();

    // -----------------------------------------------------------------------
    // TOP HEADER: Character Selection Bar
    // -----------------------------------------------------------------------
    if (this.isControlsHidden) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#FFB703';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(24, 20, 260, 36, 6);
      ctx.fill();
      ctx.stroke();

      renderer.drawText('[ H ] SHOW STUDIO UI  •  [ ESC ] TITLE', 36, 42, 'bold 10px monospace', '#FFD166');
      return;
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fillRect(20, 16, 1240, 72);
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(20, 16, 1240, 72);

    renderer.drawText(
      'HERO & ASURA COMPENDIUM',
      36,
      38,
      'bold 13px "Cinzel", sans-serif',
      '#FFD166'
    );
    renderer.drawText(
      'Vedic Character Rigs & Lore',
      36,
      56,
      '11px monospace',
      '#94A3B8'
    );

    // 5 Character Tabs (Optimized to fit cleanly across widescreen display without title or quick-bar collision)
    const tabStartX = 270;
    const tabW = 96;
    const tabGap = 5;
    for (let i = 0; i < this.charactersMeta.length; i++) {
      const c = this.charactersMeta[i];
      const isSelected = i === this.activeRigIndex;
      const tx = tabStartX + i * (tabW + tabGap);
      const ty = 24;

      ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(30, 41, 59, 0.7)';
      ctx.fillRect(tx, ty, tabW, 54);
      ctx.strokeStyle = isSelected ? '#00E5FF' : 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(tx, ty, tabW, 54);

      renderer.drawText(`[ ${i + 1} ] ${c.name}`, tx + 6, ty + 22, 'bold 10px sans-serif', isSelected ? '#00E5FF' : '#E2E8F0');
      renderer.drawText(c.title, tx + 6, ty + 40, '8px monospace', isSelected ? '#FFD166' : '#94A3B8');
    }

    // Hide UI Button
    const hideBtnX = 780;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(hideBtnX, 24, 60, 54);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.strokeRect(hideBtnX, 24, 60, 54);
    renderer.drawText('HIDE UI', hideBtnX + 9, 45, 'bold 10px sans-serif', '#CBD5E1');
    renderer.drawText('[ H ]', hideBtnX + 16, 63, '10px monospace', '#94A3B8');

    // Diagnostics Drawer Toggle Button
    const diagBtnX = 848;
    ctx.fillStyle = this.isDiagnosticsOpen ? 'rgba(239, 71, 111, 0.35)' : 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(diagBtnX, 24, 72, 54);
    ctx.strokeStyle = this.isDiagnosticsOpen ? '#EF476F' : '#64748B';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(diagBtnX, 24, 72, 54);
    renderer.drawText('DIAGNOSTICS', diagBtnX + 4, 45, 'bold 9px sans-serif', this.isDiagnosticsOpen ? '#EF476F' : '#CBD5E1');
    renderer.drawText('[ D / Tab ]', diagBtnX + 8, 63, '10px monospace', '#94A3B8');

    // Return to Title Button
    const exitBtnX = 928;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
    ctx.fillRect(exitBtnX, 24, 60, 54);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(exitBtnX, 24, 60, 54);
    renderer.drawText('🚪 TITLE', exitBtnX + 8, 45, 'bold 10px sans-serif', '#FCA5A5');
    renderer.drawText('[ ESC ]', exitBtnX + 10, 63, '10px monospace', '#94A3B8');

    // -----------------------------------------------------------------------
    // BOTTOM TRANSPORT BAR & TIMELINE SCRUBBER
    // -----------------------------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(20, 580, 1240, 122);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(20, 580, 1240, 122);

    // Status Pill
    const stateName = rig.stateMachine.currentState?.name ?? 'Locomotion';
    const stateTime = rig.stateMachine.stateTime;
    const clipDur = rig.stateMachine.currentState?.clip?.duration ?? 1.0;
    const progress = Math.min(1.0, (stateTime % clipDur) / clipDur);

    renderer.drawText(
      `ACTIVE: ${meta.name.toUpperCase()} (${meta.archetype})  |  STATE: ${stateName}  |  STATUS: ${this.isPaused ? 'PAUSED' : 'PLAYING'}`,
      36,
      602,
      'bold 11px monospace',
      '#00E5FF'
    );

    renderer.drawText(
      `SPEED: ${this.locomotionSpeed.toFixed(2)}  |  TIMESCALE: ${this.timeScale.toFixed(2)}x  |  LIGHTING: ${this.lightingPresets[this.lightingPresetIndex].name}  |  ZOOM: ${(this.zoom * 100).toFixed(0)}%`,
      36,
      620,
      '11px monospace',
      '#FFD166'
    );

    // Timeline Scrub Bar
    const scrubX = 36;
    const scrubY = 630;
    const scrubW = 1208;
    const scrubH = 14;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.fillRect(scrubX, scrubY, scrubW, scrubH);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(scrubX, scrubY, scrubW, scrubH);

    // Filled scrub progress
    ctx.fillStyle = '#06D6A0';
    ctx.fillRect(scrubX, scrubY, scrubW * progress, scrubH);

    // Playhead Handle
    const playheadX = scrubX + scrubW * progress;
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(playheadX, scrubY + scrubH / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    renderer.drawText(
      `${(stateTime % clipDur).toFixed(2)}s / ${clipDur.toFixed(2)}s`,
      playheadX - 18,
      scrubY - 4,
      '10px monospace',
      '#FFFFFF'
    );

    // Controls Legend Footer
    renderer.drawText(
      '[ 1-5 ] Switch Character   |   [ W/S ] Locomotion Speed   |   [ P ] Play/Pause   |   [ -/= ] Time Scale   |   [ L ] Lighting Preset',
      36,
      666,
      '11px monospace',
      '#FFFFFF'
    );
    renderer.drawText(
      '[ B ] Skeletal Bones   |   [ I ] Aim IK   |   [ F ] Foot IK   |   [ T ] Sockets   |   [ C ] Hitbox   |   [ [ / ] ] Zoom   |   [ 0 / R ] Reset Cam',
      36,
      684,
      '11px monospace',
      '#CBD5E1'
    );
    renderer.drawText(
      '[ K/Space/G/M/H ] Attack / Dash / Slam / Mudra / Hurt   |   [ D / Tab ] Diagnostics   |   [ ESC ] Return to Title Menu',
      36,
      698,
      '11px monospace',
      '#00E5FF'
    );

    // -----------------------------------------------------------------------
    // COLLAPSIBLE DIAGNOSTICS DRAWER (RIGHT PANEL)
    // -----------------------------------------------------------------------
    if (this.isDiagnosticsOpen) {
      const dw = 320;
      const dx = 1280 - dw - 20;
      const dy = 96;
      const dh = 476;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = '#EF476F';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, dw, dh);

      renderer.drawText('ENGINE DIAGNOSTICS', dx + 16, dy + 26, 'bold 12px "Cinzel", sans-serif', '#FFD166');
      renderer.drawText(`Model ID: ${rig.id}`, dx + 16, dy + 50, '11px monospace', '#FFFFFF');
      renderer.drawText(`Bones Count: ${rig.skeleton.getBoneCount()}`, dx + 16, dy + 68, '11px monospace', '#00E5FF');
      renderer.drawText(`Anim Eval: ${(this.animEvalTimeMs * 1000).toFixed(1)} µs`, dx + 16, dy + 86, '11px monospace', '#06D6A0');
      renderer.drawText(`Bones Overlay: ${rig.showDebugBones ? 'ENABLED' : 'DISABLED'}`, dx + 16, dy + 104, '11px monospace', '#CBD5E1');
      renderer.drawText(`Aim IK: ${rig.isAimIKEnabled ? 'ACTIVE' : 'OFF'}`, dx + 16, dy + 122, '11px monospace', '#CBD5E1');
      renderer.drawText(`Foot IK: ${rig.isFootIKEnabled ? 'ACTIVE' : 'OFF'}`, dx + 16, dy + 140, '11px monospace', '#CBD5E1');
      renderer.drawText(`Sockets Overlay: ${this.showSockets ? 'VISIBLE' : 'HIDDEN'}`, dx + 16, dy + 158, '11px monospace', '#CBD5E1');
      renderer.drawText(`Camera Pan: (${this.panX.toFixed(0)}, ${this.panY.toFixed(0)})`, dx + 16, dy + 176, '11px monospace', '#CBD5E1');
      renderer.drawText(`Camera Zoom: ${this.zoom.toFixed(2)}x`, dx + 16, dy + 194, '11px monospace', '#CBD5E1');

      // Sockets Listing
      renderer.drawText('REGISTERED SOCKETS:', dx + 16, dy + 224, 'bold 11px sans-serif', '#FFD166');
      const registeredSockets = ['socket_right_hand', 'socket_left_hand', 'socket_forehead', 'socket_crown', 'socket_bindi', 'socket_chest'];
      let sy = dy + 244;
      for (const sName of registeredSockets) {
        const trans = rig.skeleton.getSocketTransform(sName);
        if (trans) {
          renderer.drawText(`• ${sName}: (${trans.position.x.toFixed(0)}, ${trans.position.y.toFixed(0)})`, dx + 16, sy, '10px monospace', '#94A3B8');
          sy += 18;
        }
      }

      // State Transitions
      renderer.drawText('STATE MACHINE:', dx + 16, sy + 14, 'bold 11px sans-serif', '#FFD166');
      renderer.drawText(`State: ${stateName}`, dx + 16, sy + 32, '11px monospace', '#00E5FF');
      renderer.drawText(`Transition: ${(rig.stateMachine.transitionProgress * 100).toFixed(0)}%`, dx + 16, sy + 50, '11px monospace', '#CBD5E1');
    }

    ctx.restore();
  }

  public handleInput(input: InputManager): void {
    // ESC or virtual PAUSE action returns to Title Menu (while KeyP is reserved for studio Play/Pause)
    if (input.isKeyJustPressed('Escape') || (input.isActionJustPressed('PAUSE') && !input.isKeyJustPressed('KeyP'))) {
      this.engine.getSceneManager().switchTo('SplashScene');
      return;
    }

    const rig = this.getActiveRig();

    // Mouse Aim Target for Aim IK
    const mousePos = input.getMouseWorldPosition(this.engine.getRenderer().getCamera());
    rig.aimTarget = new Vector2D(mousePos.x, mousePos.y);

    // Mouse Drag Panning
    const screenMouse = input.getMousePosition();

    // Clickable UI: Character Tabs, Hide UI, Diagnostics Button, Exit Button, and Timeline Scrubbing
    if (input.isMouseButtonJustPressed(0)) {
      // Character Header Tabs & Controls hit-test (y between 24 and 78)
      if (screenMouse.y >= 24 && screenMouse.y <= 78) {
        const tabStartX = 270;
        const tabW = 96;
        const tabGap = 5;
        for (let i = 0; i < this.charactersMeta.length; i++) {
          const tx = tabStartX + i * (tabW + tabGap);
          if (screenMouse.x >= tx && screenMouse.x <= tx + tabW) {
            this.selectCharacter(i);
            break;
          }
        }
        if (screenMouse.x >= 780 && screenMouse.x <= 840) {
          this.isControlsHidden = !this.isControlsHidden;
        } else if (screenMouse.x >= 848 && screenMouse.x <= 920) {
          this.isDiagnosticsOpen = !this.isDiagnosticsOpen;
        } else if ((screenMouse.x >= 928 && screenMouse.x <= 988) || (screenMouse.x >= 1160 && screenMouse.x <= 1250)) {
          this.engine.getSceneManager().switchTo('SplashScene');
          return;
        }
      }

      // If controls hidden and click on minimal badge at (24, 20, 260, 36)
      if (this.isControlsHidden && screenMouse.x >= 24 && screenMouse.x <= 284 && screenMouse.y >= 20 && screenMouse.y <= 56) {
        this.isControlsHidden = false;
      }

      // Timeline Scrubber Seek hit-test (y between 625 and 650)
      if (screenMouse.y >= 625 && screenMouse.y <= 650 && screenMouse.x >= 36 && screenMouse.x <= 1244) {
        const scrubProgress = Math.max(0, Math.min(1.0, (screenMouse.x - 36) / 1208));
        const clipDur = rig.stateMachine.currentState?.clip?.duration ?? 1.0;
        rig.stateMachine.stateTime = scrubProgress * clipDur;
      }
    }

    if (input.isMouseButtonHeld(0)) {
      if (this.isDragging) {
        const dx = screenMouse.x - this.lastDragMouseX;
        const dy = screenMouse.y - this.lastDragMouseY;
        // Pan if dragging in main canvas area (avoid top and bottom bars)
        if (screenMouse.y > 90 && screenMouse.y < 580) {
          this.panX -= dx / this.zoom;
          this.panY -= dy / this.zoom;
        }
      }
      this.isDragging = true;
      this.lastDragMouseX = screenMouse.x;
      this.lastDragMouseY = screenMouse.y;
    } else {
      this.isDragging = false;
    }

    // Arrow Key Panning
    if (input.isKeyHeld('ArrowLeft')) this.panX -= 6 / this.zoom;
    if (input.isKeyHeld('ArrowRight')) this.panX += 6 / this.zoom;
    if (input.isKeyHeld('ArrowUp')) this.panY -= 6 / this.zoom;
    if (input.isKeyHeld('ArrowDown')) this.panY += 6 / this.zoom;

    // Zoom Controls [ / ]
    if (input.isKeyJustPressed('BracketLeft')) {
      this.zoom = Math.max(0.4, Number((this.zoom - 0.15).toFixed(2)));
    }
    if (input.isKeyJustPressed('BracketRight')) {
      this.zoom = Math.min(3.0, Number((this.zoom + 0.15).toFixed(2)));
    }

    // Reset Camera [ 0 / R ]
    if (input.isKeyJustPressed('Digit0') || input.isKeyJustPressed('KeyR')) {
      this.resetCamera();
    }

    // Character Switching [ 1 - 5 ]
    if (input.isKeyJustPressed('Digit1') || input.isKeyJustPressed('Numpad1')) {
      this.selectCharacter(0);
    } else if (input.isKeyJustPressed('Digit2') || input.isKeyJustPressed('Numpad2')) {
      this.selectCharacter(1);
    } else if (input.isKeyJustPressed('Digit3') || input.isKeyJustPressed('Numpad3')) {
      this.selectCharacter(2);
    } else if (input.isKeyJustPressed('Digit4') || input.isKeyJustPressed('Numpad4')) {
      this.selectCharacter(3);
    } else if (input.isKeyJustPressed('Digit5') || input.isKeyJustPressed('Numpad5')) {
      this.selectCharacter(4);
    }

    // Lighting Preset Cycle [ L ]
    if (input.isKeyJustPressed('KeyL')) {
      this.cycleLighting();
    }

    // Toggle Skeletal Bones [ B ]
    if (input.isKeyJustPressed('KeyB')) {
      this.toggleBones();
    }

    // Toggle Aim IK [ I ]
    if (input.isKeyJustPressed('KeyI')) {
      this.toggleAimIK();
    }

    // Toggle Foot IK [ F ]
    if (input.isKeyJustPressed('KeyF')) {
      this.toggleFootIK();
    }

    // Toggle Sockets Overlay [ T ]
    if (input.isKeyJustPressed('KeyT')) {
      this.toggleSockets();
    }

    // Toggle Hitbox Bounds [ C ]
    if (input.isKeyJustPressed('KeyC')) {
      this.showHitbox = !this.showHitbox;
    }

    // Toggle Diagnostics Drawer [ D / Tab ]
    if (input.isKeyJustPressed('KeyD') || input.isKeyJustPressed('Tab')) {
      this.isDiagnosticsOpen = !this.isDiagnosticsOpen;
    }

    // Toggle Hide UI [ H ]
    if (input.isKeyJustPressed('KeyH')) {
      this.isControlsHidden = !this.isControlsHidden;
    }

    // Play / Pause [ P ]
    if (input.isKeyJustPressed('KeyP')) {
      this.isPaused = !this.isPaused;
    }

    // Timeline Scrubbing [ , / . ]
    if (input.isKeyJustPressed('Comma')) {
      rig.stateMachine.stateTime = Math.max(0, rig.stateMachine.stateTime - 0.1);
    }
    if (input.isKeyJustPressed('Period')) {
      rig.stateMachine.stateTime += 0.1;
    }

    // Adjust Time Scale [ - / = ]
    if (input.isKeyJustPressed('Minus') || input.isKeyJustPressed('NumpadSubtract')) {
      this.timeScale = Math.max(0.1, Number((this.timeScale - 0.2).toFixed(1)));
    }
    if (input.isKeyJustPressed('Equal') || input.isKeyJustPressed('NumpadAdd')) {
      this.timeScale = Math.min(3.0, Number((this.timeScale + 0.2).toFixed(1)));
    }

    // Locomotion Speed adjustments [ W / S ]
    if (input.isActionHeld('MOVE_UP') || input.isActionJustPressed('MOVE_UP')) {
      this.locomotionSpeed = Math.min(1.0, this.locomotionSpeed + 0.1);
    }
    if (input.isActionHeld('MOVE_DOWN') || input.isActionJustPressed('MOVE_DOWN')) {
      this.locomotionSpeed = Math.max(0.0, this.locomotionSpeed - 0.1);
    }

    // Action Triggers
    if (input.isKeyJustPressed('KeyK') || input.isActionJustPressed('MELEE_ATTACK')) {
      rig.stateMachine.setTrigger('trigger_slash');
      this.engine.getAudio().playMeleeSlash();
    }
    if (input.isActionJustPressed('DASH') || input.isKeyJustPressed('Space')) {
      rig.stateMachine.setTrigger('trigger_dash');
      this.engine.getAudio().playDash();
    }
    if (input.isActionJustPressed('ATTACK') || input.isKeyJustPressed('KeyG')) {
      rig.stateMachine.setTrigger('trigger_slam');
      this.engine.getAudio().playShockwave();
    }
    if (input.isKeyJustPressed('KeyM')) {
      rig.stateMachine.setTrigger('trigger_blessing');
      rig.stateMachine.setTrigger('trigger_enrage');
      this.engine.getAudio().playHeal();
    }
    if (input.isKeyJustPressed('KeyH')) {
      rig.stateMachine.setTrigger('trigger_hurt');
      rig.stateMachine.setTrigger('trigger_stagger');
      this.engine.getAudio().playEnemyHit();
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

  public toggleSockets(): boolean {
    this.showSockets = !this.showSockets;
    return this.showSockets;
  }

  public cycleLighting(): number {
    this.lightingPresetIndex = (this.lightingPresetIndex + 1) % this.lightingPresets.length;
    return this.lightingPresetIndex;
  }
}
