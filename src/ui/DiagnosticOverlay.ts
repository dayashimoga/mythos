import { IRenderer } from '../render/CanvasRenderer';
import { Diagnostics } from '../core/Diagnostics';
import { LayeredRenderer } from '../render/LayeredRenderer';

export class DiagnosticOverlay {
  public render(renderer: IRenderer, diagnostics: Diagnostics): void {
    if (!diagnostics.getIsVisible()) return;

    const ctx = renderer.getContext();
    const vp = renderer.getViewport();
    const metrics = diagnostics.getMetrics();

    ctx.save();

    const panelWidth = 270;
    const panelHeight = 255;
    const panelX = vp.width - panelWidth - 20;
    const panelY = 56;

    // Background panel
    ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Title
    renderer.drawText(
      'ASTRA ENGINE DIAGNOSTICS (F3)',
      panelX + 12,
      panelY + 22,
      'bold 11px monospace',
      '#00E5FF'
    );

    // Divider
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(panelX + 12, panelY + 30);
    ctx.lineTo(panelX + panelWidth - 12, panelY + 30);
    ctx.stroke();

    // Layered render metrics
    const quality = LayeredRenderer.getInstance().getQuality();
    const rMetrics = LayeredRenderer.getInstance().getMetrics();

    // Metrics list
    const lines = [
      `FPS:             ${metrics.fps} (${metrics.frameTimeMs} ms)`,
      `Update Step:     ${metrics.updateTimeMs} ms`,
      `Render Step:     ${metrics.renderTimeMs} ms`,
      `Quality Preset:  ${quality}`,
      `Render Items:    ${rMetrics.itemCount} (Lights: ${rMetrics.lightCount})`,
      `Active Scene:    ${metrics.activeScene}`,
      `Active Entities: ${metrics.entityCount}`,
      `Live Particles:  ${metrics.particleCount}`,
      `Spatial Checks:  ${metrics.collisionChecks}`,
      `Audio Voices:    ${metrics.audioVoices}`,
      `Memory (JS Heap): ${metrics.memoryUsageMb > 0 ? `${metrics.memoryUsageMb} MB` : 'N/A'}`,
      `Colliders (F2):  ${diagnostics.getShowColliders() ? 'ON' : 'OFF'}`,
    ];

    let lineY = panelY + 46;
    for (const line of lines) {
      renderer.drawText(line, panelX + 12, lineY, '11px monospace', '#F8F9FA');
      lineY += 16;
    }

    ctx.restore();
  }
}
