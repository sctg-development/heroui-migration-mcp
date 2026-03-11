/**
 * Copyright (c) 2026 Ronan LE MEILLAT - SCTG Development
 * License: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import path from "node:path";
import { getHerouiDocs } from "../get-heroui-docs.js";

interface Options {
    version: "v2" | "v3" | "all";
    noGit: boolean;
    full: boolean;
    output: string;
}

function parseArgs(): Options {
    const opts: Options = {
        version: "all",
        noGit: false,
        full: true,
        output: path.join(process.cwd(), "data", "generated"),
    };

    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case "--version":
                opts.version = (args[++i] as any) || opts.version;
                break;
            case "--no-git":
                opts.noGit = true;
                break;
            case "--output":
                opts.output = args[++i] || opts.output;
                break;
            case "--no-full":
                opts.full = false;
                break;
            case "-h":
            case "--help":
                printHelp();
                process.exit(0);
            default:
                console.error(`Unknown argument: ${arg}`);
                printHelp();
                process.exit(1);
        }
    }

    if (!["v2", "v3", "all"].includes(opts.version)) {
        console.error(`--version must be one of v2,v3,all`);
        process.exit(1);
    }

    return opts;
}

function printHelp(): void {
    console.log(`
Usage: build-corpus [options]

Options:
  --version <v2|v3|all>  which docs to build (default all)
  --no-git               skip cloning/updating repo
  --output <dir>         output directory (default data/generated)
  --no-full              only generate the "components" output, not full text
  -h, --help             show this message
`);
}

async function main() {
    const opts = parseArgs();

    if (opts.version === "v2" || opts.version === "all") {
        console.log("Generating v2 corpus...");
        await getHerouiDocs("v2", opts.full, opts.noGit, opts.output);
    }
    if (opts.version === "v3" || opts.version === "all") {
        console.log("Generating v3 corpus...");
        await getHerouiDocs("v3", opts.full, opts.noGit, opts.output);
    }

    console.log("Corpus generation complete.");
}

// run the CLI when the script is executed
main().catch((err) => {
    console.error("Error building corpus:", err);
    process.exit(1);
});
