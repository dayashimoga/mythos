import { IScene } from './SceneManager';
import { IGameEngine } from '../engine/Engine';
import { IRenderer } from '../render/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { DialogueBox, DialogueNode } from '../ui/DialogueBox';
import { SacredGeometry } from '../render/SacredGeometry';
import { CharacterDefinitions } from '../animation/CharacterDefinitions';
import { CharacterRig } from '../animation/CharacterRig';

export class StoryScene implements IScene {
  public readonly id = 'StoryScene';
  private engine!: IGameEngine;
  private dialogueBox: DialogueBox = new DialogueBox();
  private animTimer = 0;

  public deviTaraRig: CharacterRig = CharacterDefinitions.createDeviTaraRig();
  public veerRig: CharacterRig = CharacterDefinitions.createVeerRig();

  private storyScript: DialogueNode[] = [
    {
      speaker: 'Devi Tara',
      speakerRole: 'Celestial Oracle of Tapas',
      portraitColor: '#00E5FF',
      text: 'Arise, Child of the Sun. The Wheel of Time falters upon its axis. The seal of Surya has shattered, and Tamas claims the thresholds of the realm.',
    },
    {
      speaker: 'Veer',
      speakerRole: 'Solar Guardian',
      portraitColor: '#FFB703',
      text: 'The Sanctum... has the corruption of Mahisha reached this sacred ground? My gauntlet pulses with turbulent heat.',
    },
    {
      speaker: 'Devi Tara',
      speakerRole: 'Celestial Oracle of Tapas',
      portraitColor: '#00E5FF',
      text: 'The sentinels have fallen into shadow slumber. Gather the three radiant Astra Shards scattered across this chamber. Bring them to the Sun Altar and rekindle the primal flame.',
    },
    {
      speaker: 'Veer',
      speakerRole: 'Solar Guardian',
      portraitColor: '#FFB703',
      text: 'The flame will not die while I draw breath. For the light of Rta—I shall calibrate the Sanctum!',
    },
  ];

  public onEnter(engine: IGameEngine): void {
    this.engine = engine;
    this.animTimer = 0;

    const vp = engine.getRenderer().getViewport();
    this.deviTaraRig.position.set(vp.width / 2 - 280, vp.height / 2 + 10);
    this.deviTaraRig.scale = 1.25;
    this.deviTaraRig.facing = 1;

    this.veerRig.position.set(vp.width / 2 + 280, vp.height / 2 + 10);
    this.veerRig.scale = 1.25;
    this.veerRig.facing = -1;

    this.dialogueBox.start(this.storyScript, () => {
      this.engine.getAudio().playAltarResonate();
      this.engine.getSceneManager().switchTo('GameScene');
    });
  }

  public onExit(): void {
    const camera = this.engine.getRenderer().getCamera();
    camera.reset(0, 0, 1.0);
  }

  public update(dt: number): void {
    this.animTimer += dt;
    this.dialogueBox.update(dt);
    this.deviTaraRig.update(dt);
    this.veerRig.update(dt);
  }

  public render(renderer: IRenderer): void {
    const vp = renderer.getViewport();
    const ctx = renderer.getContext();
    renderer.clear('#080C14');

    const cx = vp.width / 2;
    const cy = vp.height / 2;

    // Atmospheric cosmic aura
    SacredGeometry.drawMandala(ctx, cx, cy - 80, 180, 12, this.animTimer * 0.1, 'rgba(0, 229, 255, 0.12)', 1);
    SacredGeometry.drawSriYantraCentral(ctx, cx, cy - 80, 60, 'rgba(255, 183, 3, 0.3)', 0.5);

    // Render Conversational Character Rigs
    this.deviTaraRig.render(renderer);
    this.veerRig.render(renderer);

    // Chapter Title
    renderer.drawText(
      'ACT I : PROLOGUE OF THE ASTRAL ANCHOR',
      cx,
      cy - 160,
      'bold 14px "Cinzel", Georgia, serif',
      '#FFD166',
      'center'
    );

    // Dialogue Overlay
    this.dialogueBox.render(renderer);
  }

  public handleInput(input: InputManager): void {
    if (input.isActionJustPressed('PAUSE') || input.isKeyJustPressed('KeyQ')) {
      this.engine.getSceneManager().switchTo('SplashScene');
      return;
    }

    if (
      input.isActionJustPressed('DASH') ||
      input.isActionJustPressed('ATTACK') ||
      input.isActionJustPressed('INTERACT')
    ) {
      this.engine.getAudio().playShardPickup();
      this.dialogueBox.advance();
    }
  }
}
