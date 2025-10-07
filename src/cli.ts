import { Command } from "commander";
import { $, spinner, question } from "zx";
import chalk from "chalk";
import { log } from "./logger.js";
import { setupRepository, validateBranchExistence, quickPull, findBranchesWithDeletedRemotes } from "./handle-git.js";
import { detectPackageManager, getLockfileContent, getLockfile, installDependencies } from "./install-dependencies.js";

// Configure zx shell settings
($ as any).quiet = true;
($ as any).verbose = false;

async function confirmAction(message: string): Promise<boolean> {
  let result = "";
  while (result !== "y" && result !== "n") {
    result = await question(`${chalk.yellow("?")} ${message} [y/n]: `, {
      choices: ["y", "n"],
    });
  }
  return result === "y";
}

async function main(branchName?: string): Promise<void> {
  log.action("Setting up repository...");
  const { defaultRemote, gitRoot } = await setupRepository();

  log.action("Fetching latest changes and detecting dependencies...");
  const [packageManager, originalLockfileContent] = await Promise.all([
    detectPackageManager(gitRoot),
    getLockfileContent(gitRoot),
    $`git fetch`.catch((e) => {
      if (
        e instanceof Error &&
        e.message.includes("fatal: not a git repository")
      ) {
        log.error("Not a git repository");
        process.exit(1);
      }
      throw e;
    }),
  ]);

  let mainBranch = "main";
  try {
    await $`git rev-parse --quiet --verify ${mainBranch}`;
  } catch {
    mainBranch = "master";
  }
  log.info(`Using main branch: ${chalk.bold(mainBranch)}`);

  let createNewBranch: string | null = null;
  let isRemoteBranch = false;

  if (branchName) {
    const { localExists, remoteExists } = await validateBranchExistence(
      branchName,
      defaultRemote,
    );

    if (localExists) {
      mainBranch = branchName;
    } else if (remoteExists) {
      mainBranch = branchName;
      isRemoteBranch = true;
    } else {
      const shouldCreate = await confirmAction(
        `Branch '${branchName}' does not exist locally or on remote. Create it?`,
      );
      if (!shouldCreate) {
        process.exit(1);
      }
      createNewBranch = branchName;
    }
  }

  const currentBranch = (
    await $`git rev-parse --abbrev-ref HEAD`
  ).stdout.trim();

  const status = (await $`git status --porcelain`).stdout;
  if (status) {
    if (createNewBranch) {
      log.info("Creating new branch with uncommitted changes");
    } else if (currentBranch === mainBranch) {
      console.log("");
      log.warning(
        `You are on ${chalk.bold(
          mainBranch,
        )} branch with uncommitted changes:\n`,
      );
      const files = (await $`git ls-files -mo --exclude-standard`).stdout;
      files
        .split("\n")
        .filter(Boolean)
        .forEach((file) => {
          console.log(` ./${chalk.bold(file)}`);
        });
      console.log("");
      if (await confirmAction("Revert all changes?")) {
        log.action("Resetting working directory...");
        await $`git add --all`;
        await $`git reset --hard HEAD`;
        log.success("Working directory cleaned");
      } else {
        process.exit(1);
      }
    } else {
      log.error("Branch is not clean");
      process.exit(1);
    }
  }

  if (!(createNewBranch && status)) {
    if (currentBranch !== mainBranch) {
      if (isRemoteBranch) {
        log.action(`Switching to remote branch ${chalk.bold(mainBranch)}...`);
        await $`git checkout -b ${mainBranch} ${defaultRemote}/${mainBranch}`;
      } else if (!createNewBranch) {
        log.action(`Switching to ${chalk.bold(mainBranch)} branch...`);
        await $`git checkout ${mainBranch}`;
      } else {
        log.info(`Branching off from ${chalk.bold(currentBranch)} branch`);
      }
    }

    log.action("Pulling latest changes...");
    await quickPull(mainBranch, defaultRemote);
  }

  let hasLockfileChanges = false;
  if (packageManager) {
    const newLockfileContent = await getLockfileContent(gitRoot);
    hasLockfileChanges = originalLockfileContent !== newLockfileContent;
  }

  if (createNewBranch) {
    log.action(`Creating branch ${chalk.bold(createNewBranch)}...`);
    await $`git checkout -b ${createNewBranch}`;
  }

  if (mainBranch === "master" || mainBranch === "main") {
    log.action("Cleaning up branches with deleted remotes...");

    const branchesToDelete = await findBranchesWithDeletedRemotes(
      mainBranch,
      defaultRemote,
    );

    if (branchesToDelete.length === 0) {
      log.info("No branches with deleted remotes found");
    } else {
      for (const branchName of branchesToDelete) {
        log.info(`Deleting branch ${chalk.bold(branchName)} (remote deleted)`);
        await $`git branch -D ${branchName}`;
      }
      log.success(
        `Deleted ${branchesToDelete.length} branch${
          branchesToDelete.length > 1 ? "es" : ""
        } with deleted remotes`,
      );
    }
  }

  if (hasLockfileChanges && packageManager) {
    log.action(`Installing dependencies with ${packageManager}...`);
    await spinner(
      `Installing dependencies with ${chalk.bold(packageManager)}...`,
      () => installDependencies(packageManager, gitRoot),
    );
  } else if (packageManager) {
    log.info(`${await getLockfile(gitRoot)} is unchanged`);
  }

  log.success("All done!");
}

const program = new Command();

program
  .name("pow")
  .description("Manage git main/master branches and cleanup")
  .version("0.1.0")
  .argument("[branch-name]", "Optional branch name to switch to or create")
  .action(async (branchName?: string) => {
    try {
      await main(branchName);
      process.exit(0);
    } catch (error) {
      log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
