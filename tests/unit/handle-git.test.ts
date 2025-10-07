import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { validateBranchExistence } from "../../src/handle-git.js";
import { $ } from "zx";

vi.mock("zx", () => ({
  $: vi.fn(),
}));

describe("handle-git", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateBranchExistence", () => {
    test("returns localExists=true when branch exists locally", async () => {
      const mockTemplateTag = vi.fn().mockResolvedValue({ stdout: "" });
      vi.mocked($).mockImplementation(mockTemplateTag as any);

      const result = await validateBranchExistence("feature-branch", "origin");

      expect(result.localExists).toBe(true);
      expect(result.remoteExists).toBe(true);
    });

    test("returns localExists=false when branch does not exist locally", async () => {
      const mockTemplateTag = vi.fn()
        .mockRejectedValueOnce(new Error("branch not found"))
        .mockResolvedValueOnce({ stdout: "" });

      vi.mocked($).mockImplementation(mockTemplateTag as any);

      const result = await validateBranchExistence("nonexistent", "origin");

      expect(result.localExists).toBe(false);
      expect(result.remoteExists).toBe(true);
    });

    test("returns remoteExists=false when branch does not exist on remote", async () => {
      const mockTemplateTag = vi.fn()
        .mockResolvedValueOnce({ stdout: "" })
        .mockRejectedValueOnce(new Error("remote branch not found"));

      vi.mocked($).mockImplementation(mockTemplateTag as any);

      const result = await validateBranchExistence("local-only", "origin");

      expect(result.localExists).toBe(true);
      expect(result.remoteExists).toBe(false);
    });

    test("returns both false when branch exists nowhere", async () => {
      const mockTemplateTag = vi.fn()
        .mockRejectedValueOnce(new Error("not found"))
        .mockRejectedValueOnce(new Error("not found"));

      vi.mocked($).mockImplementation(mockTemplateTag as any);

      const result = await validateBranchExistence("nowhere", "origin");

      expect(result.localExists).toBe(false);
      expect(result.remoteExists).toBe(false);
    });
  });
});
