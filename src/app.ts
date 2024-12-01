import { buildApplication, buildCommand, type CommandContext } from "@stricli/core";
import { exactCheck, checkLineSimilarity } from "./lib/functions";
import { description, name, version } from "../package.json";
import { existsSync } from "node:fs";
import * as pathlib from "node:path";
import fs from "node:fs/promises";

const command = buildCommand({
    async func(this: CommandContext, _: {}, ...paths: string[]) {
        let inputContent: { pathname: string; content: string }[] = [];
        let inputHashes: { pathname: string; hash: string }[] = [];
        let exactContents = new Array<string>();
        let DEBUG_MODE = false;

        // Check if the debug flag is enabled.
        for (const [key, value] of Object.entries(_)) {
            if (key === "debug" && value === true)
                DEBUG_MODE = true;
        }

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

                if (DEBUG_MODE) {
                    this.process.stdout.write(`Path ${index + 1} does not differ from path ${i + 1}.\n`)
                }

                if (!exactContents.includes(content.pathname)) {
                    exactContents.push(content.pathname);
                }
            }
        });

        if (DEBUG_MODE) {
            inputContent.forEach((content) => {
                this.process.stdout.write(`Path: ${content.pathname}\n`);
            });
            exactContents.forEach((content) => {
                this.process.stdout.write(`Exact: ${content}\n`);
            });
        }

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
        this.process.stdout.write("===[ Detailed comparison ]===\n");
        // @ts-ignore
        this.process.stdout.write(`Path similarities percentage (full lines): ${checkLineSimilarity(inputContent[0].content, inputContent[1].content)}\n`);
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
            },
            minify: {
                kind: "boolean",
                brief: "Enable minification",
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
