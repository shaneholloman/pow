export type PackageManager = "yarn" | "pnpm" | "npm";

export interface RepositoryInfo {
    defaultRemote: string;
    gitRoot: string;
}

export interface DependencyInfo {
    packageManager: PackageManager | null;
    originalLockfileContent: string;
}

export interface BranchValidation {
    localExists: boolean;
    remoteExists: boolean;
}

// Type for zx $ configuration
export interface ZxConfig {
    quiet: boolean;
    verbose: boolean;
}
