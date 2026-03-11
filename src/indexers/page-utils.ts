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
// utilities for splitting and querying documentation pages produced by the
// corpus generator.  Each page in the text export is wrapped inside a
// `<page url="..."> ... </page>` block, which we can parse efficiently.

/**
 * Return an array of parsed pages from a raw exported text file.
 *
 * Each element has:
 *   - url: the value of the `url` attribute on the <page> tag
 *   - content: the inner text of that page (excluding the closing tag)
 */
export function splitPages(raw: string): Array<{ url: string; content: string }> {
    const result: Array<{ url: string; content: string }> = [];
    const regex = /<page\s+url="([^"]+)"[^>]*>([\s\S]*?)<\/page>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw))) {
        result.push({ url: match[1], content: match[2] });
    }
    return result;
}

/**
 * Find the first page whose url or content looks like it corresponds to the
 * given component name.  Matching is case-insensitive and attempts to handle
 * both `/docs/components/foo` and `/docs/react/components/foo` patterns.
 */
export function findPageForComponent(
    name: string,
    pages: Array<{ url: string; content: string }>
): { url: string; content: string } | null {
    const lower = name.toLowerCase();
    for (const p of pages) {
        const lurl = p.url.toLowerCase();
        if (lurl.endsWith(`/${lower}`) || lurl.includes(`/${lower}/`)) {
            return p;
        }
        // fallback: does the content contain a level‑1 heading with the name?
        if (p.content.toLowerCase().includes(`# ${lower}`)) {
            return p;
        }
    }
    return null;
}
