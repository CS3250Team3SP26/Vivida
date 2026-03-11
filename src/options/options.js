/**
 * @fileoverview Options page script for Vivida
 * Handles user interactions and communicates with the background script to manage theme groups.
 */

// ===========================================================================
// STATE
// ===========================================================================

let allGroups = [];       // [{ id, name, themes: [themeId, ...] }]
let allThemes = [];       // ExtensionInfo[]
let activeGroupId = null; // string|null
let currentThemeId = null; // string|null

// ===========================================================================
// MESSAGING
// ===========================================================================

/**
 * Sends a message to the background script.
 * @param {string} type - The message type.
 * @param {Object} [extra={}] - Additional properties to include in the message.
 * @returns {Promise<Object>} The response from the background script.
 */
function sendMessage(type, extra = {}) {
    return browser.runtime.sendMessage({ type, ...extra });
}

// ===========================================================================
// DATA LOADING
// ===========================================================================

/**
 * Loads all state from the background script and populates module-level variables.
 * @returns {Promise<void>}
 */
async function loadData() {
    try {
        const [groupsResponse, themesResponse, activeGroupResponse, currentResponse] = await Promise.all([
            sendMessage("GET_ALL_GROUPS"),
            sendMessage("GET_INSTALLED_THEMES"),
            sendMessage("GET_ACTIVE_GROUP"),
            sendMessage("GET_CURRENT_THEME")
        ]);

        allGroups      = groupsResponse.success ? groupsResponse.data : [];
        allThemes      = themesResponse.success ? themesResponse.data : [];
        activeGroupId  = activeGroupResponse.success ? activeGroupResponse.data : null;
        currentThemeId = currentResponse.success && currentResponse.data ? currentResponse.data.id : null;

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// ===========================================================================
// HELPERS
// ===========================================================================

/**
 * Returns the display name for a given theme ID.
 * Falls back to the raw ID if the theme is not found in allThemes.
 * @param {string} themeId - The theme extension ID.
 * @returns {string} The theme's display name.
 */
function getThemeName(themeId) {
    const theme = allThemes.find(t => t.id === themeId);
    return theme ? theme.name : themeId;
}

/**
 * Computes the set of theme IDs that are already assigned to at least one group.
 * @returns {Set<string>} Set of assigned theme IDs.
 */
function getAssignedThemeIds() {
    const assigned = new Set();
    for (const group of allGroups) {
        for (const themeId of group.themes) assigned.add(themeId);
    }
    return assigned;
}

// ===========================================================================
// RENDER — SIDEBAR
// ===========================================================================

/**
 * Renders the unassigned themes panel in the sidebar.
 * Themes not belonging to any group are shown here with drag and click support.
 * @returns {void}
 */
function renderSidebar() {
    const container = document.getElementById("unassigned-list");
    if (!container) return;

    const assigned = getAssignedThemeIds();
    const unassigned = allThemes.filter(t => !assigned.has(t.id));

    container.innerHTML = "";

    if (unassigned.length === 0) {
        container.innerHTML = '<p class="empty-message">All themes are currently assigned to groups.</p>';
        return;
    }

    for (const theme of unassigned) {
        const item = document.createElement("div");
        item.className = "theme-item";
        item.draggable = true;
        if (theme.id === currentThemeId) item.classList.add("active");

        item.innerHTML = `
            <span class="theme-dot ${theme.id === currentThemeId ? "theme-dot--active" : ""}"></span>
            <span class="theme-name">${escapeHtml(theme.name)}</span>
            ${theme.id === currentThemeId ? '<span class="active-badge">active</span>' : ""}
        `;

        item.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("application/json", JSON.stringify({ themeId: theme.id, sourceGroupId: null }));
            event.dataTransfer.effectAllowed = "move";
            item.classList.add("dragging");
        });
        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });
        item.addEventListener("click", () => handleEnableTheme(theme.id));

        container.appendChild(item);
    }
}

// ===========================================================================
// RENDER — GROUP CARDS
// ===========================================================================

/**
 * Renders all group cards into the groups list container.
 * Shows an empty-state message when no groups exist.
 * @returns {void}
 */
