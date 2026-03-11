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

// src/core/migration.ts
import { KNOWN_V2_IMPORTS, KNOWN_V2_PROPS } from "../knowledge/mappings.js";

// kept for backwards compatibility; newer callers may use TransformCodeResult
export type TransformationResult = TransformCodeResult;

// results types loaded from shared contracts
import type { AnalyzeFileResult, RewriteFileResult, ComponentComparisonResult } from "../types/contracts.js";
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

// AST helpers used by analyzeFile
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

/**
 * transformCode: Core function to transform v2 code to v3 patterns.
 */
import { applyAstTransforms } from "./ast.js";
import { getTransformationCategory } from "./categories.js";

export interface TransformCodeResult {
  migratedCode: string;
  warnings: string[];
  astEdits: Array<{ type: string; description: string; confidence: number }>;
}

export function transformCode(code: string): TransformCodeResult {
  let migrated = code;
  const warnings: string[] = [];
  const astEdits: Array<{ type: string; description: string; confidence: number }> = [];

  // 0. AST-based transforms run first; they return rewritten code plus any
  // warnings they detect. We pass the KNOWN_V2_IMPORTS map so the helper can
  // derive safe renames.
  try {
    const astResult = applyAstTransforms(migrated, KNOWN_V2_IMPORTS);
    migrated = astResult.code;
    warnings.push(...astResult.warnings);
    // keep the edit objects for later use
    astEdits.push(...astResult.edits);
  } catch (err) {
    // if AST layer fails for some reason we still continue with regex
    warnings.push(`AST transform error: ${(err as Error).message}`);
  }

  // 1. Basic import rewriting
  migrated = migrated.replace(/@nextui-org\/react/g, "@heroui/react");

  // 2. Component transformations (standalone -> compound)
  const sortedKeys = Object.keys(KNOWN_V2_IMPORTS).sort((a, b) => b.length - a.length);

  for (const legacy of sortedKeys) {
    const suggestion = KNOWN_V2_IMPORTS[legacy];
    const category = getTransformationCategory(legacy);
    if (category !== 'safe_rename') {
      warnings.push(`⚠️  Transformation for '${legacy}' is classified as '${category}'. Review manually.`);
    }
    if (suggestion.includes("use ") && suggestion.includes(" inside ")) {
      const match = suggestion.match(/use ([\w.]+) inside (\w+)/);
      if (match) {
        const compound = match[1];
        const openTagRegex = new RegExp(`(<)${legacy}(\\b|\\s|>)`, "g");
        const closeTagRegex = new RegExp(`(</)${legacy}(>)`, "g");

        migrated = migrated.replace(openTagRegex, `$1${compound}$2`);
        migrated = migrated.replace(closeTagRegex, `$1${compound}$2`);
      }
    }
  }

  // 3. Prop transformations
  for (const entry of KNOWN_V2_PROPS) {
    const { prop, replacement, removed, components, note } = entry;
    // check category on prop name as well
    const propCategory = getTransformationCategory(prop);
    if (propCategory !== 'safe_rename') {
      warnings.push(`⚠️  Prop '${prop}' transformation classified '${propCategory}'. ${note}`);
    }
    if (removed || !replacement) {
      const removedRegex = new RegExp(`(\\s${prop}=)`, "g");
      if (migrated.match(removedRegex)) {
        warnings.push(`⚠️  Prop '${prop}' was removed in v3. ${note}`);
      }
      continue;
    }
    if (!components) {
      migrated = migrated.replace(new RegExp(`(\\s)${prop}=`, "g"), `$1${replacement}=`);
    } else {
      for (const comp of components) {
        if (migrated.includes(`<${comp}`) || migrated.includes(`<${comp}.`)) {
          migrated = migrated.replace(new RegExp(`(<${comp}[^>]*\\s)${prop}=`, "g"), `$1${replacement}=`);
        }
      }
    }
  }

  // 4. Handle Navbar explicitly
  if (migrated.includes("Navbar")) {
    migrated = migrated.replace(/^(import .*Navbar.* from .*$)/m, "$1\n// TODO: HeroUI v3 does not have a Navbar component yet. Consider using primitives or a custom implementation.");
  }

  // 5. Handle ModalContent
  if (migrated.includes("ModalContent")) {
    migrated = migrated.replace(/<ModalContent[^>]*>/g, "");
    migrated = migrated.replace(/<\/ModalContent>/g, "");
    // Improved import cleanup: 
    // 1. handle case: { ModalContent, ModalBody } -> { ModalBody }
    migrated = migrated.replace(/ModalContent\s*,\s*/g, "");
    // 2. handle case: { Modal, ModalContent } -> { Modal }
    migrated = migrated.replace(/,\s*ModalContent/g, "");
    // 3. handle case: { ModalContent } -> { } (rare but possible)
    migrated = migrated.replace(/ModalContent/g, "");

    // 4. clean up potentially messy braces
    migrated = migrated.replace(/\{\s*,/g, "{");
    migrated = migrated.replace(/,\s*\}/g, "}");
  }

  // 6. Handle Hook Changes
  if (migrated.includes("useDisclosure")) {
    warnings.push(`⚠️  Hook 'useDisclosure' is replaced by 'useOverlayState' or primitive component hooks (e.g. useDialog, usePopover) in v3.`);
    migrated = migrated.replace(/useDisclosure/g, "useOverlayState");
  }

  if (migrated.includes("usePagination")) {
    warnings.push(`⚠️  Hook 'usePagination' has been removed in v3. Use state management and the compound <Pagination> component.`);
  }

  return { migratedCode: migrated, warnings, astEdits };
}

