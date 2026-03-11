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
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { splitPages, findPageForComponent } from './page-utils.js';
import { buildComponentIndex } from './build-component-index.js';
import { createServer } from '../server.js';

describe('Indexer utilities', () => {
  const generatedDir = path.join(process.cwd(), 'data', 'generated');

  it('splitPages should recognize page boundaries', async () => {
    const txt = await fs.readFile(path.join(generatedDir, 'heroui-v2-llms-components.txt'), 'utf8');
    const pages = splitPages(txt);
    expect(pages.length).toBeGreaterThan(40);
    const accordion = pages.find((p) => p.url.endsWith('/accordion'));
    expect(accordion).toBeDefined();
    expect(accordion?.content).toContain('Accordion display a list');
  });

  it('findPageForComponent should locate by name', async () => {
    const txt = await fs.readFile(path.join(generatedDir, 'heroui-v3-llms-components.txt'), 'utf8');
    const pages = splitPages(txt);
    const modal = findPageForComponent('Modal', pages);
    expect(modal).not.toBeNull();
    expect(modal?.url.toLowerCase()).toMatch(/\/modal$/);
  });

  it('buildComponentIndex should produce index files', async () => {
    const outDir = path.join(process.cwd(), 'data', 'index');
    // cleanup if exists
    try { await fs.rm(outDir, { recursive: true }); } catch { }

    const v2 = await buildComponentIndex('v2', outDir);
    expect(v2.length).toBeGreaterThan(10);
    const fileV2 = path.join(outDir, 'components.v2.json');
    const text2 = await fs.readFile(fileV2, 'utf8');
    const parsed2 = JSON.parse(text2);
    expect(parsed2[0].slug).toBeDefined();
    expect(parsed2[0]).toHaveProperty('category');
    if (parsed2[0].aliases) expect(Array.isArray(parsed2[0].aliases)).toBe(true);

    const v3 = await buildComponentIndex('v3', outDir);
    expect(v3.length).toBeGreaterThan(10);
    const fileV3 = path.join(outDir, 'components.v3.json');
    const text3 = await fs.readFile(fileV3, 'utf8');
    const parsed3 = JSON.parse(text3);
    expect(parsed3[0].slug).toBeDefined();
    expect(parsed3[0]).toHaveProperty('category');
    if (parsed3[0].aliases) expect(Array.isArray(parsed3[0].aliases)).toBe(true);
  });

  it('scan_project helper should detect a legacy import in a directory', async () => {
    const tmp = path.join(process.cwd(), 'tmp-scan');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });
    const filePath = path.join(tmp, 'foo.tsx');
    await fs.writeFile(filePath, 'import { Button } from "@nextui-org/react";');

    const { scanProject } = await import('../core/migration.js');
    const res1 = await scanProject(tmp);
    expect(res1.structuredContent.affectedFiles).toBe(1);
    const entry = res1.structuredContent.report[0];
    expect(entry.components).toContain('@nextui-org/react');
    // '@nextui-org/react' is a legacy package, considered manual-only => P0
    expect(entry.priority).toBe('P0');

    // cache file should now exist
    const cachePath = path.join(process.cwd(), '.scan-cache.json');
    const cacheText = await fs.readFile(cachePath, 'utf8');
    const cache = JSON.parse(cacheText);
    expect(cache['foo.tsx'].components).toContain('@nextui-org/react');

    // run again without changes, should still return same result quickly
    const res2 = await scanProject(tmp);
    expect(res2.structuredContent.affectedFiles).toBe(1);

    // now modify the file to remove legacy import and rescan with force
    await fs.writeFile(filePath, 'export const x = 1;');
    const res3 = await scanProject(tmp, { force: true });
    expect(res3.structuredContent.affectedFiles).toBe(0);
  });

  it('scan-project CLI should output JSON report', async () => {
    const tmp = path.join(process.cwd(), 'tmp-scan-cli');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });
    await fs.writeFile(path.join(tmp, 'foo.tsx'), 'import { Button } from "@nextui-org/react";');

    const { stdout } = await import('child_process').then(({ exec }) =>
      new Promise<{ stdout: string }>((res, rej) =>
        exec(`npm run scan-project -- --directory ${tmp}`, (err, stdout, stderr) => {
          if (err) return rej(err);
          res({ stdout });
        })
      )
    );
    // strip out the npm banner (e.g. "> heroui-migration-mcp@0.3.0 scan-project")
    const clean = stdout.replace(/^>.*\n/gm, '');
    const parsed = JSON.parse(clean);
    expect(parsed.affectedFiles).toBe(1);
  });

  it('doctor CLI reports corpus status', async () => {
    const { stdout } = await import('child_process').then(({ exec }) =>
      new Promise<{ stdout: string }>((res, rej) =>
        exec(`npm run doctor`, (err, stdout, stderr) => {
          if (err) return rej(err);
          res({ stdout });
        })
      )
    );
    expect(stdout).toMatch(/Heroui corpus doctor/);
    expect(stdout).toMatch(/Corpus appears healthy|Missing/);
  });

  it('audit-tailwind CLI can analyze a config file', async () => {
    const tmp = path.join(process.cwd(), 'tmp-audit.css');
    await fs.writeFile(tmp, 'plugins: [heroui()]');
    const { stdout } = await import('child_process').then(({ exec }) =>
      new Promise<{ stdout: string }>((res, rej) =>
        exec(`npm run audit-tailwind -- --file ${tmp}`, (err, stdout, stderr) => {
          if (err) return rej(err);
          res({ stdout });
        })
      )
    );
    const clean = stdout.replace(/^>.*\n/gm, '');
    const parsed = JSON.parse(clean);
    expect(parsed.issues.length).toBeGreaterThan(0);
  });

  it('build-index CLI generates both v2 and v3 index files', async () => {
    const tmpDir = path.join(process.cwd(), 'tmp-index');
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    const { stdout } = await import('child_process').then(({ exec }) =>
      new Promise<{ stdout: string }>((res, rej) =>
        exec(`npm run build-index -- --version all --output ${tmpDir}`, (err, stdout, stderr) => {
          if (err) return rej(err);
          res({ stdout });
        })
      )
    );
    // confirm both files exist
    const v2file = path.join(tmpDir, 'components.v2.json');
    const v3file = path.join(tmpDir, 'components.v3.json');
    expect(await fs.stat(v2file)).toBeDefined();
    expect(await fs.stat(v3file)).toBeDefined();
  });
});
