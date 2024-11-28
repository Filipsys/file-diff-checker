import { buildApplication, buildCommand, type CommandContext } from "@stricli/core";
import { description, name, version } from "../package.json";
import * as pathlib from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHmac } from "node:crypto";
// import path from "node:path";

const command = buildCommand({
    async func(this: CommandContext, _: {}, ...paths: string[]) {
        let inputContent: { pathname: string; content: string }[] = [];
        let inputHashes: { pathname: string; hash: string }[] = [];
        let exactContents = new Array<string>();
        let DEBUG_MODE = false;

        // Check if the debug flag is enabled.
        for (const [key] of Object.entries(_))
            if (key === "debug") DEBUG_MODE = true;

        // Hashing function to compare file contents.
        // Uses SHA-256 to hash the content and returns
        // the hash to be ready for comparison.
        const exactCheck = (data: string) => {
            return createHmac("sha256", data).digest("hex");
        };

        if (!paths) {
            this.process.stdout.write("No input provided.\n");
            return;
        }

        for (const path of paths) {
            const index = paths.indexOf(path);

            if (pathlib.isAbsolute(paths[index]!)) {
                this.process.stdout.write("Directory input mustn't be an absolute path.\n");
                return;
            }

            if (!existsSync(pathlib.join(process.cwd(), path))) {
                this.process.stdout.write(`Path ${index + 1} doesn't exist.\n`);
                return;
            }

            try {
                const data = await fs.readFile(pathlib.join(process.cwd(), path), { encoding: "utf-8" });

                inputContent.push({
                    pathname: path,
                    content: String.raw`${data}`,
                });
                inputHashes.push({
                    pathname: path,
                    hash: exactCheck(data)
                });
            } catch (err: any) {
                this.process.stdout.write(`Error reading path ${index + 1}: ${err.message}\n`);
            }
        }

        // Comparing files to check for 100% similarity. This is
        // a very rare case but should make the checking process
        // faster with larger files that are identical.
        inputContent.forEach((content) => {
            const index = inputContent.indexOf(content);

            for (let i = 0; i < inputContent.length; i++) {
                if (i === index) continue;
                if (exactCheck(content.content) !== inputHashes[i]?.hash) continue;

                DEBUG_MODE
                    ? this.process.stdout.write(`Path ${index + 1} does not differ from path ${i + 1}.\n`)
                    : null;

                if (!exactContents.includes(content.pathname)) {
                    exactContents.push(content.pathname);
                }
            }
        });

        DEBUG_MODE
        ? (
            inputContent.forEach((content) => {
            this.process.stdout.write(`Path: ${content.pathname}\n`);
            }),
            exactContents.forEach((content) => {
                this.process.stdout.write(`Exact: ${content}\n`);
            })
        ) : null;

        // Outputting the comparison summary.
        this.process.stdout.write("===[ Comparison summary ]===\n");
        this.process.stdout.write(`Total paths checked: ${paths.length}\n`);
        this.process.stdout.write(`Identical files: ${exactContents.length}\n`);
        this.process.stdout.write(
            exactContents.length > 0
                ? `Paths: ${exactContents.join(", ")}\n`
                : "No identical files found.\n"
        );
        this.process.stdout.write("\n");
    },
    parameters: {
        positional: {
            kind: "array",
            parameter: {
                brief: "File paths",
                parse: String,
            },
        },
        flags: {
            debug: {
                kind: "boolean",
                brief: "Enable debug mode",
                optional: true,
            }
        },
    },
    docs: {
        brief: description,
        customUsage: [
            "/path/to/file /path/to/file ...",
            "--debug /path/to/file /path/to/file ...",
            "/path/to/directory",
        ],
    }
});

export const app = buildApplication(command, {
    name,
    versionInfo: {
        currentVersion: version,
    },
});