function renderGroups() {
    const listContainer = document.getElementById("groups-list");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (allGroups.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No groups created yet. Click "+" to get started.</p>';
        return;
    }

    for (const group of allGroups) {
        listContainer.appendChild(buildGroupCard(group));
    }
}

/**
 * Builds a group card DOM element for the given group.
 * Includes a header with active-state checkbox, rename button, delete button,
 * and a theme list that accepts dropped themes from any source.
 * @param {{ id: string, name: string, themes: string[] }} group - The group to render.
 * @returns {HTMLElement} The group card element.
 */
function buildGroupCard(group) {
    const isActive = group.id === activeGroupId;

    const card = document.createElement("div");
    card.className = `group-card${isActive ? " group-card--active" : ""}`;
    card.dataset.groupId = group.id;

    // ── Header ──
    const header = document.createElement("div");
    header.className = "group-card-header";

    // Left: checkbox + name + rename button
    const left = document.createElement("div");
    left.className = "group-card-header-left";

    const checkboxWrapper = document.createElement("label");
    checkboxWrapper.className = "active-checkbox-label";
    checkboxWrapper.title = isActive ? "Active group" : "Set as active";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "active-checkbox";
    checkbox.checked = isActive;
    checkbox.setAttribute("aria-label", `Set "${group.name}" as active group`);
    checkbox.addEventListener("change", () => handleSetActiveGroup(group.id, checkbox));

    const checkboxCustom = document.createElement("span");
    checkboxCustom.className = "active-checkbox-custom";
    checkboxCustom.setAttribute("aria-hidden", "true");

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxCustom);

    const groupName = document.createElement("h3");
    groupName.textContent = group.name;

    const renameButton = document.createElement("button");
    renameButton.className = "btn btn-sm btn-icon";
    renameButton.type = "button";
    renameButton.setAttribute("aria-label", `Rename group "${group.name}"`);
    renameButton.title = "Rename group";
    renameButton.textContent = "\u270F"; // ✏ pencil

    renameButton.addEventListener("click", () => {
        groupName.style.display = "none";
        renameButton.style.display = "none";

        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "rename-input";
        renameInput.value = group.name;
        renameInput.setAttribute("aria-label", "New group name");

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "btn btn-sm";
        confirmBtn.textContent = "Confirm";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-sm";
        cancelBtn.textContent = "Cancel";

        async function doConfirm() {
            const newName = renameInput.value.trim();
            if (newName) {
                await handleRenameGroup(group.id, newName);
            }
        }

        confirmBtn.addEventListener("click", doConfirm);
        renameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") await doConfirm();
            if (event.key === "Escape") { renderGroups(); renderSidebar(); }
        });
        cancelBtn.addEventListener("click", () => { renderGroups(); renderSidebar(); });

        left.appendChild(renameInput);
        left.appendChild(confirmBtn);
        left.appendChild(cancelBtn);
        renameInput.focus();
        renameInput.select();
    });

    left.appendChild(checkboxWrapper);
    left.appendChild(groupName);
    left.appendChild(renameButton);

    // Right: actions
    const actions = document.createElement("div");
    actions.className = "group-card-actions";

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete group "${group.name}"`);
    deleteButton.addEventListener("click", () => handleDeleteGroup(group.id, group.name));

    actions.appendChild(deleteButton);

    header.appendChild(left);
    header.appendChild(actions);

    // ── Theme list ──
    const themeList = document.createElement("div");
    themeList.className = "theme-list";

    // Drop zone: accept themes from the unassigned panel or from other groups
    themeList.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        themeList.classList.add("drag-over");
    });
    themeList.addEventListener("dragleave", (event) => {
        if (!themeList.contains(event.relatedTarget)) {
            themeList.classList.remove("drag-over");
        }
    });
    themeList.addEventListener("drop", async (event) => {
        event.preventDefault();
        themeList.classList.remove("drag-over");

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("application/json"));
        } catch {
            return;
        }

        const { themeId, sourceGroupId } = data;

        // Skip if the theme is already in this group
        if (group.themes.includes(themeId)) return;

        if (sourceGroupId === null) {
            // Dragged from the unassigned panel
            await handleAddThemeToGroup(group.id, themeId);
        } else if (sourceGroupId !== group.id) {
            // Dragged from a different group
            await handleMoveThemeBetweenGroups(sourceGroupId, group.id, themeId);
        }
    });

    if (group.themes.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No themes assigned to this group.";
        themeList.appendChild(empty);
    } else {
        for (const themeId of group.themes) {
            themeList.appendChild(buildThemeItem(themeId, group.id));
        }
    }

    card.appendChild(header);
    card.appendChild(themeList);

    return card;
}

/**
 * Builds a single theme row for display inside a group card.
 * The item is draggable and clickable to activate the theme.
 * @param {string} themeId - The theme extension ID.
 * @param {string} groupId - The ID of the containing group (used for drag data).
 * @returns {HTMLElement}
 */
function buildThemeItem(themeId, groupId) {
    const isCurrent = themeId === currentThemeId;
    const name = getThemeName(themeId);

    const item = document.createElement("div");
    item.className = `theme-item${isCurrent ? " active" : ""}`;
    item.draggable = true;

    item.innerHTML = `
        <span class="theme-dot ${isCurrent ? "theme-dot--active" : ""}"></span>
        <span class="theme-name">${escapeHtml(name)}</span>
        ${isCurrent ? '<span class="active-badge">active</span>' : ""}
    `;

    item.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ themeId, sourceGroupId: groupId }));
        event.dataTransfer.effectAllowed = "move";
        item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
    });
    item.addEventListener("click", () => handleEnableTheme(themeId));

    return item;
}

// ===========================================================================
// EVENT HANDLERS
// ===========================================================================

/**
 * Handles setting a group as the active group.
 * Prevents unchecking — the checkbox can only be used to switch the active group.
 * @param {string} groupId - The ID of the group to activate.
 * @param {HTMLInputElement} checkbox - The checkbox that triggered the change.
 * @returns {Promise<void>}
 */
async function handleSetActiveGroup(groupId, checkbox) {
    if (!checkbox.checked) {
        checkbox.checked = true; // can't uncheck — only switch
        return;
    }

    try {
        const response = await sendMessage("SET_ACTIVE_GROUP", { groupId });
        if (response.success) {
            activeGroupId = groupId;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to set active group:", response.error);
            checkbox.checked = false;
        }
    } catch (error) {
        console.error("Error setting active group:", error);
        checkbox.checked = false;
    }
}

/**
 * Handles deleting a group after user confirmation.
 * If the deleted group was active and other groups remain, the first remaining
 * group is automatically set as the new active group.
 * @param {string} groupId - The ID of the group to delete.
 * @param {string} groupName - The display name used in the confirmation prompt.
 * @returns {Promise<void>}
 */
async function handleDeleteGroup(groupId, groupName) {
    if (!confirm(`Delete group "${groupName}"? This action cannot be undone.`)) return;
    try {
        const response = await sendMessage("DELETE_GROUP", { groupId });
        if (!response.success) { console.error("Failed to delete group:", response.error); return; }
        await handleUpdateStateAfterDelete(groupId);
        renderGroups();
        renderSidebar();
    } catch (error) {
        console.error("Error deleting group:", error);
    }
}

/**
 * Sets a new active group after the current active group is deleted.
 * @returns {Promise<void>}
 */
async function handleSetNewActiveGroup() {
    if (allGroups.length === 0) return;
    const newActiveId = allGroups[0].id;
    try {
        const response = await sendMessage("SET_ACTIVE_GROUP", { groupId: newActiveId });
        if (response.success) activeGroupId = newActiveId;
    } catch (e) {
        console.error("Error setting new active group after delete:", e);
    }
}

/**
 * Updates the local state after a group is deleted.
 * @param {string} groupId - The ID of the deleted group.
 * @returns {Promise<void>}
 */
async function handleUpdateStateAfterDelete(groupId) {
    allGroups = allGroups.filter(g => g.id !== groupId);
    if (activeGroupId === groupId) {
        activeGroupId = null;
        await handleSetNewActiveGroup();
    }
}

/**
 * Handles creating a new theme group via a prompt dialog.
 * Sends CREATE_GROUP to the background script and updates local state on success.
 * @returns {Promise<void>}
 */
async function handleCreateGroup() {
    const groupName = prompt("Enter a name for the new group:");
    if (!groupName || groupName.trim() === "") return;

    try {
        const response = await sendMessage("CREATE_GROUP", { name: groupName.trim() });
        if (response?.success) {
            allGroups.push({ id: response.id, name: groupName.trim(), themes: [] });
            renderGroups();
            renderSidebar();
        } else {
            alert(`Could not create group: ${response?.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Error creating group:", error);
        alert("An error occurred while creating the group.");
    }
}

