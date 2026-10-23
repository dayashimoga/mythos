import { Skeleton } from './Skeleton';
import { Bone } from './Bone';
import { AnimationClip } from './AnimationClip';
import { NumberTrack } from './KeyframeTrack';
import { BlendTree1D } from './BlendTree1D';
import { AnimationStateMachine } from './AnimationStateMachine';
import { CharacterRig, RigRenderDelegate } from './CharacterRig';
import { Transform2D } from './Transform2D';
import { SacredGeometry } from '../render/SacredGeometry';
import { IRenderer } from '../render/CanvasRenderer';
import { AssetManager } from '../assets/AssetManager';
import { ASSET_IDS } from '../assets/AssetManifest';

function isDrawableTexture(tex: unknown): tex is CanvasImageSource {
  if (!tex) return false;
  if (typeof HTMLImageElement !== 'undefined' && tex instanceof HTMLImageElement) {
    return tex.complete && tex.naturalWidth > 0;
  }
  if (typeof HTMLCanvasElement !== 'undefined' && tex instanceof HTMLCanvasElement) {
    return tex.width > 0 && tex.height > 0;
  }
  return false;
}

function safeClipRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  if (typeof ctx.clip === 'function') {
    ctx.clip();
  }
}

function safeStrokeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.stroke();
}

export class CharacterDefinitions {
  // =========================================================================
  // 1. SOLAR GUARDIAN VEER RIG (18 BONES)
  // =========================================================================
  public static createVeerRig(): CharacterRig {
    const skel = new Skeleton('Veer_Skeleton');

    // Bone Hierarchy
    const root = new Bone('root', 0, 0, 0, 10);
    const pelvis = new Bone('pelvis', 0, -28, 0, 12);
    const spine01 = new Bone('spine_01', 0, -14, 0, 14);
    const spine02 = new Bone('spine_02', 0, -14, 0, 14);
    const chest = new Bone('chest', 0, -14, 0, 12);
    const neck = new Bone('neck', 0, -8, 0, 8);
    const head = new Bone('head', 0, -10, 0, 16);

    // Arms
    const shoulderL = new Bone('shoulder_l', -14, -6, 0, 8);
    const armL = new Bone('arm_l', -8, 0, Math.PI * 0.45, 16);
    const forearmL = new Bone('forearm_l', 16, 0, 0.1, 14);
    const handL = new Bone('hand_l', 14, 0, 0, 8);

    const shoulderR = new Bone('shoulder_r', 14, -6, 0, 8);
    const armR = new Bone('arm_r', 8, 0, -Math.PI * 0.45, 16);
    const forearmR = new Bone('forearm_r', 16, 0, -0.1, 14);
    const handR = new Bone('hand_r', 14, 0, 0, 8);

    // Legs
    const thighL = new Bone('thigh_l', -8, 4, Math.PI * 0.5, 18);
    const shinL = new Bone('shin_l', 18, 0, 0, 18);
    const footL = new Bone('foot_l', 18, 0, -Math.PI * 0.5, 8);

    const thighR = new Bone('thigh_r', 8, 4, Math.PI * 0.5, 18);
    const shinR = new Bone('shin_r', 18, 0, 0, 18);
    const footR = new Bone('foot_r', 18, 0, -Math.PI * 0.5, 8);

    // Assemble skeleton
    skel.addBone(root);
    skel.addBone(pelvis, 'root');
    skel.addBone(spine01, 'pelvis');
    skel.addBone(spine02, 'spine_01');
    skel.addBone(chest, 'spine_02');
    skel.addBone(neck, 'chest');
    skel.addBone(head, 'neck');

    skel.addBone(shoulderL, 'chest');
    skel.addBone(armL, 'shoulder_l');
    skel.addBone(forearmL, 'arm_l');
    skel.addBone(handL, 'forearm_l');

    skel.addBone(shoulderR, 'chest');
    skel.addBone(armR, 'shoulder_r');
    skel.addBone(forearmR, 'arm_r');
    skel.addBone(handR, 'forearm_r');

    skel.addBone(thighL, 'pelvis');
    skel.addBone(shinL, 'thigh_l');
    skel.addBone(footL, 'shin_l');

    skel.addBone(thighR, 'pelvis');
    skel.addBone(shinR, 'thigh_r');
    skel.addBone(footR, 'shin_r');

    // Register Sockets
    skel.registerSocket('socket_right_hand', 'hand_r', new Transform2D(10, 0, 0));
    skel.registerSocket('socket_left_hand', 'hand_l', new Transform2D(8, 0, 0));
    skel.registerSocket('socket_forehead', 'head', new Transform2D(0, -12, 0));
    skel.registerSocket('socket_chest', 'chest', new Transform2D(0, 0, 0));

    // Animation Clips
    // 1. Idle (2.4s)
    const idleClip = new AnimationClip('idle', 2.4, true);
    const idleSpine = new NumberTrack('spine_01.rotation', 'hermite')
      .addKeyframe(0, 0)
      .addKeyframe(1.2, -0.04)
      .addKeyframe(2.4, 0);
    const idleHead = new NumberTrack('head.rotation', 'hermite')
      .addKeyframe(0, 0)
      .addKeyframe(1.2, 0.03)
      .addKeyframe(2.4, 0);
    const idleArmL = new NumberTrack('arm_l.rotation', 'hermite')
      .addKeyframe(0, Math.PI * 0.45)
      .addKeyframe(1.2, Math.PI * 0.48)
      .addKeyframe(2.4, Math.PI * 0.45);
    const idleArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.45)
      .addKeyframe(1.2, -Math.PI * 0.42)
      .addKeyframe(2.4, -Math.PI * 0.45);
    idleClip.addRotationTrack('spine_01', idleSpine);
    idleClip.addRotationTrack('head', idleHead);
    idleClip.addRotationTrack('arm_l', idleArmL);
    idleClip.addRotationTrack('arm_r', idleArmR);

