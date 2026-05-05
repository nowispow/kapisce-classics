import { test, expect } from '@playwright/test';

test('speed reader renders centered word and core controls work', async ({ page }) => {
  await page.goto('/test/speed-reader');

  const speedReader = page.locator('.speed-reader');
  await expect(speedReader).toBeVisible();

  const wordDisplay = speedReader.locator('.rsvp-word');
  await expect(wordDisplay).toBeVisible();

  const fullWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  const visibleText = ((await wordDisplay.textContent()) ?? '').trim();
  expect(fullWord).toBe('alpha');
  expect(visibleText).toBe(fullWord);

  const wordBox = await wordDisplay.boundingBox();
  const pivotBox = await wordDisplay.locator('.rsvp-pivot').boundingBox();
  expect(wordBox).not.toBeNull();
  expect(pivotBox).not.toBeNull();
  if (wordBox && pivotBox) {
    const wordCenterX = wordBox.x + wordBox.width / 2;
    const pivotCenterX = pivotBox.x + pivotBox.width / 2;
    expect(Math.abs(pivotCenterX - wordCenterX)).toBeLessThan(1);
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

  const movingPivotOffset = await wordDisplay.evaluate((el) => {
    const pivot = el.querySelector('.rsvp-pivot');
    if (!pivot) return null;
    const wordRect = el.getBoundingClientRect();
    const pivotRect = pivot.getBoundingClientRect();
    return Math.abs(pivotRect.left + pivotRect.width / 2 - (wordRect.left + wordRect.width / 2));
  });
  expect(movingPivotOffset).not.toBeNull();
  expect(movingPivotOffset!).toBeLessThan(1);

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

  const wpmSelect = speedReader.locator('select');
  await wpmSelect.selectOption('150');
  await expect(wpmSelect).toHaveValue('150');
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
      deltasByWord['tau?'] !== undefined;
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
  expect(gammaDelta).toBeDefined();
  expect(deltaPause).toBeDefined();
  expect(etaTheta).toBeDefined();
  expect(thetaPause).toBeDefined();
  expect(piRho).toBeDefined();
  expect(rhoPause).toBeDefined();
  expect(sigmaPause).toBeDefined();
  expect(tauPause).toBeDefined();
  expect(deltasByWord['![]']).toBeUndefined();
  expect(deltasByWord['Decorative']).toBeUndefined();

  // At 150 WPM, one word is ~400ms. Punctuation should add ~400ms.
  expect(deltaPause!).toBeGreaterThan(gammaDelta! + 250);
  expect(thetaPause!).toBeGreaterThan(etaTheta! + 250);
  expect(rhoPause!).toBeGreaterThan(piRho! + 250);

  // Sentence endings should pause too.
  expect(sigmaPause!).toBeGreaterThan(piRho! + 250);
  expect(tauPause!).toBeGreaterThan(piRho! + 250);
});
