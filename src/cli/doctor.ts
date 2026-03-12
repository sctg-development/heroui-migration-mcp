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

const PROJECT_ROOT = process.cwd();
const GENERATED_DIR = path.join(PROJECT_ROOT, "data", "generated");

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

async function readJson(p: string): Promise<any> {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
}

export async function doctor() {
    console.log("Heroui corpus doctor\n");
    const versions = ["v2", "v3"];
    let allOk = true;

    for (const v of versions) {
        const idxFile = path.join(GENERATED_DIR, `heroui-${v}-index.json`);
        if (!(await exists(idxFile))) {
            console.warn(`⚠️  index.json for ${v} missing (${idxFile})`);
            allOk = false;
            continue;
        }

        try {
            const idx = await readJson(idxFile);
            console.log(`-- ${v.toUpperCase()} corpus --`);
            console.log(`  generatedAt: ${idx.generatedAt || "<unknown>"}`);
            // if index includes an "outputs" summary, trust it; otherwise compute
            const outs: Record<string, { pages?: number; bytes?: number }> = idx.outputs || {};
            if (Object.keys(outs).length === 0) {
                // fallback: inspect files directly
                const candidate = [`heroui-${v}-llms-components.txt`, `heroui-${v}-llms-full.txt`];
                for (const fname of candidate) {
                    const p = path.join(GENERATED_DIR, fname);
                    try {
                        const txt = await fs.readFile(p, 'utf8');
                        const pages = (txt.match(/<page\s+url=/g) || []).length;
                        const bytes = Buffer.byteLength(txt, 'utf8');
                        outs[fname.replace(/\.txt$/, '')] = { pages, bytes };
                    } catch {
                        // ignore missing
                    }
                }
            }
            for (const name of Object.keys(outs)) {
                const o = outs[name];
                console.log(`  ${name}: ${o.pages ?? "?"} pages, ${o.bytes ?? "?"} bytes`);
            }
            console.log("");
        } catch (err) {
            console.error(`Failed to parse ${idxFile}:`, err);
            allOk = false;
        }
    }

    // check for known artifacts as fallback
    const expected = [
        "heroui-v2-llms-components.txt",
        "heroui-v2-llms-full.txt",
        "heroui-v3-llms-components.txt",
        "heroui-v3-llms-full.txt",
    ];
    for (const name of expected) {
        const p = path.join(GENERATED_DIR, name);
        if (!(await exists(p))) {
            console.warn(`⚠️  missing expected file: ${name}`);
            allOk = false;
        }
    }

    if (allOk) {
        console.log("Corpus appears healthy.");
    } else {
        console.log("Some issues detected, please re-run build-corpus or inspect output.");
    }
}

// run doctor when invoked directly (ESM-friendly)
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
    doctor().catch((err) => {
        console.error("Doctor error:", err);
        process.exit(1);
    });
}
