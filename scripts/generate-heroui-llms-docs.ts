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

import { getHerouiDocs } from "../src/get-heroui-docs.js";
import path from "node:path";

// simple CLI wrapper around shared function
async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const args = new Set(rawArgs);

  if (args.has("--help") || args.has("-h")) {
    console.log(`Usage: tsx scripts/generate-heroui-llms-docs.ts [options]

Options:
  --version <v2|v3>    select repository branch (default: v2)
  --full               include full docs output (always true by default)
  --no-git             skip git operations (use existing cache)
  --output <path>      override output directory (default: data/generated)
  --help, -h           show this help message
`);
    process.exit(0);
  }

  const versionIndex = rawArgs.findIndex((a) => a === "--version");
  const version =
    versionIndex !== -1 && rawArgs.length > versionIndex + 1
      ? rawArgs[versionIndex + 1]
      : "v2";

  const full = args.has("--full");
  const noGit = args.has("--no-git");
  const outputIndex = rawArgs.findIndex((a) => a === "--output");
  const outputPath =
    outputIndex !== -1 && rawArgs.length > outputIndex + 1
      ? rawArgs[outputIndex + 1]
      : path.join(process.cwd(), "data", "generated");

  await getHerouiDocs(version, full, noGit, outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

