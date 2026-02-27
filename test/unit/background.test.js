import { jest } from '@jest/globals';

// Mock GroupManager named exports
const mockManager = {
    initialize: jest.fn(),
    getAllGroups: jest.fn(),
    updateGroupThemes: jest.fn(),
    deleteGroup: jest.fn(),
    setActiveGroupId: jest.fn(),
    getActiveGroup: jest.fn(),
    save: jest.fn(),
};
jest.unstable_mockModule('../../src/lib/GroupManager.js', () => ({
    GroupManager: jest.fn().mockImplementation(()=> mockManager)
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

// Suppress console output during initialization
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

const { initialize, handleMessage } = await import('../../src/background/background.js');
const { getThemes, getCurrentTheme, enableTheme, disableTheme, getThemeById } = await import('../../src/lib/themeAPI.js');

// Flushes all pending microtasks/promises in the queue.
// A single Promise.resolve() only advances one tick, which isn't enough
// for handler chains that resolve across multiple async hops.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock console methods to prevent actual logging during tests
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ============================================================================
// INITIALIZE TESTS
// ============================================================================

describe('initialize', () => {
    it('should call manager.initialize once', async () => {
        mockManager.initialize.mockResolvedValue(undefined);
        await initialize();
        expect(mockManager.initialize).toHaveBeenCalledTimes(1);
    });

    it('does not throw when manager.initialize resolves successfully', async () => {
        mockManager.initialize.mockResolvedValue(undefined);
        await expect(initialize()).resolves.not.toThrow();
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

    it('GET_ALL_GROUPS should return serialized groups', async () => {
        const sendResponse = jest.fn();
        mockManager.getAllGroups.mockReturnValue([
            { id: 'g1', group: { name: 'Dark', themes: ['t1'] } }
        ]);
        handleMessage({ type: 'GET_ALL_GROUPS' }, {}, sendResponse);
        await flushPromises();
        expect(sendResponse).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 'g1', name: 'Dark', themes: ['t1'] }]
        });
    });

it('GET_ACTIVE_GROUP should return active group ID', async () => {
    const sendResponse = jest.fn();
    mockManager.getActiveGroup.mockReturnValue({ id: 'g1', group: { name: 'Dark' } });
    handleMessage({ type: 'GET_ACTIVE_GROUP' }, {}, sendResponse);
    await flushPromises();
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'g1' });
});

it('GET_ACTIVE_GROUP should return null when no active group', async () => {
    const sendResponse = jest.fn();
    mockManager.getActiveGroup.mockReturnValue(null);
    handleMessage({ type: 'GET_ACTIVE_GROUP' }, {}, sendResponse);
    await flushPromises();
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: null });
});
it('DELETE_GROUP should delete group and save', async () => {
    const sendResponse = jest.fn();
    mockManager.deleteGroup.mockReturnValue(true);
    mockManager.save.mockResolvedValue(undefined);
    handleMessage({ type: 'DELETE_GROUP', groupId: 'id-123' }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.deleteGroup).toHaveBeenCalledWith('id-123');
    expect(mockManager.save).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
});

it('DELETE_GROUP should return error when group not found', async () => {
    const sendResponse = jest.fn();
    mockManager.deleteGroup.mockReturnValue(false);
    handleMessage({ type: 'DELETE_GROUP', groupId: 'id-123' }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.deleteGroup).toHaveBeenCalledWith('id-123');
    expect(mockManager.save).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Group not found' });
});

it('SET_ACTIVE_GROUP should set active group and save', async () => {
    const sendResponse = jest.fn();
    mockManager.setActiveGroupId.mockReturnValue(true);
    mockManager.save.mockResolvedValue(undefined);
    handleMessage({ type: 'SET_ACTIVE_GROUP', groupId: 'id-123' }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.setActiveGroupId).toHaveBeenCalledWith('id-123');
    expect(mockManager.save).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
});

it('SET_ACTIVE_GROUP should return error when group not found', async () => {
    const sendResponse = jest.fn();
    mockManager.setActiveGroupId.mockReturnValue(false);
    handleMessage({ type: 'SET_ACTIVE_GROUP', groupId: 'id-123' }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.setActiveGroupId).toHaveBeenCalledWith('id-123');
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Group not found' });
});

it('SAVE_GROUP should update themes and save', async () => {
    const sendResponse = jest.fn();
    mockManager.updateGroupThemes.mockResolvedValue(true);
    mockManager.save.mockResolvedValue(undefined);
    handleMessage({ type: 'SAVE_GROUP', groupId: 'id-123', themes: ['t1'] }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.updateGroupThemes).toHaveBeenCalledWith('id-123', ['t1']);
    expect(mockManager.save).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
});

it('SAVE_GROUP should return error when group not found', async () => {
    const sendResponse = jest.fn();
    mockManager.updateGroupThemes.mockResolvedValue(false);
    handleMessage({ type: 'SAVE_GROUP', groupId: 'id-123', themes: ['t1'] }, {}, sendResponse);
    await flushPromises();
    expect(mockManager.save).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Group not found' });

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
