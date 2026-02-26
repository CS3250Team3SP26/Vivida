/**
 * @file popup.js
 * @description Handles popup UI logic for displaying:
 *  - Active group name
 *  - Themes within the active group
 *  - Visual indicator for the currently active theme
 *
 * This file communicates with the background script using runtime messaging.
 */

"use strict";

/**
 * Firefox WebExtension API reference.
 * @type {typeof browser}
 */
const ext = browser;

/**
 * Sends a message to the background script.
 * Handles both Promise-based (Firefox) and callback-based (Chrome) APIs.
 *
 * @param {Object} message - The message object to send.
 * @returns {Promise<any>} Resolves with the response from background script.
 */
function sendMessage(message) {
  try {
    const maybePromise = ext.runtime.sendMessage(message);
    if (maybePromise && typeof maybePromise.then === "function") {
      return maybePromise;
    }
  } catch {
    // Fall through to callback-style implementation
  }

  return new Promise((resolve, reject) => {
    ext.runtime.sendMessage(message, (response) => {
      const err = ext.runtime.lastError;
      if (err) reject(err);
      else resolve(response);
    });
  });
}

/** @type {HTMLElement|null} */
const groupNameEl = document.getElementById("currentGroupName");

/** @type {HTMLElement|null} */
const themesListEl = document.getElementById("themesList");

/**
 * Updates the group name displayed in the popup header.
 *
 * @param {string} text - The group name to display.
 */
function setGroupName(text) {
  if (groupNameEl) {
    groupNameEl.textContent = text;
  }
}

/**
 * Clears all rendered themes from the list.
 */
function clearThemes() {
  if (themesListEl) {
    themesListEl.innerHTML = "";
  }
}

/**
 * Renders a fallback message when no themes are available.
 *
 * @param {string} message - The message to display.
 */
function renderEmpty(message) {
  if (!themesListEl) return;

  themesListEl.innerHTML = `
    <li>
      <button class="theme-item" type="button" disabled>
        ${message}
      </button>
    </li>
  `;
}

/**
 * Renders the list of themes for the active group.
 *
 * @param {Object} params
 * @param {string[]} params.themeIds - Theme IDs belonging to the active group.
 * @param {Object[]} params.installedThemes - All installed themes.
 * @param {string|null} params.activeThemeId - Currently active theme ID.
 */
function renderThemes({ themeIds, installedThemes, activeThemeId }) {
  if (!themesListEl) return;

  clearThemes();

  if (!Array.isArray(themeIds) || themeIds.length === 0) {
    renderEmpty("No themes in this group yet");
    return;
  }

  // Map installed themes by ID for quick lookup
  const byId = new Map((installedThemes || []).map((theme) => [theme.id, theme]));

  for (const themeId of themeIds) {
    const theme = byId.get(themeId);

    const label = theme?.name || theme?.title || themeId;

    const li = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = "theme-item";
    button.textContent = label;

    // Apply visual indicator if this theme is active
    if (activeThemeId && themeId === activeThemeId) {
      button.classList.add("is-selected");
      button.setAttribute("aria-current", "true");
    }

    li.appendChild(button);
    themesListEl.appendChild(li);
  }
}

/**
 * Loads popup data from the background script and updates UI.
 *
 * Steps:
 *  1. Fetch all groups
 *  2. Fetch active group
 *  3. Fetch current active theme
 *  4. Fetch installed themes
 *  5. Render group name and theme list
 *
 * @returns {Promise<void>}
 */
async function loadPopup() {
  setGroupName("Loading...");
  clearThemes();

  try {
    const [
      groupsRes,
      activeGroupRes,
      currentThemeRes,
      installedThemesRes
    ] = await Promise.all([
      sendMessage({ type: "GET_ALL_GROUPS" }),
      sendMessage({ type: "GET_ACTIVE_GROUP" }),
      sendMessage({ type: "GET_CURRENT_THEME" }),
      sendMessage({ type: "GET_INSTALLED_THEMES" })
    ]);

    const groups = groupsRes?.success ? groupsRes.data : null;
    const activeGroupId = activeGroupRes?.success ? activeGroupRes.data : null;
    const activeThemeId = currentThemeRes?.success
      ? currentThemeRes.data?.id
      : null;
    const installedThemes = installedThemesRes?.success
      ? installedThemesRes.data
      : [];

    if (!Array.isArray(groups) || groups.length === 0) {
      setGroupName("No groups");
      renderEmpty("No groups found");
      return;
    }

    // Determine active group or fallback to first
    const activeGroup =
      groups.find((group) => group.id === activeGroupId) || groups[0];

    const displayName =
      activeGroup.name || activeGroup.id || "Unnamed Group";

    setGroupName(displayName);

    renderThemes({
      themeIds: activeGroup.themeIds || [],
      installedThemes,
      activeThemeId
    });

  } catch (error) {
    console.error("Failed to load popup:", error);
    setGroupName("Error");
    renderEmpty("Failed to load themes");
  }
}

/**
 * Initialize popup once DOM is ready.
 */
document.addEventListener("DOMContentLoaded", loadPopup);