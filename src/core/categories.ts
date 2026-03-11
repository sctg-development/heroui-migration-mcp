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
export type TransformationCategory = 'safe_rename' | 'structural_change' | 'manual_only';

// Override table for mappings that require special classification.  Most
// entries fall under 'safe_rename' because they are simple import/tag
// substitutions or prop renames.  We can expand this as the AST layer
// and documentation deepens.
const CATEGORY_OVERRIDES: Record<string, TransformationCategory> = {
    Navbar: 'manual_only',
    ModalContent: 'structural_change',
    // hooks
    useDisclosure: 'manual_only',
    usePagination: 'manual_only',
    // props / utilities
    classNames: 'structural_change',
    motionProps: 'structural_change',
    disableAnimation: 'structural_change',
};

export function getTransformationCategory(name: string): TransformationCategory {
    return CATEGORY_OVERRIDES[name] || 'safe_rename';
}
