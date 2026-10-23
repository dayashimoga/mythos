/**
 * Mythos: Astra & The Seven Realms
 * Stage 6 Production Codex & Quest Log Modal
 *
 * Provides in-depth mission journal, character affinity tracking,
 * Vedic cosmology compendium, and tactical combat tutorials.
 */

import { UIModal } from '../components/UIModal';
import { UITabs } from '../components/UITabs';
import { IRenderer } from '../../render/CanvasRenderer';
import { Vector2D } from '../../physics/Vector2D';
import { DesignTokens } from '../design/DesignTokens';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';
import { QuestManager } from '../../narrative/QuestManager';
import { CampaignChapter1 } from '../../narrative/CampaignChapter1';

export class CodexQuestModal {
  public modal: UIModal;
  private tabs: UITabs;
  private activeTabId = 'quests';
  private questManager: QuestManager;
  private selectedQuestIndex = 0;

  constructor(questManager?: QuestManager, onClose?: () => void) {
    this.questManager = questManager || new QuestManager(CampaignChapter1.getMissions());

    this.modal = new UIModal({
      title: 'Cosmic Codex & Sacred Annals',
      subtitle: 'Chronicles of Dharma, Vedic prophecies, and the Seven Realms.',
      width: 760,
      height: 520,
      onClose,
    });

    this.tabs = new UITabs('codex_tabs', 0, 0, 720, 36, {
      tabs: [
        { id: 'quests', label: 'Quests' },
        { id: 'affinities', label: 'Affinities' },
        { id: 'lore', label: 'Cosmic Lore' },
        { id: 'tutorials', label: 'Tutorials' },
      ],
      activeTabId: 'quests',
      onTabChange: (tabId: string) => {
        this.activeTabId = tabId;
      },
    });

    this.modal.addChild(this.tabs);
  }

  public setQuestManager(qm: QuestManager): void {
    this.questManager = qm;
  }

  public open(viewportWidth: number, viewportHeight: number): void {
    this.modal.open(viewportWidth, viewportHeight);
    this.tabs.bounds.x = this.modal.bounds.x + 20;
    this.tabs.bounds.y = this.modal.bounds.y + 70;
    this.tabs.bounds.width = this.modal.bounds.width - 40;
  }

  public close(): void {
    this.modal.close();
  }

  public isOpen(): boolean {
    return this.modal.isOpen;
  }

  public update(dt: number): void {
    if (!this.modal.isOpen) return;
    this.modal.update(dt);
  }

  public handlePointerMove(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerMove(point);
  }

  public handlePointerDown(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;

    // Check clicking mission list items if on quests tab
    if (this.activeTabId === 'quests') {
      const missions = this.questManager.getAllMissions();
      const listX = this.modal.bounds.x + 24;
      let listY = this.modal.bounds.y + 120;
      const itemW = 220;
      const itemH = 50;

      for (let i = 0; i < missions.length; i++) {
        if (
          point.x >= listX &&
          point.x <= listX + itemW &&
          point.y >= listY &&
          point.y <= listY + itemH
        ) {
          this.selectedQuestIndex = i;
          return true;
        }
        listY += itemH + 8;
      }
    }

    return this.modal.handlePointerDown(point);
  }

  public handlePointerUp(point: Vector2D): boolean {
    if (!this.modal.isOpen) return false;
    return this.modal.handlePointerUp(point);
  }

  public handleKeyDown(key: string, shiftKey = false): boolean {
    if (!this.modal.isOpen) return false;

    if (key === 'Escape') {
      this.close();
      return true;
    }

    if (this.activeTabId === 'quests') {
      const missions = this.questManager.getAllMissions();
      if (key === 'ArrowUp') {
        this.selectedQuestIndex = Math.max(0, this.selectedQuestIndex - 1);
        return true;
      }
      if (key === 'ArrowDown') {
        this.selectedQuestIndex = Math.min(missions.length - 1, this.selectedQuestIndex + 1);
        return true;
      }
    }

    return this.modal.handleKeyDown(key, shiftKey);
  }

  public render(renderer: IRenderer): void {
    if (!this.modal.isOpen) return;

    this.modal.render(renderer);

    const ctx = renderer.getContext();
    const a11y = AccessibilityManager.getInstance().getSettings();
    const isHighContrast = a11y.highContrast;
    const { x, y, width, height } = this.modal.bounds;

    ctx.save();

    switch (this.activeTabId) {
      case 'quests':
        this.renderQuestsTab(ctx, x, y, width, height, isHighContrast);
        break;
      case 'affinities':
        this.renderAffinitiesTab(ctx, x, y, width, height, isHighContrast);
        break;
      case 'lore':
        this.renderLoreTab(ctx, x, y, width, height, isHighContrast);
        break;
      case 'tutorials':
        this.renderTutorialsTab(ctx, x, y, width, height, isHighContrast);
        break;
    }

    ctx.restore();
  }

