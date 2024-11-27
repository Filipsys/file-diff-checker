import { buildApplication, buildCommand, type CommandContext } from "@stricli/core";
import { description, name, version } from "../package.json";
import * as pathlib from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHmac } from "node:crypto";

const command = buildCommand({
    async func(this: CommandContext, _: {}, ...paths: string[]) {
        let inputContent: { pathname: string; content: string }[] = [];
        let inputHashes: { pathname: string; hash: string }[] = [];

        const exactCheck = (data: string) => {
            return createHmac("sha256", data).digest("hex");
        };

        if (!paths) {
            this.process.stdout.write("No input provided.\n");
            return;
        }

        for (const path of paths) {
            const index = paths.indexOf(path);

            try {
                const data = await fs.readFile(pathlib.join(process.cwd(), path), { encoding: "utf-8" });

                inputHashes.push({
                    pathname: path,
                    hash: exactCheck(data)
                })
            } catch (err: any) {
                this.process.stdout.write(`Error reading path ${index + 1}: ${err.message}\n`);
            }
        }

        inputHashes.forEach((hash, index) => {
            this.process.stdout.write(`Path ${index + 1}:\n${hash.pathname}\n${hash.hash}\n`);
        });

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
            } catch (err: any) {
                this.process.stdout.write(`Error reading path ${index + 1}: ${err.message}\n`);
            }
        }

        inputContent.forEach((content, index) => {
            this.process.stdout.write(`Path ${index + 1}:\n${content.pathname}\n${content.content}\n`);
        });
    },
    parameters: {
        positional: {
            kind: "array",
            parameter: {
                brief: "File paths",
                parse: String,
            },
        },
    },
    docs: {
        brief: description,
        customUsage: [
            "/path/to/file /path/to/file ...",
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
