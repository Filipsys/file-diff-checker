import { buildApplication, buildCommand, type CommandContext } from "@stricli/core";
import { name, version, description } from "../package.json";
import path from "node:path";

interface Flags {
    dirInput?: string;
    fileInput?: string;
}

const command = buildCommand({
    func(this: CommandContext, { dirInput, fileInput }: Flags): void {

        if (dirInput === undefined && fileInput === undefined) {
            this.process.stdout.write("Directory input not provided.\n");
            return;
        }

        if (dirInput !== undefined && fileInput !== undefined ||
            dirInput === undefined && fileInput === undefined) {
            this.process.stdout.write("Please provide either a directory input or a file input, but not both.\n");
            return;
        }

        this.process.stdout.write(`Hello!\n${dirInput ? "Directory" : "File"} input: ${dirInput || fileInput}\n`);
    },
    parameters: {
        flags: {
            dirInput: {
                kind: "parsed",
                brief: "Directory input as a path",
                parse: String,
                optional: true,
            },
            fileInput: {
                kind: "parsed",
                brief: "File input as a path",
                parse: String,
                optional: true,
            },
        },
        // aliases: {
        //     di: "dirInput",
        // },
    },
    docs: {
        brief: description,
        customUsage: [
            "--dirInput /path/to/directory",
            "--fileInput /path/to/directory",
        ],
    }
});

export const app = buildApplication(command, {
    name,
    versionInfo: {
        currentVersion: version,
    },
});
