import { expect, test } from "vitest";
import { setupTemporaryTestEnvironment } from "./test-utils.js";

test("stale-branch-cleanup: pow detects and cleans up branches with deleted remotes", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create a new branch
        testAPI.exec("git checkout -b feature/test-branch");

        // Add a new file and commit it
        testAPI.exec('echo "test content" > test-file.txt');
        testAPI.exec("git add test-file.txt");
        testAPI.exec('git commit -m "Add test file"');

        // Push the branch to remote to establish tracking
        testAPI.exec("git push -u origin feature/test-branch");

        // Switch back to main
        testAPI.exec("git checkout main");

        // Verify the branch exists and has remote tracking
        const branchList = testAPI.exec("git branch -vv");
        expect(branchList).toContain("feature/test-branch");
        expect(branchList).toContain("[origin/feature/test-branch]");

        // Simulate remote branch deletion (like after a PR merge)
        const remoteRepoPath = `${testAPI.baseTempDir}/remote/upstream.git`;
        testAPI.exec(
            `git -C "${remoteRepoPath}" branch -D feature/test-branch`,
        );

        // Update local tracking info to reflect remote deletion
        testAPI.exec("git remote prune origin");

        // Verify branch now shows as "gone"
        const branchListAfterPrune = testAPI.exec("git branch -vv");
        expect(branchListAfterPrune).toContain("gone]");

        // Run pow script (no interactive prompts needed now)
        const output = testAPI.exec(`node ${testAPI.gitMainScript}`);

        // Verify the output mentions branch deletion
        expect(output).toContain("Deleting branch feature/test-branch");
        expect(output).toContain("Deleted 1 branch");

        // Verify the stale branch was cleaned up
        const finalBranchList = testAPI.exec(
            "git branch --list feature/test-branch",
        );
        expect(finalBranchList.trim()).toBe("");

        // Verify we're still on main branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("main");
    });
});

test("stale-branch-cleanup: pow handles case with no branches with deleted remotes", async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        // Create a new branch
        testAPI.exec("git checkout -b feature/active-branch");

        // Add a new file and commit it
        testAPI.exec('echo "active content" > active-file.txt');
        testAPI.exec("git add active-file.txt");
        testAPI.exec('git commit -m "Add active file"');

        // Push the branch to remote to establish tracking
        testAPI.exec("git push -u origin feature/active-branch");

        // Switch back to main
        testAPI.exec("git checkout main");

        // Verify the branch exists and has remote tracking (remote still exists)
        const branchList = testAPI.exec("git branch -vv");
        expect(branchList).toContain("feature/active-branch");
        expect(branchList).toContain("[origin/feature/active-branch]");
        expect(branchList).not.toContain("gone]");

        // Run pow script
        const output = testAPI.exec(`node ${testAPI.gitMainScript}`);

        // Verify the output mentions no branches with deleted remotes
        expect(output).toContain("No branches with deleted remotes found");

        // Verify the branch is still there
        const finalBranchList = testAPI.exec(
            "git branch --list feature/active-branch",
        );
        expect(finalBranchList).toContain("feature/active-branch");

        // Verify we're still on main branch
        const currentBranch = testAPI
            .exec("git rev-parse --abbrev-ref HEAD")
            .trim();
        expect(currentBranch).toBe("main");
    });
});
