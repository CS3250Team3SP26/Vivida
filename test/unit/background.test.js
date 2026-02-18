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