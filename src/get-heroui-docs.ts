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
import * as fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import * as git from "isomorphic-git";
import http from "isomorphic-git/http/node";

// url for direct HeroUI v3 LLM export
const V3_LLM_URL = "https://v3.heroui.com/llms-full.txt";

// global mutable state used by helper functions
let REPO_BRANCH = "";
let REPO_DIR = "";
let CACHE_ROOT = "";

// helper to download the v3 LLM text and manage backups
async function downloadV3LLM(outputDir: string): Promise<void> {
  try {
    const res = await fetch(V3_LLM_URL);
    const text = await res.text();
    // Determine the current directory in ESM
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const oldPath = path.join(__dirname, "../data/generated/heroui-v3-llms-full.txt");
    if (fs.existsSync(oldPath)) {
      const backupPath = path.join(__dirname, "../data/generated/heroui-v3-llms-full-generated.txt");
      fs.renameSync(oldPath, backupPath);
      console.log(`Renamed existing file to ${backupPath}`);
    }
    const outputPath = path.join(outputDir, `heroui-v3-llms-full.txt`);
    fs.writeFileSync(outputPath, text, "utf8");
    console.log(`Saved HeroUI v3 LLM output to ${outputPath}`);
  } catch (err) {
    console.error("Error fetching HeroUI v3 LLM output:", err);
  }
}

const REPO_URL = "https://github.com/heroui-inc/heroui.git";

async function ensureDir(dir: string): Promise<void> {
  await fsp.mkdir(dir, { recursive: true });
}

async function exists(target: string): Promise<boolean> {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

async function prepareRepository(): Promise<void> {
  await ensureDir(CACHE_ROOT);

  const gitDir = path.join(REPO_DIR, ".git");
  const alreadyCloned = await exists(gitDir);

  if (!alreadyCloned) {
    console.log(`Cloning ${REPO_URL} ${REPO_BRANCH} into ${REPO_DIR}`);
    await git.clone({
      fs,
      http,
      dir: REPO_DIR,
      url: REPO_URL,
      ref: REPO_BRANCH,
      singleBranch: true,
      depth: 1,
    });
    return;
  }

  console.log(`Fetching updates for ${REPO_BRANCH}`);
  await git.fetch({
    fs,
    http,
    dir: REPO_DIR,
    ref: REPO_BRANCH,
    singleBranch: true,
    depth: 1,
  });

  // ensure working tree is on the desired branch or commit
  await git.checkout({ fs, dir: REPO_DIR, ref: REPO_BRANCH });

  try {
    const remoteRef = `refs/remotes/origin/${REPO_BRANCH}`;
    const remoteCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: remoteRef });
    await git.checkout({ fs, dir: REPO_DIR, ref: remoteCommit });
  } catch {
    // ignore if remote ref not available
  }
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n/g, "\n");
}