// --- new helpers -------------------------------------------------------------

export async function scanProject(directory: string, options: { force?: boolean } = {}) {
  const { force = false } = options;
  const patterns = ["**/*.{ts,tsx,js,jsx}"];
  const files = await fg(patterns, {
    cwd: directory,
    absolute: true,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.next/**"]
  });

  const report: { file: string, components: string[]; priority?: string }[] = [];
  const v2Keys = Object.keys(KNOWN_V2_IMPORTS);
  const joint = v2Keys.map(k => k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join("|");
  const quick = new RegExp(joint);

  // simple cache stored at repo root
  const cacheFile = path.join(process.cwd(), '.scan-cache.json');
  let cache: Record<string, { mtime: number; components: string[] }> = {};
  if (!force) {
    try { cache = JSON.parse(await fs.readFile(cacheFile, 'utf8')); } catch { };
  }

  for (const file of files) {
    const rel = path.relative(directory, file);
    const stat = await fs.stat(file);
    const m = stat.mtimeMs;

    if (!force && cache[rel] && cache[rel].mtime === m) {
      if (cache[rel].components.length) {
        report.push({ file: rel, components: cache[rel].components });
      }
      continue;
    }

    const content = await fs.readFile(file, "utf8");
    if (!quick.test(content)) {
      cache[rel] = { mtime: m, components: [] };
      continue;
    }
    const found: string[] = [];
    for (const key of v2Keys) {
      if (content.includes(key)) {
        found.push(key);
      }
    }
    if (found.length > 0) {
      // assign priority: P0 if any component is structural or manual-only
      const pri = found.some(key => {
        const cat = getTransformationCategory(key);
        if (cat !== 'safe_rename') return true;
        const suggestion = KNOWN_V2_IMPORTS[key] || '';
        if (suggestion.includes('legacy') || suggestion.startsWith('NOT IN')) return true;
        return false;
      }) ? 'P0' : 'P1';
      report.push({ file: rel, components: found, priority: pri });
    }
    cache[rel] = { mtime: m, components: found };
  }

  try {
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
  } catch { /* ignore */ }

  return {
    content: [],
    structuredContent: { report, totalFiles: files.length, affectedFiles: report.length }
  };
}

export async function analyzeFile(code: string, filename?: string): Promise<AnalyzeFileResult> {
  const findings: any[] = [];
  const manualSteps: string[] = [];

  // run compatibility helpers first (imports/hooks/props that weren't captured by AST)
  const issues = checkV3Compatibility(code);
  for (const msg of issues) {
    findings.push({ type: "doc", severity: "warning", message: msg, autoFixable: false, confidence: 0.5 });
  }

  // tailwind plugin check
  const tw = analyzeTailwindConfig(code);
  for (const iss of tw.issues) {
    findings.push({ type: "tailwind", severity: "warning", message: iss, autoFixable: false, confidence: 0.6 });
  }

  // AST-based scanning for more precise locations and types
  try {
    const ast = parse(code, { sourceType: "module", plugins: ["jsx", "typescript"], locations: true });
    traverse(ast, {
      ImportDeclaration(path: any) {
        const src = path.node.source.value;
        if (src.includes("@nextui-org/react")) {
          const loc = path.node.loc?.start;
          findings.push({
            type: "import",
            severity: "warning",
            message: `Legacy import source ${src}`,
            autoFixable: true,
            confidence: 0.8,
            location: loc ? { line: loc.line, column: loc.column } : undefined,
          });
        }
        path.node.specifiers.forEach((spec: any) => {
          if (t.isImportSpecifier(spec)) {
            const name = spec.imported.name;
            if (KNOWN_V2_IMPORTS[name]) {
              const loc = spec.loc?.start;
              findings.push({
                type: "import",
                severity: "info",
                message: `Legacy component import ${name}`,
                component: name,
                autoFixable: true,
                confidence: 0.7,
                location: loc ? { line: loc.line, column: loc.column } : undefined,
              });
            }
          }
        });
      },
      JSXOpeningElement(path: any) {
        const nameNode = path.node.name;
        if (t.isJSXIdentifier(nameNode)) {
          const name = nameNode.name;
          if (KNOWN_V2_IMPORTS[name]) {
            const loc = nameNode.loc?.start;
            findings.push({
              type: "component",
              severity: "warning",
              message: `Legacy JSX tag <${name}>`,
              component: name,
              autoFixable: false,
              confidence: 0.6,
              location: loc ? { line: loc.line, column: loc.column } : undefined,
            });
          }
        }
        // props
        path.node.attributes.forEach((attr: any) => {
          if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
            const prop = attr.name.name;
            if (["classNames", "motionProps", "disableAnimation"].includes(prop)) {
              const loc = attr.loc?.start;
              findings.push({
                type: "prop",
                severity: "warning",
                message: `Structural prop '${prop}' detected`,
                autoFixable: false,
                confidence: 0.5,
                location: loc ? { line: loc.line, column: loc.column } : undefined,
              });
            }
            if (prop === "color") {
              // check if the element is Button
              const opening = path.node;
              const tag = opening.name;
              if (t.isJSXIdentifier(tag) && tag.name === "Button") {
                const loc = attr.loc?.start;
                findings.push({
                  type: "prop",
                  severity: "info",
                  message: "Button.color prop should become variant",
                  autoFixable: true,
                  confidence: 0.6,
                  location: loc ? { line: loc.line, column: loc.column } : undefined,
                });
              }
            }
          }
        });
      },
      Identifier(path: any) {
        if (path.node.name === "useDisclosure" || path.node.name === "usePagination") {
          const parent = path.parent;
          if (t.isCallExpression(parent) && parent.callee === path.node) {
            const loc = path.node.loc?.start;
            findings.push({
              type: "hook",
              severity: "warning",
              message: `Legacy hook '${path.node.name}' detected`,
              symbol: path.node.name,
              autoFixable: path.node.name === "useDisclosure",
              confidence: 0.7,
              location: loc ? { line: loc.line, column: loc.column } : undefined,
            });
            if (path.node.name === "useDisclosure") {
              manualSteps.push("Replace useDisclosure with useOverlayState or primitive hook");
            }
            if (path.node.name === "usePagination") {
              manualSteps.push("Reimplement pagination logic; use <Pagination> component");
            }
          }
        }
      }
    });
  } catch (err) {
    // parsing error already reported above via checkV3Compatibility perhaps
  }

  const autoFixableCount = findings.filter(f => f.autoFixable).length;
  return {
    summary: `Detected ${findings.length} issues`,
    findings,
    manualSteps,
    autoFixableCount,
    confidence: 0.5,
  };
}

