import './style.css';
import { Engine } from './engine/Engine';
import { ErrorBoundary } from './core/ErrorBoundary';
import { PlatformBridge } from './platform/PlatformBridge';
import { VirtualJoystick } from './input/VirtualJoystick';
import { Logger } from './core/Logger';

function bootstrap(): void {
  // 1. Initialize Error Boundary
  ErrorBoundary.initialize('app-root');

  const logger = Logger.getInstance();
  logger.info('Bootstrap', 'Initiating Mythos: Astra Stage 0 bootstrap sequence');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found in DOM');
  }

  // 2. Hardware and Platform detection
  const bridge = PlatformBridge.getInstance();
  const caps = bridge.getCapabilities();
  logger.info('PlatformBridge', `Running on ${caps.platform} (Touch: ${caps.hasTouch}, Mobile: ${caps.isMobile})`);

  // 3. Instantiate Engine
  const engine = new Engine();
  engine.init(canvas);
  (window as any).__astraEngine = engine;

  // Handle responsive canvas scaling
  const handleResize = () => {
    bridge.resizeCanvas(canvas, 1280, 720);
    engine.resize(1280, 720);
  };
  window.addEventListener('resize', handleResize);
  handleResize();

  // 4. Mount Virtual Touch Joystick if on mobile/touch
  if (caps.hasTouch || caps.isMobile) {
    const virtualJoystick = new VirtualJoystick(engine.getInput());
    virtualJoystick.mount(document.getElementById('app-root')!);
  }

  // 5. Connect Quick Bar DOM Controls
  const btnDiag = document.getElementById('btn-toggle-diagnostics');
  btnDiag?.addEventListener('click', () => {
    engine.getDiagnostics().toggleVisible();
  });

  const btnAudio = document.getElementById('btn-toggle-audio');
  const lblAudio = document.getElementById('lbl-audio');
  btnAudio?.addEventListener('click', () => {
    const isMuted = engine.getAudio().isMuted();
    engine.getAudio().setMuted(!isMuted);
    if (lblAudio) {
      lblAudio.textContent = !isMuted ? 'Muted' : 'Sound';
    }
  });

  const btnFullscreen = document.getElementById('btn-fullscreen');
  btnFullscreen?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // 6. Start Engine
  engine.start();
  logger.info('Bootstrap', 'Mythos: Astra Engine Stage 0 successfully engaged');
}

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
