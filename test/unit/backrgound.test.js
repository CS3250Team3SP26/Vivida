// Mock StorageService before importing background.js
const mockStorageService = {
    loadGroups: jest.fn(),
    saveGroups: jest.fn(),
    saveGroup: jest.fn(),
    deleteGroup: jest.fn(),
    loadActiveGroupId: jest.fn(),
    saveActiveGroupId: jest.fn()
};

global.StorageService = jest.fn(() => mockStorageService);

global.browser = {
    management: {
        getAll: jest.fn()
    },
    runtime: {
        onMessage: {
            addListener: jest.fn()
        }
    }
}
beforeEach(() => {
    jest.clearAllMocks();
});
describe('initialize', () => {
    it('should save empty groups object when no groups exist', async () => {
        // 1. Arrange: Set up mock to return empty object
        mockStorageService.loadGroups.mockResolvedValue({});
        
        // 2. Act: Call the function
        const { initialize } = require('../src/background/background.js');
        await initialize();
        
        // 3. Assert: Check that saveGroups was called with {}
        expect(mockStorageService.saveGroups).toHaveBeenCalledWith({});
    });
});

// 2. Import the module you're testing
// 3. describe/it blocks