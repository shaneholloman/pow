import { expect, test } from "vitest";
import { setupTemporaryTestEnvironment } from "./test-utils.js";

test("custom-branch: pow uses custom branch when specified as argument", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create a custom branch and push it to establish tracking
        testAPI.exec("git checkout -b develop");
        testAPI.exec('echo "develop content" > develop.txt');
        testAPI.exec("git add develop.txt");
        testAPI.exec('git commit -m "Add develop content"');

        // Switch back to main
        testAPI.exec("git checkout main");

        // Run pow with custom branch argument
        testAPI.exec(`node ${testAPI.gitMainScript} develop`);

        // Verify we're on the develop branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("develop");

        // Verify develop content exists
        const developContent = testAPI.exec("cat develop.txt").trim();
        expect(developContent).toBe("develop content");
    });
});

test("custom-branch: pow checks out remote branch when it exists on remote but not locally", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create a branch locally, add content, and push to remote
        testAPI.exec("git checkout -b feature/remote-only");
        testAPI.exec('echo "remote content" > remote.txt');
        testAPI.exec("git add remote.txt");
        testAPI.exec('git commit -m "Add remote content"');
        testAPI.exec("git push -u origin feature/remote-only");

        // Switch back to main and delete the local branch
        testAPI.exec("git checkout main");
        testAPI.exec("git branch -D feature/remote-only");

        // Fetch the remote branch info
        testAPI.exec("git fetch");

        // Verify the branch doesn't exist locally
        const localBranches = testAPI
            .exec("git branch --list feature/remote-only")
            .trim();
        expect(localBranches).toBe("");

        // Verify the branch exists on remote
        const remoteBranches = testAPI
            .exec("git branch -r --list origin/feature/remote-only")
            .trim();
        expect(remoteBranches).toContain("origin/feature/remote-only");

        // Run pow with the remote branch name
        testAPI.exec(`node ${testAPI.gitMainScript} feature/remote-only`);

        // Verify we're on the remote branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("feature/remote-only");

        // Verify the branch is tracking the remote
        const trackingInfo = testAPI.exec("git branch -vv").trim();
        expect(trackingInfo).toContain("[origin/feature/remote-only]");

        // Verify remote content exists
        const remoteContent = testAPI.exec("cat remote.txt").trim();
        expect(remoteContent).toBe("remote content");
    });
});

test("custom-branch: pow creates new branch when it does not exist and user confirms", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Verify the branch doesn't exist locally
        const localBranches = testAPI
            .exec("git branch --list feature/new-branch")
            .trim();
        expect(localBranches).toBe("");

        // Verify the branch doesn't exist on remote
        expect(() => {
            testAPI.exec(
                "git ls-remote --exit-code origin feature/new-branch",
                {
                    silent: true,
                },
            );
        }).toThrow();

        // Use interactive test to confirm branch creation
        const run = testAPI.execInteractive(
            `node ${testAPI.gitMainScript} feature/new-branch`,
        );
        await run.waitForText(
            "Branch 'feature/new-branch' does not exist locally or on remote. Create it?",
            5000,
        );
        run.respond("y");
        await run.waitForEnd(10000);

        // Verify we're on the new branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("feature/new-branch");

        // Verify the branch was created from the latest main
        const mainCommit = testAPI.exec("git rev-parse main").trim();
        const newBranchCommit = testAPI
            .exec("git rev-parse feature/new-branch")
            .trim();
        expect(newBranchCommit).toBe(mainCommit);
    });
});

test("custom-branch: pow creates new branch with dirty working directory", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create some uncommitted changes
        testAPI.exec('echo "uncommitted content" > uncommitted.txt');
        testAPI.exec("git add uncommitted.txt");
        testAPI.exec('echo "modified content" >> main.txt');

        // Verify we have uncommitted changes
        const status = testAPI.exec("git status --porcelain").trim();
        expect(status.length).toBeGreaterThan(0);

        // Use interactive test to confirm branch creation
        const run = testAPI.execInteractive(
            `node ${testAPI.gitMainScript} feature/dirty-branch`,
        );
        await run.waitForText(
            "Branch 'feature/dirty-branch' does not exist locally or on remote. Create it?",
            5000,
        );
        run.respond("y");
        await run.waitForEnd(10000);

        // Verify we're on the new branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("feature/dirty-branch");

        // Verify the uncommitted changes are still there
        const newStatus = testAPI.exec("git status --porcelain").trim();
        expect(newStatus.length).toBeGreaterThan(0);

        // Verify the new files exist
        const uncommittedContent = testAPI.exec("cat uncommitted.txt").trim();
        expect(uncommittedContent).toBe("uncommitted content");
    });
});

test("custom-branch: pow exits when user declines to create new branch", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Verify the branch doesn't exist locally or on remote
        const localBranches = testAPI
            .exec("git branch --list feature/declined-branch")
            .trim();
        expect(localBranches).toBe("");

        expect(() => {
            testAPI.exec(
                "git ls-remote --exit-code origin feature/declined-branch",
                {
                    silent: true,
                },
            );
        }).toThrow();

        // Use interactive test to decline branch creation
        const run = testAPI.execInteractive(
            `node ${testAPI.gitMainScript} feature/declined-branch`,
        );
        await run.waitForText(
            "Branch 'feature/declined-branch' does not exist locally or on remote. Create it?",
            5000,
        );
        run.respond("n");

        const result = await run.waitForEnd(10000);

        // Verify the process exited with code 1
        expect(result.code).toBe(1);

        // Verify we're still on the original branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("main");

        // Verify the branch was not created
        const finalBranches = testAPI
            .exec("git branch --list feature/declined-branch")
            .trim();
        expect(finalBranches).toBe("");
    });
});

test("custom-branch: pow creates new branch from non-main branch", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create a feature branch and switch to it
        testAPI.exec("git checkout -b feature/parent-branch");
        testAPI.exec('echo "parent branch content" > parent.txt');
        testAPI.exec("git add parent.txt");
        testAPI.exec('git commit -m "Add parent branch content"');

        // Verify we're on the parent branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("feature/parent-branch");

        // Use interactive test to create new branch from current branch
        const run = testAPI.execInteractive(
            `node ${testAPI.gitMainScript} feature/child-branch`,
        );
        await run.waitForText(
            "Branch 'feature/child-branch' does not exist locally or on remote. Create it?",
            5000,
        );
        run.respond("y");
        await run.waitForEnd(10000);

        // Verify we're on the new child branch
        const newBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(newBranch).toBe("feature/child-branch");

        // Verify the child branch was created from the parent branch (not main)
        const parentCommit = testAPI
            .exec("git rev-parse feature/parent-branch")
            .trim();
        const childCommit = testAPI
            .exec("git rev-parse feature/child-branch")
            .trim();
        expect(childCommit).toBe(parentCommit);

        // Verify parent branch content exists in child branch
        const parentContent = testAPI.exec("cat parent.txt").trim();
        expect(parentContent).toBe("parent branch content");

        // Verify child branch has the parent branch's commit but not main's latest commit
        const mainCommit = testAPI.exec("git rev-parse main").trim();
        expect(childCommit).not.toBe(mainCommit);
    });
});
