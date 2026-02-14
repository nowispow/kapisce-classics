import { test, expect } from '@playwright/test';

test('speed reader appears and functions correctly', async ({ page }) => {
  // We'll assume the page is running locally on port 4321
  await page.goto('/blog/pride-and-prejudice-chapter-1');

  // Check if SpeedReader is visible
  const speedReader = page.locator('.speed-reader');
  await expect(speedReader).toBeVisible();

  // Check initial state
  const wordDisplay = speedReader.locator('.text-4xl');
  await expect(wordDisplay).toBeVisible();
  
  // Play button should exist
  const playButton = speedReader.locator('button[aria-label="Play"]');
  await expect(playButton).toBeVisible();

  // WPM selector should have correct default and options
  const wpmSelect = speedReader.locator('select');
  await expect(wpmSelect).toHaveValue('300');
  
  // Check if we can change WPM
  await wpmSelect.selectOption('600');
  await expect(wpmSelect).toHaveValue('600');

  // Start playing
  await playButton.click();
  
  // Wait a bit to see if word changes (RSVP)
  const initialWord = await wordDisplay.innerText();
  await page.waitForTimeout(500); // At 600 WPM, words change every 100ms
  const newWord = await wordDisplay.innerText();
  
  expect(newWord).not.toBe(initialWord);

  // Reset button should reset to first word
  const resetButton = speedReader.locator('button:has-text("Reset")');
  await resetButton.click();
  
  // After reset, it should be back to the first word or initial state
  // (In our case it resets to the first word of the text)
  const afterResetWord = await wordDisplay.innerText();
  // Note: first word of P&P Ch 1 is usually "It"
  expect(afterResetWord).toBe('It');
});
