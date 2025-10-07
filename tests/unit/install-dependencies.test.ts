import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fs } from "zx";
import {
    detectPackageManager,
    getLockfile,
} from "../../src/install-dependencies.js";

vi.mock("zx", () => ({
    fs: {
        pathExists: vi.fn(),
    },
}));

describe("install-dependencies", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("detectPackageManager", () => {
        test("detects yarn when yarn.lock exists", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("yarn.lock");
                },
            );

            const result = await detectPackageManager("/test/repo");
            expect(result).toBe("yarn");
            expect(fs.pathExists).toHaveBeenCalledWith("/test/repo/yarn.lock");
        });

        test("detects pnpm when pnpm-lock.yaml exists", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("pnpm-lock.yaml");
                },
            );

            const result = await detectPackageManager("/test/repo");
            expect(result).toBe("pnpm");
        });

        test("detects npm when package-lock.json exists", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("package-lock.json");
                },
            );

            const result = await detectPackageManager("/test/repo");
            expect(result).toBe("npm");
        });

        test("returns null when no lockfile exists", async () => {
            vi.mocked(fs.pathExists).mockResolvedValue(false);

            const result = await detectPackageManager("/test/repo");
            expect(result).toBeNull();
        });

        test("prefers yarn over pnpm over npm", async () => {
            vi.mocked(fs.pathExists).mockResolvedValue(true);

            const result = await detectPackageManager("/test/repo");
            expect(result).toBe("yarn");
        });
    });

    describe("getLockfile", () => {
        test("returns yarn.lock for yarn", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("yarn.lock");
                },
            );

            const result = await getLockfile("/test/repo");
            expect(result).toBe("yarn.lock");
        });

        test("returns pnpm-lock.yaml for pnpm", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("pnpm-lock.yaml");
                },
            );

            const result = await getLockfile("/test/repo");
            expect(result).toBe("pnpm-lock.yaml");
        });

        test("returns package-lock.json for npm", async () => {
            vi.mocked(fs.pathExists).mockImplementation(
                async (path: string) => {
                    return path.includes("package-lock.json");
                },
            );

            const result = await getLockfile("/test/repo");
            expect(result).toBe("package-lock.json");
        });

        test("returns null when no package manager detected", async () => {
            vi.mocked(fs.pathExists).mockResolvedValue(false);

            const result = await getLockfile("/test/repo");
            expect(result).toBeNull();
        });
    });
});
