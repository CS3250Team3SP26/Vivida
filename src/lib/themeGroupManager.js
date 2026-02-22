/**
 * @fileoverview themeGroupManager class that manages the collection of theme 
 * 
 * This module gives a general manager for creating, retrieveing, 
 * updateing, and deleting theme groups, as well as managing the active groups
 * 
 * @module lib/themeGroupManager
 */

const { ThemeGroup } = require('./themeGroups');
const { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId } = require('./storageServiceWrapper');

/**
 * themeGroupManager manages a collection of themegroup instances
 * and provised methods for CRUD operations and also active group managing
 * 
 * @class
 */

class ThemeGroupManager {
    /**
     * Creates a new instance, ThemeGRoupMAnager
     * @constructor
      */
    constructor() {
        /**
         * Map of unique group ids to ThemeGroup instances
         * @type {Map<string, ThemeGroup>}
         * 
         */
        this.groups = new Map();

        /**
         * The id of the current active group
         * if no currect activr group, this will be null
         * @private
         * @type {string|null}
         */
        this.activeGroupId = null;

        /**
         * Counter for creating unique group ids
         * @private
         * @type {number}
         */
        this.idCounter = 0;
        }
        
        /**
         * Initializes the manager by loading thr grpups from storage
         * 
         * @async
         * @returns {Promise<void>}
         * @throws {Error} - if initialization fails
         */
        async initialize() {
            try {
                const serializedData = await loadGroups();
                if (serializedData && serializedData.length > 0) {
                    this.fromJSON(serializedData);
            }

            const activeID = await loadActiveGroupId();
            if (activeID && this.groups.has(activeID)) {
                this.activeGroupId = activeID;
            }
            console.log('ThemeGroupManager initialized successfully');
        
            } catch (error) {
                console.error('Failed to initialize ThemeGroupManager:', error);
                throw new Error('Initialization failed:' + error.message);
            }
        }

        /**
         * Saves the currecnt state of manager to storage
         * 
         * @async
         * @returns {Promise<void>}
         * @throws {Error} - if saving fails
         */
        async saveToStorage() {
            try {
                const serialized = this.toJSON();
                await saveGroups(serialized);

                if (this.activeGroupId){
                    await saveActiveGroupId(this.activeGroupId);
                }
                console.log('ThemeGroupManager state saved successfully');

            } catch (error) {
                console.error('Failed to save ThemeGroupManager state:', error);
                throw new Error('Failed to save ThemeGroupManager state: ' + error.message);
            }
        }

        /**
         * Manually saves the current state to the Storage
         * Call this after making changes to the groups or active group to commit those changes
         * 
         * @async
         * @returns {Promise<void>}
         * @throws {Error} - if saving fails
         */
        async save() {
            await this.saveToStorage();
        }

        /**
         * Genetages a unique ID for a new group
         * 
         * @private
         * @returns {string} - the unique ID
         */
        generateID() {
            return `group_${Date.now()}_${this.idCounter++}`;
        }

        /**
         * Created a new theme group
         * 
         * @param {string} name - The name of the new group
         * @param (Array<string>} [themes[]] - optional initial themes for group
         * @returns {object} - an object containing the group ID and the ThemeGroup instance
         * @returns {string} return.id - the unique ID of the new group
         * @returns {ThemeGroup} return.group - the created ThemeGroup instance
         * @throws {TypeError} - if name is not valid string
         * @throws {Error} - if group with same name already exists
         * 
         * */
        createGroup(name, themes = []) {
            if (typeof name !== 'string' || name.trim() === '') {
                throw new TypeError('Group name must be a string');
            }

            //check for duplicates
            for (const [, group] of this.groups) {
                if (group.name === name) {
                    throw new Error(`A group with the name "${name}" already exists.`);
                }
            }

            const id = this.generateID();
            const newGroup = new ThemeGroup(name, themes);
            this.groups.set(id, newGroup);
            return { id, group: newGroup };
        }

        /**
         * Deletes a theme group by ID
         * 
         * @param {string} id - The ID of the group to delete
         * @returns {boolean} - true if group was deleted, false if group not found
         * @throws {TypeError} - if id is not a string
         */
        deleteGroup(id) {
            if (typeof id !== 'string') {
                throw new TypeError('Group ID must be a string');
            }
            
            if (!this.groups.has(id)) {
                return false; 
            }

            this.groups.delete(id);

            //clear active group if it was deleted
            if (this.activeGroupId === id) {
                this.activeGroupId = null; // Reset active group if it was deleted
            }

            return true; 
        }

        /**
         * Retrieves a theme group by ID
         * 
         * @param {string} id - The ID of the group to retrieve
         * @returns {ThemeGroup|null} - the ThemeGroup instance, or null if not found
         * @throws {TypeError} - if id is not a string
         */
        getGroup(id) {
            if (typeof id !== 'string') {
                throw new TypeError('Group ID must be a string');
            }

            return this.groups.get(id) || null;
        }
        
