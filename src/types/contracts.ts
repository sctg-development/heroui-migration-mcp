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
// Shared JSON contracts used by MCP tools

export type Finding = {
    type: "import" | "component" | "prop" | "hook" | "tailwind" | "doc";
    severity: "info" | "warning" | "error";
    message: string;
    component?: string;
    symbol?: string;
    location?: {
        file?: string;
        line?: number;
        column?: number;
    };
    autoFixable: boolean;
    confidence: number;
};

export type AnalyzeFileResult = {
    summary: string;
    findings: Finding[];
    manualSteps: string[];
    autoFixableCount: number;
    confidence: number;
};

export type RewriteFileResult = {
    rewrittenCode: string;
    edits: Array<{
        type: string;
        description: string;
        confidence: number;
    }>;
    warnings: string[];
    manualReviewRequired: boolean;
    confidence: number;
};

export type ComponentComparisonResult = {
    component: string;
    aliases: string[];
    existsInV2: boolean;
    existsInV3: boolean;
    status: "same" | "renamed" | "compound" | "removed" | "unknown";
    breakingChanges: string[];
    subcomponentMappings: Array<{
        legacy: string;
        replacement: string;
        note?: string;
    }>;
    propChanges: Array<{
        prop: string;
        replacement?: string;
        removed?: boolean;
        note: string;
    }>;
    sources: string[];
};
