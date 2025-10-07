import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { setupTemporaryTestEnvironment } from './test-utils.js';

test('reset-to-main: pow switches to main and resets content from diverged feature branch', async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        testAPI.exec('git checkout -b feature-branch');

        await testAPI.applyChange(
            'diverged-change',
            'Commit on feature-branch with diverged README',
        );

        testAPI.exec('git checkout feature-branch'); // Make sure we are on the feature branch

        testAPI.exec(`node ${testAPI.gitMainScript}`);

        const currentBranch: string = testAPI
            .exec('git rev-parse --abbrev-ref HEAD')
            .trim();
        expect(currentBranch).toBe('main');

        const readmeContent: string = await readFile(
            join(testAPI.tempDir, 'README.md'),
            'utf-8',
        );
        const initialReadmeContent: string = await readFile(
            join(testAPI.projectRoot, 'tests', 'fixtures', 'README.md'),
            'utf-8',
        );
        expect(readmeContent).toBe(initialReadmeContent);
    });
});
