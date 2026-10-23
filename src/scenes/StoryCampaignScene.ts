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
import { StoneRakshasa } from '../entities/StoneRakshasa';
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
import { CelestialVFX } from '../render/CelestialVFX';
import { AssetManager } from '../assets/AssetManager';
import { ASSET_IDS } from '../assets/AssetManifest';
import { SacredGeometry } from '../render/SacredGeometry';

export class StoryCampaignScene implements IScene {
  public readonly id = 'StoryCampaignScene';
  private engine!: IGameEngine;

  public player!: Player;
  public altar!: Altar;
  public shards: AstraShard[] = [];
  public sentinels: EnemySentinel[] = [];
  public vanaraScout!: VanaraScout;
  public stoneRakshasa?: StoneRakshasa;
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
  private scintillationTimer = 0;

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

    // Hook dialogue voice cues to audio engine synthesizer
    this.dialogueTree.onPlayVoiceCue = (cue) => {
      this.engine.getAudio().playDialogueVoiceCue(cue);
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

    this.engine.getAudio().startMusic('BHAIRAV', 0.1);
    this.engine.getAudio().startAmbience('SANCTUM_DAWN');

    this.resetCampaign();
  }

  public resetCampaign(): void {
    this.particles.clear();
    CelestialVFX.getInstance().clear();
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
    this.stoneRakshasa = new StoneRakshasa('sthula_rakshasa', 0, -680);
    this.stoneRakshasa.health = 220;
    this.stoneRakshasa.maxHealth = 220;

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
    CelestialVFX.getInstance().clear();
    this.engine.getAudio().stopMusic();
    this.engine.getAudio().stopAmbience();
    this.cinematicDirector.finishSequence();
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
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
      if (input.isKeyJustPressed('KeyQ') || input.isKeyJustPressed('KeyM') || input.isKeyJustPressed('Backspace')) {
        this.engine.getSceneManager().switchTo('SplashScene');
        return;
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
      if (input.isKeyJustPressed('KeyQ') || input.isKeyJustPressed('KeyM') || input.isKeyJustPressed('Backspace')) {
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

    // 3. Branching Dialogue Choice Keys (1, 2, 3) or Mouse Click
    if (this.dialogueTree.isWaitingForChoice()) {
      if (input.isMouseButtonJustPressed(0)) {
        const vp = this.engine.getRenderer().getViewport();
        if (this.dialogueTree.handlePointerDown(mousePos.x, mousePos.y, vp.width, vp.height, (this.questManager as any).storyFlags)) {
          return;
        }
      }
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
      if (input.isMouseButtonJustPressed(0)) {
        const vp = this.engine.getRenderer().getViewport();
        if (this.dialogueTree.handlePointerDown(mousePos.x, mousePos.y, vp.width, vp.height, (this.questManager as any).storyFlags)) {
          return;
        }
      }
      if (input.isKeyJustPressed('Space') || input.isActionJustPressed('ATTACK')) {
        this.dialogueTree.advance();
        return;
      }
      return; // Freeze movement while in dialogue
    }

    // 5. Normal Gameplay Controls
    const moveDir = input.getMovementVector();
    this.player.move(moveDir, 1 / 60);

    // Dash (supports recovery dodge-cancelling)
    if (input.isActionJustPressed('DASH')) {
      if (this.player.triggerDash()) {
        this.particles.emitBurst(this.player.position.x, this.player.position.y, 14, '#FB8500', 160);
      }
    }

    // Weapon Swap (Q / Tab / SWAP_WEAPON)
    if (input.isActionJustPressed('SWAP_WEAPON') || input.isKeyJustPressed('KeyQ')) {
      this.player.swapWeapon();
    }

    // Defensive Guard / Parry (G / C / Z / GUARD)
    const isGuardingKey = input.isActionHeld('GUARD') || input.isKeyHeld('KeyG') || input.isKeyHeld('KeyC') || input.isKeyHeld('KeyZ') || input.isKeyHeld('KeyX');
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

    // Special Attack (Digit1 / SPECIAL_ATTACK)
    if (input.isActionJustPressed('SPECIAL_ATTACK') || input.isKeyJustPressed('Digit1')) {
      const spec = this.player.executeSpecialAttack();
      if (spec) {
        this.handlePlayerMelee(spec);
        this.engine.getAudio().playMantra('OM');
      }
    }

    // Ranged Attack (K or Right Click)
    if (input.isActionJustPressed('MELEE_ATTACK')) {
      const projs = this.player.shootBurst();
      if (projs.length > 0) {
        this.playerProjectiles.push(...projs);
      }
    }

    // Interact / Action (E / F / INTERACT)
    if (input.isKeyJustPressed('KeyE') || input.isKeyJustPressed('KeyF') || input.isActionJustPressed('INTERACT')) {
      const canInteract = this.checkCanInteract();
      if (canInteract) {
        this.handleInteract();
      } else {
        const spec = this.player.executeSpecialAttack();
        if (spec) {
          this.handlePlayerMelee(spec);
          this.engine.getAudio().playMantra('OM');
        }
      }
    }
  }

  private checkCanInteract(): boolean {
    if (Vector2D.distance(this.player.position, this.altar.position) <= 120 && this.player.shardsCollected >= 3 && this.altar.state !== 'consecrated') {
      return true;
    }
    if (Vector2D.distance(this.player.position, this.vanaraScout.position) <= 130) {
      return true;
    }
    if (this.stoneRakshasa && Vector2D.distance(this.player.position, this.stoneRakshasa.position) <= 150 && !this.questManager.getFlag('sthula_resolved', false)) {
      return true;
    }
    return false;
  }

  private handlePlayerMelee(arc: any): void {
    this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'training_strike', 1);

    // Audio & VFX Slash Trail
    const activeWeapon = this.player.equipmentManager.getActiveWeapon();
    const facingAngle = this.player.velocity.length() > 0.1
      ? Math.atan2(this.player.velocity.y, this.player.velocity.x)
      : 0;

    if (activeWeapon === 'AGNI_CHAKRAM') {
      CelestialVFX.getInstance().emitFlamingChakramTrail(this.player.position, facingAngle);
      this.engine.getAudio().playSpatialFoley('CELESTIAL_GOLD', 'SLASH', this.player.position);
    } else {
      CelestialVFX.getInstance().emitSlashTrail(this.player.position, facingAngle, '#00E5FF', '#38BDF8');
      CelestialVFX.getInstance().emitPranaWindVortex(this.player.position, 45);
      this.engine.getAudio().playSpatialFoley('BRONZE', 'SLASH', this.player.position);
    }

    // Check hit against Sentinels
    for (let i = this.sentinels.length - 1; i >= 0; i--) {
      const s = this.sentinels[i];
      if (!s.isActive) continue;

      const dist = Vector2D.distance(this.player.position, s.position);
      if (dist <= arc.radius + 30) {
        s.takeDamage(arc.damage);
        this.damageNumbers.spawn(s.position.x, s.position.y - 20, arc.damage.toString(), '#FFD166');
        this.particles.emitBurst(s.position.x, s.position.y, 12, '#EF4444', 120);
        this.engine.getAudio().playSpatialFoley('BRONZE', 'IMPACT', s.position);
        CelestialVFX.getInstance().emitMaterialDebris(s.position, s.position.subtract(this.player.position));
        CelestialVFX.getInstance().emitTamasTendrils(s.position, 4);

        if (!s.isActive) {
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'corrupted_sentinel', 1);
          this.player.score += 200;
        }
      }
    }

    // Check hit against Stone Rakshasa Sthula
    if (this.stoneRakshasa && this.stoneRakshasa.isActive) {
      const dist = Vector2D.distance(this.player.position, this.stoneRakshasa.position);
      if (dist <= arc.radius + 40) {
        this.stoneRakshasa.takeDamage(arc.damage, arc.poiseDamage || 25);
        this.damageNumbers.spawn(this.stoneRakshasa.position.x, this.stoneRakshasa.position.y - 20, arc.damage.toString(), '#FFB703');
        this.particles.emitBurst(this.stoneRakshasa.position.x, this.stoneRakshasa.position.y, 16, '#94A3B8', 140);
        this.engine.getAudio().playFoleyImpact('GRANITE', 'IMPACT');

        if (this.stoneRakshasa.poise.isStaggered && !this.questManager.getFlag('sthula_encountered', false)) {
          this.questManager.setFlag('sthula_encountered', true);
          this.handleInteract();
        }

        if (this.stoneRakshasa.health <= 0) {
          this.stoneRakshasa.destroy();
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'stone_rakshasa', 1);
          this.questManager.setFlag('sthula_resolved', true);
        }
      }
    }

