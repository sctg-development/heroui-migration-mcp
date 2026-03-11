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
import { describe, it, expect } from 'vitest';
import { resolveAlias } from './aliases.js';

describe('aliases resolver', () => {
    it('normalizes lower-case and casing differences', () => {
        expect(resolveAlias('listbox').canonical).toBe('ListBox');
        expect(resolveAlias('Listbox').canonical).toBe('ListBox');
        expect(resolveAlias('ListBox').canonical).toBe('ListBox');
    });

    it('handles known renames', () => {
        expect(resolveAlias('cardbody').canonical).toBe('Card.Content');
        expect(resolveAlias('modalheader').canonical).toBe('Modal.Heading');
    });

    it('returns same name when unknown but already pascal', () => {
        const r = resolveAlias('Button');
        expect(r.canonical).toBe('Button');
        expect(r.confidence).toBe(1);
    });

    it('guesses PascalCase for snake/ kebab', () => {
        const r = resolveAlias('date-input');
        expect(r.canonical).toBe('DateInput');
        expect(r.confidence).toBe(0.8);
    });
});
