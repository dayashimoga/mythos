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

      // 3. Surya-Kripana Weapon on Socket
      const weaponSocket = rig.skeleton.getSocketTransform('socket_right_hand');
      if (weaponSocket) {
        ctx.save();
        ctx.translate(weaponSocket.position.x - rig.position.x, weaponSocket.position.y - rig.position.y);
        ctx.rotate(weaponSocket.rotation);

        // Curved Gold Sun Blade
        ctx.fillStyle = '#FFB703';
        ctx.strokeStyle = '#FFE3A8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.quadraticCurveTo(16, -5, 26, -14);
        ctx.quadraticCurveTo(18, 2, 0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Hilt
        ctx.fillStyle = '#9B2226';
        ctx.fillRect(-6, -2, 6, 4);

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

      // Celestial Halo
      SacredGeometry.drawMandala(ctx, 0, -68, 22, 8, rig.stateMachine.stateTime * 0.5, 'rgba(0, 229, 255, 0.4)', 1.5);

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

      ctx.restore();
    };

    return new CharacterRig('vanara_scout', skel, asm, renderDelegate);
  }
}
