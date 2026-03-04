import { jest } from '@jest/globals';

// Must be set before importing popup.js — `const ext = browser` runs at module scope.
globalThis.browser = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: undefined,
  },
};

// Must be set before importing popup.js — getElementById calls run at module scope.
document.body.innerHTML = `
  <span id="currentGroupName"></span>
  <ul id="themesList"></ul>
  <button id="manageGroupsBtn"></button>
`;

const { renderThemes } = await import('../../src/popup/popup.js');

// Flushes all pending microtasks so async click handlers finish before asserting.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  document.getElementById('themesList').innerHTML = '';
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('renderThemes click handler', () => {
  it('clicking a theme button sends ENABLE_THEME with the correct themeId', async () => {
    browser.runtime.sendMessage.mockResolvedValue({ success: true });

    renderThemes({
      themeIds: ['theme-abc'],
      installedThemes: [{ id: 'theme-abc', name: 'Dark Theme' }],
      activeThemeId: null,
    });

    const button = document.querySelector('.theme-item');
    button.click();
    await flushPromises();

    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'ENABLE_THEME',
      themeId: 'theme-abc',
    });
  });

  it('on success, clicked button gets is-selected and aria-current, previously selected button loses them', async () => {
    browser.runtime.sendMessage.mockResolvedValue({ success: true });

    renderThemes({
      themeIds: ['theme-1', 'theme-2'],
      installedThemes: [],
      activeThemeId: 'theme-1',
    });

    const [firstButton, secondButton] = document.querySelectorAll('.theme-item');
    expect(firstButton.classList.contains('is-selected')).toBe(true);

    secondButton.click();
    await flushPromises();

    expect(firstButton.classList.contains('is-selected')).toBe(false);
    expect(firstButton.getAttribute('aria-current')).toBeNull();
    expect(secondButton.classList.contains('is-selected')).toBe(true);
    expect(secondButton.getAttribute('aria-current')).toBe('true');
  });

  it('on error, console.error is called with the error', async () => {
    const error = new Error('Failed to enable theme');
    browser.runtime.sendMessage.mockRejectedValue(error);

    renderThemes({
      themeIds: ['theme-abc'],
      installedThemes: [],
      activeThemeId: null,
    });

    const button = document.querySelector('.theme-item');
    button.click();
    await flushPromises();

    expect(console.error).toHaveBeenCalledWith(error);
  });
});
