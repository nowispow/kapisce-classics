import { test, expect } from '@playwright/test';

test('speed reader renders centered word and core controls work', async ({ page }) => {
  await page.goto('/test/speed-reader');

  const speedReader = page.locator('.speed-reader');
  await expect(speedReader).toBeVisible();

  const wordDisplay = speedReader.locator('.rsvp-word');
  await expect(wordDisplay).toBeVisible();

  const fullWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  const visibleText = (await wordDisplay.innerText()).trim();
  expect(visibleText).toBe(fullWord);

  const wordBox = await wordDisplay.boundingBox();
  expect(wordBox).not.toBeNull();
  if (wordBox) {
    const textCenterX = await wordDisplay.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      if (!rects.length) return null;
      const first = rects[0];
      return first.left + first.width / 2;
    });

    expect(textCenterX).not.toBeNull();
    if (textCenterX !== null) {
      const wordCenterX = wordBox.x + wordBox.width / 2;
      expect(Math.abs(textCenterX - wordCenterX)).toBeLessThan(6);
    }
  }

  const playButton = speedReader.locator('button[aria-label="Play"]');
  await expect(playButton).toBeVisible();

  const wpmSelect = speedReader.locator('select');
  await expect(wpmSelect).toHaveValue('300');

  await playButton.click();
  const initialWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  await expect
    .poll(async () => (await wordDisplay.getAttribute('aria-label')) ?? '', {
      timeout: 2000,
    })
    .not.toBe(initialWord);

  const resetButton = speedReader.locator('button:has-text("Reset")');
  await resetButton.click();
  const afterResetWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  expect(afterResetWord).toBe('alpha');
});

test('speed reader applies one-word extra pause after sentence punctuation', async ({ page }) => {
  await page.goto('/test/speed-reader');

  const speedReader = page.locator('.speed-reader');
  await expect(speedReader).toBeVisible();

  const wordDisplay = speedReader.locator('.rsvp-word');
  await expect(wordDisplay).toBeVisible();

  await speedReader.locator('select').selectOption('150');
  await speedReader.locator('button[aria-label="Play"]').click();

  let previousWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  let previousTs = Date.now();
  const deltasByWord: Record<string, number> = {};
  const timeoutAt = Date.now() + 20_000;

  while (Date.now() < timeoutAt) {
    await page.waitForTimeout(10);
    const currentWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
    if (currentWord === previousWord) continue;

    const now = Date.now();
    deltasByWord[previousWord] = now - previousTs;
    previousWord = currentWord;
    previousTs = now;

    const hasRequiredSamples =
      deltasByWord['gamma'] !== undefined &&
      deltasByWord['delta,'] !== undefined &&
      deltasByWord['eta'] !== undefined &&
      deltasByWord['theta.'] !== undefined &&
      deltasByWord['rho;'] !== undefined &&
      deltasByWord['sigma!'] !== undefined &&
      deltasByWord['tau?'] !== undefined &&
      deltasByWord['![]'] !== undefined;
    if (hasRequiredSamples) break;
  }

  const gammaDelta = deltasByWord['gamma'];
  const deltaPause = deltasByWord['delta,'];
  const etaTheta = deltasByWord['eta'];
  const thetaPause = deltasByWord['theta.'];
  const piRho = deltasByWord['pi'];
  const rhoPause = deltasByWord['rho;'];
  const sigmaPause = deltasByWord['sigma!'];
  const tauPause = deltasByWord['tau?'];
  const markdownToken = deltasByWord['![]'];
  expect(gammaDelta).toBeDefined();
  expect(deltaPause).toBeDefined();
  expect(etaTheta).toBeDefined();
  expect(thetaPause).toBeDefined();
  expect(piRho).toBeDefined();
  expect(rhoPause).toBeDefined();
  expect(sigmaPause).toBeDefined();
  expect(tauPause).toBeDefined();
  expect(markdownToken).toBeDefined();

  // At 150 WPM, one word is ~400ms. Punctuation should add ~400ms.
  expect(deltaPause!).toBeGreaterThan(gammaDelta! + 250);
  expect(thetaPause!).toBeGreaterThan(etaTheta! + 250);
  expect(rhoPause!).toBeGreaterThan(piRho! + 250);

  // Sentence endings should pause too.
  expect(sigmaPause!).toBeGreaterThan(piRho! + 250);
  expect(tauPause!).toBeGreaterThan(piRho! + 250);

  // Markdown image shortcut token should not trigger punctuation pause.
  expect(markdownToken!).toBeLessThan(tauPause! - 150);
});
