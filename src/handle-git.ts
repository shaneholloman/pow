import { $ } from "zx";
import { log } from "./logger.js";
import type { BranchValidation, RepositoryInfo } from "./types.js";

export async function setupRepository(): Promise<RepositoryInfo> {
    const [remoteResult, gitRootResult] = await Promise.all([
        $`git remote show -n`,
        $`git rev-parse --show-toplevel`,
    ]);

    const defaultRemote = remoteResult.stdout.trim();
    const gitRoot = gitRootResult.stdout.trim();

    if (!defaultRemote) {
        log.error("No remote repository found");
        process.exit(1);
    }

    return { defaultRemote, gitRoot };
}

export async function validateBranchExistence(
    branchName: string,
    defaultRemote: string,
): Promise<BranchValidation> {
    const validationResults = await Promise.allSettled([
        $`git rev-parse --quiet --verify ${branchName}`,
        $`git ls-remote --exit-code ${defaultRemote} ${branchName}`,
    ]);

    const localExists = validationResults[0].status === "fulfilled";
    const remoteExists = validationResults[1].status === "fulfilled";

    return { localExists, remoteExists };
}

export async function quickPull(
    mainBranch: string,
    remote: string,
): Promise<void> {
    try {
        await $`git merge --ff-only ${remote}/${mainBranch}`;
        log.success("Fast-forwarded to latest changes");
    } catch (_e) {
        log.action("Cannot fast-forward, using git pull...");
        try {
            const pullResult = await $`git pull`;
            if (pullResult.stdout.includes("Already up to date.")) {
                log.info("Repository is already up to date");
            }
        } catch (pullError) {
            if (
                pullError instanceof Error &&
                pullError.message.includes("There is no tracking information")
            ) {
                log.info(
                    `Branch '${mainBranch}' has no upstream tracking, skipping pull`,
                );
            } else {
                throw pullError;
            }
        }
    }
}

export async function findBranchesWithDeletedRemotes(
    mainBranch: string,
    defaultRemote: string,
): Promise<string[]> {
    const branchesToDelete: string[] = [];

    try {
        const [, branchResult, currentBranch] = await Promise.all([
            $`git remote prune ${defaultRemote}`,
            $`git branch -vv`,
            $`git rev-parse --abbrev-ref HEAD`.then((result) =>
                result.stdout.trim(),
            ),
        ]);

        const branches = branchResult.stdout.split("\n").filter(Boolean);

        for (const line of branches) {
            const match = line.match(
                /^\s*(\*?\s*)([^\s]+)\s+[a-f0-9]+(?:\s+\[([^\]]+)\])?\s*(.*)/,
            );
            if (!match) continue;

            const branchName = match[2];
            const trackingInfo = match[3] || "";

            if (
                !branchName ||
                branchName === currentBranch ||
                branchName === mainBranch ||
                branchName === "master" ||
                branchName === "main"
            ) {
                continue;
            }

            const isRemoteGone = trackingInfo?.includes(": gone");

            if (isRemoteGone) {
                branchesToDelete.push(branchName);
            }
        }
        return branchesToDelete;
    } catch (e) {
        log.error(
            `Error finding branches with deleted remotes: ${e instanceof Error ? e.message : e}`,
        );
        return [];
    }
}