  private renderQuestsTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isHighContrast: boolean
  ): void {
    const missions = this.questManager.getAllMissions();
    const listX = x + 24;
    const listW = 230;
    const contentX = x + 270;
    const contentW = width - 294;
    let listY = y + 120;
    const itemH = 52;

    // Mission Left Sidebar
    for (let i = 0; i < missions.length; i++) {
      const m = missions[i];
      const isSelected = i === this.selectedQuestIndex;
      const status = this.questManager.getMissionStatus(m.id);

      let statusColor = DesignTokens.colors.text.secondary;
      if (status === 'COMPLETED') statusColor = DesignTokens.colors.prana.primary;
      else if (status === 'ACTIVE') statusColor = DesignTokens.colors.solar.glow;
      else if (status === 'AVAILABLE') statusColor = DesignTokens.colors.astral.primary;

      ctx.fillStyle = isSelected
        ? isHighContrast
          ? '#222222'
          : 'rgba(251, 133, 0, 0.2)'
        : 'rgba(8, 12, 20, 0.6)';
      ctx.strokeStyle = isSelected
        ? isHighContrast
          ? '#FFE600'
          : DesignTokens.colors.solar.primary
        : 'rgba(255, 183, 3, 0.15)';
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.beginPath();
      ctx.roundRect(listX, listY, listW, itemH, 6);
      ctx.fill();
      ctx.stroke();

      // Title
      ctx.font = `600 12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = isSelected ? '#FFFFFF' : DesignTokens.colors.text.primary;
      ctx.textAlign = 'left';
      ctx.fillText(m.title, listX + 12, listY + 20);

      // Status Badge
      ctx.font = `bold 10px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = statusColor;
      ctx.fillText(`[ ${status} ]`, listX + 12, listY + 38);

      listY += itemH + 8;
    }

    // Mission Details Panel (Right)
    const selected = missions[this.selectedQuestIndex] || missions[0];
    if (selected) {
      const panelY = y + 120;
      const panelH = height - 144;

      ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.8)';
      ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.subtleGold;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(contentX, panelY, contentW, panelH, 8);
      ctx.fill();
      ctx.stroke();

      // Title & Act
      ctx.font = `bold 16px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.solar.glow;
      ctx.textAlign = 'left';
      ctx.fillText(selected.title, contentX + 20, panelY + 30);

      ctx.font = `11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.secondary;
      ctx.fillText(
        `Act ${selected.act}: Chapter ${selected.chapter}  ✦  Prerequisites: ${selected.prerequisites.length > 0 ? selected.prerequisites.join(', ') : 'None'}`,
        contentX + 20,
        panelY + 50
      );

      // Description
      ctx.font = `12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      ctx.fillText(selected.description, contentX + 20, panelY + 80);

      // Objectives Header
      ctx.font = `bold 13px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.astral.glow;
      ctx.fillText('MISSION OBJECTIVES:', contentX + 20, panelY + 120);

      let objY = panelY + 148;
      for (const obj of selected.objectives) {
        const isDone = obj.isCompleted;
        ctx.fillStyle = isDone ? DesignTokens.colors.prana.primary : DesignTokens.colors.text.secondary;
        ctx.font = `12px ${AccessibilityManager.getInstance().getFontFamily()}`;
        const checkIcon = isDone ? '☑' : '☐';
        ctx.fillText(`${checkIcon}  ${obj.description}`, contentX + 24, objY);

        if (obj.targetCount > 1) {
          ctx.fillStyle = DesignTokens.colors.solar.primary;
          ctx.textAlign = 'right';
          ctx.fillText(`${obj.currentCount} / ${obj.targetCount}`, contentX + contentW - 24, objY);
          ctx.textAlign = 'left';
        }

        objY += 28;
      }

      // Rewards
      ctx.font = `bold 12px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.solar.glow;
      ctx.fillText('SACRED REWARDS:', contentX + 20, panelY + 280);

      ctx.font = `11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      const unlocks =
        (selected.rewards.unlockedRealms && selected.rewards.unlockedRealms.join(', ')) ||
        (selected.rewards.unlockedAbilities && selected.rewards.unlockedAbilities.join(', ')) ||
        'Cosmic Attunement';
      ctx.fillText(
        `✦ Essence: +${selected.rewards.essence}  ✦ Unlocks: ${unlocks}`,
        contentX + 20,
        panelY + 304
      );
    }
  }

  private renderAffinitiesTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    _height: number,
    isHighContrast: boolean
  ): void {
    const startY = y + 130;
    const cardW = width - 60;
    const cardH = 90;

    const affinities = [
      {
        name: 'Tara (Astra Guide)',
        title: 'Voice of the Ancestors',
        score: this.questManager.relationships.taraAffinity,
        desc: 'Guidance frequency and cosmic resonance with the celestial matriarch.',
        color: DesignTokens.colors.astral.primary,
      },
      {
        name: 'Vanara Guardians',
        title: 'Protectors of the Grove',
        score: this.questManager.relationships.vanaraTrust,
        desc: 'Trust cultivated with the simian forest allies of Kishkindha.',
        color: DesignTokens.colors.prana.primary,
      },
      {
        name: 'Universal Dharma Balance',
        title: 'Karmic Axis',
        score: this.questManager.relationships.karmicBalance,
        desc: 'Harmonic balance between luminous Prana and entropic Tamas.',
        color: DesignTokens.colors.solar.primary,
      },
    ];

    let currentY = startY;
    for (const item of affinities) {
      ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.8)';
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 30, currentY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 14px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = item.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${item.name} — ${item.title}`, x + 46, currentY + 28);

      ctx.font = `11px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.secondary;
      ctx.fillText(item.desc, x + 46, currentY + 50);

      // Affinity Bar
      const barX = x + 46;
      const barY = currentY + 62;
      const barW = cardW - 140;
      const barH = 10;

      ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 5);
      ctx.fill();

      const progress = Math.max(0, Math.min(1, (item.score + 50) / 100));
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, 5);
      ctx.fill();

      // Numeric readout
      ctx.font = `bold 12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      ctx.textAlign = 'right';
      ctx.fillText(`${item.score > 0 ? '+' : ''}${item.score} Harmony`, x + cardW + 15, barY + 9);
      ctx.textAlign = 'left';

      currentY += cardH + 20;
    }
  }

  private renderLoreTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    _height: number,
    isHighContrast: boolean
  ): void {
    const entries = [
      {
        title: 'The Seven Sacred Realms (Sapta-Loka)',
        desc: 'From the primordial earth realm of Bhumi to the transcendent solar plane of Satyaloka, cosmic energy flows through sacred consecrated altars.',
      },
      {
        title: 'Prana vs. Tamas (The Cosmic Polarity)',
        desc: 'Prana is the living solar radiance that fuels life and purification. Tamas is corruption, stagnation, and heavy inertia summoned by Mahishasura.',
      },
      {
        title: 'Brahmastra: The Ultimate Astra',
        desc: 'A divine invocation bestowed only upon champions of perfect Dharma. Its detonation can rend celestial gates and banish sovereign demon lords.',
      },
    ];

    let currentY = y + 130;
    for (const lore of entries) {
      ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.8)';
      ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.gold;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 30, currentY, width - 60, 84, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 14px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.solar.glow;
      ctx.textAlign = 'left';
      ctx.fillText(lore.title, x + 46, currentY + 28);

      ctx.font = `12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      ctx.fillText(lore.desc, x + 46, currentY + 54);

      currentY += 100;
    }
  }

  private renderTutorialsTab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    _height: number,
    isHighContrast: boolean
  ): void {
    const tutorials = [
      {
        title: 'Agni-Dash Invulnerability Frames (i-frames)',
        body: 'Pressing Dash gives Astra 0.25 seconds of absolute invulnerability. Dash THROUGH enemy shockwaves and projectile volleys to escape unscathed.',
      },
      {
        title: 'Combo Multiplier & Surya Bursts',
        body: 'Connecting consecutive attacks increases your Cosmic Multiplier (up to 3.0x). Taking damage resets your combo meter.',
      },
      {
        title: 'Shrine Consecration Ritual',
        body: 'Defeat all corrupted Asura vanguards guarding the realm altar, then stand inside the golden mandala and press Interact [E] to consecrate.',
      },
    ];

    let currentY = y + 130;
    for (const tut of tutorials) {
      ctx.fillStyle = isHighContrast ? '#05070D' : 'rgba(12, 18, 30, 0.8)';
      ctx.strokeStyle = isHighContrast ? '#FFFFFF' : DesignTokens.colors.borders.subtleGold;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 30, currentY, width - 60, 84, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 14px ${AccessibilityManager.getInstance().getFontFamily(true)}`;
      ctx.fillStyle = DesignTokens.colors.astral.glow;
      ctx.textAlign = 'left';
      ctx.fillText(tut.title, x + 46, currentY + 28);

      ctx.font = `12px ${AccessibilityManager.getInstance().getFontFamily()}`;
      ctx.fillStyle = DesignTokens.colors.text.primary;
      ctx.fillText(tut.body, x + 46, currentY + 54);

      currentY += 100;
    }
  }
}
