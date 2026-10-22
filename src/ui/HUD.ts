import { IRenderer } from '../render/CanvasRenderer';
import { Player } from '../entities/Player';

export class HUD {
  public render(renderer: IRenderer, player: Player, objective: string): void {
    const ctx = renderer.getContext();
    const vp = renderer.getViewport();

    ctx.save();

    // Top-Left Status Panel (Health & Energy)
    const panelX = 24;
    const panelY = 24;
    const barWidth = 180;
    const barHeight = 12;

    // Background container glass card
    ctx.fillStyle = 'rgba(18, 24, 36, 0.75)';
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX - 10, panelY - 10, barWidth + 140, 76, 8);
    ctx.fill();
    ctx.stroke();

    // Health Bar
    renderer.drawText('PRANA', panelX, panelY + 10, 'bold 11px sans-serif', '#A0AAB8');
    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 50, panelY, barWidth, barHeight);
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    ctx.fillStyle = '#06D6A0';
    ctx.fillRect(panelX + 50, panelY, barWidth * hpRatio, barHeight);

    // Energy Bar (Astra / Agni)
    renderer.drawText('AGNI', panelX, panelY + 32, 'bold 11px sans-serif', '#A0AAB8');
    ctx.fillStyle = '#080C14';
    ctx.fillRect(panelX + 50, panelY + 22, barWidth, barHeight);
    const epRatio = Math.max(0, player.energy / player.maxEnergy);
    ctx.fillStyle = '#FB8500';
    ctx.fillRect(panelX + 50, panelY + 22, barWidth * epRatio, barHeight);

    // Shard Counter
    const shardX = panelX + barWidth + 65;
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(shardX, panelY + 16, 8, 0, Math.PI * 2);
    ctx.fill();

    renderer.drawText(
      `${player.shardsCollected} / 3`,
      shardX + 16,
      panelY + 20,
      'bold 16px "Cinzel", Georgia, serif',
      '#FFB703'
    );
    renderer.drawText('SHARDS', shardX - 2, panelY + 42, '9px sans-serif', '#A0AAB8', 'center');

    // Top-Center Objective Banner
    ctx.fillStyle = 'rgba(18, 24, 36, 0.8)';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(vp.width / 2 - 180, 20, 360, 34, 6);
    ctx.fill();
    ctx.stroke();

    renderer.drawText(
      `OBJECTIVE: ${objective}`,
      vp.width / 2,
      41,
      'bold 12px "Cinzel", sans-serif',
      '#FFD166',
      'center'
    );

    // Bottom-Left Keybindings Guide
    ctx.fillStyle = 'rgba(18, 24, 36, 0.6)';
    ctx.beginPath();
    ctx.roundRect(24, vp.height - 48, 420, 30, 6);
    ctx.fill();

    renderer.drawText(
      'WASD: Move  |  Space: Dash  |  Click / J: Surya-Burst  |  E: Attune  |  F3: Diagnostics',
      36,
      vp.height - 29,
      '11px sans-serif',
      '#A0AAB8'
    );

    ctx.restore();
  }
}