export function rewriteFile(code: string): RewriteFileResult {
  const { migratedCode, warnings, astEdits } = transformCode(code);
  // convert warning strings into generic edits
  const warningEdits = warnings.map((w) => ({ type: "warning", description: w, confidence: 0.5 }));
  return {
    rewrittenCode: migratedCode,
    edits: [...astEdits, ...warningEdits],
    warnings,
    manualReviewRequired: warnings.length > 0,
    confidence: 0.5,
  };
}

export async function compareComponent(component: string): Promise<ComponentComparisonResult> {
  const root = process.cwd();
  const idx2 = path.join(root, "data", "index", "components.v2.json");
  const idx3 = path.join(root, "data", "index", "components.v3.json");
  let list2: any[] = [];
  let list3: any[] = [];
  try { list2 = JSON.parse(await fs.readFile(idx2, 'utf8')); } catch { }
  try { list3 = JSON.parse(await fs.readFile(idx3, 'utf8')); } catch { }

  // normalize helper removes hyphen/underscore and lowercases
  const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, '');
  const targetNorm = normalize(component);

  const find = (list: any[]) =>
    list.find((e) => {
      if (normalize(e.slug) === targetNorm) return true;
      if (e.aliases && e.aliases.some((a: string) => normalize(a) === targetNorm)) return true;
      return false;
    });

  const e2 = find(list2);
  const e3 = find(list3);
  const exists2 = !!e2;
  const exists3 = !!e3;

  // build alias list using resolver if available
  let aliases: string[] = [];
  try {
    const { resolveAlias } = await import("../knowledge/aliases.js");
    const res = resolveAlias(component);
    if (res.alias) aliases.push(res.alias);
    if (res.canonical && res.canonical !== component) aliases.push(res.canonical);
  } catch { }

  // determine status
  let status: ComponentComparisonResult['status'];
  if (exists2 && exists3) {
    if (normalize(e2.slug) === normalize(e3.slug)) {
      status = 'same';
    } else {
      status = 'renamed';
    }
  } else if (exists2 && !exists3) {
    status = 'removed';
  } else if (!exists2 && exists3) {
    status = 'unknown';
  } else {
    status = 'unknown';
  }

  const breakingChanges: string[] = [];
  if (KNOWN_V2_IMPORTS[component]) {
    breakingChanges.push(KNOWN_V2_IMPORTS[component]);
  }

  // subcomponent mappings: any map entry starting with component name (case-insensitive) but not equal
  const subcomponentMappings: Array<{ legacy: string; replacement: string; note?: string }> = [];
  for (const [key, val] of Object.entries(KNOWN_V2_IMPORTS)) {
    if (key.toLowerCase().startsWith(component.toLowerCase()) && key.toLowerCase() !== component.toLowerCase()) {
      subcomponentMappings.push({ legacy: key, replacement: val, note: val });
    }
  }

  // prop changes relevant to this component
  const propChanges: Array<{ prop: string; replacement?: string; removed?: boolean; note: string }> = [];
  for (const p of KNOWN_V2_PROPS) {
    if (!p.components || p.components.some((c) => normalize(c) === targetNorm)) {
      propChanges.push({ prop: p.prop, replacement: p.replacement, removed: p.removed, note: p.note });
    }
  }

  // if component had subcomponent mappings but no v3 entry, it may have been
  // folded into a compound API rather than simply removed. We mark as
  // `compound` only if none of the mappings are just "NOT IN v3" notes.
  if (status === 'removed' && subcomponentMappings.length > 0) {
    const onlyNotIn = subcomponentMappings.every(m => /NOT IN v3/i.test(m.note || ''));
    if (!onlyNotIn) {
      status = 'compound';
    }
  }

  return {
    component,
    aliases,
    existsInV2: exists2,
    existsInV3: exists3,
    status,
    breakingChanges,
    subcomponentMappings,
    propChanges,
    sources: [e2?.source || '', e3?.source || ''].filter(Boolean),
  };
}

