/**
 * @fileoverview Unit tests for StorageService module
 */

import { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId } from '../../src/lib/storageServiceWrapper.js';

describe('StorageService', () => {

    // Mocking the browser.storage API
    const browserMock = {
        storage: {
            local: {
                get: jest.fn(),
                set: jest.fn(),
            },
        },
    };

    // Make the mock available globally
    global.browser = browserMock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /* ============================================
    * GROUP STORAGE TESTS
    * ============================================ */
    describe('saveGroups', () => {
        test('should successfully save an array of groups', async () => {
            const mockGroups = [{ id: '1', name: 'Dark Mode' }];
            browserMock.storage.local.set.mockResolvedValue(undefined);

            await saveGroups(mockGroups);

            expect(browserMock.storage.local.set).toHaveBeenCalledWith({ groups: mockGroups });
        });

        test('should throw an error if the storage API fails', async () => {
            const error = new Error('Storage Full');
            browserMock.storage.local.set.mockRejectedValue(error);

            await expect(saveGroups([])).rejects.toThrow('Storage Full');
        });
    });

    describe('loadGroups', () => {
        test('should return groups from storage', async () => {
            const mockGroups = [{ id: '1', name: 'Dark Mode' }];
            browserMock.storage.local.get.mockResolvedValue({ groups: mockGroups });

            const result = await loadGroups();

            expect(result).toEqual(mockGroups);
            expect(browserMock.storage.local.get).toHaveBeenCalledWith('groups');
        });

        test('should return an empty array if no groups exist', async () => {
            browserMock.storage.local.get.mockResolvedValue({});

            const result = await loadGroups();

            expect(result).toEqual([]);
        });

        test('should return an empty array and log error if loading fails', async () => {
            browserMock.storage.local.get.mockRejectedValue(new Error('Read Error'));

            const result = await loadGroups();

            expect(result).toEqual([]);
        });
    });

    /* ============================================
    * ACTIVE GROUP ID TESTS
    * ============================================ */
    describe('saveActiveGroupId', () => {
        test('should successfully save the active group ID', async () => {
            const id = 'group-123';
            browserMock.storage.local.set.mockResolvedValue(undefined);

            await saveActiveGroupId(id);

            expect(browserMock.storage.local.set).toHaveBeenCalledWith({ activeGroupId: id });
        });

        test('should throw an error if saving ID fails', async () => {
            browserMock.storage.local.set.mockRejectedValue(new Error('Write Error'));

            await expect(saveActiveGroupId('123')).rejects.toThrow('Write Error');
        });
    });

    describe('loadActiveGroupId', () => {
        test('should return the active ID from storage', async () => {
            browserMock.storage.local.get.mockResolvedValue({ activeGroupId: '123' });

            const result = await loadActiveGroupId();

            expect(result).toBe('123');
            expect(browserMock.storage.local.get).toHaveBeenCalledWith('activeGroupId');
        });

        test('should return null if no active ID is set', async () => {
            browserMock.storage.local.get.mockResolvedValue({});

            const result = await loadActiveGroupId();

            expect(result).toBeNull();
        });

        test('should return null if loading the ID fails', async () => {
            browserMock.storage.local.get.mockRejectedValue(new Error('Fatal Error'));

            const result = await loadActiveGroupId();

            expect(result).toBeNull();
        });
    });
});