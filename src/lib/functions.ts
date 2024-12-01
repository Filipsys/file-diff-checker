import { createHmac } from "node:crypto";

// Hashing function to compare file contents.
// Uses SHA-256 to hash the content and returns
// the hash to be ready for comparison.
export const exactCheck = (data: string) => {
    return createHmac("sha256", data).digest("hex");
};

// I don't like this function as it seems very
// inefficient. I will need to find a better way
// to compare the files, or so I hope as I'm making
// this the temporary solution for line comparison.
export const checkLineSimilarity = (...files: string[]) => {
    let lineSimilarity = 0;
    let totalLines = 0;
    let linePercentage;

    files.map((file) => file.replace(/\r\n/g, "\n"));

    for(const file of files) {
        const index = files.indexOf(file);

        for(const line of file.split("\n")) {
            if (files[index + 1]?.split("\n").includes(line)) {
                lineSimilarity++;
            }
        }
    }

    for (const file of files) {
        totalLines += file.split("\n").length;
    }

    linePercentage = (lineSimilarity / totalLines) * 100;
    return `${linePercentage.toFixed(2)}%`;
};