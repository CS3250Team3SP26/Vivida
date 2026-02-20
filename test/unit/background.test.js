import { jest } from '@jest/globals';

// Mock storageServiceWrapper named exports
jest.unstable_mockModule('../../src/lib/storageServiceWrapper.js', () => ({
    loadGroups: jest.fn(),
    saveGroups: jest.fn(),
    saveGroup: jest.fn(),
    deleteGroup: jest.fn(),
    loadActiveGroupId: jest.fn(),
    saveActiveGroupId: jest.fn()
}));

// Mock themeAPI named exports
jest.unstable_mockModule('../../src/lib/themeAPI.js', () => ({
    getThemes: jest.fn(),
    getCurrentTheme: jest.fn(),
    enableTheme: jest.fn(),
    disableTheme: jest.fn(),
    getThemeById: jest.fn()
}));

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

const { initialize, handleMessage } = await import('../../src/background/background.js');
const { loadGroups, saveGroups, loadActiveGroupId } = await import('../../src/lib/storageServiceWrapper.js');
const { getThemes, getCurrentTheme, enableTheme, disableTheme, getThemeById } = await import('../../src/lib/themeAPI.js');

// Flushes all pending microtasks/promises in the queue.
// A single Promise.resolve() only advances one tick, which isn't enough
// for handler chains that resolve across multiple async hops.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
    jest.clearAllMocks();
});

// ============================================================================
// INITIALIZE TESTS
// ============================================================================

describe('initialize', () => {
    it('should save empty array when no groups exist', async () => {
        loadGroups.mockResolvedValue([]);
        await initialize();
        expect(saveGroups).toHaveBeenCalledWith([]);
    });

    it('should NOT call saveGroups when groups already exist', async () => {
        loadGroups.mockResolvedValue([{ name: 'Dark Mode', themes: [] }]);
        await initialize();
        expect(saveGroups).not.toHaveBeenCalled();
    });
});

// ============================================================================
// HANDLE MESSAGE TESTS
// ============================================================================

describe('handleMessage', () => {
    it('should call sendResponse with error for unknown message type', async () => {
        const sendResponse = jest.fn();
        handleMessage({ type: 'UNKNOWN' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({
            success: false,
            error: 'Unknown message type: UNKNOWN'
        });
    });

    // -- Storage handler tests --

    it('GET_ALL_GROUPS should return groups', async () => {
        const sendResponse = jest.fn();
        loadGroups.mockResolvedValue([{ name: 'Dark Mode', themes: [] }]);
        handleMessage({ type: 'GET_ALL_GROUPS' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({ success: true, data: [{ name: 'Dark Mode', themes: [] }] });
    });

    it('GET_ACTIVE_GROUP should return active group ID', async () => {
        const sendResponse = jest.fn();
        loadActiveGroupId.mockResolvedValue('group-123');
        handleMessage({ type: 'GET_ACTIVE_GROUP' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'group-123' });
    });

    // -- Theme API handler tests --

    it('GET_INSTALLED_THEMES should return themes from getThemes', async () => {
        const sendResponse = jest.fn();
        getThemes.mockResolvedValue([{ id: '1', name: 'Dark Theme', type: 'theme' }]);
        handleMessage({ type: 'GET_INSTALLED_THEMES' }, {}, sendResponse);
        await flushPromises();
        expect(getThemes).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({
            success: true,
            data: [{ id: '1', name: 'Dark Theme', type: 'theme' }]
        });
    });

    it('GET_CURRENT_THEME should return the active theme', async () => {
        const sendResponse = jest.fn();
        getCurrentTheme.mockResolvedValue({ id: '2', name: 'Light Theme', enabled: true });
        handleMessage({ type: 'GET_CURRENT_THEME' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({
            success: true,
            data: { id: '2', name: 'Light Theme', enabled: true }
        });
    });

    it('ENABLE_THEME should call enableTheme with the correct themeId', async () => {
        const sendResponse = jest.fn();
        enableTheme.mockResolvedValue();
        handleMessage({ type: 'ENABLE_THEME', themeId: 'theme-abc' }, {}, sendResponse);
        await flushPromises();
        expect(enableTheme).toHaveBeenCalledWith('theme-abc');
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('DISABLE_THEME should call disableTheme with the correct themeId', async () => {
        const sendResponse = jest.fn();
        disableTheme.mockResolvedValue();
        handleMessage({ type: 'DISABLE_THEME', themeId: 'theme-abc' }, {}, sendResponse);
        await flushPromises();
        expect(disableTheme).toHaveBeenCalledWith('theme-abc');
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('GET_THEME_BY_ID should return the correct theme', async () => {
        const sendResponse = jest.fn();
        getThemeById.mockResolvedValue({ id: 'theme-abc', name: 'Dark Theme', type: 'theme' });
        handleMessage({ type: 'GET_THEME_BY_ID', themeId: 'theme-abc' }, {}, sendResponse);
        await flushPromises();
        expect(getThemeById).toHaveBeenCalledWith('theme-abc');
        expect(sendResponse).toHaveBeenCalledWith({
            success: true,
            data: { id: 'theme-abc', name: 'Dark Theme', type: 'theme' }
        });
    });

    it('should send success: false if a handler throws', async () => {
        const sendResponse = jest.fn();
        getThemes.mockRejectedValue(new Error('API failure'));
        handleMessage({ type: 'GET_INSTALLED_THEMES' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'API failure' });
    });
});