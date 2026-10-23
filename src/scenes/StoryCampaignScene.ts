import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { AstraShard } from '../entities/AstraShard';
import { Altar } from '../entities/Altar';
import { EnemySentinel } from '../entities/EnemySentinel';
import { VanaraScout } from '../entities/VanaraScout';
import { ResonancePillar } from '../entities/ResonancePillar';
import { MahishasuraBoss } from '../entities/MahishasuraBoss';
import { Projectile } from '../entities/Projectile';
import { Shockwave } from '../entities/Shockwave';
import { ParticleSystem } from '../render/ParticleSystem';
import { Vector2D } from '../physics/Vector2D';
import { DamageNumberSystem } from '../render/DamageNumberSystem';
import { CombatSystem } from '../gameplay/CombatSystem';
import { CheckpointManager } from '../gameplay/CheckpointManager';
import { QuestManager } from '../narrative/QuestManager';
import { DialogueTree } from '../narrative/DialogueTree';
import { CampaignChapter1 } from '../narrative/CampaignChapter1';
import { CinematicDirector } from '../cinematics/CinematicDirector';
import { SaveGameManager } from '../state/SaveGameManager';
import { PauseMenuModal } from '../ui/modals/PauseMenuModal';
import { CodexQuestModal } from '../ui/modals/CodexQuestModal';
import { SettingsModal } from '../ui/modals/SettingsModal';
import { ProductionHUD } from '../ui/ProductionHUD';
import { ToastManager } from '../ui/components/ToastManager';

export class StoryCampaignScene implements IScene {
  public readonly id = 'StoryCampaignScene';
  private engine!: IGameEngine;

  public player!: Player;
  public altar!: Altar;
  public shards: AstraShard[] = [];
  public sentinels: EnemySentinel[] = [];
  public vanaraScout!: VanaraScout;
  public pillarOm!: ResonancePillar;
  public pillarKrim!: ResonancePillar;
  public boss?: MahishasuraBoss;

  public playerProjectiles: Projectile[] = [];
  public enemyProjectiles: Projectile[] = [];
  public shockwaves: Shockwave[] = [];

  private particles: ParticleSystem = new ParticleSystem(800);
  public damageNumbers: DamageNumberSystem = new DamageNumberSystem(60);
  public combatSystem: CombatSystem = new CombatSystem();
  public checkpointManager: CheckpointManager = new CheckpointManager();

  public questManager: QuestManager = new QuestManager();
  public dialogueTree: DialogueTree = new DialogueTree();
  public cinematicDirector: CinematicDirector = new CinematicDirector();

  public isPaused = false;
  public isGameOver = false;
  public isChapterComplete = false;
  public showQuestLog = false;

  public pauseModal!: PauseMenuModal;
  public codexModal!: CodexQuestModal;
  public settingsModal!: SettingsModal;
  public productionHUD!: ProductionHUD;

  private currentAct = 1;

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    const camera = this.engine.getRenderer().getCamera();

    this.combatSystem.setDamageNumbers(this.damageNumbers);
    this.combatSystem.setCamera(camera);

    this.cinematicDirector.setCamera(camera);
    this.cinematicDirector.setDialogueTree(this.dialogueTree);

    // Initialize Quests & Dialogues
    this.questManager.registerMissions(CampaignChapter1.getMissions());
    this.dialogueTree.registerNodes(CampaignChapter1.getDialogues());

    // Hook dialogue choice to quest affinity
    this.dialogueTree.onChoiceSelected = (choice) => {
      if (choice.affinityImpact) {
        this.questManager.modifyAffinity(choice.affinityImpact);
        this.damageNumbers.spawn(
          this.player.position.x,
          this.player.position.y - 40,
          `AFFINITY SHIFT: +${choice.affinityImpact.tara || 0} Tara / +${choice.affinityImpact.vanara || 0} Vanara`,
          '#38BDF8'
        );
      }
      this.questManager.triggerObjectiveEvent('CHOOSE_DIALOGUE', choice.id);
    };