    // 2. Walk (1.0s)
    const walkClip = new AnimationClip('walk', 1.0, true);
    const walkThighL = new NumberTrack('thigh_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 - 0.4)
      .addKeyframe(0.5, Math.PI * 0.5 + 0.4)
      .addKeyframe(1.0, Math.PI * 0.5 - 0.4);
    const walkThighR = new NumberTrack('thigh_r.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 + 0.4)
      .addKeyframe(0.5, Math.PI * 0.5 - 0.4)
      .addKeyframe(1.0, Math.PI * 0.5 + 0.4);
    const walkArmL = new NumberTrack('arm_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.45 + 0.35)
      .addKeyframe(0.5, Math.PI * 0.45 - 0.35)
      .addKeyframe(1.0, Math.PI * 0.45 + 0.35);
    const walkArmR = new NumberTrack('arm_r.rotation', 'linear')
      .addKeyframe(0, -Math.PI * 0.45 - 0.35)
      .addKeyframe(0.5, -Math.PI * 0.45 + 0.35)
      .addKeyframe(1.0, -Math.PI * 0.45 - 0.35);
    walkClip.addRotationTrack('thigh_l', walkThighL);
    walkClip.addRotationTrack('thigh_r', walkThighR);
    walkClip.addRotationTrack('arm_l', walkArmL);
    walkClip.addRotationTrack('arm_r', walkArmR);
    walkClip.addEvent(0.25, 'footstep_l');
    walkClip.addEvent(0.75, 'footstep_r');

    // 3. Run (0.65s)
    const runClip = new AnimationClip('run', 0.65, true);
    const runThighL = new NumberTrack('thigh_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 - 0.7)
      .addKeyframe(0.325, Math.PI * 0.5 + 0.7)
      .addKeyframe(0.65, Math.PI * 0.5 - 0.7);
    const runThighR = new NumberTrack('thigh_r.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 + 0.7)
      .addKeyframe(0.325, Math.PI * 0.5 - 0.7)
      .addKeyframe(0.65, Math.PI * 0.5 + 0.7);
    const runSpine = new NumberTrack('spine_01.rotation', 'linear')
      .addKeyframe(0, 0.15)
      .addKeyframe(0.325, 0.12)
      .addKeyframe(0.65, 0.15);
    runClip.addRotationTrack('thigh_l', runThighL);
    runClip.addRotationTrack('thigh_r', runThighR);
    runClip.addRotationTrack('spine_01', runSpine);
    runClip.addEvent(0.16, 'footstep_l');
    runClip.addEvent(0.48, 'footstep_r');

    // 4. Melee Slash (0.35s)
    const slashClip = new AnimationClip('melee_slash', 0.35, false);
    const slashArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.7) // Windup
      .addKeyframe(0.12, Math.PI * 0.4) // Forward slash
      .addKeyframe(0.35, -Math.PI * 0.45); // Return
    const slashSpine = new NumberTrack('spine_01.rotation', 'hermite')
      .addKeyframe(0, -0.2)
      .addKeyframe(0.12, 0.3)
      .addKeyframe(0.35, 0);
    slashClip.addRotationTrack('arm_r', slashArmR);
    slashClip.addRotationTrack('spine_01', slashSpine);
    slashClip.addEvent(0.12, 'slash_hitbox');

    // 5. Dash (0.28s)
    const dashClip = new AnimationClip('dash', 0.28, false);
    const dashSpine = new NumberTrack('spine_01.rotation', 'linear')
      .addKeyframe(0, 0.4)
      .addKeyframe(0.28, 0);
    dashClip.addRotationTrack('spine_01', dashSpine);

    // 6. Hurt (0.22s)
    const hurtClip = new AnimationClip('hurt', 0.22, false);
    const hurtHead = new NumberTrack('head.rotation', 'linear')
      .addKeyframe(0, -0.3)
      .addKeyframe(0.22, 0);
    hurtClip.addRotationTrack('head', hurtHead);

    // Locomotion Blend Tree
    const locoBlend = new BlendTree1D('Locomotion', 'speed');
    locoBlend.addEntry(0.0, idleClip);
    locoBlend.addEntry(0.4, walkClip);
    locoBlend.addEntry(1.0, runClip);

    // State Machine
    const asm = new AnimationStateMachine();
    asm.addState('Locomotion', locoBlend);
    asm.addState('MeleeSlash', slashClip);
    asm.addState('Dash', dashClip);
    asm.addState('Hurt', hurtClip);

    asm.addTransition('Locomotion', 'MeleeSlash', 0.08, (p) => p.get('trigger_slash') === true);
    asm.addTransition('MeleeSlash', 'Locomotion', 0.12, undefined, true);

    asm.addTransition('Locomotion', 'Dash', 0.06, (p) => p.get('trigger_dash') === true);
    asm.addTransition('Dash', 'Locomotion', 0.1, undefined, true);

    asm.addTransition('*', 'Hurt', 0.05, (p) => p.get('trigger_hurt') === true);
    asm.addTransition('Hurt', 'Locomotion', 0.1, undefined, true);

    // Visual Render Delegate
    const renderDelegate: RigRenderDelegate = (renderer: IRenderer, rig: CharacterRig) => {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.translate(rig.position.x, rig.position.y);
      ctx.scale(rig.facing * rig.scale, rig.scale);

      // 0. Soft Ground Contact Shadow
      const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 32);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Check for production character artwork
      const texture = AssetManager.getInstance().getTexture(ASSET_IDS.CHAR_VEER);
      const spineBone = rig.skeleton.getBone('spine_01');
      const swayY = spineBone ? spineBone.localTransform.rotation * 10 : 0;

      if (isDrawableTexture(texture)) {
        const w = 84;
        const h = 106;
        const x = -w / 2;
        const y = -h + 10 + swayY;

        // Surya halo background behind hero
        SacredGeometry.drawMandala(ctx, 0, y + 26, 24, 8, rig.stateMachine.stateTime * 0.3, 'rgba(255, 183, 3, 0.25)', 1.2);

        // Character Artwork with rounded corners
        ctx.save();
        safeClipRoundRect(ctx, x, y, w, h, 10);
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(texture, x, y, w, h);
        }

        // Hit reaction flinch tint
        if (rig.expression === 'hurt') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fillRect(x, y, w, h);
        }
        ctx.restore();

        // Golden Trim / Silhouette Rim Frame
        ctx.strokeStyle = rig.expression === 'hurt' ? '#EF476F' : 'rgba(255, 209, 102, 0.65)';
        ctx.lineWidth = 2;
        safeStrokeRoundRect(ctx, x, y, w, h, 10);
      } else {
        const skinTone = rig.expression === 'hurt' ? '#FF9E9E' : '#DDA15E';
        const dhotiColor = '#9B2226';
        const goldTrim = '#FFD166';

        // 1. Torso & Dhoti
        ctx.fillStyle = dhotiColor;
        ctx.beginPath();
        ctx.moveTo(-10, -28);
        ctx.lineTo(10, -28);
        ctx.lineTo(14, 0);
        ctx.lineTo(-14, 0);
        ctx.closePath();
        ctx.fill();

        // Gold dhoti embroidery
        ctx.strokeStyle = goldTrim;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Upper Torso
        ctx.fillStyle = skinTone;
        ctx.fillRect(-9, -56, 18, 28);

        // Surya Chest Medallion
        SacredGeometry.drawMandala(ctx, 0, -44, 7, 6, 0, '#FFB703', 1.5);

        // 2. Head & Facial Features
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        ctx.roundRect(-8, -80, 16, 20, 6);
        ctx.fill();

        // Warrior Topknot (Shikha)
        ctx.fillStyle = '#11141A';
        ctx.beginPath();
        ctx.arc(0, -82, 6, 0, Math.PI * 2);
        ctx.fill();

        // Gold Hair Ring
        ctx.strokeStyle = '#FFB703';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -82, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Golden Tripundra Forehead Mark
        ctx.strokeStyle = '#FFD166';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-4, -74);
        ctx.lineTo(4, -74);
        ctx.moveTo(-4, -72);
        ctx.lineTo(4, -72);
        ctx.stroke();

        // Amber Eyes
        ctx.fillStyle = '#FB8500';
        ctx.beginPath();
        ctx.arc(3, -69, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Dynamic Surya-Kripana Weapon on Socket
      const weaponSocket = rig.skeleton.getSocketTransform('socket_right_hand');
      if (weaponSocket) {
        ctx.save();
        ctx.translate(weaponSocket.position.x - rig.position.x, weaponSocket.position.y - rig.position.y);
        ctx.rotate(weaponSocket.rotation);

        // Curved Gold Sun Blade
        ctx.fillStyle = '#FFB703';
        ctx.strokeStyle = '#FFE3A8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.quadraticCurveTo(16, -6, 28, -16);
        ctx.quadraticCurveTo(20, 2, 0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Prana Solar Slash Trail
        if (rig.stateMachine.currentState?.name === 'MeleeSlash') {
          ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(14, -6, 20, -0.6, 0.9);
          ctx.stroke();
        }

        // Hilt & Gem
        ctx.fillStyle = '#9B2226';
        ctx.fillRect(-6, -2, 6, 4);
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(-2, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    };

    return new CharacterRig('veer', skel, asm, renderDelegate);
  }

  // =========================================================================
  // 2. DEVI TARA RIG (20 BONES)
  // =========================================================================
  public static createDeviTaraRig(): CharacterRig {
    const skel = new Skeleton('DeviTara_Skeleton');

    const root = new Bone('root', 0, 0, 0, 10);
    const pelvis = new Bone('pelvis', 0, -32, 0, 12);
    const spine = new Bone('spine', 0, -16, 0, 14);
    const chest = new Bone('chest', 0, -16, 0, 12);
    const neck = new Bone('neck', 0, -10, 0, 8);
    const head = new Bone('head', 0, -12, 0, 16);

    const shoulderL = new Bone('shoulder_l', -12, -6, 0, 8);
    const armL = new Bone('arm_l', -8, 0, Math.PI * 0.4, 16);
    const forearmL = new Bone('forearm_l', 16, 0, 0.2, 14);
    const handL = new Bone('hand_l', 14, 0, 0, 8);

    const shoulderR = new Bone('shoulder_r', 12, -6, 0, 8);
    const armR = new Bone('arm_r', 8, 0, -Math.PI * 0.4, 16);
    const forearmR = new Bone('forearm_r', 16, 0, -0.2, 14);
    const handR = new Bone('hand_r', 14, 0, 0, 8);

    // Floating Celestial Veil & Silk Robes
    const dressCenter = new Bone('dress_center', 0, 12, 0, 20);
    const dressHem = new Bone('dress_hem', 0, 20, 0, 16);
    const veilLeft = new Bone('veil_left', -16, -10, 0.2, 24);
    const veilRight = new Bone('veil_right', 16, -10, -0.2, 24);

    skel.addBone(root);
    skel.addBone(pelvis, 'root');
    skel.addBone(spine, 'pelvis');
    skel.addBone(chest, 'spine');
    skel.addBone(neck, 'chest');
    skel.addBone(head, 'neck');

    skel.addBone(shoulderL, 'chest');
    skel.addBone(armL, 'shoulder_l');
    skel.addBone(forearmL, 'arm_l');
    skel.addBone(handL, 'forearm_l');

    skel.addBone(shoulderR, 'chest');
    skel.addBone(armR, 'shoulder_r');
    skel.addBone(forearmR, 'arm_r');
    skel.addBone(handR, 'forearm_r');

    skel.addBone(dressCenter, 'pelvis');
    skel.addBone(dressHem, 'dress_center');
    skel.addBone(veilLeft, 'chest');
    skel.addBone(veilRight, 'chest');

    skel.registerSocket('socket_bindi', 'head', new Transform2D(0, -10, 0));
    skel.registerSocket('socket_halo', 'chest', new Transform2D(0, -20, 0));

    // Animation Clips
    // 1. Celestial Float Idle (3.2s)
    const floatIdle = new AnimationClip('float_idle', 3.2, true);
    const floatPelvis = new NumberTrack('pelvis.rotation', 'hermite')
      .addKeyframe(0, 0)
      .addKeyframe(1.6, -0.05)
      .addKeyframe(3.2, 0);
    const floatVeilL = new NumberTrack('veil_left.rotation', 'hermite')
      .addKeyframe(0, 0.2)
      .addKeyframe(1.6, 0.4)
      .addKeyframe(3.2, 0.2);
    const floatVeilR = new NumberTrack('veil_right.rotation', 'hermite')
      .addKeyframe(0, -0.2)
      .addKeyframe(1.6, -0.4)
      .addKeyframe(3.2, -0.2);
    floatIdle.addRotationTrack('pelvis', floatPelvis);
    floatIdle.addRotationTrack('veil_left', floatVeilL);
    floatIdle.addRotationTrack('veil_right', floatVeilR);

    // 2. Abhaya Mudra Blessing (2.0s)
    const blessingClip = new AnimationClip('blessing_mudra', 2.0, false);
    const blessArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.4)
      .addKeyframe(0.6, -Math.PI * 0.75)
      .addKeyframe(1.6, -Math.PI * 0.75)
      .addKeyframe(2.0, -Math.PI * 0.4);
    blessingClip.addRotationTrack('arm_r', blessArmR);

    const asm = new AnimationStateMachine();
    asm.addState('FloatIdle', floatIdle);
    asm.addState('BlessingMudra', blessingClip);

    asm.addTransition('FloatIdle', 'BlessingMudra', 0.15, (p) => p.get('trigger_blessing') === true);
    asm.addTransition('BlessingMudra', 'FloatIdle', 0.2, undefined, true);

    const renderDelegate: RigRenderDelegate = (renderer: IRenderer, rig: CharacterRig) => {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.translate(rig.position.x, rig.position.y);
      ctx.scale(rig.facing * rig.scale, rig.scale);

      // 0. Soft Floating Shadow on Ground
      const floatY = Math.sin(rig.stateMachine.stateTime * 2.2) * 5;
      const shadowGrad = ctx.createRadialGradient(0, 12, 3, 0, 12, 28);
      shadowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
      shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 12, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Celestial Halo Rotating Mandala
      SacredGeometry.drawMandala(ctx, 0, -68 + floatY, 26, 8, rig.stateMachine.stateTime * 0.5, 'rgba(0, 229, 255, 0.45)', 1.5);

      // Check for production character artwork
      const texture = AssetManager.getInstance().getTexture(ASSET_IDS.CHAR_DEVI_TARA);

      if (isDrawableTexture(texture)) {
        const w = 84;
        const h = 108;
        const x = -w / 2;
        const y = -h + 8 + floatY;

        ctx.save();
        safeClipRoundRect(ctx, x, y, w, h, 12);
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(texture, x, y, w, h);
        }

        // Starlight blessing radiance
        if (rig.stateMachine.currentState?.name === 'BlessingMudra') {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
          ctx.fillRect(x, y, w, h);
        }
        ctx.restore();

        // Astral Cyan Rim Frame
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
        ctx.lineWidth = 1.8;
        safeStrokeRoundRect(ctx, x, y, w, h, 12);

        // Dynamic Blessing Mudra Mandala if active
        if (rig.stateMachine.currentState?.name === 'BlessingMudra') {
          SacredGeometry.drawMandala(ctx, 16, -45 + floatY, 18, 6, -rig.stateMachine.stateTime * 1.5, 'rgba(255, 215, 0, 0.8)', 2.0);
        }
      } else {
        // Flowing Celestial Robes (Midnight Blue to Cosmic Indigo)
        const grad = ctx.createLinearGradient(0, -60, 0, 10);
        grad.addColorStop(0, '#03045E');
        grad.addColorStop(0.5, '#4361EE');
        grad.addColorStop(1, '#00E5FF');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-12, -45);
        ctx.lineTo(12, -45);
        ctx.lineTo(18, 12);
        ctx.lineTo(-18, 12);
        ctx.closePath();
        ctx.fill();

        // Translucent Starlight Veil
        ctx.fillStyle = 'rgba(162, 210, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(-16, -55);
        ctx.quadraticCurveTo(-26, -20, -20, 20);
        ctx.quadraticCurveTo(-12, 0, -10, -40);
        ctx.closePath();
        ctx.fill();

        // Porcelain Face
        ctx.fillStyle = '#E0F2FE';
        ctx.beginPath();
        ctx.roundRect(-7, -76, 14, 18, 6);
        ctx.fill();

        // Silver-Lavender Celestial Hair
        ctx.fillStyle = '#C8B6FF';
        ctx.beginPath();
        ctx.arc(0, -78, 9, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Astral Bindi (Third Eye)
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(0, -70, 2, 0, Math.PI * 2);
        ctx.fill();

        // Celestial Eyes
        ctx.fillStyle = '#48CAE4';
        ctx.beginPath();
        ctx.arc(3, -67, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Socket Third Eye / Bindi radiance
      const bindiSocket = rig.skeleton.getSocketTransform('socket_bindi');
      if (bindiSocket) {
        ctx.save();
        ctx.translate(bindiSocket.position.x - rig.position.x, bindiSocket.position.y - rig.position.y);
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    return new CharacterRig('devi_tara', skel, asm, renderDelegate);
  }

  // =========================================================================
  // 3. STONE RAKSHASA ENFORCER RIG (15 BONES)
  // =========================================================================
  public static createRakshasaRig(): CharacterRig {
    const skel = new Skeleton('Rakshasa_Skeleton');

    const root = new Bone('root', 0, 0, 0, 10);
    const pelvis = new Bone('pelvis', 0, -24, 0, 14);
    const spine = new Bone('spine', 0, -20, 0, 16);
    const chest = new Bone('chest', 0, -20, 0, 18);
    const head = new Bone('head', 0, -16, 0, 18);

    const shoulderL = new Bone('shoulder_l', -22, -10, 0, 12);
    const armL = new Bone('arm_l', -12, 0, Math.PI * 0.4, 22);
    const forearmL = new Bone('forearm_l', 22, 0, 0.1, 20);

    const shoulderR = new Bone('shoulder_r', 22, -10, 0, 12);
    const armR = new Bone('arm_r', 12, 0, -Math.PI * 0.4, 22);
    const forearmR = new Bone('forearm_r', 22, 0, -0.1, 20);

    const thighL = new Bone('thigh_l', -14, 4, Math.PI * 0.5, 18);
    const shinL = new Bone('shin_l', 18, 0, 0, 18);

    const thighR = new Bone('thigh_r', 14, 4, Math.PI * 0.5, 18);
    const shinR = new Bone('shin_r', 18, 0, 0, 18);

    skel.addBone(root);
    skel.addBone(pelvis, 'root');
    skel.addBone(spine, 'pelvis');
    skel.addBone(chest, 'spine');
    skel.addBone(head, 'chest');

    skel.addBone(shoulderL, 'chest');
    skel.addBone(armL, 'shoulder_l');
    skel.addBone(forearmL, 'arm_l');

    skel.addBone(shoulderR, 'chest');
    skel.addBone(armR, 'shoulder_r');
    skel.addBone(forearmR, 'arm_r');

    skel.addBone(thighL, 'pelvis');
    skel.addBone(shinL, 'thigh_l');
    skel.addBone(thighR, 'pelvis');
    skel.addBone(shinR, 'thigh_r');

    // Walk & Slam Clips
    const walkClip = new AnimationClip('heavy_walk', 1.2, true);
    const wThighL = new NumberTrack('thigh_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 - 0.3)
      .addKeyframe(0.6, Math.PI * 0.5 + 0.3)
      .addKeyframe(1.2, Math.PI * 0.5 - 0.3);
    const wThighR = new NumberTrack('thigh_r.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 + 0.3)
      .addKeyframe(0.6, Math.PI * 0.5 - 0.3)
      .addKeyframe(1.2, Math.PI * 0.5 + 0.3);
    walkClip.addRotationTrack('thigh_l', wThighL);
    walkClip.addRotationTrack('thigh_r', wThighR);

    const slamClip = new AnimationClip('slam', 1.0, false);
    const sArmL = new NumberTrack('arm_l.rotation', 'hermite')
      .addKeyframe(0, Math.PI * 0.4)
      .addKeyframe(0.7, -Math.PI * 0.8) // Windup
      .addKeyframe(0.85, Math.PI * 0.5) // Slam down
      .addKeyframe(1.0, Math.PI * 0.4);
    const sArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.4)
      .addKeyframe(0.7, -Math.PI * 0.8)
      .addKeyframe(0.85, Math.PI * 0.5)
      .addKeyframe(1.0, -Math.PI * 0.4);
    slamClip.addRotationTrack('arm_l', sArmL);
    slamClip.addRotationTrack('arm_r', sArmR);

    const asm = new AnimationStateMachine();
    asm.addState('HeavyWalk', walkClip);
    asm.addState('Slam', slamClip);

    asm.addTransition('HeavyWalk', 'Slam', 0.1, (p) => p.get('trigger_slam') === true);
    asm.addTransition('Slam', 'HeavyWalk', 0.15, undefined, true);

    const renderDelegate: RigRenderDelegate = (renderer: IRenderer, rig: CharacterRig) => {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.translate(rig.position.x, rig.position.y);
      ctx.scale(rig.facing * rig.scale, rig.scale);

      // 0. Heavy Ground Contact Shadow with Molten Embers
      const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      shadowGrad.addColorStop(0.6, 'rgba(239, 71, 111, 0.2)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Check for production character artwork
      const texture = AssetManager.getInstance().getTexture(ASSET_IDS.CHAR_STONE_RAKSHASA);

      if (isDrawableTexture(texture)) {
        const w = 98;
        const h = 114;
        const x = -w / 2;
        const y = -h + 10;

        ctx.save();
        safeClipRoundRect(ctx, x, y, w, h, 12);
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(texture, x, y, w, h);
        }
        ctx.restore();

        // Molten Magma Pulse Border
        const magmaPulse = 0.5 + 0.5 * Math.sin(rig.stateMachine.stateTime * 4);
        ctx.strokeStyle = `rgba(251, 133, 0, ${magmaPulse.toFixed(2)})`;
        ctx.lineWidth = 2.2;
        safeStrokeRoundRect(ctx, x, y, w, h, 12);

        // Ground Slam Shockwave Telegraph
        if (rig.stateMachine.currentState?.name === 'Slam') {
          ctx.strokeStyle = '#EF476F';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 30 + (rig.stateMachine.stateTime % 1.0) * 45, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Basalt Torso
        ctx.fillStyle = '#1F1A24';
        ctx.strokeStyle = '#EF476F';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-24, -64, 48, 52, 8);
        ctx.fill();
        ctx.stroke();

        // Molten Cracks
        ctx.strokeStyle = '#FB8500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-12, -45);
        ctx.lineTo(-4, -30);
        ctx.lineTo(8, -40);
        ctx.stroke();

        // Obsidian Horns
        ctx.fillStyle = '#080C14';
        ctx.beginPath();
        ctx.moveTo(-16, -64);
        ctx.lineTo(-24, -82);
        ctx.lineTo(-10, -66);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(16, -64);
        ctx.lineTo(24, -82);
        ctx.lineTo(10, -66);
        ctx.fill();

        // Cyclopean Core Eye
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.arc(0, -56, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    return new CharacterRig('stone_rakshasa', skel, asm, renderDelegate);
  }

  // =========================================================================
  // 4. VANARA VOID-SCOUT RIG (16 BONES)
  // =========================================================================
  public static createVanaraScoutRig(): CharacterRig {
    const skel = new Skeleton('VanaraScout_Skeleton');

    const root = new Bone('root', 0, 0, 0, 8);
    const pelvis = new Bone('pelvis', 0, -18, 0, 10);
    const spine = new Bone('spine', 0, -14, 0, 12);
    const chest = new Bone('chest', 0, -14, 0, 12);
    const head = new Bone('head', 0, -12, 0, 12);

    // Arms
    const armL = new Bone('arm_l', -10, -6, Math.PI * 0.45, 14);
    const forearmL = new Bone('forearm_l', 14, 0, 0.1, 12);
    const armR = new Bone('arm_r', 10, -6, -Math.PI * 0.45, 14);
    const forearmR = new Bone('forearm_r', 14, 0, -0.1, 12);

    // Legs
    const thighL = new Bone('thigh_l', -6, 2, Math.PI * 0.5, 14);
    const shinL = new Bone('shin_l', 14, 0, 0, 14);
    const thighR = new Bone('thigh_r', 6, 2, Math.PI * 0.5, 14);
    const shinR = new Bone('shin_r', 14, 0, 0, 14);

    // 3-Bone Tail Chain
    const tail01 = new Bone('tail_01', 0, 4, Math.PI * 0.6, 12);
    const tail02 = new Bone('tail_02', 12, 0, 0.3, 12);
    const tail03 = new Bone('tail_03', 12, 0, 0.4, 12);

    skel.addBone(root);
    skel.addBone(pelvis, 'root');
    skel.addBone(spine, 'pelvis');
    skel.addBone(chest, 'spine');
    skel.addBone(head, 'chest');

    skel.addBone(armL, 'chest');
    skel.addBone(forearmL, 'arm_l');
    skel.addBone(armR, 'chest');
    skel.addBone(forearmR, 'arm_r');

    skel.addBone(thighL, 'pelvis');
    skel.addBone(shinL, 'thigh_l');
    skel.addBone(thighR, 'pelvis');
    skel.addBone(shinR, 'thigh_r');

    skel.addBone(tail01, 'pelvis');
    skel.addBone(tail02, 'tail_01');
    skel.addBone(tail03, 'tail_02');

    // Skitter Clip
    const skitterClip = new AnimationClip('orbit_skitter', 0.8, true);
    const sTail01 = new NumberTrack('tail_01.rotation', 'hermite')
      .addKeyframe(0, Math.PI * 0.6 - 0.3)
      .addKeyframe(0.4, Math.PI * 0.6 + 0.3)
      .addKeyframe(0.8, Math.PI * 0.6 - 0.3);
    skitterClip.addRotationTrack('tail_01', sTail01);

    const asm = new AnimationStateMachine();
    asm.addState('OrbitSkitter', skitterClip);

    const renderDelegate: RigRenderDelegate = (renderer: IRenderer, rig: CharacterRig) => {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.translate(rig.position.x, rig.position.y);
      ctx.scale(rig.facing * rig.scale, rig.scale);

      // 0. Agile Scout Contact Shadow
      const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      shadowGrad.addColorStop(0.6, 'rgba(76, 201, 240, 0.2)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Check for production character artwork
      const texture = AssetManager.getInstance().getTexture(ASSET_IDS.CHAR_VANARA_KAPI);

      if (isDrawableTexture(texture)) {
        const w = 78;
        const h = 96;
        const x = -w / 2;
        const y = -h + 8;

        ctx.save();
        safeClipRoundRect(ctx, x, y, w, h, 10);
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(texture, x, y, w, h);
        }
        ctx.restore();

        // Cyan Visor / Astral Rim
        ctx.strokeStyle = '#4CC9F0';
        ctx.lineWidth = 1.6;
        safeStrokeRoundRect(ctx, x, y, w, h, 10);

        // Dynamic Prehensile Tail
        ctx.strokeStyle = '#F77F00';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(-22, -4, -26, -24);
        ctx.stroke();
      } else {
        // Agile Scout Silhouette
        ctx.fillStyle = '#3A0CA3';
        ctx.strokeStyle = '#4CC9F0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(14, -14);
        ctx.lineTo(0, -6);
        ctx.lineTo(-14, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail
        ctx.strokeStyle = '#3A0CA3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(-18, 0, -22, -18);
        ctx.stroke();

        // Cyan Visor
        ctx.fillStyle = '#4CC9F0';
        ctx.beginPath();
        ctx.fillRect(-5, -36, 10, 3);
      }

      ctx.restore();
    };

    return new CharacterRig('vanara_scout', skel, asm, renderDelegate);
  }

  // =========================================================================
  // 5. TITAN ASURA EMPEROR MAHISHASURA RIG (21 BONES)
  // =========================================================================
  public static createMahishasuraRig(): CharacterRig {
    const skel = new Skeleton('Mahishasura_Skeleton');

    // Bone Hierarchy (21 Bones)
    const root = new Bone('root', 0, 0, 0, 14);
    const pelvis = new Bone('pelvis', 0, -36, 0, 18);
    const spine01 = new Bone('spine_01', 0, -20, 0, 20);
    const spine02 = new Bone('spine_02', 0, -20, 0, 20);
    const chest = new Bone('chest', 0, -18, 0, 22);
    const neck = new Bone('neck', 0, -10, 0, 12);
    const head = new Bone('head', 0, -16, 0, 24);

    // Horns
    const hornL = new Bone('horn_l', -16, -14, -0.6, 22);
    const hornR = new Bone('horn_r', 16, -14, 0.6, 22);

    // Arms
    const shoulderL = new Bone('shoulder_l', -26, -12, 0, 16);
    const armL = new Bone('arm_l', -14, 0, Math.PI * 0.45, 24);
    const forearmL = new Bone('forearm_l', 24, 0, 0.1, 20);
    const handL = new Bone('hand_l', 20, 0, 0, 12);

    const shoulderR = new Bone('shoulder_r', 26, -12, 0, 16);
    const armR = new Bone('arm_r', 14, 0, -Math.PI * 0.45, 24);
    const forearmR = new Bone('forearm_r', 24, 0, -0.1, 20);
    const handR = new Bone('hand_r', 20, 0, 0, 12);

    // Legs
    const thighL = new Bone('thigh_l', -18, 6, Math.PI * 0.5, 22);
    const shinL = new Bone('shin_l', 22, 0, 0, 22);
    const thighR = new Bone('thigh_r', 18, 6, Math.PI * 0.5, 22);
    const shinR = new Bone('shin_r', 22, 0, 0, 22);

    // Assemble skeleton
    skel.addBone(root);
    skel.addBone(pelvis, 'root');
    skel.addBone(spine01, 'pelvis');
    skel.addBone(spine02, 'spine_01');
    skel.addBone(chest, 'spine_02');
    skel.addBone(neck, 'chest');
    skel.addBone(head, 'neck');
    skel.addBone(hornL, 'head');
    skel.addBone(hornR, 'head');

    skel.addBone(shoulderL, 'chest');
    skel.addBone(armL, 'shoulder_l');
    skel.addBone(forearmL, 'arm_l');
    skel.addBone(handL, 'forearm_l');

    skel.addBone(shoulderR, 'chest');
    skel.addBone(armR, 'shoulder_r');
    skel.addBone(forearmR, 'arm_r');
    skel.addBone(handR, 'forearm_r');

    skel.addBone(thighL, 'pelvis');
    skel.addBone(shinL, 'thigh_l');
    skel.addBone(thighR, 'pelvis');
    skel.addBone(shinR, 'thigh_r');

    // Register Sockets
    skel.registerSocket('socket_right_hand', 'hand_r', new Transform2D(14, 0, 0));
    skel.registerSocket('socket_crown', 'head', new Transform2D(0, -20, 0));

    // Animation Clips
    // 1. Titan Idle (2.4s)
    const titanIdle = new AnimationClip('titan_idle', 2.4, true);
    const idleSpine = new NumberTrack('spine_01.rotation', 'hermite')
      .addKeyframe(0, 0)
      .addKeyframe(1.2, -0.05)
      .addKeyframe(2.4, 0);
    const idleArmL = new NumberTrack('arm_l.rotation', 'hermite')
      .addKeyframe(0, Math.PI * 0.45)
      .addKeyframe(1.2, Math.PI * 0.48)
      .addKeyframe(2.4, Math.PI * 0.45);
    const idleArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.45)
      .addKeyframe(1.2, -Math.PI * 0.42)
      .addKeyframe(2.4, -Math.PI * 0.45);
    titanIdle.addRotationTrack('spine_01', idleSpine);
    titanIdle.addRotationTrack('arm_l', idleArmL);
    titanIdle.addRotationTrack('arm_r', idleArmR);

    // 2. Titan March (1.2s)
    const titanMarch = new AnimationClip('titan_march', 1.2, true);
    const mThighL = new NumberTrack('thigh_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 - 0.45)
      .addKeyframe(0.6, Math.PI * 0.5 + 0.45)
      .addKeyframe(1.2, Math.PI * 0.5 - 0.45);
    const mThighR = new NumberTrack('thigh_r.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 + 0.45)
      .addKeyframe(0.6, Math.PI * 0.5 - 0.45)
      .addKeyframe(1.2, Math.PI * 0.5 + 0.45);
    titanMarch.addRotationTrack('thigh_l', mThighL);
    titanMarch.addRotationTrack('thigh_r', mThighR);
    titanMarch.addEvent(0.3, 'footstep_l');
    titanMarch.addEvent(0.9, 'footstep_r');

    // 3. Buffalo Charge (0.8s)
    const buffaloCharge = new AnimationClip('buffalo_charge', 0.8, true);
    const cSpine = new NumberTrack('spine_01.rotation', 'linear')
      .addKeyframe(0, 0.42)
      .addKeyframe(0.4, 0.38)
      .addKeyframe(0.8, 0.42);
    const cThighL = new NumberTrack('thigh_l.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 - 0.6)
      .addKeyframe(0.4, Math.PI * 0.5 + 0.6)
      .addKeyframe(0.8, Math.PI * 0.5 - 0.6);
    const cThighR = new NumberTrack('thigh_r.rotation', 'linear')
      .addKeyframe(0, Math.PI * 0.5 + 0.6)
      .addKeyframe(0.4, Math.PI * 0.5 - 0.6)
      .addKeyframe(0.8, Math.PI * 0.5 + 0.6);
    buffaloCharge.addRotationTrack('spine_01', cSpine);
    buffaloCharge.addRotationTrack('thigh_l', cThighL);
    buffaloCharge.addRotationTrack('thigh_r', cThighR);
    buffaloCharge.addEvent(0.2, 'charge_gallop_1');
    buffaloCharge.addEvent(0.6, 'charge_gallop_2');

    // 4. Overhead Slam (1.1s)
    const overheadSlam = new AnimationClip('overhead_slam', 1.1, false);
    const sArmR = new NumberTrack('arm_r.rotation', 'hermite')
      .addKeyframe(0, -Math.PI * 0.45)
      .addKeyframe(0.5, -Math.PI * 0.9) // Overhead windup
      .addKeyframe(0.75, Math.PI * 0.4) // Crushing slam down
      .addKeyframe(1.1, -Math.PI * 0.45);
    overheadSlam.addRotationTrack('arm_r', sArmR);
    overheadSlam.addEvent(0.75, 'slam_impact');

    // 5. Stagger Flinch (0.4s)
    const staggerClip = new AnimationClip('stagger', 0.4, false);
    const stSpine = new NumberTrack('spine_01.rotation', 'linear')
      .addKeyframe(0, -0.35)
      .addKeyframe(0.4, 0);
    staggerClip.addRotationTrack('spine_01', stSpine);

    // 6. Eclipse Enrage Roar (1.5s)
    const enrageClip = new AnimationClip('eclipse_enrage', 1.5, false);
    const eHead = new NumberTrack('head.rotation', 'hermite')
      .addKeyframe(0, 0)
      .addKeyframe(0.5, -0.4) // Roar head up
      .addKeyframe(1.2, -0.4)
      .addKeyframe(1.5, 0);
    enrageClip.addRotationTrack('head', eHead);
    enrageClip.addEvent(0.5, 'eclipse_roar');

    // Locomotion Blend Tree
    const locoBlend = new BlendTree1D('TitanLocomotion', 'speed');
    locoBlend.addEntry(0.0, titanIdle);
    locoBlend.addEntry(0.4, titanMarch);
    locoBlend.addEntry(1.0, buffaloCharge);

    // State Machine
    const asm = new AnimationStateMachine();
    asm.addState('Locomotion', locoBlend);
    asm.addState('Slam', overheadSlam);
    asm.addState('Charge', buffaloCharge);
    asm.addState('Stagger', staggerClip);
    asm.addState('Enrage', enrageClip);

    asm.addTransition('*', 'Slam', 0.08, (p) => p.get('trigger_slam') === true);
    asm.addTransition('Slam', 'Locomotion', 0.15, undefined, true);

    asm.addTransition('*', 'Charge', 0.08, (p) => p.get('trigger_charge') === true);
    asm.addTransition('Charge', 'Locomotion', 0.12, (p) => p.get('trigger_stop_charge') === true, true);

    asm.addTransition('*', 'Stagger', 0.05, (p) => p.get('trigger_stagger') === true);
    asm.addTransition('Stagger', 'Locomotion', 0.1, undefined, true);

    asm.addTransition('*', 'Enrage', 0.1, (p) => p.get('trigger_enrage') === true);
    asm.addTransition('Enrage', 'Locomotion', 0.15, undefined, true);

    // Visual Render Delegate
    const renderDelegate: RigRenderDelegate = (renderer: IRenderer, rig: CharacterRig) => {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.translate(rig.position.x, rig.position.y);
      ctx.scale(rig.facing * rig.scale, rig.scale);

      // 0. Titan Ground Shadow
      const shadowGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 52);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      shadowGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.25)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 48, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Check for production character artwork
      const texture = AssetManager.getInstance().getTexture(ASSET_IDS.CHAR_MAHISHASURA);

      if (isDrawableTexture(texture)) {
        const w = 126;
        const h = 144;
        const x = -w / 2;
        const y = -h + 12;

        ctx.save();
        safeClipRoundRect(ctx, x, y, w, h, 14);
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(texture, x, y, w, h);
        }

        // Enrage Purple Eclipse aura
        if (rig.stateMachine.currentState?.name === 'Enrage') {
          ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
          ctx.fillRect(x, y, w, h);
        }
        ctx.restore();

        // Demonic Horns Rim Trim
        ctx.strokeStyle = rig.stateMachine.currentState?.name === 'Enrage' ? '#C026D3' : 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 2.5;
        safeStrokeRoundRect(ctx, x, y, w, h, 14);

        // Expanding slam shockwave ring
        if (rig.stateMachine.currentState?.name === 'Slam') {
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, 36 + (rig.stateMachine.stateTime % 1.1) * 55, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Procedural Titan Carapace
        ctx.fillStyle = '#1C1917';
        ctx.fillRect(-28, -64, 56, 64);

        // Magma Fissures
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-16, -45);
        ctx.lineTo(0, -30);
        ctx.lineTo(16, -45);
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -6);
        ctx.stroke();

        // Horns
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.moveTo(-22, -64);
        ctx.lineTo(-38, -94);
        ctx.lineTo(-12, -68);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(22, -64);
        ctx.lineTo(38, -94);
        ctx.lineTo(12, -68);
        ctx.fill();

        // Crimson Demon Eyes
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(-8, -54, 3, 0, Math.PI * 2);
        ctx.arc(8, -54, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Void Gada Mace Weapon on Socket
      const weaponSocket = rig.skeleton.getSocketTransform('socket_right_hand');
      if (weaponSocket) {
        ctx.save();
        ctx.translate(weaponSocket.position.x - rig.position.x, weaponSocket.position.y - rig.position.y);
        ctx.rotate(weaponSocket.rotation);

        // Gada Shaft
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(-4, -2, 34, 4);

        // Heavy Flanged Mace Head
        ctx.fillStyle = '#18181B';
        ctx.strokeStyle = '#9333EA';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gold Flanges
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(28, -14, 8, 28);

        ctx.restore();
      }

      ctx.restore();
    };

    return new CharacterRig('mahishasura', skel, asm, renderDelegate);
  }
}

