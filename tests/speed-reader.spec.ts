import { test, expect } from '@playwright/test';

test('speed reader renders centered pivot letter and core controls work', async ({ page }) => {
  await page.goto('/test/speed-reader');

  const speedReader = page.locator('.speed-reader');
  await expect(speedReader).toBeVisible();

  const wordDisplay = speedReader.locator('.rsvp-word');
  await expect(wordDisplay).toBeVisible();

  const pivotLetter = wordDisplay.locator('.rsvp-pivot');
  const leftPart = wordDisplay.locator('.rsvp-left');
  const rightPart = wordDisplay.locator('.rsvp-right');
  await expect(pivotLetter).toBeVisible();

  const fullWord = (await wordDisplay.getAttribute('aria-label')) ?? '';
  const reconstructed =
    (await leftPart.innerText()) +
    (await pivotLetter.innerText()) +
    (await rightPart.innerText());
  expect(reconstructed).toBe(fullWord);

  const wordBox = await wordDisplay.boundingBox();
  const pivotBox = await pivotLetter.boundingBox();
  expect(wordBox).not.toBeNull();
  expect(pivotBox).not.toBeNull();
  if (wordBox && pivotBox) {
    const wordCenter = wordBox.x + wordBox.width / 2;
    const pivotCenter = pivotBox.x + pivotBox.width / 2;
    expect(Math.abs(pivotCenter - wordCenter)).toBeLessThan(2.5);
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

test('speed reader applies longer delays after punctuation', async ({ page }) => {
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
      deltasByWord['theta.'] !== undefined;
    if (hasRequiredSamples) break;
  }

  const gammaDelta = deltasByWord['gamma'];
  const deltaPause = deltasByWord['delta,'];
  const etaTheta = deltasByWord['eta'];
  const thetaPause = deltasByWord['theta.'];
  expect(gammaDelta).toBeDefined();
  expect(deltaPause).toBeDefined();
  expect(etaTheta).toBeDefined();
  expect(thetaPause).toBeDefined();

  expect(deltaPause!).toBeGreaterThan(gammaDelta! + 80);
  expect(thetaPause!).toBeGreaterThan(etaTheta! + 140);
});
