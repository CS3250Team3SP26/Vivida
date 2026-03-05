/**
 * @fileoverview Options page script for HueVault
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

function sendMessage(type, extra = {}) {
    return browser.runtime.sendMessage({ type, ...extra });
}

// ===========================================================================
// DATA LOADING
// ===========================================================================

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

function getThemeName(themeId) {
    const theme = allThemes.find(t => t.id === themeId);
    return theme ? theme.name : themeId;
}

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
        if (theme.id === currentThemeId) item.classList.add("active");

        item.innerHTML = `
            <span class="theme-dot ${theme.id === currentThemeId ? "theme-dot--active" : ""}"></span>
            <span class="theme-name">${escapeHtml(theme.name)}</span>
            ${theme.id === currentThemeId ? '<span class="active-badge">active</span>' : ""}
        `;
        container.appendChild(item);
    }
}

// ===========================================================================
// RENDER — GROUP CARDS
// ===========================================================================

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

function buildGroupCard(group) {
    const isActive = group.id === activeGroupId;

    const card = document.createElement("div");
    card.className = `group-card${isActive ? " group-card--active" : ""}`;
    card.dataset.groupId = group.id;

    // ── Header ──
    const header = document.createElement("div");
    header.className = "group-card-header";

    // Left: checkbox + name
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

    // fix: checkboxCustom was appended but never declared
    const checkboxCustom = document.createElement("span");
    checkboxCustom.className = "active-checkbox-custom";
    checkboxCustom.setAttribute("aria-hidden", "true");

    const checkboxText = document.createElement("span");
    checkboxText.className = "active-checkbox-text";
    checkboxText.textContent = isActive ? "Active" : "Set active";

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxCustom);
    checkboxWrapper.appendChild(checkboxText);

    const groupName = document.createElement("h3");
    groupName.textContent = group.name;

    left.appendChild(checkboxWrapper);
    left.appendChild(groupName);

    // Right: actions
    // fix: declared as "right" but then referenced as "actions" — unified to "actions"
    const actions = document.createElement("div");
    actions.className = "group-card-actions";

    const deleteButton = document.createElement("button");
    // fix: wrong class names — "button button--danger button--small" don't exist in CSS
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

    if (group.themes.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No themes assigned to this group.";
        themeList.appendChild(empty);
    } else {
        for (const themeId of group.themes) {
            // fix: called "createGroupThemeItem" which doesn't exist — correct name is buildThemeItem
            themeList.appendChild(buildThemeItem(themeId));
        }
    }

    card.appendChild(header);
    card.appendChild(themeList);

    return card;
}

function buildThemeItem(themeId) {
    const isCurrent = themeId === currentThemeId;
    const name = getThemeName(themeId);

    const item = document.createElement("div");
    // fix: "theme-item--active" isn't in CSS, correct class is "active"
    item.className = `theme-item${isCurrent ? " active" : ""}`;

    item.innerHTML = `
        <span class="theme-dot ${isCurrent ? "theme-dot--active" : ""}"></span>
        <span class="theme-name">${escapeHtml(name)}</span>
        ${isCurrent ? '<span class="active-badge">active</span>' : ""}
    `;

    return item;
}

// ===========================================================================
// EVENT HANDLERS
// ===========================================================================

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

async function handleDeleteGroup(groupId, groupName) {
    // fix: missing "return" after the guard — the try/catch was inside the if block
    // so delete only ran when the user clicked Cancel
    if (!confirm(`Delete group "${groupName}"? This action cannot be undone.`)) return;

    try {
        const response = await sendMessage("DELETE_GROUP", { groupId });
        if (response.success) {
            allGroups = allGroups.filter(g => g.id !== groupId);
            if (activeGroupId === groupId) activeGroupId = null;
            renderGroups();
            renderSidebar();
        } else {
            console.error("Failed to delete group:", response.error);
        }
    } catch (error) {
        console.error("Error deleting group:", error);
    }
}

async function handleCreateGroup() {
    const groupName = prompt("Enter a name for the new group:");
    if (!groupName || groupName.trim() === "") return;

    try {
        const response = await sendMessage("CREATE_GROUP", { name: groupName.trim() });
        if (response && response.success) {
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

// ===========================================================================
// UTILITY
// ===========================================================================

function escapeHtml(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===========================================================================
// INITIALIZATION
// ===========================================================================

async function init() {
    await loadData(); // fix: was "leadData"
    renderGroups();
    renderSidebar();

    const createButton = document.getElementById("create-group-btn");
    if (createButton) {
        createButton.addEventListener("click", handleCreateGroup);
    }
}

document.addEventListener("DOMContentLoaded", init);