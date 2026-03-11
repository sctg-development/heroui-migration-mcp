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
import { z } from "zod";

export const LocationSchema = z.object({
    file: z.string().optional(),
    line: z.number().optional(),
    column: z.number().optional(),
});

export const FindingSchema = z.object({
    type: z.enum(["import", "component", "prop", "hook", "tailwind", "doc"]),
    severity: z.enum(["info", "warning", "error"]),
    message: z.string(),
    component: z.string().optional(),
    symbol: z.string().optional(),
    location: LocationSchema.optional(),
    autoFixable: z.boolean(),
    confidence: z.number(),
});

export const AnalyzeFileResultSchema = z.object({
    summary: z.string(),
    findings: z.array(FindingSchema),
    manualSteps: z.array(z.string()),
    autoFixableCount: z.number(),
    confidence: z.number(),
});

export const RewriteFileResultSchema = z.object({
    rewrittenCode: z.string(),
    edits: z.array(
        z.object({
            type: z.string(),
            description: z.string(),
            confidence: z.number(),
        })
    ),
    warnings: z.array(z.string()),
    manualReviewRequired: z.boolean(),
    confidence: z.number(),
});

export const ComponentComparisonResultSchema = z.object({
    component: z.string(),
    aliases: z.array(z.string()),
    existsInV2: z.boolean(),
    existsInV3: z.boolean(),
    status: z.enum(["same", "renamed", "compound", "removed", "unknown"]),
    breakingChanges: z.array(z.string()),
    subcomponentMappings: z.array(
        z.object({
            legacy: z.string(),
            replacement: z.string(),
            note: z.string().optional(),
        })
    ),
    propChanges: z.array(
        z.object({
            prop: z.string(),
            replacement: z.string().optional(),
            removed: z.boolean().optional(),
            note: z.string(),
        })
    ),
    sources: z.array(z.string()),
});

// minimal schema for scan_project result
export const ScanProjectResultSchema = z.object({
    report: z.array(
        z.object({
            file: z.string(),
            components: z.array(z.string()),
            priority: z.string().optional(),
        })
    ),
    totalFiles: z.number(),
    affectedFiles: z.number(),
});

export const ScanProjectStructuredSchema = z.object({
    report: ScanProjectResultSchema.shape.report,
    totalFiles: ScanProjectResultSchema.shape.totalFiles,
    affectedFiles: ScanProjectResultSchema.shape.affectedFiles,
});

// export zod types
export type AnalyzeFileResult = z.infer<typeof AnalyzeFileResultSchema>;
export type RewriteFileResult = z.infer<typeof RewriteFileResultSchema>;
export type ComponentComparisonResult = z.infer<typeof ComponentComparisonResultSchema>;
export type ScanProjectResult = z.infer<typeof ScanProjectResultSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type Location = z.infer<typeof LocationSchema>;