        /**
         * Retirns all theme groups
         * 
         * @return {Array[Object]} - An array of objects containing group IDs and their corresponding ThemeGroup instances
         * @returns {string} return[].id - the unique ID of the group
         * @returns {ThemeGroup} return[].group - The ThemeGroup instance
         */

        getAllGroups() {
            const allGroups = [];
            for (const [id, group] of this.groups) {
                allGroups.push({ id, group });
            }
            return allGroups;
        }

        /**
         * sets the active theme group by ID
         * 
         * @param {string} id - The ID of the group to set as active
         * @returns {boolean} - true if the active group was set, false if group not fiudn
         * @throws {TypeError} - if id is not a string
         */
        setActiveGroup(id) {
            if (typeof id !== 'string') {
                throw new TypeError('Group ID must be a string');
            }

            if (!this.groups.has(id)) {
                return false; // Group not found
            }

            this.activeGroupId = id;
            return true; // Active group set successfully
        }

        /**
         * Returns the currently active theme group
         * 
         * @returns {object|null} Object that contains the active group ID and instance, null if there isnt any active
         * @returns {string} return.id - the active group ID
         * @returns {ThemeGroup} return.group - the actiev ThemeGroup instance
         */
        getActiveGroup() {
            if (!this.activeGroupId || !this.groups.has(this.activeGroupId)) {
                return null;
            }

            return { id: this.activeGroupId, group: this.groups.get(this.activeGroupId) };
        }

        /**
         * Clears active group selection
         * 
         * @return {void}
         */
        clearActiveGroup() {
            this.activeGroupId = null;
        }

        /**
         * Returns the total number of groups 
         * 
         * @returns {number} - The total number of groups
         */
        groupCount() {
            return this.groups.size;
        }
         
        /**
         * Serializes the current state of the manager to a JSON compatible format
         * 
         * @returns {Array<Object>} - Array of serialized group objects
         * @returns {string} - return[].id - The ID of the group
         * @returns {string} - return[].name - The name of the group
         * @returns {Array<string>} - return[].themes - The themes in the group
         */
        toJSON() {
            const serializedGroups = [];
            for (const [id, group] of this.groups) {
                serializedGroups.push({
                    id,
                    name: group.name,
                    themes: [...group.themes]
                });
            }
            return serializedGroups;
        }

        /**
         * Deserializes the JSON data to restore the state of the manager
         * 
         * @param {Array<Object>} data - Array of serialized group objects
         * @param {string} data[].id - The group ID
         * @param {string} data[].name - The group name
         * @param {Array<string>} data[].themes - The themes in the group
         * @returns {void}
         * @throws {TypeError} If data is not an array or contains invalid entries
         */
        fromJSON(data){
            if (!Array.isArray(data)){
                throw new TypeError('Data must be an array of group objects');
            }
            this.groups.clear();
            this.activeGroupId = null; // Reset active group when loading new data
            this.idCounter = 0; // Reset ID counter when loading new data

            let maxCounter = 0;

            for (const item of data) {
                if (!item || typeof item !== 'object') {
                    throw new TypeError('Each item must be an object');}
                    
                if (typeof item.id !== 'string') {
                    throw new TypeError('Each item must have a string ID');
                }

                if (typeof item.name !== 'string') {
                    throw new TypeError('Each item must have a string name');
                }

                if (!Array.isArray(item.themes)) {
                    throw new TypeError('Each item must have an array of themes');
                }

                // Extract the numeric part of the ID to keep the unique ID
                const match = item.id.match(/group_\d+_(\d+)/);
                if (match) {
                    const counterValue = parseInt(match[1], 10);
                    if (counterValue >= maxCounter) {
                        maxCounter = counterValue;
                    }
                }

                const group = new ThemeGroup(item.name, item.themes);
                this.groups.set(item.id, group);
            }

            // Update the ID counter to avoid collisions with existing IDs
            this.idCounter = maxCounter + 1;

        }

        /**
         * Check if a group with the given name already exists
         * 
         * @param {string} name - The name to check for duplicates
         * @returns {boolean} True if a group with the name exists, false otherwise
         * @throws {TypeError} If name is not a string
         */
        hasGroupWithName(name) {
            if (typeof name !== 'string') {
                throw new TypeError('Group name must be a string');
            }

            for (const [, group] of this.groups) {
                if (group.name === name) {
                    return true; // A group with the same name exists
                }
            }
            return false; // No group with the same name found
        }

        /**
         * Checks if a group with the given ID exists
         * 
         * @param {string} id - The ID to check for existence
         * @returns {boolean} True if a group with the ID exists, false otherwise
         * @throws {TypeError} If id is not a string
         */
        hasGroupID(id) {
            if (typeof id !== 'string') {
                throw new TypeError('Group ID must be a string');
            }

            return this.groups.has(id);
        }
        
    }
    
module.exports = { ThemeGroupManager };