/**
 * @fileoverview Unit tests for groupManager
 * 
 * Test file location: test/unit/groupManager.test.js
 * 
 * This test suite provides comprehensive coverage of the groupManager
 * class, testing all public methods, error handling, and edge cases.
 * 
 * @module tests/groupManager.test
 */
import { it, jest } from '@jest/globals';

// In ESM mode, jest.mock() is not available.
// jest.unstable_mockModule() must be called BEFORE dynamic imports.
jest.unstable_mockModule('../../src/lib/storageServiceWrapper', () => ({
    saveGroups: jest.fn().mockResolvedValue(undefined),
    loadGroups: jest.fn().mockResolvedValue([]),
    saveActiveGroupId: jest.fn().mockResolvedValue(undefined),
    loadActiveGroupId: jest.fn().mockResolvedValue(null)
}));

// Dynamic imports must come AFTER unstable_mockModule calls
const { groupManager } = await import('../../src/lib/GroupManager');
const { ThemeGroup } = await import('../../src/lib/themeGroups');
const { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId } =
    await import('../../src/lib/storageServiceWrapper');

describe('groupManager', () => {
    let manager;
    let consoleSpy;

    beforeEach(() => {
        manager = new groupManager();
        jest.clearAllMocks();
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(() => {}),
            error: jest.spyOn(console, 'error').mockImplementation(() => {})
        };
    });

    afterEach(() => {
        consoleSpy.log.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe('constructor', () => {
        test('should create a new instance with empty groups', () => {
            expect(manager).toBeInstanceOf(groupManager);
            expect(manager.groupCount()).toBe(0);
            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should initialize properties correctly', () => {
            expect(manager.groups).toBeInstanceOf(Map);
            expect(manager.activeGroupId).toBeNull();
            expect(manager.idCounter).toBe(0);
        });
    });

    describe('initialize', () => {
        test('should load groups from storage', async () => {
            const mockData = [
                { id: 'group_1', name: 'Test Group', themes: ['theme1', 'theme2'] }
            ];
            loadGroups.mockResolvedValue(mockData);
            loadActiveGroupId.mockResolvedValue('group_1');

            await manager.initialize();

            expect(loadGroups).toHaveBeenCalledTimes(1);
            expect(loadActiveGroupId).toHaveBeenCalledTimes(1);
            expect(manager.groupCount()).toBe(1);
            expect(manager.getActiveGroup().id).toBe('group_1');
        });

        test('should handle empty storage', async () => {
            loadGroups.mockResolvedValue([]);
            loadActiveGroupId.mockResolvedValue(null);

            await manager.initialize();

            expect(manager.groupCount()).toBe(0);
            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should ignore invalid active group ID', async () => {
            const mockData = [
                { id: 'group_1', name: 'Test Group', themes: [] }
            ];
            loadGroups.mockResolvedValue(mockData);
            loadActiveGroupId.mockResolvedValue('invalid_id');

            await manager.initialize();

            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should throw error if initialization fails', async () => {
            loadGroups.mockRejectedValue(new Error('Storage error'));

            await expect(manager.initialize()).rejects.toThrow('Initialization failed');
        });
    });

    describe('createGroup', () => {
        test('should create a new group with valid name', () => {
            const result = manager.createGroup('Work Themes');

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('group');
            expect(result.group).toBeInstanceOf(ThemeGroup);
            expect(result.group.name).toBe('Work Themes');
            expect(manager.groupCount()).toBe(1);
        });

        test('should create group with initial themes', () => {
            const result = manager.createGroup('Dark Themes', ['dark', 'midnight']);

            expect(result.group.themes).toEqual(['dark', 'midnight']);
            expect(result.group.themeCount()).toBe(2);
        });

        test('should generate unique IDs for multiple groups', () => {
            const result1 = manager.createGroup('Group 1');
            const result2 = manager.createGroup('Group 2');

            expect(result1.id).not.toBe(result2.id);
            expect(manager.groupCount()).toBe(2);
        });

        test('should throw TypeError for empty string name', () => {
            expect(() => manager.createGroup('')).toThrow(TypeError);
            expect(() => manager.createGroup('   ')).toThrow(TypeError);
        });

        test('should throw TypeError for non-string name', () => {
            expect(() => manager.createGroup(123)).toThrow(TypeError);
            expect(() => manager.createGroup(null)).toThrow(TypeError);
            expect(() => manager.createGroup(undefined)).toThrow(TypeError);
        });

        test('should throw Error for duplicate group names', () => {
            manager.createGroup('Duplicate');

            expect(() => manager.createGroup('Duplicate')).toThrow(Error);
            expect(() => manager.createGroup('Duplicate')).toThrow(/already exists/);
        });
    });

    describe('updateGroupThemes', () => {
    it('updates themes on an existing group and returns true', () => {
        const { id } = manager.createGroup('Test Group');
        const result = manager.updateGroupThemes(id, ['theme1', 'theme2']);
        expect(result).toBe(true);
        expect(manager.getGroup(id).themes).toEqual(['theme1', 'theme2']);
    });

    it('returns false for a non-existent ID', () => {
        const result = manager.updateGroupThemes('non-existent-id', ['theme1']);
        expect(result).toBe(false);
    });

    it('throws TypeError if id is not a string', () => {
        expect(() => manager.updateGroupThemes(123, ['theme1'])).toThrow(TypeError);
    });

    it('throws TypeError if themes is not an array', () => {
        const { id } = manager.createGroup('Test Group');
        expect(() => manager.updateGroupThemes(id, 'not-an-array')).toThrow(TypeError);
    });

    it('throws TypeError if themes array contains non-string', () => {
        const { id } = manager.createGroup('Test Group');
        expect(() => manager.updateGroupThemes(id, ['theme1', 123])).toThrow(TypeError);
    });

    it('throws TypeError if themes array contains empty string', () => {
        const { id } = manager.createGroup('Test Group');
        expect(() => manager.updateGroupThemes(id, ['theme1', ''])).toThrow(TypeError);
    });

    it('does not mutate the original themes array', () => {
        const { id } = manager.createGroup('Test Group');
        const themes = ['theme1', 'theme2'];
        manager.updateGroupThemes(id, themes);
        themes.push('theme3');
        expect(manager.getGroup(id).themes).toEqual(['theme1', 'theme2']);
    });
});


    describe('deleteGroup', () => {
        test('should delete an existing group', () => {
            const { id } = manager.createGroup('Test Group');

            const result = manager.deleteGroup(id);

            expect(result).toBe(true);
            expect(manager.groupCount()).toBe(0);
            expect(manager.getGroup(id)).toBeNull();
        });

        test('should return false for non-existent group', () => {
            const result = manager.deleteGroup('non_existent_id');

            expect(result).toBe(false);
        });

        test('should clear active group if deleted', () => {
            const { id } = manager.createGroup('Active Group');
            manager.setActiveGroupId(id);

            manager.deleteGroup(id);

            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should not affect active group if different group deleted', () => {
            const { id: id1 } = manager.createGroup('Active Group');
            const { id: id2 } = manager.createGroup('Other Group');
            manager.setActiveGroupId(id1);

            manager.deleteGroup(id2);

            expect(manager.getActiveGroup().id).toBe(id1);
        });

        test('should throw TypeError for non-string ID', () => {
            expect(() => manager.deleteGroup(123)).toThrow(TypeError);
            expect(() => manager.deleteGroup(null)).toThrow(TypeError);
        });
    });

    describe('getGroup', () => {
        test('should retrieve an existing group', () => {
            const { id, group: createdGroup } = manager.createGroup('Test Group');

            const retrievedGroup = manager.getGroup(id);

            expect(retrievedGroup).toBe(createdGroup);
            expect(retrievedGroup.name).toBe('Test Group');
        });

        test('should return null for non-existent group', () => {
            const result = manager.getGroup('non_existent_id');

            expect(result).toBeNull();
        });

        test('should throw TypeError for non-string ID', () => {
            expect(() => manager.getGroup(123)).toThrow(TypeError);
            expect(() => manager.getGroup(null)).toThrow(TypeError);
        });
    });

    describe('getAllGroups', () => {
        test('should return empty array when no groups exist', () => {
            const result = manager.getAllGroups();

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });

        test('should return all groups', () => {
            manager.createGroup('Group 1');
            manager.createGroup('Group 2');
            manager.createGroup('Group 3');

            const result = manager.getAllGroups();

            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('group');
        });

        test('should return groups in order of creation', () => {
            manager.createGroup('First');
            manager.createGroup('Second');
            manager.createGroup('Third');

            const result = manager.getAllGroups();

            expect(result[0].group.name).toBe('First');
            expect(result[1].group.name).toBe('Second');
            expect(result[2].group.name).toBe('Third');
        });

        test('should return independent array', () => {
            manager.createGroup('Test');

            const result1 = manager.getAllGroups();
            const result2 = manager.getAllGroups();

            expect(result1).not.toBe(result2);
            expect(result1).toEqual(result2);
        });
    });

    describe('setActiveGroupId', () => {
        test('should set active group with valid ID', () => {
            const { id } = manager.createGroup('Test Group');

            const result = manager.setActiveGroupId(id);

            expect(result).toBe(true);
            expect(manager.getActiveGroup().id).toBe(id);
        });

        test('should return false for non-existent group', () => {
            const result = manager.setActiveGroupId('non_existent_id');

            expect(result).toBe(false);
            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should update active group when changed', () => {
            const { id: id1 } = manager.createGroup('Group 1');
            const { id: id2 } = manager.createGroup('Group 2');

            manager.setActiveGroupId(id1);
            expect(manager.getActiveGroup().id).toBe(id1);

            manager.setActiveGroupId(id2);
            expect(manager.getActiveGroup().id).toBe(id2);
        });

        test('should throw TypeError for non-string ID', () => {
            expect(() => manager.setActiveGroupId(123)).toThrow(TypeError);
            expect(() => manager.setActiveGroupId(null)).toThrow(TypeError);
        });
    });

    describe('getActiveGroup', () => {
        test('should return null when no active group is set', () => {
            const result = manager.getActiveGroup();

            expect(result).toBeNull();
        });

        test('should return active group with ID and instance', () => {
            const { id, group } = manager.createGroup('Active Group');
            manager.setActiveGroupId(id);

            const result = manager.getActiveGroup();

            expect(result).not.toBeNull();
            expect(result.id).toBe(id);
            expect(result.group).toBe(group);
        });

        test('should return null if active group was deleted', () => {
            const { id } = manager.createGroup('Test Group');
            manager.setActiveGroupId(id);
            manager.deleteGroup(id);

            const result = manager.getActiveGroup();

            expect(result).toBeNull();
        });
    });

    describe('clearActiveGroup', () => {
        test('should clear the active group', () => {
            const { id } = manager.createGroup('Test Group');
            manager.setActiveGroupId(id);

            manager.clearActiveGroup();

            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should work when no active group is set', () => {
            expect(() => manager.clearActiveGroup()).not.toThrow();
            expect(manager.getActiveGroup()).toBeNull();
        });
    });

    describe('save', () => {
        test('should save groups to storage', async () => {
            manager.createGroup('Group 1');
            manager.createGroup('Group 2');

            await manager.save();

            expect(saveGroups).toHaveBeenCalledTimes(1);
        });

        test('should save active group ID to storage', async () => {
            const { id } = manager.createGroup('Test Group');
            manager.setActiveGroupId(id);

            await manager.save();

            expect(saveGroups).toHaveBeenCalled();
            expect(saveActiveGroupId).toHaveBeenCalledWith(id);
        });

        test('should not save active group ID if none set', async () => {
            manager.createGroup('Test Group');

            await manager.save();

            expect(saveGroups).toHaveBeenCalled();
            expect(saveActiveGroupId).not.toHaveBeenCalled();
        });

        test('should throw error if save fails', async () => {
            saveGroups.mockRejectedValueOnce(new Error('Storage error'));
            manager.createGroup('Test Group');

            await expect(manager.save()).rejects.toThrow('Failed to save groupManager state');
        });
    });

    describe('groupCount', () => {
        test('should return 0 for empty manager', () => {
            expect(manager.groupCount()).toBe(0);
        });

        test('should return correct count', () => {
            manager.createGroup('Group 1');
            expect(manager.groupCount()).toBe(1);

            manager.createGroup('Group 2');
            expect(manager.groupCount()).toBe(2);

            manager.createGroup('Group 3');
            expect(manager.groupCount()).toBe(3);
        });

        test('should update count after deletion', () => {
            const { id } = manager.createGroup('Test Group');
            expect(manager.groupCount()).toBe(1);

            manager.deleteGroup(id);
            expect(manager.groupCount()).toBe(0);
        });
    });

    describe('toJSON', () => {
        test('should return empty array for empty manager', () => {
            const result = manager.toJSON();

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });

        test('should serialize groups correctly', () => {
            manager.createGroup('Group 1', ['theme1', 'theme2']);
            manager.createGroup('Group 2', ['theme3']);

            const result = manager.toJSON();

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('themes');
            expect(result[0].themes).toEqual(['theme1', 'theme2']);
        });

        test('should create independent copy of themes', () => {
            const { id } = manager.createGroup('Test', ['theme1']);
            const json = manager.toJSON();
            
            // Modify the group
            const group = manager.getGroup(id);
            group.addTheme('theme2');

            // JSON should not be affected (themes array is copied by value)
            expect(json[0].themes).toEqual(['theme1']);
        });
    });

    describe('fromJSON', () => {
        test('should restore groups from valid data', () => {
            const data = [
                { id: 'group_1', name: 'Group 1', themes: ['theme1', 'theme2'] },
                { id: 'group_2', name: 'Group 2', themes: ['theme3'] }
            ];

            manager.fromJSON(data);

            expect(manager.groupCount()).toBe(2);
            expect(manager.getGroup('group_1').name).toBe('Group 1');
            expect(manager.getGroup('group_2').themes).toEqual(['theme3']);
        });

        test('should clear existing groups before restoring', () => {
            manager.createGroup('Existing Group');
            expect(manager.groupCount()).toBe(1);

            const data = [
                { id: 'group_1', name: 'New Group', themes: [] }
            ];

            manager.fromJSON(data);

            expect(manager.groupCount()).toBe(1);
            expect(manager.getGroup('group_1').name).toBe('New Group');
        });

        test('should reset active group when restoring', () => {
            const { id } = manager.createGroup('Active');
            manager.setActiveGroupId(id);

            const data = [
                { id: 'group_1', name: 'New Group', themes: [] }
            ];

            manager.fromJSON(data);

            expect(manager.getActiveGroup()).toBeNull();
        });

        test('should track the highest ID counter when counters are out of order', () => {
            const data = [
                { id: 'group_123_10', name: 'Group 1', themes: [] },
                { id: 'group_456_3', name: 'Group 2', themes: [] }  // lower counter second
            ];

            manager.fromJSON(data);

            const { id } = manager.createGroup('New Group');
            // Counter should be 11 (max was 10), not 4
            expect(id).toMatch(/group_\d+_11/);
        });

        test('should handle empty array', () => {
            manager.fromJSON([]);

            expect(manager.groupCount()).toBe(0);
        });

        test('should throw TypeError for non-array data', () => {
            expect(() => manager.fromJSON('not an array')).toThrow(TypeError);
            expect(() => manager.fromJSON(123)).toThrow(TypeError);
            expect(() => manager.fromJSON(null)).toThrow(TypeError);
        });

        test('should throw TypeError for invalid items', () => {
            expect(() => manager.fromJSON([null])).toThrow(TypeError);
            expect(() => manager.fromJSON(['string'])).toThrow(TypeError);
        });

        test('should throw TypeError for missing ID', () => {
            const data = [{ name: 'Test', themes: [] }];
            expect(() => manager.fromJSON(data)).toThrow(TypeError);
        });

        test('should throw TypeError for missing name', () => {
            const data = [{ id: 'group_1', themes: [] }];
            expect(() => manager.fromJSON(data)).toThrow(TypeError);
        });

        test('should throw TypeError for missing themes', () => {
            const data = [{ id: 'group_1', name: 'Test' }];
            expect(() => manager.fromJSON(data)).toThrow(TypeError);
        });

        test('should maintain ID counter correctly', () => {
            const data = [
                { id: 'group_123_5', name: 'Group 1', themes: [] },
                { id: 'group_456_10', name: 'Group 2', themes: [] }
            ];

            manager.fromJSON(data);

            const { id } = manager.createGroup('New Group');

            // ID counter should be 11 (max counter 10 + 1)
            expect(id).toMatch(/group_\d+_11/);
        });
    });

    describe('hasGroupWithName', () => {
        test('should return false when no groups exist', () => {
            expect(manager.hasGroupWithName('Test')).toBe(false);
        });

        test('should return true for existing group name', () => {
            manager.createGroup('Existing Group');

            expect(manager.hasGroupWithName('Existing Group')).toBe(true);
        });

        test('should return false for non-existent group name', () => {
            manager.createGroup('Existing Group');

            expect(manager.hasGroupWithName('Non-existent')).toBe(false);
        });

        test('should be case-sensitive', () => {
            manager.createGroup('Test Group');

            expect(manager.hasGroupWithName('test group')).toBe(false);
            expect(manager.hasGroupWithName('TEST GROUP')).toBe(false);
        });

        test('should throw TypeError for non-string name', () => {
            expect(() => manager.hasGroupWithName(123)).toThrow(TypeError);
            expect(() => manager.hasGroupWithName(null)).toThrow(TypeError);
        });
    });

    describe('hasGroupID', () => {
        test('should return false when no groups exist', () => {
            expect(manager.hasGroupID('group_1')).toBe(false);
        });

        test('should return true for existing group ID', () => {
            const { id } = manager.createGroup('Test Group');

            expect(manager.hasGroupID(id)).toBe(true);
        });

        test('should return false for non-existent group ID', () => {
            expect(manager.hasGroupID('non_existent_id')).toBe(false);
        });

        test('should throw TypeError for non-string ID', () => {
            expect(() => manager.hasGroupID(123)).toThrow(TypeError);
            expect(() => manager.hasGroupID(null)).toThrow(TypeError);
        });
    });

    describe('integration tests', () => {
        test('should handle complete workflow', async () => {
            // Create groups
            const { id: id1 } = manager.createGroup('Work', ['professional', 'corporate']);
            const { id: id2 } = manager.createGroup('Personal', ['casual', 'fun']);

            // Set active group
            manager.setActiveGroupId(id1);
            expect(manager.getActiveGroup().group.name).toBe('Work');

            // Get all groups
            expect(manager.getAllGroups()).toHaveLength(2);

            // Modify a group
            const group1 = manager.getGroup(id1);
            group1.addTheme('business');
            expect(group1.themeCount()).toBe(3);

            // Change active group
            manager.setActiveGroupId(id2);
            expect(manager.getActiveGroup().group.name).toBe('Personal');

            // Delete a group
            manager.deleteGroup(id1);
            expect(manager.groupCount()).toBe(1);

            // Save changes
            await manager.save();
            expect(saveGroups).toHaveBeenCalled();
        });

        test('should persist and restore state', () => {
            // Create initial state
            const { id: workId } = manager.createGroup('Work', ['theme1']);
            const { id: personalId } = manager.createGroup('Personal', ['theme2']);
            manager.setActiveGroupId(workId);

            // Export state
            const serialized = manager.toJSON();

            // Create new manager and restore
            const newManager = new groupManager();
            newManager.fromJSON(serialized);

            // Verify restoration
            expect(newManager.groupCount()).toBe(2);
            expect(newManager.getGroup(workId).name).toBe('Work');
            expect(newManager.getGroup(personalId).name).toBe('Personal');
        });
    });

    describe('edge cases', () => {
        test('should handle special characters in group names', () => {
            const specialNames = [
                'Group with spaces',
                'Group-with-dashes',
                'Group_with_underscores',
                'Group.with.dots',
                'Group (with parentheses)',
                'Group [with brackets]',
                'Group {with braces}',
                'Group @#$%^&*'
            ];

            specialNames.forEach(name => {
                expect(() => manager.createGroup(name)).not.toThrow();
            });

            expect(manager.groupCount()).toBe(specialNames.length);
        });

        test('should handle very long group names', () => {
            const longName = 'A'.repeat(1000);

            expect(() => manager.createGroup(longName)).not.toThrow();
            expect(manager.getAllGroups()[0].group.name).toBe(longName);
        });

        test('should handle many groups', () => {
            for (let i = 0; i < 100; i++) {
                manager.createGroup(`Group ${i}`);
            }

            expect(manager.groupCount()).toBe(100);
            expect(manager.getAllGroups()).toHaveLength(100);
        });

        test('should handle rapid operations', () => {
            const ids = [];

            for (let i = 0; i < 10; i++) {
                ids.push(manager.createGroup(`Group ${i}`).id);
            }

            for (const id of ids) {
                manager.setActiveGroupId(id);
                expect(manager.getActiveGroup().id).toBe(id);
            }

            for (const id of ids) {
                manager.deleteGroup(id);
            }

            expect(manager.groupCount()).toBe(0);
        });
    });
});