    // Register primary checkpoint
    this.checkpointManager.clear();
    this.checkpointManager.register('cp_campaign_start', 'Sanctum Threshold', 0, 80);

    // Initialize Production UI Modals and HUD
    this.pauseModal = new PauseMenuModal({
      onResume: () => {
        this.isPaused = false;
      },
      onOpenCodex: () => {
        const vp = this.engine.getRenderer().getViewport();
        this.codexModal.open(vp.width, vp.height);
      },
      onOpenSettings: () => {
        const vp = this.engine.getRenderer().getViewport();
        this.settingsModal.open(vp.width, vp.height);
      },
      onRestartRealm: () => {
        this.resetCampaign();
      },
      onExitToTitle: () => {
        this.engine.getSceneManager().switchTo('SplashScene');
      },
    });

    this.codexModal = new CodexQuestModal(this.questManager, () => {
      this.showQuestLog = false;
      if (this.isPaused) {
        const vp = this.engine.getRenderer().getViewport();
        this.pauseModal.open(vp.width, vp.height);
      }
    });

    this.settingsModal = new SettingsModal(() => {
      if (this.isPaused) {
        const vp = this.engine.getRenderer().getViewport();
        this.pauseModal.open(vp.width, vp.height);
      }
    });

    this.productionHUD = new ProductionHUD({
      onPauseClick: () => {
        const vp = this.engine.getRenderer().getViewport();
        this.isPaused = true;
        this.pauseModal.open(vp.width, vp.height);
      },
      onCodexClick: () => {
        const vp = this.engine.getRenderer().getViewport();
        this.codexModal.open(vp.width, vp.height);
      },
    });