/**
 * Adds a theme from the unassigned panel into a group.
 * Sends SAVE_GROUP and updates local state on success.
 *
 * @param {string} groupId - The target group ID.
 * @param {string} themeId - The theme to add.
 * @returns {Promise<void>}
 */
async function handleAddThemeToGroup(groupId, themeId) {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;

    const updatedThemes = [...group.themes, themeId];

    try {
        const response = await sendMessage("SAVE_GROUP", { groupId, themes: updatedThemes });
        if (response.success) {
            group.themes = updatedThemes;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to add theme to group:", response.error);
        }
    } catch (error) {
        console.error("Error adding theme to group:", error);
    }
}

/**
 * Removes a theme from a group, returning it to the unassigned panel.
 * Sends SAVE_GROUP and updates local state on success.
 *
 * @param {string} groupId - The source group ID.
 * @param {string} themeId - The theme to remove.
 * @returns {Promise<void>}
 */
async function handleRemoveThemeFromGroup(groupId, themeId) {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;

    const updatedThemes = group.themes.filter(id => id !== themeId);

    try {
        const response = await sendMessage("SAVE_GROUP", { groupId, themes: updatedThemes });
        if (response.success) {
            group.themes = updatedThemes;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to remove theme from group:", response.error);
        }
    } catch (error) {
        console.error("Error removing theme from group:", error);
    }
}

