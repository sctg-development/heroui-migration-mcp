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
import fs from "node:fs/promises";
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  transformCode,
  analyzeTailwindConfig,
  checkV3Compatibility
} from "./core/migration.js";
import { KNOWN_V2_IMPORTS } from "./knowledge/mappings.js";// zod schemas are defined in src/types/schemas.ts for general use, but
// importing that file directly causes issues when Vitest dynamically loads
// `server.ts` (Node can't resolve a `.ts` module path).  To keep the public
// API schema definitions available here without creating circular runtime
// dependencies, we inline the portions we need.

const AnalyzeFileResultSchema = z.object({
  summary: z.string(),
  findings: z.array(z.any()),
  manualSteps: z.array(z.string()),
  autoFixableCount: z.number(),
  confidence: z.number(),
});

const RewriteFileResultSchema = z.object({
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

const ComponentComparisonResultSchema = z.object({
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

const ScanProjectStructuredSchema = z.object({
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
// prefer working directory so that compiled output can be executed from dist/
const PROJECT_ROOT = process.cwd();
const GENERATED_DIR = path.join(PROJECT_ROOT, "data", "generated");


async function listGeneratedFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(GENERATED_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

async function readGeneratedFile(name: string): Promise<string> {
  const allowed = new Set([
    // v2 outputs
    "heroui-v2-llms-components.txt",
    "heroui-v2-llms-full.txt",
    "heroui-v2-index.json",
    // v3 outputs
    "heroui-v3-llms-components.txt",
    "heroui-v3-llms-full.txt",
    "heroui-v3-web-llms-full.txt",
    "heroui-v3-native-llms-full.txt",
    "heroui-v3-index.json",
  ]);

  if (!allowed.has(name)) {
    throw new Error(`Unsupported generated file: ${name}`);
  }

  const fullPath = path.join(GENERATED_DIR, name);
  return fs.readFile(fullPath, "utf8");
}

// Constants and core logic moved to src/core/migration.ts

const NAVBAR_V3_TEMPLATE = `
import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@heroui/react'; // or your local cn util
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

/**
 * Navbar Context for state management
 */
const NavbarContext = createContext<{
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isVisible: boolean;
} | undefined>(undefined);

const useNavbarContext = () => {
  const context = useContext(NavbarContext);
  if (!context) throw new Error("Navbar compound components must be used within a <Navbar />");
  return context;
};

export interface NavbarProps {
  children?: React.ReactNode;
  className?: string;
  shouldHideOnScroll?: boolean;
  isBlurred?: boolean;
  isBordered?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'static' | 'sticky';
  height?: string;
}

/**
 * Root Navbar Component
 */
export const Navbar = ({
  children,
  className,
  shouldHideOnScroll = false,
  isBlurred = true,
  isBordered = false,
  maxWidth = 'lg',
  position = 'sticky',
  height = '4rem',
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!shouldHideOnScroll) return;
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  const maxWidthClasses = {
    sm: 'max-w-[640px]',
    md: 'max-w-[768px]',
    lg: 'max-w-[1024px]',
    xl: 'max-w-[1280px]',
    full: 'max-w-full',
  };

  return (
    <NavbarContext.Provider value={{ isMenuOpen, setIsMenuOpen, isVisible }}>
      <header
        style={{ '--navbar-height': height } as React.CSSProperties}
        className={cn(
          "flex z-40 w-full h-[var(--navbar-height)] items-center justify-center data-[sticky=true]:sticky top-0 inset-x-0",
          isBlurred && "backdrop-blur-lg backdrop-saturate-150 bg-background/70",
          isBordered && "border-b border-divider",
          className
        )}
        data-sticky={position === 'sticky'}
      >
        <motion.nav
          animate={{ y: isVisible ? 0 : '-100%' }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn(
            "flex w-full h-full items-center justify-between px-6 gap-4",
            maxWidthClasses[maxWidth]
          )}
        >
          {children}
        </motion.nav>
      </header>
    </NavbarContext.Provider>
  );
};

// --- Navbar.Brand ---
Navbar.Brand = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-row flex-nowrap justify-start items-center gap-2 bg-transparent no-underline outline-none", className)}>
    {children}
  </div>
);

// --- Navbar.Content ---
Navbar.Content = ({ 
  children, 
  className, 
  justify = 'start' 
}: { 
  children?: React.ReactNode; 
  className?: string;
  justify?: 'start' | 'center' | 'end';
}) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  };
  return (
    <ul className={cn("flex h-full flex-row flex-nowrap items-center gap-4 list-none", justifyClasses[justify], className)}>
      {children}
    </ul>
  );
};

// --- Navbar.Item ---
Navbar.Item = ({ children, className, isActive }: { children?: React.ReactNode; className?: string; isActive?: boolean }) => (
  <li className={cn("text-medium whitespace-nowrap box-border list-none", isActive && "text-primary font-semibold", className)}>
    {children}
  </li>
);

// --- Navbar.Toggle ---
Navbar.Toggle = ({ className }: { className?: string }) => {
  const { isMenuOpen, setIsMenuOpen } = useNavbarContext();
  return (
    <button
      aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      className={cn("flex sm:hidden flex-col items-center justify-center w-6 h-6 gap-1 group outline-none", className)}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
    >
      <span className={cn("w-full h-0.5 bg-foreground transition-transform", isMenuOpen && "rotate-45 translate-y-1.5")} />
      <span className={cn("w-full h-0.5 bg-foreground transition-opacity", isMenuOpen && "opacity-0")} />
      <span className={cn("w-full h-0.5 bg-foreground transition-transform", isMenuOpen && "-rotate-45 -translate-y-1.5")} />
    </button>
  );
};

// --- Navbar.Menu ---
Navbar.Menu = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const { isMenuOpen } = useNavbarContext();
  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.ul
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed inset-x-0 top-[var(--navbar-height)] bottom-0 z-30 flex flex-col gap-2 p-6 bg-background border-t border-divider sm:hidden overflow-y-auto",
            className
          )}
        >
          {children}
        </motion.ul>
      )}
    </AnimatePresence>
  );
};

// --- Navbar.MenuItem ---
Navbar.MenuItem = ({ children, className, isActive }: { children?: React.ReactNode; className?: string; isActive?: boolean }) => (
  <li className={cn("text-large list-none", isActive && "text-primary font-semibold", className)}>
    {children}
  </li>
);

export default Navbar;
`;


import { splitPages, findPageForComponent } from "./indexers/page-utils.js";

const _pageCache: Record<string, Array<{ url: string; content: string }>> = {};

async function findComponentDoc(name: string, fileName: string): Promise<string | null> {
  let pages = _pageCache[fileName];
  if (!pages) {
    const content = await readGeneratedFile(fileName);
    pages = splitPages(content);
    _pageCache[fileName] = pages;
  }
  const page = findPageForComponent(name, pages);
  if (!page) return null;
  return `<page url="${page.url}">${page.content}</page>`;
}

let _cachedServer: McpServer | null = null;

// testing helper: allow clearing the cached server instance so that
// configuration (e.g. LEGACY_TOOLS_ENABLED) can be re-evaluated.
export function resetServerCache() {
  _cachedServer = null;
}

function registerPublicTools(server: McpServer) {
  // core public helpers
  server.registerTool(
    "corpus_status",
    {
      title: "Corpus status",
      description: "Checks the presence and metadata of generated documentation artifacts.",
      inputSchema: {}
    },
    async () => {
      const files = await listGeneratedFiles();
      const expected = [
        "heroui-v2-llms-components.txt",
        "heroui-v2-llms-full.txt",
        "heroui-v2-index.json",
        "heroui-v3-llms-components.txt",
        "heroui-v3-llms-full.txt",
        "heroui-v3-index.json",
      ];
      const missing = expected.filter((n) => !files.includes(n));

      let indexes: Record<string, any> = {};
      for (const v of ["v2", "v3"]) {
        const path = `heroui-${v}-index.json`;
        if (files.includes(path)) {
          try {
            indexes[v] = JSON.parse(await readGeneratedFile(path));
          } catch {
            indexes[v] = null;
          }
        }
      }

      // compute basic metrics for text outputs if the index lacks them
      const metrics: Record<string, any> = {};
      for (const v of ["v2", "v3"]) {
        const versionMetrics: any = {};
        for (const fname of [`heroui-${v}-llms-components.txt`, `heroui-${v}-llms-full.txt`]) {
          if (files.includes(fname)) {
            try {
              const txt = await readGeneratedFile(fname);
              const pages = (txt.match(/<page\s+url=/g) || []).length;
              const bytes = Buffer.byteLength(txt, "utf8");
              versionMetrics[fname] = { pages, bytes };
            } catch { }
          }
        }
        metrics[v] = versionMetrics;
      }

      return {
        content: [
          {
            type: "text",
            text: `Corpus files: ${files.join(", ")}\n` +
              (missing.length ? `Missing: ${missing.join(", ")}\n` : "All expected files present.\n")
          }
        ],
        structuredContent: {
          ready: missing.length === 0,
          missingFiles: missing,
          generatedFiles: files,
          indexes,
          metrics,
        }
      };
    }
  );

  // primary public tools
  server.registerTool(
    "scan_project",
    {
      title: "Scan project for HeroUI v2",
      description: "Recursively scans a directory for files using legacy HeroUI/NextUI components.",
      inputSchema: {
        directory: z.string()
      }
    },
    async ({ directory }) => {
      const { scanProject } = await import("./core/migration.js");
      const res = await scanProject(directory);
      // validate structured content
      ScanProjectStructuredSchema.parse(res.structuredContent);
      return res;
    }
  );

  server.registerTool(
    "analyze_file",
    {
      title: "Analyze file",
      description: "Analyze code and return detailed findings about legacy imports, components, props, hooks and Tailwind patterns.",
      inputSchema: { code: z.string(), filename: z.string().optional() }
    },
    async ({ code, filename }) => {
      const { analyzeFile } = await import("./core/migration.js");
      const result = await analyzeFile(code, filename);
      AnalyzeFileResultSchema.parse(result);
      return { content: [], structuredContent: result as any };
    }
  );

  server.registerTool(
    "rewrite_file",
    {
      title: "Rewrite file",
      description: "Apply heuristic migrations to code and return the rewritten source plus diagnostics.",
      inputSchema: { code: z.string() }
    },
    async ({ code }) => {
      const { rewriteFile } = await import("./core/migration.js");
      const result = rewriteFile(code);
      RewriteFileResultSchema.parse(result);
      return { content: [], structuredContent: result as any };
    }
  );

  server.registerTool(
    "compare_component",
    {
      title: "Compare component",
      description: "Show presence/status of a component between v2 and v3, with alias lookup.",
      inputSchema: { component: z.string() }
    },
    async ({ component }) => {
      const { compareComponent } = await import("./core/migration.js");
      const result = await compareComponent(component);
      ComponentComparisonResultSchema.parse(result);
      return { content: [], structuredContent: result as any };
    }
  );

  server.registerTool(
    "audit_tailwind",
    {
      title: "Audit Tailwind config",
      description: "Analyze a Tailwind configuration file for legacy HeroUI patterns.",
      inputSchema: { code: z.string() }
    },
    async ({ code }) => {
      const { analyzeTailwindConfig } = await import("./core/migration.js");
      const result = analyzeTailwindConfig(code);
      return { content: [], structuredContent: result as any };
    }
  );

  // public resource registration (was previously at bottom)
  server.registerResource(
    "generated-doc",
    new ResourceTemplate("heroui://generated/{name}", { list: undefined }),
    {
      title: "Generated HeroUI v2 docs",
      description: "Access generated HeroUI v2 LLM outputs by resource URI."
    },
    async (_uri, { name }) => {
      const fileName = Array.isArray(name) ? name[0] : name;
      const text = await readGeneratedFile(fileName);
      const mimeType = fileName.endsWith('.json') ? 'application/json' : 'text/plain';
      return {
        contents: [{
          uri: `heroui://generated/${fileName}`,
          mimeType,
          text
        }]
      };
    }
  );
}

function registerLegacyTools(server: McpServer) {
  // keep legacy helpers for compatibility or debugging
  server.registerTool(
    "resolve_alias",
    {
      title: "Resolve component alias",
      description: "Return canonical name and confidence for a legacy component name",
      inputSchema: { name: z.string() }
    },
    async ({ name }) => {
      const { resolveAlias } = await import("./knowledge/aliases.js");
      const result = resolveAlias(name);
      return { content: [], structuredContent: result as unknown as Record<string, unknown> };
    }
  );

  server.registerTool(
    "migrate_file_code",
    {
      title: "Migrate file code v2 to v3",
      description: "Applies heuristic transformations to convert HeroUI v2 code to v3 patterns.",
      inputSchema: { code: z.string() }
    },
    async ({ code }) => {
      const { migratedCode, warnings } = transformCode(code);
      return {
        content: [{ type: "text", text: `### Suggested Migration to v3\n\n\`\`\`tsx\n${migratedCode}\n\`\`\`\n` }],
        structuredContent: { originalLength: code.length, migratedLength: migratedCode.length, warnings }
      };
    }
  );

  // legacy docs/comparison tools
  server.registerTool(
    "get_migration_guide",
    {
      title: "Get migration guide",
      description: "(legacy) Returns detailed migration guidance for a component by comparing v2 and v3 docs.",
      inputSchema: {
        component: z.string()
      }
    },
    async ({ component }) => {
      const { compareComponent } = await import("./core/migration.js");
      const res = await compareComponent(component);
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        structuredContent: res as any
      };
    }
  );

  server.registerTool(
    "check_v3_compatibility",
    {
      title: "Check v3 compatibility",
      description: "Checks if a file content follows HeroUI v3 patterns (no NextUI, uses compound API).",
      inputSchema: {
        code: z.string()
      }
    },
    async ({ code }) => {
      const issues = checkV3Compatibility(code);

      let text = "### HeroUI v3 Compatibility Check\n\n";
      if (issues.length === 0) {
        text += "✅ Code appears to be compatible with v3 patterns (heuristically).";
      } else {
        text += "❌ Potential compatibility issues found:\n" + issues.map(i => `- ${i}`).join("\n");
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: { issues, isCompatible: issues.length === 0 }
      };
    }
  );

  server.registerTool(
    "analyze_tailwind_config",
    {
      title: "Analyze Tailwind config",
      description: "Checks tailwind.config.js for legacy HeroUI plugins and content paths.",
      inputSchema: {
        code: z.string()
      }
    },
    async ({ code }) => {
      const { issues, suggestions } = analyzeTailwindConfig(code);

      let text = "### Tailwind Configuration Analysis\n\n";
      if (issues.length === 0) {
        text += "No legacy HeroUI patterns detected in Tailwind config.";
      } else {
        text += "Identified legacy patterns:\n" + issues.map(i => `- ${i}`).join("\n");
        text += "\n\nRecommended actions:\n" + suggestions.map(s => `- ${s}`).join("\n");
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: { issues, suggestions }
      };
    }
  );

  server.registerTool(
    "diff_component",
    {
      title: "Diff component v2 vs v3",
      description: "Returns v2 and v3 (web) documentation for a specific component to help with migration.",
      inputSchema: {
        component: z.string()
      }
    },
    async ({ component }) => {
      const v2Doc = await findComponentDoc(component, "heroui-v2-llms-full.txt");
      const v3Doc = await findComponentDoc(component, "heroui-v3-web-llms-full.txt");

      let text = `## Migration guide for ${component}\n\n`;

      if (v2Doc) {
        text += `### v2 Documentation\n${v2Doc}\n\n`;
      } else {
        text += `### v2 Documentation\nNot found in v2 full docs.\n\n`;
      }

      if (v3Doc) {
        text += `### v3 Documentation (Web)\n${v3Doc}\n\n`;
      } else {
        text += `### v3 Documentation (Web)\nNot found in v3 web docs.\n\n`;
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: { component, foundV2: !!v2Doc, foundV3: !!v3Doc }
      };
    }
  );

  server.registerTool(
    "list_generated_v2_outputs",
    {
      title: "List generated v2 outputs",
      description: "Lists files present in data/generated after running the HeroUI v2 generator.",
      inputSchema: {}
    },
    async () => {
      const files = await listGeneratedFiles();
      return {
        content: [{ type: "text", text: files.length ? files.join("\n") : "No generated files found in data/generated/." }],
        structuredContent: { files }
      };
    }
  );

  server.registerTool(
    "list_generated_v3_outputs",
    {
      title: "List generated v3 outputs",
      description: "Lists files present in data/generated after running the HeroUI v3 generator.",
      inputSchema: {}
    },
    async () => {
      const files = await listGeneratedFiles();
      const v3Files = files.filter((f) => f.startsWith("heroui-v3"));
      return {
        content: [{ type: "text", text: v3Files.length ? v3Files.join("\n") : "No generated v3 files found in data/generated/." }],
        structuredContent: { files: v3Files }
      };
    }
  );

  server.registerTool(
    "read_generated_v2_doc",
    {
      title: "Read generated v2 doc",
      description: "Reads one generated HeroUI v2 LLM output file.",
      inputSchema: {
        file: z.enum([
          "heroui-v2-llms-components.txt",
          "heroui-v2-llms-full.txt",
          "heroui-v2-index.json"
        ])
      }
    },
    async ({ file }) => {
      if (!file) {
        throw new Error("missing 'file' argument for read_generated_v2_doc");
      }
      const text = await readGeneratedFile(file);
      return {
        content: [{ type: "text", text }],
        structuredContent: { file, bytes: Buffer.byteLength(text, "utf8") }
      };
    }
  );

  server.registerTool(
    "read_generated_v3_doc",
    {
      title: "Read generated v3 doc",
      description: "Reads one generated HeroUI v3 LLM output file.",
      inputSchema: {
        file: z.enum([
          "heroui-v3-llms-components.txt",
          "heroui-v3-llms-full.txt",
          "heroui-v3-web-llms-full.txt",
          "heroui-v3-native-llms-full.txt",
          "heroui-v3-index.json"
        ])
      }
    },
    async ({ file }) => {
      if (!file) {
        throw new Error("missing 'file' argument for read_generated_v3_doc");
      }
      const text = await readGeneratedFile(file);
      return {
        content: [{ type: "text", text }],
        structuredContent: { file, bytes: Buffer.byteLength(text, "utf8") }
      };
    }
  );

  server.registerTool(
    "analyze_legacy_imports",
    {
      title: "Analyze legacy imports",
      description: "Quick heuristic scanner for HeroUI/NextUI v2 imports and symbols.",
      inputSchema: {
        code: z.string()
      }
    },
    async ({ code }) => {
      const findings = Object.entries(KNOWN_V2_IMPORTS)
        .filter(([needle]) => code.includes(needle))
        .map(([needle, note]) => ({ needle, note }));

      return {
        content: [{
          type: "text",
          text: findings.length
            ? findings.map((f) => `- ${f.needle}: ${f.note}`).join("\n")
            : "No known legacy imports detected."
        }],
        structuredContent: { findings }
      };
    }
  );

  server.registerTool(
    "get_navbar_v3_backport",
    {
      title: "Get Navbar v3 backport",
      description: "Generates the TSX code for a HeroUI v3-compatible Navbar component (missing in v3).",
      inputSchema: {}
    },
    async () => {
      return {
        content: [{ type: "text", text: `### HeroUI v3 Navbar Backport\n\nHeroUI v3 does not currently have a first-party Navbar component. Here is a compatible implementation using v3 patterns (compound components) and framer-motion.\n\n\`\`\`tsx\n${NAVBAR_V3_TEMPLATE}\n\`\`\`\n` }],
        structuredContent: { template: NAVBAR_V3_TEMPLATE }
      };
    }
  );
}

export function createServer(): McpServer {
  if (_cachedServer) return _cachedServer;
  const server = new McpServer({
    name: "heroui-migration-mcp",
    version: "0.3.0"
  });
  _cachedServer = server;

  registerPublicTools(server);
  if (process.env.LEGACY_TOOLS_ENABLED === "true") {
    registerLegacyTools(server);
  }

  return server;
}
