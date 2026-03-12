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
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
// import { getHerouiDocs } from "./get-heroui-docs.js"; // used by CLI commands later
import fs from "node:fs/promises";
import path from "node:path";

// __dirname equivalent in ES modules
// use working directory for path resolution so CLI and runtime agree
const PROJECT_ROOT = process.cwd();
const GENERATED_DIR = path.join(PROJECT_ROOT, "data", "generated");

// utility to verify that a given version's artifacts exist.
// returns true if everything is present, false otherwise.
// note: this function intentionally does NOT create or download anything;
// generation is handled by the separate CLI command that will be added in
// Epic A2.
async function ensureVersionDocs(version: "v2" | "v3"): Promise<boolean> {
  const files =
    version === "v3"
      ? [
        `heroui-v3-llms-components.txt`,
        `heroui-v3-web-llms-full.txt`,
        `heroui-v3-native-llms-full.txt`,
        `heroui-v3-index.json`,
      ]
      : [
        `heroui-v2-llms-components.txt`,
        `heroui-v2-llms-full.txt`,
        `heroui-v2-index.json`,
      ];

  for (const name of files) {
    try {
      await fs.access(path.join(GENERATED_DIR, name));
    } catch {
      return false;
    }
  }

  return true;
}

async function main(): Promise<void> {
  // Runtime no longer generates or verifies corpus at startup.
  // Tools will return diagnostics if needed.
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("heroui-migration-mcp v0.3 started on stdio (corpus not validated)\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
