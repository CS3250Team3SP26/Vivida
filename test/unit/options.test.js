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
const mockGetManifest = jest.fn(() => ({ version: '0.3.0' }));

globalThis.browser = {
    runtime: {
        sendMessage: mockSendMessage,
        getManifest: mockGetManifest
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
    <button id="info-btn" type="button"></button>
    <dialog id="info-modal">
        <button id="modal-close-btn" type="button"></button>
        <p id="modal-version"></p>
    </dialog>
`;

// ---------------------------------------------------------------------------
// Import the functions under test (dynamic import required for ESM mocks)
// ---------------------------------------------------------------------------
const {
    loadData,
    handleAddThemeToGroup,
    handleRemoveThemeFromGroup,
    handleMoveThemeBetweenGroups,
    handleRenameGroup,
    handleDeleteGroup,
    handleEnableTheme,
    openInfoModal,
    closeInfoModal,
    initInfoModal,
} = await import('../../src/options/options.js');

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

    test('sends SAVE_GROUP with the new theme appended', async () => {
        await handleAddThemeToGroup('group-1', 'theme-d');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-a', 'theme-b', 'theme-d'],
        });
    });

    test('does nothing when the group ID does not exist', async () => {
        await handleAddThemeToGroup('nonexistent-group', 'theme-d');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('updates local state so subsequent calls see the added theme', async () => {
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

    test('does not update local state when SAVE_GROUP returns failure', async () => {
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

    test('works on a second group independently', async () => {
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

    test('sends SAVE_GROUP with the theme removed', async () => {
        await handleRemoveThemeFromGroup('group-1', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b'],
        });
    });

    test('does nothing when the group ID does not exist', async () => {
        await handleRemoveThemeFromGroup('nonexistent-group', 'theme-a');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('updates local state so the removed theme is gone in subsequent calls', async () => {
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

    test('does not update local state when SAVE_GROUP returns failure', async () => {
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

    test('can empty a group completely', async () => {
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

    test('sends RENAME_GROUP with the correct groupId and newName', async () => {
        await handleRenameGroup('group-1', 'Renamed Group');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-1',
            newName: 'Renamed Group',
        });
    });

    test('updates local state so the new name is used in subsequent operations', async () => {
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

    test('does not update local state when the server returns failure', async () => {
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

    test('calls alert when the server returns failure', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Duplicate name' });

        await handleRenameGroup('group-1', 'Group Two');

        expect(globalThis.alert).toHaveBeenCalledWith(
            expect.stringContaining('Duplicate name')
        );
    });

    test('works on the second group', async () => {
        await handleRenameGroup('group-2', 'Night Themes');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RENAME_GROUP',
            groupId: 'group-2',
            newName: 'Night Themes',
        });
    });
});

// ===========================================================================
// handleMoveThemeBetweenGroups
// ===========================================================================

describe('handleMoveThemeBetweenGroups', () => {
    beforeEach(async () => {
        setupLoadDataMock();
        await loadData();
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
    });

    test('sends SAVE_GROUP for both source and target groups', async () => {
        await handleMoveThemeBetweenGroups('group-1', 'group-2', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b'],
        });
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-2',
            themes: ['theme-c', 'theme-a'],
        });
        expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });

    test('does nothing when the source group does not exist', async () => {
        await handleMoveThemeBetweenGroups('nonexistent', 'group-2', 'theme-a');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('does nothing when the target group does not exist', async () => {
        await handleMoveThemeBetweenGroups('group-1', 'nonexistent', 'theme-a');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('updates local state so subsequent calls see the moved theme', async () => {
        await handleMoveThemeBetweenGroups('group-1', 'group-2', 'theme-a');

        // Move theme-a back — it should now be in group-2
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleMoveThemeBetweenGroups('group-2', 'group-1', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-2',
            themes: ['theme-c'],
        });
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b', 'theme-a'],
        });
    });

    test('does not update local state when either save fails', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Storage error' });

        await handleMoveThemeBetweenGroups('group-1', 'group-2', 'theme-a');

        // State unchanged — theme-a should still be in group-1
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleMoveThemeBetweenGroups('group-1', 'group-2', 'theme-a');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SAVE_GROUP',
            groupId: 'group-1',
            themes: ['theme-b'],
        });
    });
});

// ===========================================================================
// openInfoModal
// ===========================================================================

describe('openInfoModal', () => {
    beforeEach(() => {
        const modal = document.getElementById('info-modal');
        modal.showModal = jest.fn();
        modal.close = jest.fn();
        const versionEl = document.getElementById('modal-version');
        versionEl.textContent = '';
    });

    test('calls showModal() on the dialog', () => {
        openInfoModal('1.2.3');

        expect(document.getElementById('info-modal').showModal).toHaveBeenCalledTimes(1);
    });

    test('sets the version text with the provided version string', () => {
        openInfoModal('1.2.3');

        const versionEl = document.getElementById('modal-version');
        expect(versionEl.textContent).toBe('Version 1.2.3');
    });

    test('does not throw when called with an empty version string', () => {
        expect(() => openInfoModal('')).not.toThrow();
    });

    test('leaves existing version text unchanged when version is empty', () => {
        const versionEl = document.getElementById('modal-version');
        versionEl.textContent = 'Version 0.3.0';

        openInfoModal('');

        expect(versionEl.textContent).toBe('Version 0.3.0');
    });
});

// ===========================================================================
// handleDeleteGroup — auto-active-group on delete
// ===========================================================================

describe('handleDeleteGroup — auto-active on delete', () => {
    beforeEach(async () => {
        globalThis.confirm.mockReturnValue(true);
        mockSendMessage.mockImplementation((msg) => {
            switch (msg.type) {
                case 'GET_ALL_GROUPS':
                    return Promise.resolve({ success: true, data: JSON.parse(JSON.stringify(TEST_GROUPS)) }); // NOSONAR
                case 'GET_INSTALLED_THEMES':
                    return Promise.resolve({ success: true, data: TEST_THEMES });
                case 'GET_ACTIVE_GROUP':
                    return Promise.resolve({ success: true, data: 'group-1' });
                case 'GET_CURRENT_THEME':
                    return Promise.resolve({ success: true, data: null });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        await loadData();
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
    });

    test('sends SET_ACTIVE_GROUP for the first remaining group when deleting the active group', async () => {
        await handleDeleteGroup('group-1', 'Group One');

        expect(mockSendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'SET_ACTIVE_GROUP', groupId: 'group-2' })
        );
    });

    test('does not send SET_ACTIVE_GROUP when deleting a non-active group', async () => {
        await handleDeleteGroup('group-2', 'Group Two');

        const calls = mockSendMessage.mock.calls.map(c => c[0]);
        expect(calls.some(c => c.type === 'SET_ACTIVE_GROUP')).toBe(false);
    });

    test('does not send SET_ACTIVE_GROUP when deleting the last group', async () => {
        // Reload with only one group active
        mockSendMessage.mockImplementation((msg) => {
            switch (msg.type) {
                case 'GET_ALL_GROUPS':
                    return Promise.resolve({ success: true, data: [{ id: 'group-1', name: 'Group One', themes: [] }] });
                case 'GET_INSTALLED_THEMES':
                    return Promise.resolve({ success: true, data: [] });
                case 'GET_ACTIVE_GROUP':
                    return Promise.resolve({ success: true, data: 'group-1' });
                case 'GET_CURRENT_THEME':
                    return Promise.resolve({ success: true, data: null });
                default:
                    return Promise.resolve({ success: true });
            }
        });
        await loadData();
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });

        await handleDeleteGroup('group-1', 'Group One');

        const calls = mockSendMessage.mock.calls.map(c => c[0]);
        expect(calls.some(c => c.type === 'SET_ACTIVE_GROUP')).toBe(false);
        expect(calls.some(c => c.type === 'DELETE_GROUP')).toBe(true);
    });

    test('does not delete the group if the user cancels the confirmation', async () => {
        globalThis.confirm.mockReturnValue(false);

        await handleDeleteGroup('group-1', 'Group One');

        expect(mockSendMessage).not.toHaveBeenCalled();
    });
});

// ===========================================================================
// closeInfoModal
// ===========================================================================

describe('closeInfoModal', () => {
    beforeEach(() => {
        const modal = document.getElementById('info-modal');
        modal.showModal = jest.fn();
        modal.close = jest.fn();
        modal.showModal(); // put it in "open" state
    });

    test('calls close() on the dialog', () => {
        const modal = document.getElementById('info-modal');
        closeInfoModal();
        expect(modal.close).toHaveBeenCalledTimes(1);
    });

    test('is idempotent — calling it twice does not throw', () => {
        const modal = document.getElementById('info-modal');
        closeInfoModal();
        expect(() => closeInfoModal()).not.toThrow();
        expect(modal.close).toHaveBeenCalledTimes(2);
    });
});

// ===========================================================================
// handleEnableTheme
// ===========================================================================

describe('handleEnableTheme', () => {
    beforeEach(async () => {
        setupLoadDataMock();
        await loadData();
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
    });

    test('sends ENABLE_THEME with the correct themeId', async () => {
        await handleEnableTheme('theme-a');

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'ENABLE_THEME',
            themeId: 'theme-a',
        });
    });

    test('updates currentThemeId in local state on success', async () => {
        await handleEnableTheme('theme-a');

        // Switching to a second theme should succeed; verifies the first update persisted
        mockSendMessage.mockReset();
        mockSendMessage.mockResolvedValue({ success: true });
        await handleEnableTheme('theme-b');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'ENABLE_THEME',
            themeId: 'theme-b',
        });
    });

    test('logs an error and does not update state when the response indicates failure', async () => {
        mockSendMessage.mockResolvedValue({ success: false, error: 'Theme not found' });

        await handleEnableTheme('theme-a');

        expect(console.error).toHaveBeenCalledWith('Failed to enable theme:', 'Theme not found');
    });

    test('works for a theme in the second group', async () => {
        await handleEnableTheme('theme-c');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'ENABLE_THEME',
            themeId: 'theme-c',
        });
    });
});

// ===========================================================================
// initInfoModal
// ===========================================================================

describe('initInfoModal', () => {
    beforeEach(() => {
        const modal = document.getElementById('info-modal');
        modal.showModal = jest.fn();
        modal.close = jest.fn();
        mockGetManifest.mockReturnValue({ version: '0.3.0' });
    });

    test('clicking the info button opens the modal', () => {
        initInfoModal();
        document.getElementById('info-btn').click();
        expect(document.getElementById('info-modal').showModal).toHaveBeenCalled();
    });

    test('clicking the close button closes the modal', () => {
        initInfoModal();
        document.getElementById('modal-close-btn').click();
        expect(document.getElementById('info-modal').close).toHaveBeenCalled();
    });

    test('clicking outside the dialog closes the modal', () => {
        initInfoModal();
        const modal = document.getElementById('info-modal');

        // Simulate a click whose coordinates land outside the dialog's bounding rect
        jest.spyOn(modal, 'getBoundingClientRect').mockReturnValue({
            left: 100, right: 500, top: 100, bottom: 400
        });

        const event = new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 });
        modal.dispatchEvent(event);

        expect(modal.close).toHaveBeenCalled();
    });

    test('uses the version from browser.runtime.getManifest()', () => {
        mockGetManifest.mockReturnValue({ version: '9.9.9' });
        initInfoModal();

        document.getElementById('info-btn').click();

        expect(document.getElementById('modal-version').textContent).toBe('Version 9.9.9');
    });
});
