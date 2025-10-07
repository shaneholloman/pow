import { existsSync, writeFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import { expect, test } from 'vitest';
import { createInteractiveCLI } from './interactiveSpawn.js';
import { setupTemporaryTestEnvironment } from './test-utils.js';

// Define generous timeouts for CI environments
const INTERACTIVE_TIMEOUT_MS = 10000;
const END_TIMEOUT_MS = 15000;

test('interactive: dirty-repo-reset: pow prompts to reset a dirty main branch and resets if confirmed', async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        const dirtyFilePath = pathJoin(testAPI.tempDir, 'dirty-file.txt');

        // Make the main branch dirty
        writeFileSync(dirtyFilePath, 'This is a dirty file.', 'utf-8');

        // Verify it's dirty
        const initialStatus = testAPI.exec('git status --porcelain').trim();
        expect(initialStatus).toContain('?? dirty-file.txt');

        const cliSession = createInteractiveCLI(
            `node ${testAPI.gitMainScript}`,
            {
                cwd: testAPI.tempDir,
            },
        );

        // Wait for the prompt asking to revert changes
        const promptOutput = await cliSession.waitForText(
            /Revert all changes\? \[y\/n]:/i,
            INTERACTIVE_TIMEOUT_MS,
        );
        expect(promptOutput).toContain(
            'You are on main branch with uncommitted changes:',
        );

        cliSession.respond('y');

        await cliSession.waitForText(
            /SUCCESS All done!/i,
            INTERACTIVE_TIMEOUT_MS,
        );

        const result = await cliSession.waitForEnd(END_TIMEOUT_MS);
        expect(result.code).toBe(0);

        // Verify branch is clean
        const finalStatus = testAPI.exec('git status --porcelain').trim();
        expect(finalStatus).toBe('');

        // Verify untracked file is gone
        const dirtyFileExists = existsSync(dirtyFilePath);
        expect(dirtyFileExists).toBe(false);

        // Assert current branch is main
        const currentBranch = testAPI
            .exec('git rev-parse --abbrev-ref HEAD')
            .trim();
        expect(currentBranch).toBe('main');
    });
});
