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
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

// Babel types packages don't ship their own typings, so we provide ambient
// declarations in src/types/babel.d.ts in order to keep the build green.

export interface AstTransformResult {
    code: string;
    warnings: string[];
    edits: Array<{ type: string; description: string; confidence: number }>;
}

/**
 * applyAstTransforms: run a small set of AST-based migrations before the
 * existing regex heuristics. The caller provides the KNOWN_V2_IMPORTS map so
 * we avoid any circular dependency with migration.ts.
 */
export function applyAstTransforms(
    inputCode: string,
    knownImports: Record<string, string>
): AstTransformResult {
    const warnings: string[] = [];
    const edits: Array<{ type: string; description: string; confidence: number }> = [];
    let ast;
    try {
        ast = parse(inputCode, {
            sourceType: "module",
            plugins: ["jsx", "typescript"]
        });
    } catch (err) {
        // parsing failed; return original code so the rest of the pipeline can
        // still run using regex fallbacks
        warnings.push(`AST parse error: ${(err as Error).message}`);
        return { code: inputCode, warnings, edits: [] };
    }

    traverse(ast, {
        ImportDeclaration(path: any) {
            const src = path.node.source.value;
            if (src === "@nextui-org/react") {
                path.node.source.value = "@heroui/react";
                const msg = "Rewrote import source @nextui-org/react → @heroui/react";
                warnings.push(msg);
                edits.push({ type: 'import', description: msg, confidence: 0.9 });
            }

            // collect existing top‑level names already imported from this package
            const existing: Set<string> = new Set(
                path.node.specifiers
                    .filter((s: any) => s.type === 'ImportSpecifier')
                    .map((s: any) => s.imported.name)
            );

            const newSpecs: any[] = [];
            const removedSpecs: any[] = [];

            path.node.specifiers.forEach((spec: any) => {
                if (t.isImportSpecifier(spec)) {
                    const name = (spec.imported as any).name;
                    const suggestion = knownImports[name];
                    if (
                        suggestion &&
                        suggestion.includes("use ") &&
                        suggestion.includes(" inside ")
                    ) {
                        const match = suggestion.match(/use\s+([\w.]+)\s+inside\s+(\w+)/);
                        if (match) {
                            const compound = match[1];
                            const root = compound.split(".")[0];
                            if (root && root !== name) {
                                if (!existing.has(root)) {
                                    newSpecs.push(t.importSpecifier(t.identifier(root), t.identifier(root)));
                                    existing.add(root);
                                }
                                removedSpecs.push(spec);
                                const msg = `Rewrote import '{ ${name} }' to '{ ${root} }' for compound migration`;
                                warnings.push(msg);
                                edits.push({ type: 'import', description: msg, confidence: 0.8 });
                            }
                        }
                    }
                }
            });

            if (removedSpecs.length) {
                path.node.specifiers = path.node.specifiers.filter((s: any) => !removedSpecs.includes(s as any));
                path.node.specifiers.push(...newSpecs);
            }
        },
        JSXOpeningElement(path: any) {
            const nameNode = path.node.name;
            if (t.isJSXIdentifier(nameNode)) {
                const legacy = nameNode.name;
                const suggestion = knownImports[legacy];
                if (
                    suggestion &&
                    suggestion.includes("use ") &&
                    suggestion.includes(" inside ")
                ) {
                    const match = suggestion.match(/use\s+([\w.]+)\s+inside\s+(\w+)/);
                    if (match) {
                        const compound = match[1];
                        if (compound.includes(".")) {
                            const parts = compound.split(".");
                            path.node.name = t.jsxMemberExpression(
                                t.jsxIdentifier(parts[0]),
                                t.jsxIdentifier(parts[1])
                            );
                        } else {
                            path.node.name = t.jsxIdentifier(compound);
                        }
                    }
                }
            }
        },
        JSXClosingElement(path: any) {
            const nameNode = path.node.name;
            if (t.isJSXIdentifier(nameNode)) {
                const legacy = nameNode.name;
                const suggestion = knownImports[legacy];
                if (
                    suggestion &&
                    suggestion.includes("use ") &&
                    suggestion.includes(" inside ")
                ) {
                    const match = suggestion.match(/use\s+([\w.]+)\s+inside\s+(\w+)/);
                    if (match) {
                        const compound = match[1];
                        if (compound.includes(".")) {
                            const parts = compound.split(".");
                            path.node.name = t.jsxMemberExpression(
                                t.jsxIdentifier(parts[0]),
                                t.jsxIdentifier(parts[1])
                            );
                        } else {
                            path.node.name = t.jsxIdentifier(compound);
                        }
                    }
                }
            }
        },
        JSXAttribute(path: any) {
            // prop-level migrations and warnings
            if (t.isJSXIdentifier(path.node.name)) {
                const propName = path.node.name.name;

                // rename color→variant for Button elements
                const opening = path.findParent((p: any) => p.isJSXOpeningElement());
                const elementName = opening && t.isJSXIdentifier(opening.node.name)
                    ? opening.node.name.name
                    : null;

                if (propName === 'color' && elementName === 'Button') {
                    path.node.name.name = 'variant';
                    const msg = "Renamed prop 'color' to 'variant' on Button";
                    warnings.push(msg);
                    edits.push({ type: 'prop', description: msg, confidence: 0.9 });
                }

                // structural-change props: just warn rather than rename
                if (['classNames', 'motionProps', 'disableAnimation'].includes(propName)) {
                    const msg = `Prop '${propName}' requires manual review (structural change)`;
                    warnings.push(msg);
                    edits.push({ type: 'prop', description: msg, confidence: 0.5 });
                }
            }
        },
        Identifier(path: any) {
            // hook rename transformation
            if (path.node.name === 'useDisclosure') {
                // only rewrite when called as a function
                const parent = path.parent;
                if (t.isCallExpression(parent) && parent.callee === path.node) {
                    path.node.name = 'useOverlayState';
                    const msg = "Rewrote hook useDisclosure → useOverlayState";
                    warnings.push(msg);
                    edits.push({ type: 'hook', description: msg, confidence: 0.9 });
                }
            }
        },
        JSXElement(path: any) {
            // unwrap <ModalContent> when present
            const opening = path.node.openingElement;
            if (t.isJSXIdentifier(opening.name) && opening.name.name === 'ModalContent') {
                const msg = 'Removed <ModalContent> wrapper via AST';
                warnings.push(msg);
                edits.push({ type: 'jsx', description: msg, confidence: 0.9 });
                // replace element with its children directly
                const children = path.node.children || [];
                // filter out empty text nodes
                const realChildren = children.filter((c: any) => {
                    return !(t.isJSXText(c) && c.value.trim() === '');
                });
                if (realChildren.length) {
                    path.replaceWithMultiple(realChildren);
                } else {
                    path.remove();
                }
            }
        }
    });

    const output = generate(ast, { /* retain formatting defaults */ }, inputCode);
    return { code: output.code, warnings, edits };
}