    // Check hit against Brahmic Pillars
    if (Vector2D.distance(this.player.position, this.pillarOm.position) <= arc.radius + 30) {
      if (this.pillarOm.state !== 'attuned') {
        this.pillarOm.attune();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_om', 1);
        this.engine.getAudio().playAltarResonate();
        this.engine.getAudio().playMantra('KRIM');
        CelestialVFX.getInstance().emitSanskritRunes(this.pillarOm.position, 6, '#FFB703');
        CelestialVFX.getInstance().emitShockwave(this.pillarOm.position, 180, '#FFB703', '#00E5FF');
      }
    }

    if (Vector2D.distance(this.player.position, this.pillarKrim.position) <= arc.radius + 30) {
      if (this.pillarKrim.state !== 'attuned') {
        this.pillarKrim.attune();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'pillar_krim', 1);
        this.engine.getAudio().playAltarResonate();
        this.engine.getAudio().playMantra('KRIM');
        CelestialVFX.getInstance().emitSanskritRunes(this.pillarKrim.position, 6, '#FFB703');
        CelestialVFX.getInstance().emitShockwave(this.pillarKrim.position, 180, '#FFB703', '#00E5FF');
      }
    }

    // Check hit against Boss if spawned
    if (this.boss && this.boss.isActive) {
      if (Vector2D.distance(this.player.position, this.boss.position) <= arc.radius + 40) {
        this.boss.takeDamage(arc.damage);
        this.damageNumbers.spawn(this.boss.position.x, this.boss.position.y - 20, arc.damage.toString(), '#FFD700');
        this.engine.getAudio().playFoleyImpact('GRANITE', 'IMPACT');

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
    if (Vector2D.distance(this.player.position, this.altar.position) <= 120) {
      if (this.player.shardsCollected >= 3 && this.altar.state !== 'consecrated') {
        this.altar.depositShard();
        this.altar.depositShard();
        this.altar.depositShard();
        this.questManager.triggerObjectiveEvent('CONSECRATE_ALTAR', 'sun_altar', 1);
        this.engine.getAudio().playVictoryFanfare();
        this.engine.getAudio().playMantra('OM');
        this.engine.getAudio().playSpatialSfx('ALTAR_HUM', this.altar.position);
        this.engine.getRenderer().getCamera().triggerShake(8, 0.9);
        CelestialVFX.getInstance().emitShockwave(this.altar.position, 280, '#FFB703', '#00E5FF');
        CelestialVFX.getInstance().emitSanskritRunes(this.altar.position, 8, '#FFD166');
        CelestialVFX.getInstance().emitSuryaSolarFlare(this.altar.position, 16);
        CelestialVFX.getInstance().emitConsecrationLightPillar(this.altar.position, 650, 3.0);
        CelestialVFX.getInstance().triggerRadialDistortion(this.altar.position, 1.0);
        this.particles.emitBurst(this.altar.position.x, this.altar.position.y, 60, '#FFB703', 250);

        // Advance to Act II
        this.transitionToAct2();
        return;
      }
    }

    // Confer with Kapi
    if (Vector2D.distance(this.player.position, this.vanaraScout.position) <= 130) {
      this.cinematicDirector.playSequence([
        {
          duration: 3.0,
          cameraTarget: this.vanaraScout.position,
          letterboxHeight: 64,
          dialogueNodeId: 'kapi_standoff_1',
        },
      ]);
      return;
    }

    // Confer with Sthula (Stone Rakshasa)
    if (this.stoneRakshasa && Vector2D.distance(this.player.position, this.stoneRakshasa.position) <= 150) {
      this.cinematicDirector.playSequence(
        CinematicDirector.createSthulaStandoffSequence(this.stoneRakshasa.position, this.player.position, {
          onRoar: () => {
            this.engine.getAudio().playSpatialSfx('SHOCKWAVE', this.stoneRakshasa!.position);
            this.engine.getRenderer().getCamera().triggerShake(8, 0.8);
            this.dialogueTree.start('sthula_encounter_1');
          },
          onComplete: () => {
            this.questManager.setFlag('sthula_resolved', true);
            this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'stone_rakshasa', 1);
          },
        })
      );
      return;
    }
  }

  private transitionToAct2(): void {
    this.currentAct = 2;
    this.checkpointManager.register('cp_act2', 'Dandaka Torana Gate', 0, -250);
    this.checkpointManager.activate('cp_act2');
    this.questManager.startMission('M3_DANDAKA_INFILTRATION');
    this.engine.getAudio().fadeToRaga('DARBARI', 0.25, 2.0);
    this.engine.getAudio().crossfadeAmbience('DANDAKA_GROVE', 2.0);
    this.engine.getAudio().playShankhaFanfare();
    CelestialVFX.getInstance().emitPranaWindVortex(new Vector2D(0, -320), 80);

    this.cinematicDirector.playSequence(
      CinematicDirector.createToranaUnsealingSequence(new Vector2D(0, -320), this.player.position)
    );
  }

  private transitionToAct3(): void {
    this.currentAct = 3;
    this.checkpointManager.register('cp_act3', 'Caldera Precipice', 0, -1100);
    this.checkpointManager.activate('cp_act3');
    this.questManager.startMission('M5_OBSIDIAN_THRONE');
    this.engine.getAudio().fadeToRaga('MARWA', 0.75, 2.0);
    this.engine.getAudio().crossfadeAmbience('OBSIDIAN_CHASM', 2.0);
    this.engine.getAudio().playShankhaFanfare();

    // Spawn Titan Boss Mahishasura
    this.boss = new MahishasuraBoss('boss_mahisha_campaign', 0, -1350);
    CelestialVFX.getInstance().emitTamasTendrils(new Vector2D(0, -1350), 16);

    this.cinematicDirector.playSequence(
      CinematicDirector.createMahishasuraAwakeningSequence(new Vector2D(0, -1350), this.player.position, {
        onRoar: () => {
          this.engine.getAudio().playSpatialSfx('SHOCKWAVE', new Vector2D(0, -1350));
          this.engine.getRenderer().getCamera().triggerShake(12, 1.2);
          CelestialVFX.getInstance().emitShockwave(new Vector2D(0, -1350), 320, '#581C87', '#EF4444');
        },
      })
    );
  }

  private handleChapterVictory(): void {
    this.isChapterComplete = true;
    this.particles.emitBurst(this.player.position.x, this.player.position.y, 100, '#FFD700', 350);
    CelestialVFX.getInstance().emitConsecrationLightPillar(this.player.position, 700, 3.5);
    CelestialVFX.getInstance().emitSuryaSolarFlare(this.player.position, 20);
    this.engine.getAudio().playVictoryFanfare();
    this.engine.getAudio().fadeToRaga('BHAIRAV', 0.1, 2.5);

    this.cinematicDirector.playSequence(
      CinematicDirector.createDawnRestorationSequence(this.player.position, {
        onSunrise: () => {
          this.engine.getAudio().playMantra('OM');
          this.engine.getRenderer().getCamera().triggerShake(4, 0.6);
        },
      })
    );

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
      this.productionHUD.update(dt, this.player);

      // Contextual prompt detection based on player proximity
      let prompt: string | null = null;
      if (Vector2D.distance(this.player.position, this.altar.position) <= 95 && this.altar.state !== 'consecrated') {
        prompt = '[ E ] Consecrate the Sun Altar';
      } else if (Vector2D.distance(this.player.position, this.vanaraScout.position) <= 100) {
        prompt = '[ E ] Speak with Vanara Scout Kapi';
      } else if (Vector2D.distance(this.player.position, this.pillarOm.position) <= 100 && this.pillarOm.state !== 'attuned') {
        prompt = '[ J / Attack ] Strike to Attune Pillar Om';
      } else if (Vector2D.distance(this.player.position, this.pillarKrim.position) <= 100 && this.pillarKrim.state !== 'attuned') {
        prompt = '[ J / Attack ] Strike to Attune Pillar Krim';
      } else if (this.stoneRakshasa && this.stoneRakshasa.isActive && Vector2D.distance(this.player.position, this.stoneRakshasa.position) <= 120) {
        prompt = '[ E ] Confer with Sthula';
      }
      this.productionHUD.setContextualPrompt(prompt);

      // Compass calculation towards active objective target
      let targetAngle: number | null = null;
      if (this.altar.state !== 'consecrated') {
        targetAngle = Math.atan2(this.altar.position.y - this.player.position.y, this.altar.position.x - this.player.position.x);
      } else if (this.currentAct === 2) {
        targetAngle = Math.atan2(this.pillarOm.position.y - this.player.position.y, this.pillarOm.position.x - this.player.position.x);
      } else if (this.boss && this.boss.isActive) {
        targetAngle = Math.atan2(this.boss.position.y - this.player.position.y, this.boss.position.x - this.player.position.x);
      }
      this.productionHUD.setCompassAngle(targetAngle);
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
    CelestialVFX.getInstance().update(dt);
    this.damageNumbers.update(dt);
    this.engine.getAudio().update(dt);

    this.scintillationTimer += dt;
    if (this.scintillationTimer >= 0.45) {
      this.scintillationTimer = 0;
      const bounds = {
        x: this.player ? this.player.position.x - 450 : -450,
        y: this.player ? this.player.position.y - 350 : -350,
        width: 900,
        height: 700,
      };
      const type = this.currentAct === 3 ? 'VOLCANIC_EMBERS' : 'TEMPLE_DUST';
      CelestialVFX.getInstance().emitAtmosphericScintillation(bounds, 3, type);
    }

    if (this.cinematicDirector.isPlaying() || this.dialogueTree.isActive()) {
      return; // Pause world simulation during scripted cinematics
    }

    if (this.isGameOver || this.isChapterComplete) return;

    // Update Player
    this.player.update(dt);
    this.engine.getAudio().spatial.setListener(this.player.position, this.player.velocity);

    const activeSentinels = this.sentinels.filter(s => s.isActive && Vector2D.distance(this.player.position, s.position) < 320).length;
    const bossTension = (this.boss && this.boss.isActive) ? 0.65 : 0.0;
    this.engine.getAudio().setCombatTension(Math.min(1.0, 0.1 + activeSentinels * 0.25 + bossTension));

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

    // Update Stone Rakshasa Sthula
    if (this.stoneRakshasa && this.stoneRakshasa.isActive) {
      if (this.currentAct >= 2 && Vector2D.distance(this.player.position, this.stoneRakshasa.position) <= 450) {
        const sw = this.stoneRakshasa.updateAI(this.player.position, dt);
        if (sw) this.shockwaves.push(sw);
      }
      this.stoneRakshasa.update(dt);
    }

    // Update Boss if spawned & harvest events
    if (this.boss && this.boss.isActive) {
      this.boss.updateAI(this.player.position, dt);
      this.boss.update(dt);

      while (this.boss.pendingEvents.length > 0) {
        const ev = this.boss.pendingEvents.shift()!;
        if (ev.shockwaves) this.shockwaves.push(...ev.shockwaves);
        if (ev.projectiles) this.enemyProjectiles.push(...ev.projectiles);
      }

      // Check Boss Charge Impact with Player
      if (this.boss.isCharging && this.boss.chargeWindupTimer <= 0) {
        if (this.boss.bounds.intersects(this.player.bounds)) {
          if (this.player.isGuarding) {
            this.player.takeDamage(12);
            this.engine.getAudio().playFoleyImpact('BRONZE', 'BLOCK');
          } else {
            this.player.takeDamage(32);
            this.engine.getAudio().playEnemyHit();
          }
          if (this.player.health <= 0) this.isGameOver = true;
        }
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);
      if (sw.checkPlayerHit(this.player.position, this.player.isDashing)) {
        if (this.player.isGuarding) {
          this.player.takeDamage(sw.damage * 0.35);
          this.engine.getAudio().playFoleyImpact('BRONZE', 'BLOCK');
        } else {
          this.player.takeDamage(sw.damage);
          this.engine.getAudio().playEnemyHit();
        }
        if (this.player.health <= 0) this.isGameOver = true;
      }
      if (!sw.isActive) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Enemy Projectiles with Perfect Parry Deflection
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const proj = this.enemyProjectiles[i];
      proj.update(dt);

      if (proj.bounds.intersects(this.player.bounds)) {
        // Perfect parry deflection window (120ms)
        if (this.player.parryWindowTimer > 0) {
          this.player.score += 200;
          this.damageNumbers.spawn(this.player.position.x, this.player.position.y - 30, 'DEFLECTED!', '#FFD700');
          CelestialVFX.getInstance().emitShockwave(this.player.position, 120, '#FFD700', '#00E5FF');
          this.engine.getAudio().playFoleyImpact('CELESTIAL_GOLD', 'PARRY');
          this.engine.getRenderer().getCamera().triggerShake(6.0, 0.15);

          // Reverse velocity and magnify into counter-projectile
          proj.velocity.scale(-1.4);
          proj.damage = Math.round(proj.damage * 1.5);
          this.enemyProjectiles.splice(i, 1);
          this.playerProjectiles.push(proj);
          continue;
        }

        // Check hit on player
        if (this.player.isGuarding) {
          this.player.takeDamage(proj.damage * 0.35);
          this.engine.getAudio().playFoleyImpact('BRONZE', 'BLOCK');
        } else {
          this.player.takeDamage(proj.damage);
          this.engine.getAudio().playEnemyHit();
        }
        proj.destroy();
        this.enemyProjectiles.splice(i, 1);
        if (this.player.health <= 0) this.isGameOver = true;
        continue;
      }

      if (!proj.isActive) {
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // Update Player Projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      p.update(dt);

      // Hit Sentinels
      for (const s of this.sentinels) {
        if (s.isActive && s.bounds.intersects(p.bounds)) {
          s.takeDamage(p.damage);
          this.damageNumbers.spawn(s.position.x, s.position.y - 20, p.damage.toString(), '#38BDF8');
          p.destroy();
          if (!s.isActive) {
            this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'corrupted_sentinel', 1);
            this.player.score += 200;
          }
          break;
        }
      }

      // Hit Stone Rakshasa Sthula
      if (this.stoneRakshasa && this.stoneRakshasa.isActive && this.stoneRakshasa.bounds.intersects(p.bounds)) {
        this.stoneRakshasa.takeDamage(p.damage, 15);
        this.damageNumbers.spawn(this.stoneRakshasa.position.x, this.stoneRakshasa.position.y - 20, p.damage.toString(), '#38BDF8');
        p.destroy();
        if (this.stoneRakshasa.health <= 0) {
          this.stoneRakshasa.destroy();
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'stone_rakshasa', 1);
        }
      }

      // Hit Mahishasura Boss
      if (this.boss && this.boss.isActive && this.boss.bounds.intersects(p.bounds)) {
        this.boss.takeDamage(p.damage);
        this.damageNumbers.spawn(this.boss.position.x, this.boss.position.y - 20, p.damage.toString(), '#FFD700');
        p.destroy();
        if (this.boss.health <= 0) {
          this.boss.destroy();
          this.questManager.triggerObjectiveEvent('DEFEAT_TARGET', 'boss_mahishasura', 1);
          this.handleChapterVictory();
        }
      }

      if (!p.isActive) {
        this.playerProjectiles.splice(i, 1);
      }
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();

    // World Pass with Camera Transform
    renderer.beginWorldPass();

    // 1. Render World Environment
    this.renderWorldEnvironment(ctx);

    // 2. Render Checkpoint Monolith
    this.renderCheckpoint(ctx);

    // 3. Render Props & Shards
    this.altar.render(renderer);
    for (const s of this.shards) s.render(renderer);
    for (const sen of this.sentinels) sen.render(renderer);
    this.vanaraScout.render(renderer);
    if (this.stoneRakshasa && this.stoneRakshasa.isActive) {
      this.stoneRakshasa.render(renderer);
    }
    this.pillarOm.render(renderer);
    this.pillarKrim.render(renderer);

    if (this.boss && this.boss.isActive) {
      this.boss.render(renderer);
    }

    // 4. Render Projectiles & Shockwaves
    for (const sw of this.shockwaves) sw.render(renderer);
    for (const p of this.playerProjectiles) p.render(renderer);
    for (const ep of this.enemyProjectiles) ep.render(renderer);

    // 5. Render Player
    this.player.render(renderer);

    // 6. Particles, CelestialVFX & Damage Numbers
    this.particles.render(ctx, new Vector2D(0, 0));
    CelestialVFX.getInstance().render(renderer);
    this.damageNumbers.render(renderer);

    renderer.endWorldPass();

    // 7. Cinematic & Dialogue Overlays (Screen-Space Pass)
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

    const texBackdrop =
      AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_BACKDROP) ||
      AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_SKY);
    const texFloor =
      AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_FLOOR) ||
      AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_FLOOR);
    const texLava = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_LAVA);
    const texBridge = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_BRIDGE);
    const texTorana = AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_TORANA);
    const texPillar = AssetManager.getInstance().getTexture(ASSET_IDS.SANCTUM_PILLAR);
    const texCliff = AssetManager.getInstance().getTexture(ASSET_IDS.BHUMI_CLIFF);

    // 1. Deep Subterranean Parallax / Volcanic Cavern Backdrop
    if (texBackdrop && (texBackdrop as any).naturalWidth) {
      ctx.drawImage(texBackdrop as HTMLImageElement, -1200, -1800, 2400, 2400);
    } else {
      ctx.fillStyle = '#080C14';
      ctx.fillRect(-1200, -1800, 2400, 2400);
    }

    // 2. Basalt & Granite Paved Sacred Causeway (-220 to +220 X, -1600 to +500 Y)
    if (texFloor && (texFloor as any).naturalWidth) {
      const ptrn = ctx.createPattern(texFloor as HTMLImageElement, 'repeat');
      if (ptrn) {
        ctx.fillStyle = ptrn;
        ctx.fillRect(-220, -1600, 440, 2100);
      }
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(-220, -1600, 440, 2100);
    }

    // Outer Sanctum Courtyard Base (Y: -220 to +450)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(-500, -220, 1000, 680);

    // Decorative Golden Mandala Inlays on the Floor
    // Surya Kund Altar Dais (0, 80)
    SacredGeometry.drawMandala(ctx, 0, 80, 140, 12, 0, 'rgba(255, 183, 3, 0.25)', 1.5);
    SacredGeometry.drawSriYantraCentral(ctx, 0, 80, 50, 'rgba(0, 229, 255, 0.35)', 1);

    // Torana Threshold Mandala (0, -220)
    SacredGeometry.drawMandala(ctx, 0, -220, 90, 8, Math.PI / 4, 'rgba(245, 158, 11, 0.3)', 1.2);

    // Brahmic Ridge Mandala (0, -750)
    SacredGeometry.drawMandala(ctx, 0, -750, 110, 10, 0, 'rgba(217, 119, 6, 0.3)', 1.2);

    // Caldera Obsidian Dais Mandala (0, -1350)
    SacredGeometry.drawMandala(ctx, 0, -1350, 160, 16, -Math.PI / 8, 'rgba(239, 68, 68, 0.3)', 2);

    // Causeway Edge Curbs & Carved Hoysala Border Inlays
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-220, 460);
    ctx.lineTo(-220, -920);
    ctx.moveTo(220, 460);
    ctx.lineTo(220, -920);
    ctx.stroke();

    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-220, -1080);
    ctx.lineTo(-220, -1600);
    ctx.moveTo(220, -1080);
    ctx.lineTo(220, -1600);
    ctx.stroke();

    // 3. Great Molten Lava Chasm (-920 to -1080 Y)
    if (texLava && (texLava as any).naturalWidth) {
      const lavaPtrn = ctx.createPattern(texLava as HTMLImageElement, 'repeat');
      if (lavaPtrn) {
        ctx.fillStyle = lavaPtrn;
        ctx.fillRect(-1000, -1080, 2000, 160);
      }
    } else {
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(-1000, -1080, 2000, 160);
    }

    // Glowing Lava Thermal Heat Fog
    const lavaGrad = ctx.createLinearGradient(0, -1080, 0, -920);
    lavaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    lavaGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)');
    lavaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(-1000, -1080, 2000, 160);

    // 4. Ancient Chiseled Granite Bridge Spanning the Chasm (Center X: 0, Width: 180)
    if (texBridge && (texBridge as any).naturalWidth) {
      ctx.drawImage(texBridge as HTMLImageElement, -90, -1080, 180, 160);
    } else {
      ctx.fillStyle = '#374151';
      ctx.fillRect(-90, -1080, 180, 160);
    }

    // Bridge Balustrades
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-95, -1080, 10, 160);
    ctx.fillRect(85, -1080, 10, 160);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-95, -1080, 10, 160);
    ctx.strokeRect(85, -1080, 10, 160);

    // Tamas Void Barrier or Golden Consecration Aura on the Bridge
    const bridgeUnlocked = this.questManager.getFlag('chasm_bridge_accessible', false);
    if (!bridgeUnlocked) {
      ctx.fillStyle = 'rgba(76, 5, 25, 0.82)';
      ctx.fillRect(-90, -1080, 180, 160);

      // Void runes
      SacredGeometry.drawSriYantraCentral(ctx, 0, -1000, 36, 'rgba(239, 68, 68, 0.85)', 1.5);
      ctx.fillStyle = '#FCA5A5';
      ctx.font = 'bold 10px "Cinzel", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAMASIC VOID BARRIER', 0, -1015);
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText('HARMONIZE BRAHMIC PILLARS TO DISSOLVE', 0, -995);
    } else {
      // Golden Bridge Cleansed Aura
      ctx.fillStyle = 'rgba(255, 183, 3, 0.2)';
      ctx.fillRect(-90, -1080, 180, 160);
    }

    // 5. Torana Gateway Structure (Y = -220)
    if (texTorana && (texTorana as any).naturalWidth) {
      ctx.drawImage(texTorana as HTMLImageElement, -160, -260, 320, 80);
    } else {
      ctx.fillStyle = '#B45309';
      ctx.fillRect(-150, -250, 30, 60);
      ctx.fillRect(120, -250, 30, 60);
      ctx.fillRect(-160, -264, 320, 18);
    }

    // 6. Hoysala Carved Pillars flanking key landmarks
    const pillarPositions = [
      { x: -160, y: 80 },
      { x: 160, y: 80 },
      { x: -180, y: -450 },
      { x: 180, y: -450 },
      { x: -160, y: -1350 },
      { x: 160, y: -1350 },
    ];

    pillarPositions.forEach((p) => {
      if (texPillar && (texPillar as any).naturalWidth) {
        ctx.drawImage(texPillar as HTMLImageElement, p.x - 22, p.y - 48, 44, 96);
      } else {
        ctx.fillStyle = '#4B5563';
        ctx.fillRect(p.x - 16, p.y - 36, 32, 72);
      }

      // Brazier flame on top
      ctx.fillStyle = '#FFB703';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 44, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Caldera Cliff Walls (Obsidian Throne enclosing perimeter)
    if (texCliff && (texCliff as any).naturalWidth) {
      ctx.drawImage(texCliff as HTMLImageElement, -600, -1620, 380, 220);
      ctx.drawImage(texCliff as HTMLImageElement, 220, -1620, 380, 220);
    }

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
    const vp = this.engine.getRenderer().getViewport();
    ctx.save();

    const hudX = 20;
    const hudY = 104;

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

    // Relationship & Moral Affinity Card (stacked below CODEX/PAUSE buttons)
    const affX = vp.width - 210;
    const affY = 96;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(affX, affY, 190, 68, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.textAlign = 'left';
    ctx.fillText(`TARA AFFINITY: +${this.questManager.relationships.taraAffinity}`, affX + 12, affY + 20);
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`VANARA TRUST: +${this.questManager.relationships.vanaraTrust}`, affX + 12, affY + 38);
    ctx.fillStyle = '#A78BFA';
    ctx.fillText(`KARMIC BALANCE: +${this.questManager.relationships.karmicBalance}`, affX + 12, affY + 56);

    ctx.restore();
  }

  private renderQuestLogModal(ctx: CanvasRenderingContext2D): void {
    const vp = this.engine.getRenderer().getViewport();
    ctx.save();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.font = 'bold 28px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#FFB703';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPAIGN QUEST CHRONICLE', vp.width / 2, 70);

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
      ctx.roundRect(vp.width / 2 - 280, cardY, 560, 65, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = isComplete ? '#34D399' : isActive ? '#FFD166' : '#94A3B8';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillText(`[ ${status} ] ${m.title}`, vp.width / 2 - 260, cardY + 26);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(m.description, vp.width / 2 - 260, cardY + 48);
    });

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Press [ O / TAB ] to Close Quest Chronicle', vp.width / 2, vp.height - 35);

    ctx.restore();
  }

  private renderVictoryOverlay(ctx: CanvasRenderingContext2D): void {
    const vp = this.engine.getRenderer().getViewport();
    ctx.save();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#F59E0B';
    ctx.textAlign = 'center';
    ctx.fillText('CHAPTER I COMPLETED', vp.width / 2, vp.height / 2 - 70);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('The Dawning Flare of Dandaka has been restored.', vp.width / 2, vp.height / 2 - 25);
    ctx.fillText(`Final Moral Karmic Balance: +${this.questManager.relationships.karmicBalance}`, vp.width / 2, vp.height / 2 + 5);

    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = '#34D399';
    ctx.fillText('Pathway to Floating Sky Citadels of Vayu Unlocked!', vp.width / 2, vp.height / 2 + 50);

    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Press [ R ] to Replay Chapter  |  [ ESC / M ] Return to Title', vp.width / 2, vp.height / 2 + 95);

    ctx.restore();
  }

  private renderDefeatOverlay(ctx: CanvasRenderingContext2D): void {
    const vp = this.engine.getRenderer().getViewport();
    ctx.save();

    ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
    ctx.fillRect(0, 0, vp.width, vp.height);

    ctx.font = 'bold 34px "Cinzel", serif';
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'center';
    ctx.fillText('FALLEN IN SCRIPTED MISSION', vp.width / 2, vp.height / 2 - 30);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText('Press [ R ] to Respawn at Chapter Checkpoint  |  [ ESC / M ] Return to Menu', vp.width / 2, vp.height / 2 + 25);

    ctx.restore();
  }
}