/**
 * Moves a theme from one group directly into another.
 * Sends SAVE_GROUP for both the source and target groups in parallel.
 * Updates local state only when both saves succeed.
 *
 * @param {string} sourceGroupId - The ID of the group the theme is leaving.
 * @param {string} targetGroupId - The ID of the group the theme is joining.
 * @param {string} themeId - The theme to move.
 * @returns {Promise<void>}
 */
async function handleMoveThemeBetweenGroups(sourceGroupId, targetGroupId, themeId) {
    const sourceGroup = allGroups.find(g => g.id === sourceGroupId);
    const targetGroup = allGroups.find(g => g.id === targetGroupId);
    if (!sourceGroup || !targetGroup) return;

    const updatedSourceThemes = sourceGroup.themes.filter(id => id !== themeId);
    const updatedTargetThemes = [...targetGroup.themes, themeId];

    try {
        const [sourceResponse, targetResponse] = await Promise.all([
            sendMessage("SAVE_GROUP", { groupId: sourceGroupId, themes: updatedSourceThemes }),
            sendMessage("SAVE_GROUP", { groupId: targetGroupId, themes: updatedTargetThemes }),
        ]);

        if (sourceResponse.success && targetResponse.success) {
            sourceGroup.themes = updatedSourceThemes;
            targetGroup.themes = updatedTargetThemes;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to move theme between groups");
        }
    } catch (error) {
        console.error("Error moving theme between groups:", error);
    }
}

/**
 * Renames a group via the background script.
 * Updates local state and re-renders on success.
 *
 * @param {string} groupId - The ID of the group to rename.
 * @param {string} newName - The new display name.
 * @returns {Promise<void>}
 */