function stripEsmPreamble(input: string): string {
  const lines = input.split("\n");
  const out: string[] = [];

  let skippingExportBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (skippingExportBlock) {
      if (trimmed.endsWith(";") || trimmed === "}") {
        skippingExportBlock = false;
      }
      continue;
    }

    if (/^import\s.+from\s+['"].+['"];?$/.test(trimmed)) continue;
    if (/^import\s+['"].+['"];?$/.test(trimmed)) continue;
    if (/^export\s+default\s+/.test(trimmed)) continue;
    if (/^export\s+const\s+/.test(trimmed) && !trimmed.endsWith(";")) {
      skippingExportBlock = true;
      continue;
    }
    if (/^export\s+(const|function|class|\{)/.test(trimmed)) continue;

    out.push(line);
  }

  return out.join("\n");
}

function stripNoise(input: string): string {
  let s = input;

  s = s.replace(/<Seo\s+[\s\S]*?\/>/g, "");
  s = s.replace(/<FeaturesGrid[\s\S]*?<\/FeaturesGrid>/g, "");
  s = s.replace(/<CodeDemo[\s\S]*?<\/CodeDemo>/g, "");
  s = s.replace(/<PackageManagers[\s\S]*?<\/PackageManagers>/g, "");
  s = s.replace(/<PackageManagerTabs[\s\S]*?<\/PackageManagerTabs>/g, "");
  s = s.replace(/<Sandpack[\s\S]*?<\/Sandpack>/g, "");
  s = s.replace(/<Preview[\s\S]*?<\/Preview>/g, "");
  s = s.replace(/<Spacer\s+[^\n]*\/>/g, "");
  s = s.replace(/<br\s*\/?>>/gi, "\n");
  s = s.replace(/<!--([\s\S]*?)-->/g, "");

  return s;
}

function compressBlankLines(input: string): string {
  return input
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function firstMarkdownTitle(body: string): string | null {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function firstParagraph(body: string): string | null {
  const lines = body.split("\n");
  const chunks: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (chunks.length) break;
      continue;
    }
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("<") ||
      trimmed.startsWith("```") ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ")
    ) {
      if (chunks.length) break;
      continue;
    }
    chunks.push(trimmed);
  }
  return chunks.length ? chunks.join(" ") : null;
}

function inferUrl(filePath: string, fm: Record<string, unknown>, docsRoot: string): string {
  const slugLike = typeof fm.slug === "string"
    ? fm.slug
    : typeof fm.route === "string"
    ? fm.route
    : typeof fm.path === "string"
    ? fm.path
    : null;

  if (slugLike) {
    if (slugLike.startsWith("/")) return slugLike;
    return `/docs/${slugLike.replace(/^docs\//, "")}`;
  }

  const rel = path.relative(docsRoot, filePath).replace(/\\/g, "/").replace(/\.mdx?$/, "");
  return `/docs/${rel}`;
}

function sourceUrl(filePath: string): string {
  const rel = path.relative(REPO_DIR, filePath).replace(/\\/g, "/");
  return `https://raw.githubusercontent.com/heroui-inc/heroui/${REPO_BRANCH}/${rel}`;
}

function pageBlock(params: {
  filePath: string;
  docsRoot: string;
  category: string;
  includeBody: string;
}): string {
  const raw = normalizeNewlines(params.includeBody);
  const parsed = matter(raw);
  const fm = (parsed.data ?? {}) as Record<string, unknown>;

  let body = normalizeNewlines(parsed.content);
  body = stripEsmPreamble(body);
  body = stripNoise(body);
  body = compressBlankLines(body);

  const title =
    (typeof fm.title === "string" && fm.title.trim()) ||
    (typeof fm.name === "string" && fm.name.trim()) ||
    firstMarkdownTitle(body) ||
    path.basename(params.filePath).replace(/\.mdx?$/, "");

  const description =
    (typeof fm.description === "string" && fm.description.trim()) ||
    firstParagraph(body) ||
    "";

  const url = inferUrl(params.filePath, fm, params.docsRoot);
  const absoluteUrl = `https://www.heroui.com${url}`;
  const src = sourceUrl(params.filePath);

  const parts: string[] = [];
  parts.push(`<page url="${url}">`);
  parts.push(`# ${title}`);
  parts.push("");
  parts.push(`**Category**: ${params.category}`);
  parts.push(`**URL**: ${absoluteUrl}`);
  parts.push(`**Source**: ${src}`);
  if (description) {
    parts.push(`> ${description}`);
    parts.push("");
  } else {
    parts.push("");
  }
  parts.push(body);
  parts.push("");
  parts.push(`</page>`);
  return parts.join("\n");
}

async function collectPages(
  rootDir: string,
  docsRoot: string,
  category: string,
  filter?: (file: string) => boolean
): Promise<{ file: string; page: string }[]> {
  const patterns = ["**/*.mdx", "**/*.md"];
  const files = await fg(patterns, {
    cwd: rootDir,
    absolute: true,
    onlyFiles: true,
    dot: false,
  });

  const pages: { file: string; page: string }[] = [];

  for (const file of files.sort()) {
    if (filter && !filter(file)) continue;
    const raw = await fsp.readFile(file, "utf8");
    const page = pageBlock({
      filePath: file,
      docsRoot,
      category,
      includeBody: raw,
    });
    pages.push({ file, page });
  }

  return pages;
}

async function writeTextFile(target: string, content: string): Promise<number> {
  await ensureDir(path.dirname(target));
  await fsp.writeFile(target, content, "utf8");
  return Buffer.byteLength(content, "utf8");
}

export async function getHerouiDocs(
  version: string,
  full: boolean,
  noGit: boolean,
  outputPath: string
): Promise<void> {
  REPO_BRANCH = version;

  const PROJECT_ROOT = process.cwd();
  CACHE_ROOT = path.join(PROJECT_ROOT, ".cache");
  REPO_DIR = path.join(CACHE_ROOT, `heroui-${REPO_BRANCH}`);
  const DOCS_ROOT = path.join(REPO_DIR, "apps", "docs", "content", "docs");
  const COMPONENTS_ROOT =
    REPO_BRANCH === "v3"
      ? path.join(DOCS_ROOT, "react", "components")
      : path.join(DOCS_ROOT, "components");
  const OUTPUT_DIR = outputPath || path.join(PROJECT_ROOT, "data", "generated");

  const FLAG_FULL = full;
  const FLAG_NO_GIT = noGit;

  if (!FLAG_NO_GIT) {
    await prepareRepository();
  }

  const hasComponents = await exists(COMPONENTS_ROOT);
  if (!hasComponents) {
    console.warn(`Components directory not found (${COMPONENTS_ROOT}); skipping component pages.`);
  }

  await ensureDir(OUTPUT_DIR);

  // Filters
  const isWeb = (f: string) => !f.includes("/native/");
  const isNative = (f: string) => f.includes("/native/");

  const componentPages = hasComponents
    ? await collectPages(
        COMPONENTS_ROOT,
        DOCS_ROOT,
        "react-components",
        REPO_BRANCH === "v3" ? isWeb : undefined
      )
    : [];

  const headerPrefix = REPO_BRANCH === "v2" ? "HeroUI v2" : "HeroUI v3";
  const componentsHeader = [
    `# ${headerPrefix} LLMs Components`,
    "",
    `Generated from ${REPO_URL} (branch: ${REPO_BRANCH})`,
    `Source root: ${path.relative(REPO_DIR, COMPONENTS_ROOT)}`,
    `Pages: ${componentPages.length}`,
    "",
  ].join("\n");

  const componentsContent = componentsHeader + componentPages.map((p) => p.page).join("\n\n");
  const componentsFileName = `heroui-${REPO_BRANCH}-llms-components.txt`;
  const componentsPath = path.join(OUTPUT_DIR, componentsFileName);
  const componentsBytes = await writeTextFile(componentsPath, componentsContent);

  console.log(`Generated ${componentsFileName} (${componentsBytes} bytes)`);

  if (FLAG_FULL) {
    // For v3, we generate separate web and native files if possible
    if (REPO_BRANCH === "v3") {
      // WEB
      const webPages = await collectPages(DOCS_ROOT, DOCS_ROOT, "react-docs", isWeb);
      const webHeader = [
        `# HeroUI v3 LLMs Full (Web)`,
        "",
        `Generated from ${REPO_URL} (branch: v3)`,
        `Source root: apps/docs/content/docs`,
        `Pages: ${webPages.length}`,
        "",
      ].join("\n");
      const webContent = webHeader + webPages.map((p) => p.page).join("\n\n");
      const webFileName = `heroui-v3-web-llms-full.txt`;
      await writeTextFile(path.join(OUTPUT_DIR, webFileName), webContent);
      console.log(`Generated ${webFileName} (${webPages.length} pages)`);

      // NATIVE
      const nativePages = await collectPages(DOCS_ROOT, DOCS_ROOT, "native-docs", isNative);
      const nativeHeader = [
        `# HeroUI v3 LLMs Full (Native)`,
        "",
        `Generated from ${REPO_URL} (branch: v3)`,
        `Source root: apps/docs/content/docs`,
        `Pages: ${nativePages.length}`,
        "",
      ].join("\n");
      const nativeContent = nativeHeader + nativePages.map((p) => p.page).join("\n\n");
      const nativeFileName = `heroui-v3-native-llms-full.txt`;
      await writeTextFile(path.join(OUTPUT_DIR, nativeFileName), nativeContent);
      console.log(`Generated ${nativeFileName} (${nativePages.length} pages)`);
    } else {
      // v2
      const fullPages = await collectPages(DOCS_ROOT, DOCS_ROOT, "react-docs");
      const fullHeader = [
        `# HeroUI v2 LLMs Full`,
        "",
        `Generated from ${REPO_URL} (branch: v2)`,
        `Source root: apps/docs/content/docs`,
        `Pages: ${fullPages.length}`,
        "",
      ].join("\n");
      const fullContent = fullHeader + fullPages.map((p) => p.page).join("\n\n");
      const fullFileName = `heroui-v2-llms-full.txt`;
      await writeTextFile(path.join(OUTPUT_DIR, fullFileName), fullContent);
      console.log(`Generated ${fullFileName} (${fullPages.length} pages)`);
    }
  }

  // Metadata/Index
  const index = {
    repoUrl: REPO_URL,
    branch: REPO_BRANCH,
    docsRoot: "apps/docs/content/docs",
    generatedAt: new Date().toISOString(),
    components: componentPages.map((p) => ({
      file: path.relative(REPO_DIR, p.file).replace(/\\/g, "/"),
      source: sourceUrl(p.file),
    })),
  };

  const indexFilename = `heroui-${REPO_BRANCH}-index.json`;
  await writeTextFile(path.join(OUTPUT_DIR, indexFilename), JSON.stringify(index, null, 2));

  // if generating for v3 with full flag, also grab the direct export from heroui.com
  if (REPO_BRANCH === "v3" && FLAG_FULL) {
    await downloadV3LLM(OUTPUT_DIR);
  }
}
