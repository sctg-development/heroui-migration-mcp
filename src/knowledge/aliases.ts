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
// simple alias resolver to unify component names between v2 and v3
// the goal is to handle common casing differences and known renames.

interface ResolveResult {
    canonical: string;
    alias?: string;
    confidence: number; // 0..1
}

// map lowercase alias -> canonical name
const ALIASES: Record<string, string> = {
    // casing fixes
    "listbox": "ListBox",
    "listboxitem": "ListBox.Item",
    "listboxsection": "ListBox.Section",
    "dateinput": "DateField",
    "dateinputgroup": "DateField.Group",
    "dateinputinput": "DateField.Input",
    // v2->v3 renames or moves
    "cardbody": "Card.Content",
    "cardheader": "Card.Header",
    "modalheader": "Modal.Heading",
    "modalcontent": "", // removed entirely, caller should treat specially
    "navbar": "", // no v3 equivalent
};

export function resolveAlias(name: string): ResolveResult {
    const lower = name.toLowerCase();
    if (ALIASES.hasOwnProperty(lower)) {
        const canonical = ALIASES[lower];
        const confidence = canonical ? 1.0 : 0.5;
        return { canonical, alias: name, confidence };
    }
    // fallback: return name with proper casing if it looks like camelcase mismatch
    const pascal = name.replace(/(^\w|[-_]\w)/g, (m) => m.replace(/[-_]/, '').toUpperCase());
    if (pascal !== name) {
        return { canonical: pascal, confidence: 0.8 };
    }
    return { canonical: name, confidence: 1.0 };
}
