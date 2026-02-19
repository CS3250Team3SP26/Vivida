import { jest } from '@jest/globals';
// Mock StorageService before importing background.js
const mockStorageServiceWrapper = {
    loadGroups: jest.fn(),
    saveGroups: jest.fn(),
    saveGroup: jest.fn(),
    deleteGroup: jest.fn(),
    loadActiveGroupId: jest.fn(),
    saveActiveGroupId: jest.fn()
};

globalThis.browser = {
    management: {
        getAll: jest.fn()
    },
    runtime: {
        onMessage: {
            addListener: jest.fn()
        }
    }
};
jest.unstable_mockModule('../../src/lib/storageServiceWrapper.js', () => ({
    default: jest.fn(() => mockStorageServiceWrapper)
}));

// Imports must come AFTER jest.unstable_mockModule
//Initilize Test Begin: Test for Empty Groups
const { initialize, handleMessage, getInstalledThemes } = await import('../../src/background/background.js');



beforeEach(() => {
    jest.clearAllMocks();
});

describe('initialize', () => {
    it('should save empty groups object when no groups exist', async () => {
        // 1. Arrange
        mockStorageServiceWrapper.loadGroups.mockResolvedValue({});

        // 2. Act
        await initialize();

        // 3. Assert
        expect(mockStorageServiceWrapper.saveGroups).toHaveBeenCalledWith({});
    });
});
//Initilize Test: Existing Groups
it('should NOT call saveGroups when groups already exist', async () => {
    // 1. Arrange
    mockStorageServiceWrapper.loadGroups.mockResolvedValue({"Dark Mode": []});

    // 2. Act
    await initialize();

    // 3. Assert
    expect(mockStorageServiceWrapper.saveGroups).not.toHaveBeenCalled({});
});
//Get Installed Themes Test : Filtering out ONLY themes
// Uses an array because of multiple different kinds of themes we might have.
describe('getInstalledThemes', () => {
    it('should return only themes from getAll results', async () => {
        // 1. Arrange
        // mock browser.management.getAll to return a mixed array
        browser.management.getAll.mockResolvedValue([
            { id: "1", name: "Dark Theme", type: "theme" },
            { id: "2", name: "uBlock Origin", type: "extension" }
        ])
        
        // 2. Act
        // call getInstalledThemes() and stores in const results
        const result = await getInstalledThemes();
        
        // 3. Assert
        // check that only the theme came back
        expect(result).toEqual([{ id: "1", name: "Dark Theme", type: "theme" }]);
        /**this whole test filters between mutliple themes and checks if it is a theme or extension
         * if it is a theme it will keep it if not it will filter it out silently
        **/
    });
});
//Test for fails
it('should throw when browser.management.getAll fails', async () => {
    // 1. Arrange
    // told jest to getALL failing with an 'API error'
    browser.management.getAll.mockRejectedValue(new Error('API Error'));

    // 2. Assert
    // verified that getInstalledThemes catches the error and re-throws it with a message
    await expect(getInstalledThemes()).rejects.toThrow('Failed to get installed themes');
});