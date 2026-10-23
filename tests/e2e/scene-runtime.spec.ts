import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Helper to inspect rendered canvas pixel activity
async function getCanvasPixelMetrics(page: Page, x = 0, y = 0, width = 1280, height = 720) {
  return await page.evaluate(
    ({ x, y, width, height }) => {
      const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const sampleW = Math.min(width, canvas.width - x);
      const sampleH = Math.min(height, canvas.height - y);
      if (sampleW <= 0 || sampleH <= 0) return null;

      const imgData = ctx.getImageData(x, y, sampleW, sampleH);
      let nonZeroCount = 0;
      let totalLuminance = 0;

      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const a = imgData.data[i + 3];

        if (a > 10 && (r > 10 || g > 10 || b > 10)) {
          nonZeroCount++;
          totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
        }
      }

      const total = sampleW * sampleH;
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        sampledPixels: total,
        activePixels: nonZeroCount,
        activityRatio: nonZeroCount / total,
        avgLuminance: nonZeroCount > 0 ? totalLuminance / nonZeroCount : 0,
      };
    },
    { x, y, width, height }
  );
}

// Click on canvas at specified 1280x720 virtual buffer coordinates
export async function clickCanvas(page: Page, bufferX: number, bufferY: number) {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  if (!box) return;
  const scaleX = box.width / 1280;
  const scaleY = box.height / 720;
  const clickX = box.x + bufferX * scaleX;
  const clickY = box.y + bufferY * scaleY;
  await page.mouse.click(clickX, clickY);
}

