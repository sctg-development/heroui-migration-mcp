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

import { scanProject } from "../core/migration.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

interface Args {
    directory: string;
    force?: boolean;
}

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option("directory", {
            type: "string",
            describe: "Root directory to scan",
            demandOption: true,
        })
        .option("force", {
            type: "boolean",
            describe: "Ignore cache and re-scan all files",
            default: false,
        })
        .help()
        .parseAsync() as Args;

    const res = await scanProject(argv.directory, { force: argv.force });
    // validate with schema to catch any future contract regressions
    try {
        const { ScanProjectStructuredSchema } = await import("../types/schemas.js");
        ScanProjectStructuredSchema.parse(res.structuredContent);
    } catch (err) {
        console.error("scanProject output failed schema validation:", err);
        // fall through to printing anyway
    }
    console.log(JSON.stringify(res.structuredContent, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
