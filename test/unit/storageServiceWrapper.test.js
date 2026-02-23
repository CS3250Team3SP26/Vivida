/**
 * @fileoverview Unit tests for StorageService module
 */

// Import the functions to be tested
import { describe, jest, test } from "@jest/globals";
import {
  saveGroups,
  loadGroups,
  saveGroup,
  deleteGroup,
  saveActiveGroupId,
  loadActiveGroupId,
} from "../../src/lib/storageServiceWrapper.js";

describe("StorageService", () => {
  // Mocking the browser.storage API
  const browserMock = {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
      },
    },
  };

  // Make the mock available globally
  globalThis.browser = browserMock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  /* ============================================
   * GROUP STORAGE TESTS
   * ============================================ */

  describe("saveGroups", () => {
    test("should successfully save an array of groups", async () => {
      const mockGroups = [{ id: "1", name: "Dark Mode" }];
      browserMock.storage.local.set.mockResolvedValue(undefined);

      await saveGroups(mockGroups);

      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        groups: mockGroups,
      });
    });

    test("should throw an error if the storage API fails", async () => {
      const error = new Error("Storage Full");
      browserMock.storage.local.set.mockRejectedValue(error);

      await expect(saveGroups([])).rejects.toThrow("Storage Full");
    });

    test("should throw a TypeError if input is not an array", async () => {
      await expect(saveGroups("not an array")).rejects.toThrow(TypeError);
    });

    test("should throw a TypeError if input is null", async () => {
      await expect(saveGroups(null)).rejects.toThrow(TypeError);
    });

    test("should log success message when groups saved", async () => {
      browserMock.storage.local.set.mockResolvedValue(undefined);
      await saveGroups([]);
      expect(console.log).toHaveBeenCalledWith("Groups saved successfully");
    });
  });

  describe("loadGroups", () => {
    test("should return groups from storage", async () => {
      const mockGroups = [{ id: "1", name: "Dark Mode" }];
      browserMock.storage.local.get.mockResolvedValue({ groups: mockGroups });

      const result = await loadGroups();

      expect(result).toEqual(mockGroups);
      expect(browserMock.storage.local.get).toHaveBeenCalledWith("groups");
    });

    test("should return an empty array if no groups exist", async () => {
      browserMock.storage.local.get.mockResolvedValue({});

      const result = await loadGroups();

      expect(result).toEqual([]);
    });

    test("should throw an error if loading groups fails", async () => {
      const error = new Error("Read Error");
      browserMock.storage.local.get.mockRejectedValue(error);
      await expect(loadGroups()).rejects.toThrow("Read Error");
    });
  });

  /* ============================================
   * SAVE DELETE GROUP TESTS
   * ============================================ */
  describe("saveGroup", () => {
    test("should save a new group when it does not exist", async () => {
      const mockGroups = [{ id: "1", name: "Dark Mode" }];
      browserMock.storage.local.get.mockResolvedValue({ groups: mockGroups });
      browserMock.storage.local.set.mockResolvedValue(undefined);
      await saveGroup("2", ["theme-123"]);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        groups: [
          { id: "1", name: "Dark Mode" },
          { id: "2", themeIds: ["theme-123"] },
        ],
      });
    });

    test("should update an existing group", async () => {
      const mockGroups = [{ id: "1", name: "Dark Mode", themeIds: [] }];
      browserMock.storage.local.get.mockResolvedValue({ groups: mockGroups });
      browserMock.storage.local.set.mockResolvedValue(undefined);
      await saveGroup("1", ["theme-456"]);
      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        groups: [{ id: "1", name: "Dark Mode", themeIds: ["theme-456"] }],
      });
    });

    test("should throw an error if saving the group fails", async () => {
      const error = new Error("Write Error");
      browserMock.storage.local.get.mockResolvedValue({ groups: [] });
      browserMock.storage.local.set.mockRejectedValue(error);
      await expect(saveGroup("1", ["theme-123"])).rejects.toThrow("Write Error");
    });

    test("should throw a TypeError if Id is not a string", async () => {
      await expect(saveGroup(123, ["theme-123"])).rejects.toThrow(TypeError);
    });

    test("should throw a TypeError if themeIds is not an array", async () => {
      await expect(saveGroup("1", "not an array")).rejects.toThrow(TypeError);
    });
  });

  describe("deleteGroup", () => {
    test("should successfully delete a group", async () => {
      const mockGroups = [
        { id: "1", name: "Dark Mode" },
        { id: "2", name: "Light Mode" },
      ];
      browserMock.storage.local.get.mockResolvedValue({ groups: mockGroups });
      browserMock.storage.local.set.mockResolvedValue(undefined);

      await deleteGroup("1");

      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        groups: [{ id: "2", name: "Light Mode" }],
      });
    });

    test("should throw an error if deleting fails", async () => {
      const error = new Error("Delete Error");
      browserMock.storage.local.get.mockRejectedValue(error);

      await expect(deleteGroup("1")).rejects.toThrow("Delete Error");
    });

    test("should throw a TypeError if input is not a string", async () => {
      await expect(deleteGroup(123)).rejects.toThrow(TypeError);
    });
  });

  /* ============================================
   * ACTIVE GROUP ID TESTS
   * ============================================ */
  describe("saveActiveGroupId", () => {
    test("should successfully save the active group ID", async () => {
      const id = "group-123";
      browserMock.storage.local.set.mockResolvedValue(undefined);

      await saveActiveGroupId(id);

      expect(browserMock.storage.local.set).toHaveBeenCalledWith({
        activeGroupId: id,
      });
    });

    test("should throw an error if saving ID fails", async () => {
      browserMock.storage.local.set.mockRejectedValue(new Error("Write Error"));

      await expect(saveActiveGroupId("123")).rejects.toThrow("Write Error");
    });

    test("should throw a TypeError if input is not a string", async () => {
      await expect(saveActiveGroupId(123)).rejects.toThrow(TypeError);
    });

    test("should throw a TypeError if input is null", async () => {
      await expect(saveActiveGroupId(null)).rejects.toThrow(TypeError);
    });
  });

  describe("loadActiveGroupId", () => {
    test("should return the active ID from storage", async () => {
      browserMock.storage.local.get.mockResolvedValue({ activeGroupId: "123" });

      const result = await loadActiveGroupId();

      expect(result).toBe("123");
      expect(browserMock.storage.local.get).toHaveBeenCalledWith(
        "activeGroupId",
      );
    });

    test("should return null if no active ID is set", async () => {
      browserMock.storage.local.get.mockResolvedValue({});

      const result = await loadActiveGroupId();

      expect(result).toBeNull();
    });

    test("should throw an error if loading the ID fails", async () => {
      const error = new Error("Fatal Error");
      browserMock.storage.local.get.mockRejectedValue(error);

      await expect(loadActiveGroupId()).rejects.toThrow("Fatal Error");
    });
  });
});
