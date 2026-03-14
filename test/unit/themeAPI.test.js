/**
 * @fileoverview Unit tests for themeAPI module
 */
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { enableTheme, getCurrentTheme, getThemes, disableTheme, isValidTheme, isThemeEnabled, getThemeById } from '../../src/lib/themeAPI.js';

describe('themeAPI Module', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Clear any previous mocks before each test
        jest.clearAllMocks();

        // Mock console methods to prevent actual logging during tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        globalThis.browser = {
            management: {
                getAll: jest.fn(),
                setEnabled: jest.fn(),
                get: jest.fn(),
            },
        };
    });

    afterEach(() => {
        // Restore original console methods after each test
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    /* ============================================
    * GET THEMES TESTS
    * ============================================ */
    test('getThemes should return only themes', async () => {
        // Arrange: Mock the browser API to return a mix of themes and extensions
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'theme', name: 'Dark Theme' },
            { id: '2', type: 'extension', name: 'Some Extension' },
            { id: '3', type: 'theme', name: 'Light Theme' },
        ]);

        // Act: Call the getThemes function
        const themes = await getThemes();

        // Assert: Verify that only themes are returned and logged correctly
        expect(consoleLogSpy).toHaveBeenCalledWith("Retrieved themes:", [
            { id: '1', type: 'theme', name: 'Dark Theme' },
            { id: '3', type: 'theme', name: 'Light Theme' },
        ]);
        expect(themes).toEqual([
            { id: '1', type: 'theme', name: 'Dark Theme' },
            { id: '3', type: 'theme', name: 'Light Theme' },
        ]);
    });

    test('getThemes should return an empty array if there are no themes', async () => {
        // Arrange: Mock the browser API to return only extensions
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'extension', name: 'Some Extension' },
            { id: '2', type: 'extension', name: 'Another Extension' },
        ]);

        // Act: Call the getThemes function
        const themes = await getThemes();

        // Assert: Verify that an empty array is returned and logged correctly
        expect(consoleLogSpy).toHaveBeenCalledWith("Retrieved themes:", []);
        expect(themes).toEqual([]);
    });

    test('getThemes should handle errors gracefully', async () => {
        // Arrange: Mock the browser API to throw an error
        globalThis.browser.management.getAll.mockRejectedValue(new Error('Failed to retrieve themes'));

        // Act: Call the getThemes function
        const themes = await getThemes();

        // Assert: Verify that the error is logged and an empty array is returned
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error retrieving themes:", expect.any(Error));
        expect(themes).toEqual([]);
    });

    /* ============================================
    * GET CURRENT THEME TESTS
    * ============================================ */
    test('getCurrentTheme should return the currently active theme', async () => {
        // Arrange: Mock the browser API to return a list of themes with one active theme
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'theme', name: 'Dark Theme', enabled: false },
            { id: '2', type: 'theme', name: 'Light Theme', enabled: true },
        ]);

        // Act: Call the getCurrentTheme function
        const currentTheme = await getCurrentTheme();

        // Assert: Verify that the correct theme is returned
        expect(currentTheme).toEqual({ id: '2', type: 'theme', name: 'Light Theme', enabled: true });
        expect(consoleLogSpy).toHaveBeenCalledWith("Current active theme:", { id: '2', type: 'theme', name: 'Light Theme', enabled: true });
    });

    test('getCurrentTheme should return null if no theme is active', async () => {
        // Arrange: Mock the browser API to return a list of themes with no active theme
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'theme', name: 'Dark Theme', enabled: false },
            { id: '2', type: 'theme', name: 'Light Theme', enabled: false },
        ]);

        // Act: Call the getCurrentTheme function
        const currentTheme = await getCurrentTheme();

        // Assert: Verify that null is returned
        expect(currentTheme).toBeNull();
        expect(consoleLogSpy).toHaveBeenCalledWith("Current active theme:", undefined);
    });

    /* ============================================
    * IS VALID THEME TESTS
    * ============================================ */
    test('isValidTheme should return true for a valid theme ID', async () => {
        // Arrange: Mock the browser API to return a valid theme for the given ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme' });

        // Act: Call the isValidTheme function with a valid theme ID
        const result = await isValidTheme('valid-theme-id');

        // Assert: Verify that the function returns true
        expect(result).toBe(true);
    });

    test('isValidTheme should return false for a non-string or empty theme ID', async () => {
        // Act & Assert: Call the isValidTheme function with invalid theme IDs and expect it to return false
        expect(await isValidTheme(123)).toBe(false);
        expect(await isValidTheme(null)).toBe(false);
        expect(await isValidTheme(undefined)).toBe(false);
        expect(await isValidTheme('')).toBe(false);
    });

    test('isValidTheme should return false for a non-theme ID', async () => {
        // Arrange: Mock the browser API to return a non-theme for the given ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'extension' });

        // Act: Call the isValidTheme function with a non-theme ID
        const result = await isValidTheme('non-theme-id');

        // Assert: Verify that the function returns false
        expect(result).toBe(false);
    });

    test('isValidTheme should return false for an invalid theme ID', async () => {
        // Arrange: Mock the browser API to throw an error for an invalid theme ID
        globalThis.browser.management.get.mockRejectedValue(new Error('Theme not found'));

        // Act: Call the isValidTheme function with an invalid theme ID
        const result = await isValidTheme('invalid-theme-id');

        // Assert: Verify that the function returns false
        expect(result).toBe(false);
    });

    /* ============================================
    * ENABLE THEME TESTS
    * ============================================ */
    test('enableTheme should enable the specified theme', async () => {
        // Arrange: Mock the browser API to validate the theme and enable it
        globalThis.browser.management.setEnabled.mockResolvedValue();
            // Mock the isValidTheme function to return true for the valid theme ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme' });

        // Act: Call the enableTheme function with a valid theme ID
        await enableTheme('valid-theme-id');

        // Assert: Verify that the theme is enabled
        expect(globalThis.browser.management.setEnabled).toHaveBeenCalledWith('valid-theme-id', true);
        expect(consoleLogSpy).toHaveBeenCalledWith(`Theme with ID valid-theme-id has been enabled.`);
    });

    test('enableTheme should throw an error if the theme ID is invalid', async () => {
        // Arrange: Mock the browser API to validate the theme and return false
        globalThis.browser.management.setEnabled.mockRejectedValue(new Error('Invalid theme ID'));

        // Act: Call the enableTheme function with an invalid theme ID and expect it to throw an error
        await expect(enableTheme('invalid-theme-id')).rejects.toThrow("Invalid theme ID");
    });

    test('enableTheme should throw an error if there is an issue enabling the theme', async () => {
        // Arrange: Mock the browser API to throw an error when enabling the theme
        globalThis.browser.management.setEnabled.mockRejectedValue(new Error('Failed to enable theme'));
        // Mock the isValidTheme function to return true for the valid theme ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme' });

        // Act: Call the enableTheme function with a valid theme ID and expect it to throw an error
        await expect(enableTheme('valid-theme-id')).rejects.toThrow("Failed to enable theme");
    });

    /* ============================================
    * DISABLE THEME TESTS
    * ============================================ */
    test('disableTheme should disable the specified theme', async () => {
        // Arrange: Mock the browser API to validate the theme and disable it
        globalThis.browser.management.setEnabled.mockResolvedValue();
        // Mock the isValidTheme function to return true for the valid theme ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme' });
        // Act: Call the disableTheme function with a valid theme ID
        await disableTheme('valid-theme-id');
        // Assert: Verify that the theme is disabled
        expect(globalThis.browser.management.setEnabled).toHaveBeenCalledWith('valid-theme-id', false);
        expect(consoleLogSpy).toHaveBeenCalledWith(`Theme with ID valid-theme-id has been disabled.`);
    });

    test('disableTheme should throw an error if the theme ID is invalid', async () => {
        // Arrange: Mock the browser API to validate the theme and return false
        globalThis.browser.management.setEnabled.mockRejectedValue(new Error('Invalid theme ID'));
        // Act: Call the disableTheme function with an invalid theme ID and expect it to throw an error
        await expect(disableTheme('invalid-theme-id')).rejects.toThrow("Invalid theme ID");
    });

    test('disableTheme should throw an error if there is an issue disabling the theme', async () => {
        // Arrange: Mock the browser API to throw an error when disabling the theme
        globalThis.browser.management.setEnabled.mockRejectedValue(new Error('Failed to disable theme'));
        // Mock the isValidTheme function to return true for the valid theme ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme' });
        // Act: Call the disableTheme function with a valid theme ID and expect it to throw an error
        await expect(disableTheme('valid-theme-id')).rejects.toThrow("Failed to disable theme");
    });

    /* ============================================
    * IS THEME ENABLED TESTS
    * ============================================ */
    test('isThemeEnabled should return true for an enabled theme', async () => {
        // Arrange: Mock the browser API to return a theme with enabled set to true
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme', enabled: true });
        // Act: Call the isThemeEnabled function with a valid theme ID
        const result = await isThemeEnabled('valid-theme-id');
        // Assert: Verify that the function returns true
        expect(result).toBe(true);
    });

    test('isThemeEnabled should return false for a disabled theme', async () => {
        // Arrange: Mock the browser API to return a theme with enabled set to false
        globalThis.browser.management.get.mockResolvedValue({ type: 'theme', enabled: false });
        // Act: Call the isThemeEnabled function with a valid theme ID
        const result = await isThemeEnabled('valid-theme-id');
        // Assert: Verify that the function returns false
        expect(result).toBe(false);
    });

    test('isThemeEnabled should throw an error if there is an issue retrieving the theme', async () => {
        // Arrange: Mock the browser API to throw an error for an invalid theme ID
        globalThis.browser.management.get.mockRejectedValue(new Error('Failed to retrieve theme'));
        // Act: Call the isThemeEnabled function with an invalid theme ID and expect it to throw an error
        const result = await isThemeEnabled('invalid-theme-id');
        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error checking if theme is enabled:", expect.any(Error));
    });

    test('isThemeEnabled should return false for a non-theme ID', async () => {
        // Arrange: Mock the browser API to return a non-theme for the given ID
        globalThis.browser.management.get.mockResolvedValue({ type: 'extension' });
        // Act: Call the isThemeEnabled function with a non-theme ID
        const result = await isThemeEnabled('non-theme-id');
        // Assert: Verify that the function returns false
        expect(result).toBe(false);
    });

    test('isThemeEnabled should return false if the theme ID is not a string or is empty', async () => {
        // Act: Call the isThemeEnabled function with an invalid theme ID (not a string)
        const result = await isThemeEnabled(null);
        // Assert: Verify that the function returns false
        expect(result).toBe(false);
    });

    /* ============================================
    * GET THEME BY ID TESTS
    * ============================================ */
    test('getThemeById should return the correct theme for a valid theme ID', async () => {
        // Arrange: Mock the browser API to return a theme for the given ID
        globalThis.browser.management.get.mockResolvedValue({ id: 'valid-theme-id', type: 'theme', name: 'Valid Theme' });
        // Act: Call the getThemeById function with a valid theme ID
        const result = await getThemeById('valid-theme-id');
        // Assert: Verify that the correct theme is returned
        expect(result).toEqual({ id: 'valid-theme-id', type: 'theme', name: 'Valid Theme' });
        expect(consoleLogSpy).toHaveBeenCalledWith(`Retrieved theme info:`, { id: 'valid-theme-id', type: 'theme', name: 'Valid Theme' });
    });

    test('getThemeById should throw an error for an invalid theme ID', async () => {
        // Arrange: Mock the browser API to throw an error for an invalid theme ID
        globalThis.browser.management.get.mockRejectedValue(new Error('Theme not found'));
        // Act & Assert: Call the getThemeById function with an invalid theme ID and expect it to throw an error
        await expect(getThemeById('invalid-theme-id')).rejects.toThrow("Theme not found");
    });

    test('getThemeById should throw an error for a non-theme ID', async () => {
        // Arrange: Mock the browser API to return a non-theme for the given ID
        globalThis.browser.management.get.mockResolvedValue({ id: 'non-theme-id', type: 'extension', name: 'Some Extension' });
        // Act & Assert: Call the getThemeById function with a non-theme ID and expect it to throw an error
        await expect(getThemeById('non-theme-id')).rejects.toThrow("ID does not correspond to a theme");
    });

    test('getThemeById should throw an error if there is an issue retrieving the theme', async () => {
        // Arrange: Mock the browser API to throw an error for a valid theme ID
        globalThis.browser.management.get.mockRejectedValue(new Error('Failed to retrieve theme'));
        // Act & Assert: Call the getThemeById function with a valid theme ID and expect it to throw an error
        await expect(getThemeById('valid-theme-id')).rejects.toThrow("Failed to retrieve theme");
    });

    test('getThemeById should throw an error if the theme ID is not a string or is empty', async () => {
        // Act: Call the getThemeById function with an invalid theme ID (not a string)
        await expect(getThemeById(null)).rejects.toThrow("Invalid theme ID");
        await expect(getThemeById(undefined)).rejects.toThrow("Invalid theme ID");
        await expect(getThemeById('')).rejects.toThrow("Invalid theme ID");
    });
});