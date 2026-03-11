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

import fs from "node:fs/promises";
import path from "node:path";
import { analyzeTailwindConfig } from "../core/migration.js";

interface Options {
    file?: string;
    code?: string;
}

function parseArgs(): Options {
    const opts: Options = {};
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case "--file":
                opts.file = args[++i];
                break;
            case "--code":
                opts.code = args[++i];
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
    if (!opts.file && !opts.code) {
        console.error("either --file or --code must be provided");
        printHelp();
        process.exit(1);
    }
    return opts;
}

function printHelp() {
    console.log(`
Usage: audit-tailwind [options]

Options:
  --file <path>    path to a tailwind config file to audit
  --code <string>  raw code to analyze (e.g. from stdin)
  -h, --help        show this message
`);
}

async function main() {
    const opts = parseArgs();
    let code = opts.code || "";
    if (opts.file) {
        code = await fs.readFile(path.resolve(opts.file), "utf8");
    }
    const { issues, suggestions } = analyzeTailwindConfig(code);
    const out = { issues, suggestions };
    console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
    console.error("Error in audit-tailwind:", err);
    process.exit(1);
});
