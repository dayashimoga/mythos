export class SacredGeometry {
  public static drawMandala(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    petals: number,
    rotation: number,
    color: string,
    lineWidth = 2
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner concentric ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Petal flourishes
    const angleStep = (Math.PI * 2) / petals;
    for (let i = 0; i < petals; i++) {
      const angle = i * angleStep;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, radius * 0.6);
      ctx.quadraticCurveTo(radius * 0.2, radius * 0.85, 0, radius);
      ctx.quadraticCurveTo(-radius * 0.2, radius * 0.85, 0, radius * 0.6);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  public static drawSriYantraCentral(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
    alpha = 0.8
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // Upward triangle (Shiva / Divine Will)
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Downward triangle (Shakti / Creative Energy)
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size * 0.866, -size * 0.5);
    ctx.lineTo(-size * 0.866, -size * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Central Bindu dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public static drawRuneInscription(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color = '#FFD166',
    glowColor = '#FFB703'
  ): void {
    ctx.save();
    ctx.font = '12px "Cinzel", "Outfit", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}
