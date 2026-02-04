#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { isCancel, select } from "@clack/prompts";
import { Command } from "commander";

interface VersionParts {
	major: number;
	minor: number;
	patch: number;
}

interface PrereleaseInfo {
	type: "alpha" | "beta" | "rc" | "stable";
	number: number;
}

// Parse version from package.json
function getCurrentVersion(): string {
	const packagePath = path.join(process.cwd(), "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
	return packageJson.version;
}

// Parse version into components
function parseVersion(version: string): VersionParts {
	const baseVersion = version.replace(/-.*$/, "");
	const [major, minor, patch] = baseVersion.split(".").map(Number);
	return { major, minor, patch };
}

// Check if version is a prerelease
function isPrerelease(version: string): boolean {
	return /-/.test(version);
}

// Extract prerelease type
function getPrereleaseType(version: string): PrereleaseInfo["type"] {
	const match = version.match(/-([a-z]+)/);
	return (match?.[1] as PrereleaseInfo["type"]) || "stable";
}

// Extract prerelease number
function getPrereleaseNumber(version: string): number {
	const match = version.match(/-([a-z]+)\.(\d+)/);
	return match ? Number(match[2]) : 0;
}

// Get next prerelease level
function getNextPrereleaseLevel(
	current: PrereleaseInfo["type"],
): PrereleaseInfo["type"] {
	const levels: Record<PrereleaseInfo["type"], PrereleaseInfo["type"]> = {
		alpha: "beta",
		beta: "rc",
		rc: "stable",
		stable: "alpha",
	};
	return levels[current];
}

// Create new version based on bump type
function createVersion(current: string, bumpType: string): string {
	const parts = parseVersion(current);
	const type = getPrereleaseType(current);
	const number = getPrereleaseNumber(current);
	const baseVersion = current.replace(/-.*$/, "");

	switch (bumpType) {
		case "patch":
			return `${parts.major}.${parts.minor}.${parts.patch + 1}`;
		case "minor":
			return `${parts.major}.${parts.minor + 1}.0`;
		case "major":
			return `${parts.major + 1}.0.0`;
		case "increment-prerelease":
			return `${baseVersion}-${type}.${number + 1}`;
		case "next-prerelease": {
			const nextLevel = getNextPrereleaseLevel(type);
			return nextLevel === "stable"
				? baseVersion
				: `${baseVersion}-${nextLevel}.1`;
		}
		case "alpha-to-rc":
			return `${baseVersion}-rc.1`;
		case "patch-prerelease":
			return `${parts.major}.${parts.minor}.${parts.patch + 1}-${type}.1`;
		case "release":
			return baseVersion;
		default:
			throw new Error(`Unknown bump type: ${bumpType}`);
	}
}

// Show menu for version selection
async function selectBumpType(currentVersion: string): Promise<string> {
	// In non-interactive mode, select the first option
	if (!process.stdin.isTTY) {
		if (isPrerelease(currentVersion)) {
			const type = getPrereleaseType(currentVersion);
			return type === "rc" ? "release" : "next-prerelease";
		} else {
			return "patch";
		}
	}

	if (isPrerelease(currentVersion)) {
		const type = getPrereleaseType(currentVersion);
		const number = getPrereleaseNumber(currentVersion);
		const baseVersion = currentVersion.replace(/-.*$/, "");
		const nextLevel = getNextPrereleaseLevel(type);

		const nextPreVersion = `${baseVersion}-${type}.${number + 1}`;

		const options: Array<{ value: string; label: string }> = [
			{
				value: "increment-prerelease",
				label: `${nextPreVersion} (increment)`,
			},
		];

		if (type === "rc") {
			options.push({
				value: "release",
				label: `${baseVersion} (release)`,
			});
			options.push({
				value: "more",
				label: "more...",
			});
		} else {
			const nextLevelVersion = `${baseVersion}-${nextLevel}.1`;
			options.push({
				value: "next-prerelease",
				label: `${nextLevelVersion} (next level)`,
			});
			options.push({
				value: "release",
				label: `${baseVersion} (release)`,
			});
			options.push({
				value: "more",
				label: "more...",
			});
		}

		const choice = await select({
			message: "Select version bump type:",
			options,
		});

		if (isCancel(choice)) {
			console.log("Released cancelled");
			process.exit(0);
		}

		if (choice === "more") {
			return selectAdvancedMenu(currentVersion);
		}

		return choice;
	} else {
		const patch = parseVersion(currentVersion).patch;
		const nextPatch = `${currentVersion.slice(0, currentVersion.lastIndexOf("."))}.${patch + 1}`;

		const choice = await select({
			message: "Select version bump type:",
			options: [
				{
					value: "patch",
					label: `Patch (${currentVersion} → ${nextPatch})`,
				},
				{
					value: "minor",
					label: "Minor",
				},
				{
					value: "major",
					label: "Major",
				},
			],
		});

		if (isCancel(choice)) {
			console.log("Released cancelled");
			process.exit(0);
		}

		return choice;
	}
}

// Show advanced menu
async function selectAdvancedMenu(currentVersion: string): Promise<string> {
	const type = getPrereleaseType(currentVersion);
	const baseVersion = currentVersion.replace(/-.*$/, "");
	const parts = parseVersion(currentVersion);
	const nextPatch = `${parts.major}.${parts.minor}.${parts.patch + 1}`;
	const patchVersion = `${nextPatch}-${type}.1`;

	const options: Array<{ value: string; label: string }> = [
		{
			value: "patch-prerelease",
			label: `${patchVersion} (patch bump)`,
		},
	];

	if (type === "alpha") {
		options.push({
			value: "alpha-to-rc",
			label: `${baseVersion}-rc.1 (to RC)`,
		});
	}

	options.push({
		value: "back",
		label: "back",
	});

	const choice = await select({
		message: "Advanced Options:",
		options,
	});

	if (isCancel(choice)) {
		console.log("Released cancelled");
		process.exit(0);
	}

	if (choice === "back") {
		return selectBumpType(currentVersion);
	}

	return choice;
}

// Main function
async function main() {
	const program = new Command();

	program
		.name("release")
		.description("Release script for ha-ws-js-sugar")
		.option("--dry-run", "Run without making changes")
		.option("--release", "Create GitHub release")
		.parse();

	const options = program.opts();
	const dryRun = options.dryRun === true;

	console.log(
		dryRun ? "\n=== Release Script (DRY RUN) ===" : "\n=== Release Script ===",
	);
	console.log();

	// Step 1: Check git status
	if (!dryRun) {
		try {
			execSync("git diff-index --quiet HEAD --", { stdio: "pipe" });
		} catch {
			console.error("✗ Working directory has uncommitted changes");
			process.exit(1);
		}
		console.log("✓ Working directory is clean");
	}

	// Step 2: Get current version
	const currentVersion = getCurrentVersion();
	console.log(`✓ Current version: ${currentVersion}`);
	console.log();

	// Step 3: Select bump type
	const bumpType = await selectBumpType(currentVersion);
	console.log();

	// Step 4: Calculate new version
	const newVersion = createVersion(currentVersion, bumpType);
	console.log(`New version: ${currentVersion} → ${newVersion}`);
	console.log();

	// Step 5: Update version in package.json
	console.log("→ Updating version in package.json...");
	if (!dryRun) {
		execSync(
			`pnpm version ${newVersion} --no-commit-hooks --no-git-tag-version`,
		);
	}
	console.log(`✓ Version updated to ${newVersion}`);

	// Step 6: Commit
	console.log("→ Committing changes...");
	if (!dryRun) {
		execSync("git add package.json pnpm-lock.yaml", { stdio: "pipe" });
		execSync(`git commit -m "Release version ${newVersion}"`, {
			stdio: "pipe",
		});
	}
	console.log("✓ Changes committed");

	// Step 7: Create tag
	console.log("→ Creating git tag...");
	if (!dryRun) {
		execSync(`git tag v${newVersion}`, { stdio: "pipe" });
	}
	console.log(`✓ Tag v${newVersion} created`);

	// Step 8: Push changes and tag
	console.log("→ Pushing changes to remote...");
	if (!dryRun) {
		execSync("git push origin main", { stdio: "pipe" });
		execSync(`git push origin v${newVersion}`, { stdio: "pipe" });
	}
	console.log("✓ Changes and tag pushed");

	// Step 9: Determine if prerelease
	const prereleaseType = getPrereleaseType(newVersion);
	const isPrereleaseBool = prereleaseType !== "stable";

	// Step 10: Create GitHub release
	console.log("→ Creating GitHub release...");

	const releaseTitle = `Release ${newVersion}`;
	const prereleaseFlagGh = isPrereleaseBool ? "--prerelease" : "";

	if (options.release) {
		if (!dryRun) {
			try {
				execSync(`which gh`, { stdio: "pipe" });
				const ghCommand = `gh release create v${newVersion} --title "${releaseTitle}" --notes "Release version ${newVersion}" ${prereleaseFlagGh}`;
				execSync(ghCommand, { stdio: "pipe" });
				console.log("✓ GitHub release created");
			} catch {
				console.warn(
					"⚠ GitHub CLI (gh) not found. Please create the release manually:",
				);
				console.warn(
					`  gh release create v${newVersion} --title "${releaseTitle}" --notes "Release version ${newVersion}" ${prereleaseFlagGh}`,
				);
			}
		} else {
			console.log("✓ GitHub release would be created");
		}
	} else {
		console.warn(
			"⚠ Skipping GitHub release creation (use --release flag to create it)",
		);
	}

	if (isPrereleaseBool) {
		console.log(`\nℹ This is a ${prereleaseType} release`);
	}

	// Final summary
	console.log();
	console.log(dryRun ? "=== Dry Run Complete ===" : "=== Release Complete ===");
	console.log(`Version: ${newVersion}`);
	console.log(`Tag: v${newVersion}`);

	if (prereleaseType !== "stable") {
		console.log(`Type: Prerelease (${prereleaseType})`);
	} else {
		console.log("Type: Stable");
	}
	console.log();
}

main().catch(console.error);