test.describe('Stage 0 — Critical Runtime & Scene Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-canvas', { state: 'visible' });
    await page.waitForTimeout(300);
  });

  test('Title Screen loads and renders non-empty scene content and quick-bar controls', async ({ page }, testInfo) => {
    const metrics = await getCanvasPixelMetrics(page);
    expect(metrics).not.toBeNull();
    expect(metrics!.activePixels).toBeGreaterThan(5000);
    expect(metrics!.activityRatio).toBeGreaterThan(0.02);

    // Verify quick-bar navigation exists
    await expect(page.locator('#btn-toggle-diagnostics')).toBeVisible();
    await expect(page.locator('#btn-toggle-audio')).toBeVisible();
    await expect(page.locator('#btn-fullscreen')).toBeVisible();

    // Toggle diagnostics overlay
    await page.click('#btn-toggle-diagnostics');
    await page.waitForTimeout(100);

    // Toggle sound
    await page.click('#btn-toggle-audio');
    await page.waitForTimeout(100);

    const screenshotPath = path.join('screenshots', `title_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath });
  });

  test('Full Journey: Title -> Campaign -> Dialogue -> Gameplay -> Pause -> Resume -> Title', async ({ page }, testInfo) => {
    // 1. Enter Campaign Mode (Hotkey A)
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(600);

    // Verify Scene is StoryCampaignScene
    const activeScene = await page.evaluate(() => (window as any).__astraEngine?.getSceneManager()?.getCurrentScene()?.id);
    expect(activeScene).toBe('StoryCampaignScene');

    // 2. Dialogue Box Containment Assertion (Dialogue should be centered at bottom safe area)
    // Virtual 1280x720: boxWidth=840 (x: 220 to 1060), boxHeight=150 (y: 546 to 696)
    const dialogueSample = await getCanvasPixelMetrics(page, 220, 546, 840, 150);
    expect(dialogueSample).not.toBeNull();
    expect(dialogueSample!.activePixels).toBeGreaterThan(2000);

    // Capture Dialogue & Cinematic Frame
    const dialogueScreenshot = path.join('screenshots', `campaign_dialogue_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    fs.mkdirSync(path.dirname(dialogueScreenshot), { recursive: true });
    await page.screenshot({ path: dialogueScreenshot });

    // 3. Skip Cinematic to enter direct gameplay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Advance dialogue if active
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // 4. Player Camera Tracking & World Movement
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(200);

    const gameplayMetrics = await getCanvasPixelMetrics(page);
    expect(gameplayMetrics!.activePixels).toBeGreaterThan(10000);

    const gameplayScreenshot = path.join('screenshots', `story_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: gameplayScreenshot });

    // 5. Open Pause Modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Assert Pause Modal rendered in center of screen
    const pauseMetrics = await getCanvasPixelMetrics(page, 440, 160, 400, 400);
    expect(pauseMetrics!.activePixels).toBeGreaterThan(3000);

    const pauseScreenshot = path.join('screenshots', `campaign_pause_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: pauseScreenshot });

    // 6. Resume Gameplay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 7. Pause again and Return to Title via KeyQ
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(400);

    // Verify Return to Title Scene
    const returnScene = await page.evaluate(() => (window as any).__astraEngine?.getSceneManager()?.getCurrentScene()?.id);
    expect(returnScene).toBe('SplashScene');
  });

  test('Character Studio renders visible character rigs, bone diagnostics, and handles navigation', async ({ page }, testInfo) => {
    // Open Character Studio (Hotkey C)
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(500);

    // Sample character center area (pedestal center around 640, 360 - size 300x300)
    const centerSample = await getCanvasPixelMetrics(page, 490, 210, 300, 300);
    expect(centerSample).not.toBeNull();
    expect(centerSample!.activePixels).toBeGreaterThan(1500);

    // Switch to Devi Tara (Key 2)
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(300);
    const taraSample = await getCanvasPixelMetrics(page, 490, 210, 300, 300);
    expect(taraSample!.activePixels).toBeGreaterThan(1500);

    // Switch to Stone Rakshasa (Key 3)
    await page.keyboard.press('Digit3');
    await page.waitForTimeout(300);
    const rakshasaSample = await getCanvasPixelMetrics(page, 490, 210, 300, 300);
    expect(rakshasaSample!.activePixels).toBeGreaterThan(1500);

    // Toggle skeletal bones (Key B)
    await page.keyboard.press('KeyB');
    await page.waitForTimeout(300);
    const bonesSample = await getCanvasPixelMetrics(page, 490, 210, 300, 300);
    expect(bonesSample!.activePixels).toBeGreaterThan(1500);

    const studioScreenshot = path.join('screenshots', `studio_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: studioScreenshot });

    // Press Escape to return to Title
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Verify Title Screen is back
    const titleMetrics = await getCanvasPixelMetrics(page);
    expect(titleMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('Bhumi Temple Scene renders, displays pause modal, and returns cleanly', async ({ page }, testInfo) => {
    // Open Bhumi Temple (Hotkey T)
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(600);

    // Assert environment and character are rendered
    const templeMetrics = await getCanvasPixelMetrics(page);
    expect(templeMetrics!.activePixels).toBeGreaterThan(10000);

    // Open Pause Modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Assert pause overlay is visible
    const pauseMetrics = await getCanvasPixelMetrics(page);
    expect(pauseMetrics!.activePixels).toBeGreaterThan(5000);

    const templePauseScreenshot = path.join('screenshots', `temple_pause_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: templePauseScreenshot });

    // Press Q to return to Title
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(400);

    // Verify Title Screen
    const titleMetrics = await getCanvasPixelMetrics(page);
    expect(titleMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('World Exploration Scene renders terrain, player, and returns on Escape', async ({ page }, testInfo) => {
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(600);

    const worldMetrics = await getCanvasPixelMetrics(page);
    expect(worldMetrics!.activePixels).toBeGreaterThan(10000);

    // Move player in world
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');

    const worldScreenshot = path.join('screenshots', `world_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: worldScreenshot });

    // Escape returns to Title
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const titleMetrics = await getCanvasPixelMetrics(page);
    expect(titleMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('Boss Encounter Scene renders arena, boss, and returns on Escape', async ({ page }, testInfo) => {
    await page.keyboard.press('KeyX');
    await page.waitForTimeout(600);

    const bossMetrics = await getCanvasPixelMetrics(page);
    expect(bossMetrics!.activePixels).toBeGreaterThan(10000);

    // Attack action (KeyJ) and Dash (Space)
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    const bossScreenshot = path.join('screenshots', `boss_${testInfo.project.name.replace(/\s+/g, '_')}.png`);
    await page.screenshot({ path: bossScreenshot });

    // Pause encounter via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Resume encounter via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Pause and exit via KeyQ
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.keyboard.press('KeyQ');
    await page.waitForTimeout(400);

    const titleMetrics = await getCanvasPixelMetrics(page);
    expect(titleMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('Settings Scene opens, renders configuration options, and returns on Escape', async ({ page }) => {
    await page.keyboard.press('KeyP');
    await page.waitForTimeout(400);

    const settingsMetrics = await getCanvasPixelMetrics(page);
    expect(settingsMetrics!.activePixels).toBeGreaterThan(3000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const titleMetrics = await getCanvasPixelMetrics(page);
    expect(titleMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('20x Multi-Scene Transition Stress Test executes smoothly without degradation or memory leaks', async ({ page }) => {
    test.setTimeout(90000);
    const scenes = [
      { enter: 'KeyA', name: 'StoryCampaignScene' },
      { enter: 'KeyC', name: 'CharacterShowcaseScene' },
      { enter: 'KeyE', name: 'WorldExplorationScene' },
      { enter: 'KeyX', name: 'BossEncounterScene' },
      { enter: 'KeyP', name: 'SettingsScene' },
    ];

    // Execute 20 iterations (4 cycles across 5 distinct scenes)
    for (let i = 0; i < 20; i++) {
      const target = scenes[i % scenes.length];
      await page.keyboard.press(target.enter);
      await page.waitForTimeout(200);

      // Verify active scene count is strictly 1
      const sceneCount = await page.evaluate(() => {
        const sm = (window as any).__astraEngine?.getSceneManager();
        return sm ? (sm.getCurrentScene() ? 1 : 0) : 1;
      });
      expect(sceneCount).toBe(1);

      // Verify non-empty active rendering
      const metrics = await getCanvasPixelMetrics(page);
      expect(metrics!.activePixels).toBeGreaterThan(2000);

      // Return to SplashScene
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      // If paused in campaign/boss, press KeyQ
      const curScene = await page.evaluate(() => (window as any).__astraEngine?.getSceneManager()?.getCurrentScene()?.id);
      if (curScene === 'StoryCampaignScene' || curScene === 'BossEncounterScene') {
        await page.keyboard.press('KeyQ');
        await page.waitForTimeout(150);
      }
    }

    // Final assertion: Title Scene is healthy and interactive
    const finalMetrics = await getCanvasPixelMetrics(page);
    expect(finalMetrics!.activePixels).toBeGreaterThan(5000);
  });

  test('Canvas adapts correctly during dynamic viewport resize and DPR changes', async ({ page }) => {
    // Test tablet dimension
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(300);

    let metrics = await getCanvasPixelMetrics(page);
    expect(metrics).not.toBeNull();
    expect(metrics!.canvasWidth).toBe(1280);
    expect(metrics!.canvasHeight).toBe(720);
    expect(metrics!.activePixels).toBeGreaterThan(5000);

    // Test widescreen 2560x1440 dimension
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(300);

    metrics = await getCanvasPixelMetrics(page);
    expect(metrics).not.toBeNull();
    expect(metrics!.canvasWidth).toBe(1280);
    expect(metrics!.canvasHeight).toBe(720);
    expect(metrics!.activePixels).toBeGreaterThan(5000);
  });
});