/**
 * analyzeTailwindConfig: Detect legacy patterns in Tailwind configuration.
 */
export function analyzeTailwindConfig(code: string): { issues: string[], suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (code.includes("@heroui/theme") || code.includes("@nextui-org/theme")) {
    issues.push("Legacy '@heroui/theme' or '@nextui-org/theme' detected.");
    suggestions.push("In v3, these are replaced by @import '@heroui/styles' in your global CSS.");
  }

  if (code.includes("heroui(") || code.includes("nextui(")) {
    issues.push("Tailwind plugin 'heroui()' or 'nextui()' detected.");
    suggestions.push("Remove the plugin from tailwind.config.js. v3 uses pure CSS imports.");
  }

  if (code.includes("node_modules/@heroui/theme") || code.includes("node_modules/@nextui-org/theme")) {
    issues.push("Legacy HeroUI content path in tailwind.config.js.");
    suggestions.push("Remove the node_modules content path. v3 does not require it.");
  }

  return { issues, suggestions };
}

/**
 * checkV3Compatibility: Heuristic check for v3 compliance.
 */
export function checkV3Compatibility(code: string): string[] {
  const issues: string[] = [];

  if (code.includes("@nextui-org/")) {
    issues.push("Still contains NextUI imports (@nextui-org/). Should be @heroui/.");
  }

  if (code.includes("ModalContent")) {
    issues.push("Uses 'ModalContent' which is removed in v3.");
  }

  for (const [legacy, suggestion] of Object.entries(KNOWN_V2_IMPORTS)) {
    if (suggestion.includes("use ") && code.includes(`<${legacy}`)) {
      issues.push(`Uses standalone component '<${legacy}'. Should likely be ${suggestion.split(" ")[1]}.`);
    }
  }

  if (code.includes("useDisclosure")) {
    issues.push("Legacy hook 'useDisclosure' detected. Use 'useOverlayState' or specific component hooks (like 'useDialog') in v3.");
  }
  if (code.includes("usePagination")) {
    issues.push("Legacy hook 'usePagination' detected. It has been removed in v3.");
  }
  if (code.includes("classNames=")) {
    issues.push("Prop 'classNames' detected; v3 uses className string & CSS instead of object.");
  }
  if (code.includes("motionProps")) {
    issues.push("Prop 'motionProps' detected; animations are CSS-based in v3.");
  }
  if (code.includes("disableAnimation")) {
    issues.push("Prop 'disableAnimation' detected; use theme or CSS prefers-reduced-motion.");
  }
  return issues;
}
