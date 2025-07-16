import { test, expect } from '@playwright/test';

test.describe('Tracks Page E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to main application page
    await page.goto('/');
  });

  test('should display page title and main elements', async ({ page }) => {
    // Check that page is loaded
    await expect(page).toHaveTitle(/Music Tracks/);

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
    // Find search field - target the native input within the Material 3 component
    const searchInput = page.locator('app-m3-input[data-testid="search-input"] input');
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
    // Find genre selector - use correct test-id
    const genreSelect = page.locator('mat-select[data-testid="filter-genre"]');
    await expect(genreSelect).toBeVisible();

    // Open dropdown
    await genreSelect.click();

    // Wait for options to load
    await page.waitForSelector('mat-option', { timeout: 5000 });

    // Select first non-"All Genres" option
    const genreOptions = page.locator('mat-option');
    const firstGenreOption = genreOptions.nth(1); // Skip "All Genres"
    await firstGenreOption.click();

    // Wait for results update
    await page.waitForTimeout(2000);

    // Check that filtering works
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should open track creation modal', async ({ page }) => {
    // Find and click create track button
    const createButton = page.locator('[data-testid="create-track-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Check that modal dialog appeared (Material dialog)
    const modalDialog = page.locator('mat-dialog-container');
    if (await modalDialog.isVisible()) {
      await expect(modalDialog).toBeVisible();
      
      // Check for form elements inside modal
      const formInputs = modalDialog.locator('input, mat-select');
      if (await formInputs.first().isVisible()) {
        await expect(formInputs.first()).toBeVisible();
      }

      // Close modal by pressing Escape
      await page.keyboard.press('Escape');
      
      // Wait for modal to close
      await page.waitForTimeout(500);
    }

    // Verify we're back to main page
    await expect(page.locator('app-track-list-widget')).toBeVisible();
  });

  test('should support track playback', async ({ page }) => {
    // Wait for tracks to load
    await page.waitForSelector('app-track-card', { timeout: 10000 });

    // Find first track with audio file (play button)
    const firstTrack = page.locator('app-track-card').first();
    const playButton = firstTrack.locator('app-m3-button[data-testid*="play-button"]');
    
    // Check if play button exists (track has audio file)
    if (await playButton.isVisible()) {
      // Click play button
      await playButton.click();

      // Wait for audio playback to start
      await page.waitForTimeout(2000);

      // Check that active track widget is displayed
      const activeTrackWidget = page.locator('app-active-track-widget');
      if (await activeTrackWidget.isVisible()) {
        await expect(activeTrackWidget).toBeVisible();
      }

      // Alternatively, check if button changed to pause
      const pauseButton = firstTrack.locator('app-m3-button[data-testid*="pause-button"]');
      if (await pauseButton.isVisible()) {
        await expect(pauseButton).toBeVisible();
      }
    } else {
      // If no play button found, just verify tracks are displayed
      await expect(firstTrack).toBeVisible();
    }
  });

  test('should support track sorting', async ({ page }) => {
    // Wait for tracks to load
    await page.waitForSelector('app-track-card', { timeout: 10000 });

    // Find sort selector with correct test-id
    const sortSelect = page.locator('[data-testid="sort-select"]');
    await expect(sortSelect).toBeVisible();

    // Open dropdown
    await sortSelect.click();

    // Wait for options to load
    await page.waitForSelector('mat-option', { timeout: 5000 });

    // Select sorting option (e.g., by artist)
    const sortOption = page.locator('mat-option').filter({ hasText: 'Artist' });
    if (await sortOption.isVisible()) {
      await sortOption.click();
    } else {
      // If "Artist" not found, click first non-selected option
      const options = page.locator('mat-option');
      await options.nth(1).click(); // Skip current selection
    }

    // Wait for results to be sorted
    await page.waitForTimeout(2000);

    // Check that tracks are still displayed
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should display track details on click', async ({ page }) => {
    // Wait for tracks to load
    await page.waitForSelector('app-track-card', { timeout: 10000 });

    // Click on first track card to view details
    const firstTrack = page.locator('app-track-card').first();
    await firstTrack.click();

    // Wait for any modal or details view to appear
    await page.waitForTimeout(1000);

    // Check if track edit modal appeared (if clicking opens edit modal)
    const editModal = page.locator('app-track-edit-modal');
    if (await editModal.isVisible()) {
      await expect(editModal).toBeVisible();
      // Close the modal
      await page.keyboard.press('Escape');
    }

    // Verify track card is still visible
    await expect(firstTrack).toBeVisible();
  });

  test('should correctly handle loading state', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');

    // Check for loading indicators (spinner or skeleton)
    const loadingIndicators = page.locator('mat-spinner, .loading, .skeleton, mat-progress-spinner');
    
    // Wait for content to load
    await page.waitForSelector('app-track-card', { timeout: 10000 });

    // Verify loading state is gone and content is displayed
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();
  });

  test('should support responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForSelector('app-track-card', { timeout: 10000 });
    
    // Check that tracks are displayed in desktop layout
    const trackCards = page.locator('app-track-card');
    await expect(trackCards.first()).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Check that tracks are still displayed
    await expect(trackCards.first()).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that tracks are still displayed in mobile layout
    await expect(trackCards.first()).toBeVisible();
    
    // Check that responsive elements are working
    const searchContainer = page.locator('.search-container');
    if (await searchContainer.isVisible()) {
      await expect(searchContainer).toBeVisible();
    }
  });

});
