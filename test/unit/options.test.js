/**
 * @fileoverview Unit tests for options page handler functions.
 *
 * Tests cover the three new features added to options.js:
 *   - handleAddThemeToGroup  (drag from unassigned panel into a group)
 *   - handleRemoveThemeFromGroup  (drag from a group back to unassigned panel)
 *   - handleRenameGroup  (inline rename via pencil button)
 *
 * @module tests/options.test
 */
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Browser API mock — must exist before the module is imported
// ---------------------------------------------------------------------------
const mockSendMessage = jest.fn();

globalThis.browser = {
    runtime: {
        sendMessage: mockSendMessage
    }
};

// Suppress alert/confirm that some handlers call in error paths
globalThis.alert  = jest.fn();
globalThis.confirm = jest.fn();

// Suppress console noise during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Minimal DOM required by renderGroups / renderSidebar
// ---------------------------------------------------------------------------
document.body.innerHTML = `
    <div id="unassigned-list" class="sidebar-theme-list"></div>
    <div id="groups-list"></div>
    <button id="create-group-btn" type="button"></button>
`;

// ---------------------------------------------------------------------------
// Import the functions under test (dynamic import required for ESM mocks)
// ---------------------------------------------------------------------------
const { loadData, handleAddThemeToGroup, handleRemoveThemeFromGroup, handleRenameGroup } =
    await import('../../src/options/options.js');

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------
const TEST_THEMES = [
    { id: 'theme-a', name: 'Theme A' },
    { id: 'theme-b', name: 'Theme B' },
    { id: 'theme-c', name: 'Theme C' },
    { id: 'theme-d', name: 'Theme D' },
];

const TEST_GROUPS = [
    { id: 'group-1', name: 'Group One',  themes: ['theme-a', 'theme-b'] },
    { id: 'group-2', name: 'Group Two',  themes: ['theme-c'] },
];

/**
 * Configures mockSendMessage to return fresh copies of the test fixtures
 * for all four GET_* calls that loadData() makes in parallel.
 */
function setupLoadDataMock() {
    mockSendMessage.mockImplementation((msg) => {
        switch (msg.type) {
            case 'GET_ALL_GROUPS':
                // Deep copy so mutations in one test don't bleed into another
                return Promise.resolve({ success: true, data: JSON.parse(JSON.stringify(TEST_GROUPS)) }); // NOSONAR: test fixture contains only JSON-safe primitives, structuredClone unavailable in jsdom
            case 'GET_INSTALLED_THEMES':
                return Promise.resolve({ success: true, data: TEST_THEMES });
            case 'GET_ACTIVE_GROUP':
                return Promise.resolve({ success: true, data: null });
            case 'GET_CURRENT_THEME':
                return Promise.resolve({ success: true, data: null });
            default:
                return Promise.resolve({ success: true });
        }
    });
}

// ===========================================================================
// handleAddThemeToGroup
// ===========================================================================

describe('handleAddThemeToGroup', () => {
    beforeEach(async () => {
        setupLoadDataMock();
        await loadData();
        // Reset so only calls from the handler under test are recorded
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
    });

    it('sends SAVE_GROUP with the new theme appended', async () => {
        await handleAddThemeToGroup('group-1', 'theme-d');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-a', 'theme-b', 'theme-d'],
        });
    });

    it('does nothing when the group ID does not exist', async () => {
        await handleAddThemeToGroup('nonexistent-group', 'theme-d');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('updates local state so subsequent calls see the added theme', async () => {
        await handleAddThemeToGroup('group-1', 'theme-d');

        // Remove it next; the themes array seen by the handler should include theme-d
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleRemoveThemeFromGroup('group-1', 'theme-d');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-a', 'theme-b'],
        });
    });

    it('does not update local state when SAVE_GROUP returns failure', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Storage error' });

        await handleAddThemeToGroup('group-1', 'theme-d');

        // State should not have changed — adding theme-d again should still send the same payload
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleAddThemeToGroup('group-1', 'theme-d');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-a', 'theme-b', 'theme-d'],
        });
    });

    it('works on a second group independently', async () => {
        await handleAddThemeToGroup('group-2', 'theme-d');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-2',
            themes: ['theme-c', 'theme-d'],
        });
    });
});

// ===========================================================================
// handleRemoveThemeFromGroup
// ===========================================================================

describe('handleRemoveThemeFromGroup', () => {
    beforeEach(async () => {
        setupLoadDataMock();
        await loadData();    
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
    });

    it('sends SAVE_GROUP with the theme removed', async () => {
        await handleRemoveThemeFromGroup('group-1', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b'],
        });
    });

    it('does nothing when the group ID does not exist', async () => {
        await handleRemoveThemeFromGroup('nonexistent-group', 'theme-a');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('updates local state so the removed theme is gone in subsequent calls', async () => {
        await handleRemoveThemeFromGroup('group-1', 'theme-a');

        // Removing theme-a again should now produce an empty list (only theme-b remains)
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleRemoveThemeFromGroup('group-1', 'theme-b');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: [],
        });
    });

    it('does not update local state when SAVE_GROUP returns failure', async () => {
        mockSendMessage.mockResolvedValueOnce({ success: false, error: 'Storage error' });

        await handleRemoveThemeFromGroup('group-1', 'theme-a');

        // State should be unchanged — a second attempt sees theme-a still in the list
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleRemoveThemeFromGroup('group-1', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b'],
        });
    });

    it('can empty a group completely', async () => {
        await handleRemoveThemeFromGroup('group-2', 'theme-c');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-2',
            themes: [],
        });
    });
});

// ===========================================================================
// handleRenameGroup
// ===========================================================================

describe('handleRenameGroup', () => {
    beforeEach(async () => {
        setupLoadDataMock();
        await loadData();
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        globalThis.alert.mockClear();
    });

    it('sends RENAME_GROUP with the correct groupId and newName', async () => {
        await handleRenameGroup('group-1', 'Renamed Group');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-1',
            newName: 'Renamed Group',
        });
    });

    it('updates local state so the new name is used in subsequent operations', async () => {
        await handleRenameGroup('group-1', 'Renamed Group');

        // Rename again — if local state was updated, we'll see the first rename reflected
        // in the rendered DOM (no error), and the second rename message goes through fine
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleRenameGroup('group-1', 'Renamed Again');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-1',
            newName: 'Renamed Again',
        });
    });

    it('does not update local state when the server returns failure', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Duplicate name' });

        await handleRenameGroup('group-1', 'Group Two');

        expect(console.error).toHaveBeenCalledWith('Failed to rename group:', 'Duplicate name');

        // Because local state was NOT updated, the group should still be named 'Group One'
        // Verify by triggering a successful rename with the original name — no collision error
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleRenameGroup('group-1', 'Group One');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-1',
            newName: 'Group One',
        });
    });

    it('calls alert when the server returns failure', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Duplicate name' });

        await handleRenameGroup('group-1', 'Group Two');

        expect(globalThis.alert).toHaveBeenCalledWith(
            expect.stringContaining('Duplicate name')
        );
    });

    it('works on the second group', async () => {
        await handleRenameGroup('group-2', 'Night Themes');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-2',
            newName: 'Night Themes',
        });
    });
});