async function handleRenameGroup(groupId, newName) {
    try {
        const response = await sendMessage("RENAME_GROUP", { groupId, newName });
        if (response.success) {
            const group = allGroups.find(g => g.id === groupId);
            if (group) group.name = newName;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to rename group:", response.error);
            alert(`Could not rename group: ${response.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Error renaming group:", error);
        alert("An error occurred while renaming the group.");
    }
}

/**
 * Activates a theme by sending ENABLE_THEME to the background script.
 * Updates currentThemeId in local state and re-renders on success.
 *
 * @param {string} themeId - The ID of the theme to enable.
 * @returns {Promise<void>}
 */
async function handleEnableTheme(themeId) {
    try {
        const response = await sendMessage("ENABLE_THEME", { themeId });
        if (response.success) {
            currentThemeId = themeId;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to enable theme:", response.error);
        }
    } catch (error) {
        console.error("Error enabling theme:", error);
    }
}

// ===========================================================================
// UTILITY
// ===========================================================================

/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * @param {string} string - The raw string to escape.
 * @returns {string} The HTML-escaped string.
 */
function escapeHtml(string) {
    return string
        .replaceAll('&', "&amp;")
        .replaceAll('<', "&lt;")
        .replaceAll('>', "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ===========================================================================
// INFO MODAL
// ===========================================================================

/**
 * Opens the info modal and displays the given version string.
 * @param {string} version - The extension version to display (e.g. "0.3.0").
 * @returns {void}
 */
function openInfoModal(version) {
    const modal = document.getElementById("info-modal");
    const versionEl = document.getElementById("modal-version");
    if (!modal) return;
    if (versionEl && version) {
        versionEl.textContent = `Version ${version}`;
    }
    modal.showModal();
}

/**
 * Closes the info modal.
 * @returns {void}
 */
function closeInfoModal() {
    const modal = document.getElementById("info-modal");
    if (modal) {
        modal.close();
    }
}

/**
 * Wires up the info button, close button, and backdrop-click to open/close the modal.
 * Reads the extension version from the manifest once at setup time.
 * @returns {void}
 */
function initInfoModal() {
    let version = "";
    try {
        version = browser.runtime.getManifest().version;
    } catch (e) {
        console.error("Could not read manifest version:", e);
    }

    const infoBtn = document.getElementById("info-btn");
    if (infoBtn) {
        infoBtn.addEventListener("click", () => openInfoModal(version));
    }

    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeInfoModal);
    }

    const modal = document.getElementById("info-modal");
    if (modal) {
        modal.addEventListener("click", (event) => {
        const rect = modal.getBoundingClientRect();
        const clickedOutside =
            event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top  || event.clientY > rect.bottom;
        if (clickedOutside) {
            closeInfoModal();
        }
    });
}
}

// ===========================================================================
// DROP ZONE INITIALIZATION (called once from init)
// ===========================================================================

/**
 * Sets up the unassigned panel as a drop target for themes dragged out of groups.
 * Called once on page load so listeners do not accumulate across re-renders.
 * @returns {void}
 */
function initDropZones() {
    const container = document.getElementById("unassigned-list");
    if (!container) return;

    container.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        container.classList.add("drag-over");
    });
    container.addEventListener("dragleave", (event) => {
        if (!container.contains(event.relatedTarget)) {
            container.classList.remove("drag-over");
        }
    });
    container.addEventListener("drop", async (event) => {
        event.preventDefault();
        container.classList.remove("drag-over");

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("application/json"));
        } catch {
            return;
        }

        const { themeId, sourceGroupId } = data;
        // Only accept drops that originated from a group
        if (!sourceGroupId) return;

        await handleRemoveThemeFromGroup(sourceGroupId, themeId);
    });
}

// ===========================================================================
// INITIALIZATION
// ===========================================================================

/**
 * Initializes the options page: loads data, renders the UI, and binds event handlers.
 * @returns {Promise<void>}
 */
async function init() {
    await loadData();
    renderGroups();
    renderSidebar();
    initDropZones();
    initInfoModal();

    const createButton = document.getElementById("create-group-btn");
    if (createButton) {
        createButton.addEventListener("click", handleCreateGroup);
    }
}

document.addEventListener("DOMContentLoaded", init);

export {
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
};
