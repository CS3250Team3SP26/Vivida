/**
 * @fileoverview Unit tests for themeAPI module
 */
import { afterEach, beforeEach, jest } from '@jest/globals';
import { getThemes } from '../../src/lib/themeAPI.js';

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
        //Arrange: Mock the browser API to return a mix of themes and extensions
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'theme', name: 'Dark Theme' },
            { id: '2', type: 'extension', name: 'Some Extension' },
            { id: '3', type: 'theme', name: 'Light Theme' },
        ]);

        //Act: Call the getThemes function
        const themes = await getThemes();

        //Assert: Verify that only themes are returned and logged correctly
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
        //Arrange: Mock the browser API to return only extensions
        globalThis.browser.management.getAll.mockResolvedValue([
            { id: '1', type: 'extension', name: 'Some Extension' },
            { id: '2', type: 'extension', name: 'Another Extension' },
        ]);

        //Act: Call the getThemes function
        const themes = await getThemes();

        //Assert: Verify that an empty array is returned and logged correctly
        expect(consoleLogSpy).toHaveBeenCalledWith("Retrieved themes:", []);
        expect(themes).toEqual([]);
    });

    test('getThemes should handle errors gracefully', async () => {
        //Arrange: Mock the browser API to throw an error
        globalThis.browser.management.getAll.mockRejectedValue(new Error('Failed to retrieve themes'));

        //Act: Call the getThemes function
        const themes = await getThemes();

        //Assert: Verify that the error is logged and an empty array is returned
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error retrieving themes:", expect.any(Error));
        expect(themes).toEqual([]);
    });
});