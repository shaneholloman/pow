import { $, fs } from "zx";
import type { PackageManager } from "./types.js";

export async function detectPackageManager(
    gitRoot: string,
): Promise<PackageManager | null> {
    if (await fs.pathExists(`${gitRoot}/yarn.lock`)) return "yarn";
    if (await fs.pathExists(`${gitRoot}/pnpm-lock.yaml`)) return "pnpm";
    if (await fs.pathExists(`${gitRoot}/package-lock.json`)) return "npm";
    return null;
}

export async function installDependencies(
    packageManager: PackageManager,
    gitRoot: string,
): Promise<void> {
    switch (packageManager) {
        case "yarn":
            await $`cd "${gitRoot}" && yarn --immutable`.pipe(process.stdout);
            break;
        case "pnpm":
            await $`cd "${gitRoot}" && pnpm install --frozen-lockfile`.pipe(
                process.stdout,
            );
            break;
        case "npm":
            await $`cd "${gitRoot}" && npm ci`.pipe(process.stdout);
            break;
    }
}

export async function getLockfile(gitRoot: string): Promise<string | null> {
    const packageManager = await detectPackageManager(gitRoot);
    if (!packageManager) return null;
    switch (packageManager) {
        case "yarn":
            return "yarn.lock";
        case "pnpm":
            return "pnpm-lock.yaml";
        case "npm":
            return "package-lock.json";
    }
}

export async function getLockfileContent(gitRoot: string): Promise<string> {
    const lockfile = await getLockfile(gitRoot);
    if (!lockfile) return "";
    return await readFileIfExists(`${gitRoot}/${lockfile}`);
}

async function readFileIfExists(filepath: string): Promise<string> {
    try {
        return await fs.readFile(filepath, "utf8");
    } catch {
        return "";
    }
}
