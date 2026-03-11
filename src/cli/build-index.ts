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
import { buildComponentIndex } from "../indexers/build-component-index.js";

interface Options {
    version: "v2" | "v3" | "all";
    output?: string;
}

function parseArgs(): Options {
    const opts: Options = { version: "all" };
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case "--version":
                opts.version = (args[++i] as any) || opts.version;
                break;
            case "--output":
                opts.output = args[++i];
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
    if (!(["v2", "v3", "all"].includes(opts.version))) {
        console.error("--version must be one of v2,v3,all");
        process.exit(1);
    }
    return opts;
}

function printHelp() {
    console.log(`
Usage: build-index [options]

Options:
  --version <v2|v3|all>   which version(s) to index (default all)
  --output <dir>          directory where index files will be written (default data/index)
  -h, --help              show help
`);
}

async function main() {
    const opts = parseArgs();
    if (opts.version === "v2" || opts.version === "all") {
        console.log("Building component index for v2...");
        await buildComponentIndex("v2", opts.output);
    }
    if (opts.version === "v3" || opts.version === "all") {
        console.log("Building component index for v3...");
        await buildComponentIndex("v3", opts.output);
    }
    console.log("Index build complete.");
}

main().catch((err) => {
    console.error("Error building index:", err);
    process.exit(1);
});
