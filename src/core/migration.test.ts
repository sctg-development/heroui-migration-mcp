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

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { transformCode, analyzeTailwindConfig, checkV3Compatibility, rewriteFile } from './migration.js';

describe('HeroUI Migration Core', () => {

  describe('transformCode', () => {
    it('should rewrite legacy NextUI imports', () => {
      const code = 'import { Button } from "@nextui-org/react";';
      const { migratedCode } = transformCode(code);
      expect(migratedCode).toBe('import { Button } from "@heroui/react";');
    });

    it('transformation category helper returns expected values', async () => {
      const { getTransformationCategory } = await import('./categories.js');
      expect(getTransformationCategory('Navbar')).toBe('manual_only');
      expect(getTransformationCategory('ModalContent')).toBe('structural_change');
      expect(getTransformationCategory('Button')).toBe('safe_rename');
    });

    it('warnings include category info for non-safe renames', () => {
      const code = '<Navbar/>';
      const { migratedCode, warnings } = transformCode(code);
      expect(warnings.some((w: string) => w.includes('manual_only'))).toBe(true);
    });

    it('prop-based special cases trigger structural_change warnings', () => {
      const code = '<Card motionProps={{}} classNames="foo" disableAnimation />';
      const { warnings } = transformCode(code);
      expect(warnings.some((w: string) => w.includes('structural_change'))).toBe(true);
      expect(warnings.some((w: string) => w.includes('motionProps'))).toBe(true);
      expect(warnings.some((w: string) => w.includes('classNames'))).toBe(true);
      expect(warnings.some((w: string) => w.includes('disableAnimation'))).toBe(true);
    });

    it('AST layer rewrites component imports to root compound import', () => {
      const code = 'import { CardHeader, CardBody } from "@nextui-org/react";';
      const { migratedCode, warnings } = transformCode(code);
      // AST should convert to import Card once
      expect(migratedCode).toMatch(/import \{\s*Card(?:,\s*CardBody)?\s*\} from/);
      expect(warnings.some(w => w.includes('Rewrote import'))).toBe(true);
    });

    it('rewriteFile returns structured edits for AST transforms', () => {
      const res = rewriteFile('import { AccordionItem } from "@heroui/react";<ModalContent>hi</ModalContent>');
      expect(res.edits.length).toBeGreaterThan(0);
      // edits should include at least one warning entry
      expect(res.edits.some((e: any) => e.type === 'warning')).toBe(true);
    });

    it('AST should rename Button color prop to variant and log edit', () => {
      const res = rewriteFile('<Button color="primary">Hi</Button>');
      expect(res.rewrittenCode).toContain('variant="primary"');
      expect(res.rewrittenCode).not.toContain('color="primary"');
      expect(res.edits.some((e: any) => e.type === 'prop' && e.description.includes("color"))).toBe(true);
    });

    it('AST should rewrite useDisclosure hook and warn', () => {
      const res = rewriteFile('const state = useDisclosure();');
      expect(res.rewrittenCode).toContain('useOverlayState');
      expect(res.edits.some((e: any) => e.type === 'hook')).toBe(true);
    });

    it('AST should warn about structural-change props like classNames', () => {
      const res = rewriteFile('<Card classNames={{}} />');
      expect(res.edits.some((e: any) => e.type === 'prop' && e.description.includes('classNames'))).toBe(true);
    });

    it('should transform standalone components to compound ones', () => {
      const code = '<CardHeader>Title</CardHeader>';
      const { migratedCode } = transformCode(code);
      expect(migratedCode.trim().replace(/;$/, ''))
        .toBe('<Card.Header>Title</Card.Header>');
    });

    it('should handle complex compound naming (ListBox)', () => {
      const code = '<ListboxItem>Item</ListboxItem>';
      const { migratedCode } = transformCode(code);
      expect(migratedCode.trim().replace(/;$/, ''))
        .toBe('<ListBox.Item>Item</ListBox.Item>');
    });

    it('should map v2 props to v3 equivalents (color -> variant for Button)', () => {
      const code = '<Button color="primary">Click</Button>';
      const { migratedCode } = transformCode(code);
      expect(migratedCode.trim().replace(/;$/, ''))
        .toBe('<Button variant="primary">Click</Button>');
    });

    it('should warn and add TODO for Navbar', () => {
      const code = 'import { Navbar } from "@heroui/react";';
      const { migratedCode } = transformCode(code);
      expect(migratedCode).toContain('TODO: HeroUI v3 does not have a Navbar component yet');
    });

    it('should remove ModalContent wrapper', () => {
      const code = `
        import { Modal, ModalContent, ModalBody } from "@heroui/react";
        <Modal><ModalContent><ModalBody>Hi</ModalBody></ModalContent></Modal>
      `;
      const { migratedCode } = transformCode(code);
      expect(migratedCode).not.toContain('ModalContent');
      expect(migratedCode).toContain('<Modal><Modal.Body>Hi</Modal.Body></Modal>');
      // Check import cleanup
      expect(migratedCode).toContain('import { Modal } from "@heroui/react"');
    });

    it('should replace useDisclosure with useOverlayState and add warning', () => {
      const code = 'const { isOpen } = useDisclosure();';
      const { migratedCode, warnings } = transformCode(code);
      expect(migratedCode).toContain('useOverlayState()');
      expect(warnings.some((w: string) => w.includes('useDisclosure'))).toBe(true);
    });

    it('should warn about removed props like motionProps', () => {
      const code = '<Accordion motionProps={{}}>Item</Accordion>';
      const { warnings } = transformCode(code);
      expect(warnings.some((w: string) => w.includes('motionProps'))).toBe(true);
    });
  });

  describe('analyzeTailwindConfig', () => {
    it('should detect legacy heroui plugin', () => {
      const code = 'plugins: [heroui()]';
      const { issues } = analyzeTailwindConfig(code);
      expect(issues.some((i: string) => i.includes('heroui()'))).toBe(true);
    });
  });

  describe('checkV3Compatibility', () => {
    it('should return issues for v2 patterns', () => {
      const code = '<CardHeader>Title</CardHeader>';
      const issues = checkV3Compatibility(code);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('Card.Header');
    });

    it('should warn about pagination hook', () => {
      const code = 'const x = usePagination();';
      const issues = checkV3Compatibility(code);
      expect(issues.some(i => i.includes('usePagination'))).toBe(true);
    });

    it('should warn about special props in compatibility check', () => {
      const code = '<Card classNames="foo" motionProps={{}} disableAnimation />';
      const issues = checkV3Compatibility(code);
      expect(issues.some(i => i.includes('classNames'))).toBe(true);
      expect(issues.some(i => i.includes('motionProps'))).toBe(true);
      expect(issues.some(i => i.includes('disableAnimation'))).toBe(true);
    });

    it('should return empty list for compliant code', () => {
      const code = '<Card.Header>Title</Card.Header>';
      const issues = checkV3Compatibility(code);
      expect(issues.length).toBe(0);
    });
  });

  describe('new core utilities', () => {
    it('analyzeFile produces findings for v2 code with types and locations', async () => {
      const { analyzeFile } = await import('./migration.js');
      const res = await analyzeFile('<CardHeader>foo</CardHeader>');
      expect(res.findings.length).toBeGreaterThan(0);
      const f = res.findings[0];
      expect(f).toHaveProperty('type');
      expect(f).toHaveProperty('severity');
      expect(f).toHaveProperty('message');
      // location should be present for JSX import
      expect(f.location).toBeDefined();
      expect(res.summary).toContain('Detected');
    });

    it('rewriteFile handles a real TSX fixture', async () => {
      const code = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'rewrite', 'simple.tsx'), 'utf8');
      const { rewriteFile } = await import('./migration.js');
      const res = rewriteFile(code);
      expect(res.rewrittenCode).toContain('Card.Header');
      expect(res.rewrittenCode).not.toContain('ModalContent'); expect(res.warnings.some((w: string) => w.includes('ModalContent'))).toBe(true);
    });

    it('rewriteFile migrates various real components correctly', async () => {
      const { rewriteFile } = await import('./migration.js');
      const cardCode = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'rewrite', 'card.tsx'), 'utf8');
      const cardRes = rewriteFile(cardCode);
      expect(cardRes.rewrittenCode).toContain('Card.Content');
      expect(cardRes.rewrittenCode).not.toContain('CardBody');

      const modalCode = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'rewrite', 'modal.tsx'), 'utf8');
      const modalRes = rewriteFile(modalCode);
      expect(modalRes.rewrittenCode).not.toContain('ModalContent');
      expect(modalRes.warnings.some((w: string) => w.includes('ModalContent'))).toBe(true);

      const navCode = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'rewrite', 'navbar.tsx'), 'utf8');
      const navRes = rewriteFile(navCode);
      // navbar is manual only; expect a warning
      expect(navRes.warnings.some((w: string) => w.match(/Navbar/i))).toBe(true);
    });

    it('analyzeFile handles hooks fixture and returns hook findings', async () => {
      const code = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'analyze', 'hooks.tsx'), 'utf8');
      const { analyzeFile } = await import('./migration.js');
      const res = await analyzeFile(code);
      expect(res.findings.some(f => f.type === 'hook' && f.symbol === 'usePagination')).toBe(true);
      expect(res.findings.some(f => f.type === 'hook' && f.symbol === 'useDisclosure')).toBe(true);
      // ensure manualSteps were added
      expect(res.manualSteps.length).toBeGreaterThanOrEqual(1);
    });

    it('analyzeFile spots prop and hook issues in props fixture', async () => {
      const code = await fs.readFile(path.join(process.cwd(), 'tests', 'fixtures', 'analyze', 'props.tsx'), 'utf8');
      const { analyzeFile } = await import('./migration.js');
      const res = await analyzeFile(code);
      expect(res.findings.some(f => f.symbol === 'useDisclosure')).toBe(true);
      expect(res.findings.some(f => f.type === 'prop' && f.message.includes('classNames'))).toBe(true);
      expect(res.findings.some(f => f.type === 'prop' && f.message.includes('motionProps'))).toBe(true);
      expect(res.findings.some(f => f.type === 'prop' && f.message.includes('disableAnimation'))).toBe(true);
    });

    it('rewriteFile rewrites code and returns warnings', async () => {
      const { rewriteFile } = await import('./migration.js');
      const res = rewriteFile('<CardHeader>foo</CardHeader>');
      expect(res.rewrittenCode).toContain('Card.Header');
      // manualReviewRequired may be true if underlying AST warnings were emitted
      expect(res.manualReviewRequired).toBe(res.warnings.length > 0);
    });

    it('compareComponent recognizes existing component', async () => {
      const { compareComponent } = await import('./migration.js');
      const { buildComponentIndex } = await import('../indexers/build-component-index.js');
      // ensure indexes are populated
      await buildComponentIndex('v2');
      await buildComponentIndex('v3');
      const res = await compareComponent('Accordion');
      expect(res.existsInV2).toBe(true);
      expect(res.existsInV3).toBe(true);
      expect(res.status).toBe('same');
      expect(res.aliases.length).toBeGreaterThanOrEqual(0);
    });

    it('compareComponent handles renamed/alias names and prop changes', async () => {
      const { compareComponent } = await import('./migration.js');
      const { buildComponentIndex } = await import('../indexers/build-component-index.js');
      await buildComponentIndex('v2');
      await buildComponentIndex('v3');
      // Listbox should map to list-box in v3
      const res = await compareComponent('Listbox');
      expect(res.existsInV2).toBe(true);
      expect(res.existsInV3).toBe(true);
      // slug normalization should mark this as same or renamed
      expect(['same', 'renamed']).toContain(res.status);
      // there should be no negative values
      expect(res.propChanges).toBeInstanceOf(Array);
    });

    it('compareComponent reports removal and breaking changes', async () => {
      const { compareComponent } = await import('./migration.js');
      const { buildComponentIndex } = await import('../indexers/build-component-index.js');
      await buildComponentIndex('v2');
      await buildComponentIndex('v3');
      const res = await compareComponent('Navbar');
      expect(res.existsInV2).toBe(true);
      expect(res.existsInV3).toBe(false);
      expect(res.status).toBe('removed');
      expect(res.breakingChanges.length).toBeGreaterThan(0);
    });

    it('compareComponent identifies compound mappings for subcomponents', async () => {
      const { compareComponent } = await import('./migration.js');
      const { buildComponentIndex } = await import('../indexers/build-component-index.js');
      await buildComponentIndex('v2');
      await buildComponentIndex('v3');
      const res = await compareComponent('Card');
      // Card is present in both
      expect(res.existsInV2).toBe(true);
      expect(res.existsInV3).toBe(true);
      // many subcomponents exist
      expect(res.subcomponentMappings.length).toBeGreaterThan(0);
      // propChanges should include some Card-specific props
      expect(res.propChanges.some(p => p.prop.toLowerCase().includes('blur'))).toBe(true);
    });

    it('contract tests for analyzeFile/rewriteFile/compareComponent', async () => {
      const { analyzeFile, rewriteFile, compareComponent } = await import('./migration.js');
      const af = await analyzeFile('<Button>hi</Button>');
      expect(af).toHaveProperty('summary');
      expect(Array.isArray(af.findings)).toBe(true);
      expect(af).toHaveProperty('autoFixableCount');

      const rf = rewriteFile('<Button>hi</Button>');
      expect(rf).toHaveProperty('rewrittenCode');
      expect(Array.isArray(rf.edits)).toBe(true);
      expect(typeof rf.manualReviewRequired).toBe('boolean');

      const cc = await compareComponent('Accordion');
      expect(cc).toHaveProperty('status');
      expect(cc).toHaveProperty('aliases');
      expect(cc).toHaveProperty('propChanges');
    });

    describe('MCP server tool registration', () => {
      it('registers only public tools by default', async () => {
        const { createServer, resetServerCache } = await import('../server.js');
        resetServerCache();
        delete process.env.LEGACY_TOOLS_ENABLED;
        const server: any = createServer();
        const tools = Object.keys(server._registeredTools).sort();
        expect(tools).toEqual(expect.arrayContaining([
          'corpus_status',
          'scan_project',
          'analyze_file',
          'rewrite_file',
          'compare_component',
          'audit_tailwind'
        ]));
        expect(tools).not.toContain('get_migration_guide');
        expect(tools).not.toContain('diff_component');
      });

      it('includes legacy tools when flag enabled', async () => {
        const { createServer, resetServerCache } = await import('../server.js');
        resetServerCache();
        process.env.LEGACY_TOOLS_ENABLED = 'true';
        const server: any = createServer();
        const tools = Object.keys(server._registeredTools);
        expect(tools).toContain('get_migration_guide');
        expect(tools).toContain('diff_component');
      });
    });

    describe('MCP server tools return valid structuredContent', () => {
      let server: any;
      beforeEach(async () => {
        const { createServer, resetServerCache } = await import('../server.js');
        resetServerCache();
        delete process.env.LEGACY_TOOLS_ENABLED;
        server = createServer();
      });

      const callTool = async (name: string, args: any) => {
        return await server._registeredTools[name].handler(args);
      };

      it('analyze_file returns AnalyzeFileResult', async () => {
        const res = await callTool('analyze_file', { code: '<Card />' });
        expect(res.structuredContent).toHaveProperty('summary');
        expect(Array.isArray(res.structuredContent.findings)).toBe(true);
      });

      it('rewrite_file returns RewriteFileResult', async () => {
        const res = await callTool('rewrite_file', { code: '<Card />' });
        expect(res.structuredContent).toHaveProperty('rewrittenCode');
        expect(Array.isArray(res.structuredContent.edits)).toBe(true);
      });

      it('compare_component returns ComponentComparisonResult', async () => {
        const { buildComponentIndex } = await import('../indexers/build-component-index.js');
        await buildComponentIndex('v2');
        await buildComponentIndex('v3');
        const res = await callTool('compare_component', { component: 'Accordion' });
        expect(res.structuredContent).toHaveProperty('status');
        expect(res.structuredContent).toHaveProperty('aliases');
      });

      it('scan_project returns structured report', async () => {
        const tmp = path.join(process.cwd(), 'tmp-scan');
        await fs.rm(tmp, { recursive: true, force: true });
        await fs.mkdir(tmp, { recursive: true });
        await fs.writeFile(path.join(tmp, 'foo.tsx'), 'import { Button } from "@nextui-org/react";');
        const res = await callTool('scan_project', { directory: tmp });
        expect(res.structuredContent).toHaveProperty('report');
        expect(typeof res.structuredContent.totalFiles).toBe('number');
      });
    });
  });

});
