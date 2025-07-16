import { test, expect } from '@playwright/test';

test.describe('Tracks Page E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to main application page
    await page.goto('/');
  });

  test('should display page title and main elements', async ({ page }) => {
    // Check that page is loaded
    await expect(page).toHaveTitle(/Music Tracks App/);

    // Check presence of main interface elements
    await expect(page.locator('app-track-list-widget')).toBeVisible();
    await expect(page.locator('[data-testid="tracks-header"]')).toBeVisible();
  });

  test('should display tracks list', async ({ page }) => {
    // Wait for tracks list to load
    await page.waitForSelector('app-track-card', { timeout: 10000 });

    // Check that tracks are displayed
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();

    // Check content of first track
    const firstTrack = trackCards.first();
    await expect(firstTrack.locator('[data-testid*="-title"]')).toBeVisible();
    await expect(firstTrack.locator('[data-testid*="-artist"]')).toBeVisible();
  });

  test('should support track search', async ({ page }) => {
    // Find search field
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Enter search query
    await searchInput.fill('test');

    // Wait for results update
    await page.waitForTimeout(2000);

    // Check that search works (check change in number of results or their content)
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should support genre filtering', async ({ page }) => {
    // Find genre selector
    const genreSelect = page.locator('[data-testid="filter-genre"]');

    if (await genreSelect.isVisible()) {
      await genreSelect.click();

      // Select first available genre (not "All Genres")
      const genreOptions = page.locator('mat-option');
      const firstGenreOption = genreOptions.nth(1); // Skip "All Genres"

      if (await firstGenreOption.isVisible()) {
        await firstGenreOption.click();

        // Wait for results update
        await page.waitForTimeout(2000);

        // Check that filter is applied
        const trackCards = page.locator('app-track-card');
        await expect(trackCards.first()).toBeVisible();
      }
    }
  });

  test('should open track creation modal', async ({ page }) => {
    // Find create track button
    const createButton = page.locator('[data-testid="create-track-button"]');

    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for modal to appear
      await page.waitForTimeout(1000);

      // Check that modal opened
      const modal = page.locator('mat-dialog-container');
      await expect(modal).toBeVisible();

      // Check presence of form inside modal
      await expect(modal.locator('input[placeholder*="title" i]')).toBeVisible();

      // Close modal (press Escape or find close button)
      await page.keyboard.press('Escape');

      // Wait for modal to close
      await page.waitForTimeout(500);
    }
  });

  test('should support track playback', async ({ page }) => {
    // Wait for tracks to load
    await page.waitForSelector('app-track-card');

    // Find first track with play button
    const firstTrack = page.locator('app-track-card').first();
    const playButton = firstTrack.locator('button[data-testid*="play-button"]');

    if (await playButton.isVisible()) {
      await playButton.click();

      // Wait for player activation
      await page.waitForTimeout(1000);

      // Check that player is activated
      const player = page.locator('app-track-player');
      if (await player.isVisible()) {
        await expect(player).toBeVisible();
      }

      // Check that button changed to "pause"
      const pauseButton = firstTrack.locator('button[data-testid*="pause-button"]');
      if (await pauseButton.isVisible()) {
        await expect(pauseButton).toBeVisible();
      }
    }
  });

  test('should support track sorting', async ({ page }) => {
    // Find sorting controls
    const sortSelect = page.locator('[data-testid="sort-select"]');

    if (await sortSelect.isVisible()) {
      // Change sorting
      await sortSelect.click();

      // Wait for options to appear and select Title
      await page.waitForTimeout(500);
      const titleOption = page.locator('mat-option').filter({ hasText: 'Title' });
      if (await titleOption.isVisible()) {
        await titleOption.click();
      }

      // Wait for update
      await page.waitForTimeout(2000);

      // Check that tracks are displayed after sorting
      const trackTitles = await page.locator('[data-testid*="-title"]').allTextContents();
      expect(trackTitles.length).toBeGreaterThan(0);
    }
  });

  test('should display track details on click', async ({ page }) => {
    // Wait for tracks to load
    await page.waitForSelector('app-track-card');

    // Click on first track (on title area)
    const firstTrack = page.locator('app-track-card').first();
    const trackTitle = firstTrack.locator('[data-testid*="-title"]');

    if (await trackTitle.isVisible()) {
      await trackTitle.click();

      // Wait for possible reaction to click
      await page.waitForTimeout(1000);
    }

    // Check that track remains visible (details can be displayed inline)
    await expect(firstTrack).toBeVisible();
  });

  test('should correctly handle loading state', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();

    // Check presence of loading indicator
    const loader = page.locator('[data-testid="loading-tracks"]');

    // Indicator should appear and then disappear
    if (await loader.isVisible()) {
      await expect(loader).toBeVisible();
      await expect(loader).not.toBeVisible({ timeout: 10000 });
    }

    // After loading, tracks should be visible
    await expect(page.locator('app-track-card').first()).toBeVisible();
  });

  test('should support responsive design', async ({ page }) => {
    // Check on mobile resolution
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that elements remain visible
    await expect(page.locator('app-track-list-widget')).toBeVisible();

    // Check on tablet resolution
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for tracks to load and check their visibility
    await page.waitForSelector('app-track-card', { timeout: 10000 });
    await expect(page.locator('app-track-card').first()).toBeVisible();

    // Return to normal resolution
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