    this.resetCampaign();
  }

  public resetCampaign(): void {
    this.particles.clear();
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.shockwaves = [];
    this.isPaused = false;
    this.isGameOver = false;
    this.isChapterComplete = false;
    this.showQuestLog = false;
    this.currentAct = 1;

    // Reset and start Mission 1
    this.questManager.resetAll();
    this.questManager.startMission('M1_SANCTUM_AWAKENING');

    // Spawn Player
    this.player = new Player('player_veer', 0, 80);
    this.checkpointManager.restorePlayer(this.player);

    const camera = this.engine.getRenderer().getCamera();
    camera.setTarget(this.player.position);
    camera.position.set(0, 80);

    // Spawn Entities
    this.altar = new Altar('altar_surya', 0, -220);

    this.shards = [
      new AstraShard('shard_c1', -260, 140),
      new AstraShard('shard_c2', 260, 140),
      new AstraShard('shard_c3', 0, 320),
    ];

    this.sentinels = [
      new EnemySentinel('sentinel_c1', -220, -100),
      new EnemySentinel('sentinel_c2', 220, -100),
    ];

    this.vanaraScout = new VanaraScout('scout_kapi', 0, -550);
    this.pillarOm = new ResonancePillar('pillar_om', -280, -750, 'om');
    this.pillarKrim = new ResonancePillar('pillar_krim', 280, -750, 'krim');

    // Launch Act I Opening Cinematic
    this.cinematicDirector.playSequence([
      {
        duration: 3.5,
        cameraTarget: new Vector2D(0, 0),
        letterboxHeight: 64,
        titleCard: {
          title: 'CHAPTER I: THE DAWNING FLARE',
          subtitle: 'Act I — The Shattered Sanctum of Astra',
        },
        dialogueNodeId: 'tara_awaken_1',
      },
    ]);
  }

  public onExit(): void {
    this.particles.clear();
    this.cinematicDirector.finishSequence();
  }

  public handleInput(input: InputManager): void {
    const mousePos = input.getMousePosition();

    // 0. Active Modals Input Interception
    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.handlePointerMove(mousePos);
      if (input.isActionJustPressed('ATTACK')) {
        this.settingsModal.handlePointerDown(mousePos);
      } else if (input.isActionJustReleased('ATTACK')) {
        this.settingsModal.handlePointerUp(mousePos);
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.settingsModal.close();
      }
      return;
    }

    if (this.codexModal && this.codexModal.isOpen()) {
      this.codexModal.handlePointerMove(mousePos);
      if (input.isActionJustPressed('ATTACK')) {
        this.codexModal.handlePointerDown(mousePos);
      } else if (input.isActionJustReleased('ATTACK')) {
        this.codexModal.handlePointerUp(mousePos);
      }
      if (input.isActionJustPressed('PAUSE') || input.isKeyJustPressed('KeyO') || input.isKeyJustPressed('Tab')) {
        this.codexModal.close();
      }
      return;
    }

    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.handlePointerMove(mousePos);
      if (input.isActionJustPressed('ATTACK')) {
        this.pauseModal.handlePointerDown(mousePos);
      } else if (input.isActionJustReleased('ATTACK')) {
        this.pauseModal.handlePointerUp(mousePos);
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.pauseModal.close();
        this.isPaused = false;
      }
      return;
    }

    // 1-Click Fast HUD Actions (only on actual mouse button click)
    if (input.isMouseButtonJustPressed(0)) {
      if (this.productionHUD && this.productionHUD.handlePointerDown(mousePos)) {
        return;
      }
    }

    if (this.isPaused) {
      if (input.isKeyJustPressed('KeyM') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      if (input.isActionJustPressed('PAUSE')) {
        this.isPaused = false;
        if (this.pauseModal) this.pauseModal.close();
        return;
      }
      return;
    }

    if (this.isGameOver || this.isChapterComplete) {
      if (input.isKeyJustPressed('KeyR')) {
        this.resetCampaign();
        return;
      }
      if (input.isKeyJustPressed('KeyM') || input.isActionJustPressed('PAUSE')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
      }
      return;
    }

    // 1. Cinematic skip or Pause
    if (input.isActionJustPressed('PAUSE')) {
      if (this.cinematicDirector.isPlaying()) {
        this.cinematicDirector.skip();
        return;
      }
      this.isPaused = true;
      const vp = this.engine.getRenderer().getViewport();
      this.pauseModal.open(vp.width, vp.height);
      return;
    }

    // 2. Toggle Quest Log Modal (Tab / O)
    if (input.isKeyJustPressed('KeyO') || input.isKeyJustPressed('Tab')) {
      this.showQuestLog = !this.showQuestLog;
      const vp = this.engine.getRenderer().getViewport();
      if (this.showQuestLog) {
        this.codexModal.open(vp.width, vp.height);
      } else {
        this.codexModal.close();
      }
      return;
    }

    // 3. Branching Dialogue Choice Keys (1, 2, 3)
    if (this.dialogueTree.isWaitingForChoice()) {
      if (input.isKeyJustPressed('Digit1') || input.isKeyJustPressed('Numpad1')) {
        this.dialogueTree.selectChoice(0);
        return;
      }
      if (input.isKeyJustPressed('Digit2') || input.isKeyJustPressed('Numpad2')) {
        this.dialogueTree.selectChoice(1);
        return;
      }
      if (input.isKeyJustPressed('Digit3') || input.isKeyJustPressed('Numpad3')) {
        this.dialogueTree.selectChoice(2);
        return;
      }
    }

    // 4. Advance Dialogue with Space or Click
    if (this.dialogueTree.isActive()) {
      if (input.isKeyJustPressed('Space') || input.isActionJustPressed('ATTACK')) {
        this.dialogueTree.advance();
        return;
      }
      return; // Freeze movement while in dialogue
    }

    // 5. Normal Gameplay Controls
    const moveDir = input.getMovementVector();
    this.player.move(moveDir, 1 / 60);

    // Dash
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 14, '#FB8500', 160);
      }
    }

    // Weapon Swap (Q)
    if (input.isKeyJustPressed('KeyQ')) {
      this.player.swapWeapon();
    }

    // Defensive Guard / Parry (C or X)
    const isGuardingKey = input.isKeyHeld('KeyC') || input.isKeyHeld('KeyX');
    if (isGuardingKey) {
      this.player.startGuard();
    } else {
      this.player.stopGuard();
    }

    // Melee Attack (J or Left Click)
    if (input.isActionJustPressed('ATTACK')) {
      const strike = this.player.executeComboAttack();
      if (strike) {
        this.handlePlayerMelee(strike.arc);
      }
    }

    // Ranged Attack (K or Right Click)
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      const projs = this.player.shootBurst();
      if (projs.length > 0) {
        this.playerProjectiles.push(...projs);
      }
    }

    // Interact (E)
    if (input.isKeyJustPressed('KeyE')) {
      this.handleInteract();
    }
  }

  private handlePlayerMelee(arc: any): void {
    this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'training_strike', 1);

    // Check hit against Sentinels
    for (let i = this.sentinels.length - 1; i >= 0; i--) {
      const s = this.sentinels[i];
      if (!s.isActive) continue;

      const dist = Vector2D.distance(this.player.position, s.position);
      if (dist <= arc.radius + 30) {
        s.takeDamage(arc.damage);
        this.damageNumbers.spawn(s.position.x, s.position.y - 20, arc.damage.toString(), '#FFD166');
        this.particles.emitBurst(s.position.x, s.position.y, 12, '#EF4444', 120);

        if (!s.isActive) {
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'corrupted_sentinel', 1);
          this.player.score += 200;
        }
      }
    }

    // Check hit against Brahmic Pillars
    if (Vector2D.distance(this.player.position, this.pillarOm.position) <= arc.radius + 30) {
      if (this.pillarOm.state !== 'attuned') {
        this.pillarOm.attune();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_om', 1);
        this.engine.getAudio().playAltarResonate();
      }
    }

    if (Vector2D.distance(this.player.position, this.pillarKrim.position) <= arc.radius + 30) {
      if (this.pillarKrim.state !== 'attuned') {
        this.pillarKrim.attune();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_krim', 1);
        this.engine.getAudio().playAltarResonate();
      }
    }

    // Check hit against Boss if spawned
    if (this.boss && this.boss.isActive) {
      if (Vector2D.distance(this.player.position, this.boss.position) <= arc.radius + 40) {
        this.boss.takeDamage(arc.damage);
        this.damageNumbers.spawn(this.boss.position.x, this.boss.position.y - 20, arc.damage.toString(), '#FFD700');

        if (this.boss.poise.isStaggered) {
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'boss_stagger', 1);
        }

        if (this.boss.health <= 0) {
          this.boss.destroy();
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'boss_mahishasura', 1);
          this.handleChapterVictory();
        }
      }
    }
  }

  private handleInteract(): void {
    // Altar consecration
    if (Vector2D.distance(this.player.position, this.altar.position) <= 100) {
      if (this.player.shardsCollected >= 3 && this.altar.state !== 'consecrated') {
        this.altar.depositShard();
        this.altar.depositShard();
        this.altar.depositShard();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'sun_altar', 1);
        this.engine.getAudio().playVictoryFanfare();
        this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 60, '#FFB703', 250);

        // Advance to Act II
        this.transitionToAct2();
      }
    }

    // Confer with Kapi
    if (Vector2D.distance(this.player.position, this.vanaraScout.position) <= 120) {
      this.cinematicDirector.playSequence([
        {
          duration: 3.0,
          cameraTarget: this.vanaraScout.position,
          letterboxHeight: 64,
          dialogueNodeId: 'kapi_standoff_1',
        },
      ]);
    }
  }

  private transitionToAct2(): void {
    this.currentAct = 2;
    this.checkpointManager.register('cp_act2', 'Dandaka Torana Gate', 0, -250);
    this.checkpointManager.activate('cp_act2');
    this.questManager.startMission('M3_DANDAKA_INFILTRATION');

    this.cinematicDirector.playSequence([
      {
        duration: 3.5,
        cameraTarget: new Vector2D(0, -350),
        letterboxHeight: 64,
        titleCard: {
          title: 'ACT II: THE BLIGHTED GROVES',
          subtitle: 'The Sacred Torana & Dandaka Forest',
        },
      },
    ]);
  }

  private transitionToAct3(): void {
    this.currentAct = 3;
    this.checkpointManager.register('cp_act3', 'Caldera Precipice', 0, -1100);
    this.checkpointManager.activate('cp_act3');
    this.questManager.startMission('M5_OBSIDIAN_THRONE');

    // Spawn Titan Boss Mahishasura
    this.boss = new MahishasuraBoss('boss_mahisha_campaign', 0, -1350);

    this.cinematicDirector.playSequence([
      {
        duration: 4.0,
        cameraTarget: new Vector2D(0, -1300),
        letterboxHeight: 64,
        titleCard: {
          title: 'ACT III: THE OBSIDIAN THRONE',
          subtitle: "Mahishasura's Final Defiance",
        },
        dialogueNodeId: 'mahisha_manifest_1',
      },
    ]);
  }

  private handleChapterVictory(): void {
    this.isChapterComplete = true;
    this.particles.emitBurst(this.player.position.x, this.player.position.y, 100, '#FFD700', 350);
    this.engine.getAudio().playVictoryFanfare();

    // Persist complete narrative state
    const narrativeState = this.questManager.exportSaveState();
    SaveGameManager.save({
      shardsCollected: this.player.shardsCollected,
      highScore: this.player.score + 10000,
      currentRealm: 'RealmOfVayu',
      unlockedRealms: ['SanctumOfAstra', 'RealmOfBhumi', 'RealmOfVayu'],
      narrative: narrativeState,
    });
  }

  public update(dt: number): void {
    ToastManager.getInstance().update(dt);
    if (this.productionHUD) {
      this.productionHUD.update(dt);
    }

    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.update(dt);
      return;
    }
    if (this.codexModal && this.codexModal.isOpen()) {
      this.codexModal.update(dt);
      return;
    }
    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.update(dt);
      return;
    }

    if (this.isPaused) return;

    this.cinematicDirector.update(dt);
    this.dialogueTree.update(dt);
    this.particles.update(dt);
    this.damageNumbers.update(dt);

    if (this.cinematicDirector.isPlaying() || this.dialogueTree.isActive()) {
      return; // Pause world simulation during scripted cinematics
    }

    if (this.isGameOver || this.isChapterComplete) return;

    // Update Player
    this.player.update(dt);
    if (this.player.health <= 0) {
      this.isGameOver = true;
      return;
    }

    // Update Camera tracking
    this.engine.getRenderer().getCamera().setTarget(this.player.position);

    // Check Shard Pickups
    for (const s of this.shards) {
      if (!s.isCollected && s.bounds.intersects(this.player.bounds)) {
        s.collect();
        this.player.shardsCollected++;
        this.player.score += 250;
        this.questManager.triggerObjectiveEvent('COLLECT_SHARD', undefined, 1);
        this.damageNumbers.spawn(s.position.x, s.position.y - 20, '+1 ASTRA SHARD', '#FFD166');
      }
      s.update(dt);
    }

    // Update Sentinels
    for (const sentinel of this.sentinels) {
      if (sentinel.isActive) {
        sentinel.update(dt);
        if (sentinel.bounds.intersects(this.player.bounds)) {
          this.player.takeDamage(15);
          if (this.player.health <= 0) this.isGameOver = true;
        }
      }
    }

    // Update Props
    this.altar.update(dt);
    this.pillarOm.update(dt);
    this.pillarKrim.update(dt);

    // Location objective triggers
    if (this.currentAct === 2 && this.player.position.y <= -200) {
      this.questManager.triggerObjectiveEvent('EXPLORE_LOCATION', undefined, 1);
    }

    // Check if Act II finished -> trigger Act III
    if (this.currentAct === 2 && this.questManager.getMissionStatus('M4_HARMONIZE_PILLARS') === 'COMPLETED') {
      if (!this.boss) {
        this.transitionToAct3();
      }
    }

    // Update Boss if spawned
    if (this.boss && this.boss.isActive) {
      this.boss.updateAI(this.player.position, dt);
      this.boss.update(dt);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    // 1. Render World Environment
    this.renderWorldEnvironment(ctx);

    // 2. Render Checkpoint Monolith
    this.renderCheckpoint(ctx);

    // 3. Render Props & Shards
    this.altar.render(renderer);
    for (const s of this.shards) s.render(renderer);
    for (const sen of this.sentinels) sen.render(renderer);
    this.vanaraScout.render(renderer);
    this.pillarOm.render(renderer);
    this.pillarKrim.render(renderer);

    if (this.boss && this.boss.isActive) {
      this.boss.render(renderer);
    }

    // 4. Render Player
    this.player.render(renderer);

    // 5. Particles & Damage Numbers
    this.particles.render(ctx, new Vector2D(0, 0));
    this.damageNumbers.render(renderer);

    // 6. Cinematic & Dialogue Overlays
    this.cinematicDirector.render(renderer);
    this.dialogueTree.render(renderer);

    // 7. Quest Tracking HUD & Overlays
    this.renderQuestHUD(ctx);

    if (this.showQuestLog) {
      this.renderQuestLogModal(ctx);
    } else if (this.isChapterComplete) {
      this.renderVictoryOverlay(ctx);
    } else if (this.isGameOver) {
      this.renderDefeatOverlay(ctx);
    }

    // 8. Production Responsive HUD & Modals
    if (this.productionHUD) {
      const activeMission = this.questManager.getActiveMission();
      const objDesc =
        activeMission && activeMission.objectives[0]
          ? activeMission.objectives[0].description
          : 'Purify Sapta-Loka';
      this.productionHUD.render(renderer, this.player, objDesc);
    }

    if (this.pauseModal && this.pauseModal.isOpen()) {
      this.pauseModal.render(renderer);
    }
    if (this.codexModal && this.codexModal.isOpen()) {
      this.codexModal.render(renderer);
    }
    if (this.settingsModal && this.settingsModal.isOpen()) {
      this.settingsModal.render(renderer);
    }

    ToastManager.getInstance().render(renderer);
  }

  private renderWorldEnvironment(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Ambient floor
    ctx.fillStyle = '#080C14';
    ctx.fillRect(-1000, -1600, 2000, 2200);

    // Sacred pathway paving
    ctx.fillStyle = '#111827';
    ctx.fillRect(-120, -1500, 240, 2000);

    // Pathway border lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-120, -1500);
    ctx.lineTo(-120, 500);
    ctx.moveTo(120, -1500);
    ctx.lineTo(120, 500);
    ctx.stroke();

    // Torana Gateway Arch (at Y = -200)
    ctx.fillStyle = '#B45309';
    ctx.fillRect(-140, -220, 28, 44);
    ctx.fillRect(112, -220, 28, 44);
    ctx.fillRect(-150, -236, 300, 16);

    ctx.restore();
  }

  private renderCheckpoint(ctx: CanvasRenderingContext2D): void {
    const cp = this.checkpointManager.getActiveCheckpoint();
    if (!cp) return;

    ctx.save();
    ctx.translate(cp.position.x, cp.position.y);
    ctx.fillStyle = '#059669';
    ctx.fillRect(-6, -24, 12, 28);
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(0, -14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderQuestHUD(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    const hudX = 20;
    const hudY = 20;

    const mission = this.questManager.getActiveMission();
    if (mission) {
      // Mission Card
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, 320, 36 + mission.objectives.length * 22, 6);
      ctx.fill();
      ctx.stroke();

      // Title & Act
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ACT ${mission.act}: ${mission.title.toUpperCase()}`, hudX + 12, hudY + 20);

      // Objectives list
      mission.objectives.forEach((obj, idx) => {
        const objY = hudY + 42 + idx * 22;
        ctx.fillStyle = obj.isCompleted ? '#34D399' : '#94A3B8';
        ctx.font = '11px Inter, sans-serif';
        const check = obj.isCompleted ? '[✓]' : `[ ${obj.currentCount}/${obj.targetCount} ]`;
        ctx.fillText(`${check} ${obj.description}`, hudX + 14, objY);
      });
    }

    // Relationship & Moral Affinity Card (top right)
    const affX = cam.viewportWidth - 210;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(affX, 20, 190, 68, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'left';
    ctx.fillText(`TARA AFFINITY: +${this.questManager.relationships.taraAffinity}`, affX + 12, 40);
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`VANARA TRUST: +${this.questManager.relationships.vanaraTrust}`, affX + 12, 58);
    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`KARMIC BALANCE: +${this.questManager.relationships.karmicBalance}`, affX + 12, 76);

    ctx.restore();
  }

  private renderQuestLogModal(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);

    ctx.font = 'bold 28px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FFB703';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPAIGN QUEST CHRONICLE', cam.viewportWidth / 2, 70);

    const missions = this.questManager.getAllMissions();
    missions.forEach((m, idx) => {
      const cardY = 120 + idx * 75;
      const status = this.questManager.getMissionStatus(m.id);
      const isComplete = status === 'COMPLETED';
      const isActive = status === 'ACTIVE';

      ctx.fillStyle = isActive ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = isComplete ? '#34D399' : isActive ? '#F59E0B' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cam.viewportWidth / 2 - 280, cardY, 560, 65, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = isComplete ? '#34D399' : isActive ? '#FFD166' : '#94A3B8';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillText(`[ ${status} ] ${m.title}`, cam.viewportWidth / 2 - 260, cardY + 26);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(m.description, cam.viewportWidth / 2 - 260, cardY + 48);
    });

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Press [ O / TAB ] to Close Quest Chronicle', cam.viewportWidth / 2, cam.viewportHeight - 35);

    ctx.restore();
  }

  private renderVictoryOverlay(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);

    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('CHAPTER I COMPLETED', cam.viewportWidth / 2, cam.viewportHeight / 2 - 70);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('The Dawning Flare of Dandaka has been restored.', cam.viewportWidth / 2, cam.viewportHeight / 2 - 25);
    ctx.fillText(`Final Moral Karmic Balance: +${this.questManager.relationships.karmicBalance}`, cam.viewportWidth / 2, cam.viewportHeight / 2 + 5);

    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = '#34D399';
    ctx.fillText('Pathway to Floating Sky Citadels of Vayu Unlocked!', cam.viewportWidth / 2, cam.viewportHeight / 2 + 50);

    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Press [ R ] to Replay Chapter  |  [ ESC / M ] Return to Title', cam.viewportWidth / 2, cam.viewportHeight / 2 + 95);

    ctx.restore();
  }

  private renderDefeatOverlay(ctx: CanvasRenderingContext2D): void {
    const cam = this.engine.getRenderer().getCamera();
    ctx.save();
    ctx.translate(cam.position.x - cam.viewportWidth / 2, cam.position.y - cam.viewportHeight / 2);

    ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
    ctx.fillRect(0, 0, cam.viewportWidth, cam.viewportHeight);

    ctx.font = 'bold 34px "Cinzel", serif';
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'center';
    ctx.fillText('FALLEN IN SCRIPTED MISSION', cam.viewportWidth / 2, cam.viewportHeight / 2 - 30);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText('Press [ R ] to Respawn at Chapter Checkpoint  |  [ ESC / M ] Return to Menu', cam.viewportWidth / 2, cam.viewportHeight / 2 + 25);

    ctx.restore();
  }
}
