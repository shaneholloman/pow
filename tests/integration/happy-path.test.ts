import { expect, test } from 'vitest';
import { setupTemporaryTestEnvironment } from './test-utils.js';

test('happy-path: pow runs successfully on a clean repository', async () => {
    await setupTemporaryTestEnvironment(async (testAPI) => {
        testAPI.exec(`node ${testAPI.gitMainScript}`);
        const currentBranch: string = testAPI
            .exec('git rev-parse --abbrev-ref HEAD')
            .trim();
        expect(currentBranch).toBe('main');
    });
});
