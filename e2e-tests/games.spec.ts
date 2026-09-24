import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Verify game cards are displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first()).toBeVisible();
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first().getByTestId('game-title')).toBeVisible();
      await expect(gameCards.first().getByTestId('game-title')).not.toBeEmpty();
    });
  });

  test('should display publisher avatars on game cards', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.getByTestId('game-card').first();
    const avatar = firstCard.getByTestId('game-card-avatar');

    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('role', 'img');
    await expect(avatar).toHaveAttribute('aria-label', /avatar$/);
    await expect(avatar).not.toBeEmpty();
  });

  test('should filter games by category and publisher', async ({ page }) => {
    await page.goto('/');

    await test.step('Filter by category', async () => {
      await page.getByTestId('category-filter-Strategy').check();
      const cards = page.locator('[data-testid="game-card"]:not([hidden])');
      await expect(cards).toHaveCount(4);
      await expect(page).toHaveURL(/category=Strategy/);
    });

    await test.step('Combine category and publisher filters', async () => {
      await page.getByTestId('publisher-filter').selectOption({ label: 'CodeForge Studios' });
      const cards = page.locator('[data-testid="game-card"]:not([hidden])');
      await expect(cards).toHaveCount(1);
      await expect(page).toHaveURL(/category=Strategy.*publisher=CodeForge\+Studios/);
      await expect(page.getByTestId('games-result-count')).toContainText('game');
    });
  });

  test('should hydrate filters from the URL and clear them', async ({ page }) => {
    await page.goto('/?category=Puzzle&publisher=GitHub%20Games');

    await expect(page.getByTestId('category-filter-Puzzle')).toBeChecked();
    await expect(page.getByTestId('publisher-filter')).toHaveValue('GitHub Games');
    await expect(page.getByTestId('clear-filters')).toBeEnabled();

    await page.getByTestId('clear-filters').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('category-filter-Puzzle')).not.toBeChecked();
    await expect(page.getByTestId('publisher-filter')).toHaveValue('');
    await expect(page.getByTestId('games-result-count')).toContainText('21 games found');
  });

  test('should show an empty state when filters have no matches', async ({ page }) => {
    await page.goto('/?category=NotARealCategory&publisher=GitHub%20Games');

    await expect(page.getByTestId('filtered-empty-state')).toBeVisible();
    await expect(page.getByTestId('games-grid')).toBeHidden();
    await expect(page.getByTestId('games-result-count')).toHaveText('0 games found');
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameId: string | null;
    let gameTitle: string | null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Get first game information and click it', async () => {
      const firstGameCard = page.getByTestId('game-card').first();
      gameId = await firstGameCard.getAttribute('data-game-id');
      gameTitle = await firstGameCard.getAttribute('data-game-title');
      await firstGameCard.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(`/game/${gameId}`);
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        await expect(page.getByTestId('game-details-title')).toHaveText(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});
