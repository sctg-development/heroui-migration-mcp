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
import { splitPages } from "./page-utils.js";
import { resolveAlias } from "../knowledge/aliases.js";

interface RawComponentEntry {
    file: string;
    source?: string;
}

export interface ComponentIndexEntry {
    name: string;
    slug: string;
    category?: string;
    source?: string;
    docPath?: string;
    aliases?: string[];
    excerpt?: string;
}

export async function buildComponentIndex(
    version: "v2" | "v3",
    outputDir?: string
): Promise<ComponentIndexEntry[]> {
    const projectRoot = process.cwd();
    const generatedDir = path.join(projectRoot, "data", "generated");
    const indexPath = path.join(generatedDir, `heroui-${version}-index.json`);
    const txtPath = path.join(generatedDir, `heroui-${version}-llms-components.txt`);

    if (!(await exists(indexPath))) {
        throw new Error(`index file not found: ${indexPath}`);
    }
    if (!(await exists(txtPath))) {
        throw new Error(`text components file not found: ${txtPath}`);
    }

    const rawIdx = JSON.parse(await fs.readFile(indexPath, "utf8"));
    const rawComponents: RawComponentEntry[] = rawIdx.components || [];

    const text = await fs.readFile(txtPath, "utf8");
    const pages = splitPages(text);

    const entries: ComponentIndexEntry[] = rawComponents.map((item) => {
        const slug = path.basename(item.file, ".mdx");
        const name = slug
            .split(/[-_]/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");

        let excerpt: string | undefined;
        let docPath: string | undefined;
        const page = pages.find((p) => p.url.toLowerCase().endsWith(`/${slug}`));
        if (page) {
            docPath = page.url;
            const lines = page.content.split("\n");
            for (const line of lines) {
                const t = line.trim();
                if (t && !t.startsWith("#")) {
                    excerpt = t;
                    break;
                }
            }
        }

        // extract category from excerpt if present
        let category: string | undefined;
        if (excerpt) {
            const m = excerpt.match(/\*\*Category\*\*:\s*([^\n]+)/i);
            if (m) {
                category = m[1].trim();
            }
        }

        // compute aliases using resolver
        let aliases: string[] | undefined;
        const r1 = resolveAlias(slug);
        aliases = [];
        if (r1.canonical && r1.canonical.toLowerCase() !== slug.toLowerCase()) {
            aliases.push(r1.canonical);
        }
        const r2 = resolveAlias(name);
        if (r2.canonical && r2.canonical.toLowerCase() !== name.toLowerCase() && (!aliases || !aliases.includes(r2.canonical))) {
            aliases.push(r2.canonical);
        }
        if (aliases.length === 0) aliases = undefined;

        return {
            name,
            slug,
            category,
            source: item.source,
            docPath,
            excerpt,
            aliases,
        };
    });

    const outDir = outputDir || path.join(projectRoot, "data", "index");
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `components.${version}.json`);
    await fs.writeFile(outPath, JSON.stringify(entries, null, 2), "utf8");

    return entries;
}

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}
