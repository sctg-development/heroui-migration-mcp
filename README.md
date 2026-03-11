# HeroUI Migration MCP

**Version: 0.3.0**

A Model Context Protocol (MCP) server to help migrate **HeroUI v2 / NextUI** projects toward **HeroUI v3 beta** with a practical workflow based on project scanning, file analysis, guided rewrites, component comparison, and documentation lookup.

## 🚀 Overview

HeroUI v3 introduces important changes compared with v2:

- more compound component APIs
- package and import changes
- updated overlay and hook patterns
- Tailwind/CSS workflow changes
- some components that still require manual migration decisions

This server is designed to support a **controlled, review-first migration workflow**:

1. Scan a project.
2. Analyze impacted files.
3. Rewrite safe patterns.
4. Review manual changes.
5. Cross-check components against the generated documentation corpus.

## Public API

By default, the server exposes the main public tools below:

- `corpus_status` — check whether generated documentation artifacts are present and usable
- `scan_project` — scan a codebase and identify files using legacy HeroUI/NextUI patterns
- `analyze_file` — inspect a file and return findings about imports, components, props, hooks, and Tailwind usage
- `rewrite_file` — apply heuristic rewrites and return the rewritten code plus diagnostics
- `compare_component` — compare a component across v2 and v3 and summarize migration status
- `audit_tailwind` — inspect a Tailwind config for legacy HeroUI patterns

### Legacy tools

Some older compatibility/debugging tools still exist, but they are **not enabled by default**.

To enable them:

```json
{
  "mcpServers": {
    "heroui-migration": {
      "command": "node",
      "args": ["/absolute/path/to/heroui-migration-mcp/dist/src/index.js"],
      "env": {
        "LEGACY_TOOLS_ENABLED": "true"
      }
    }
  }
}

## ✨ Features

### Project scanning
- Detects legacy HeroUI/NextUI usage across a project
- Highlights affected files
- Assigns priority levels to help sequence the migration work

### File analysis
- Detects legacy imports
- Detects component usage that changed in v3
- Flags hook migrations and prop migrations
- Returns structured findings with severity, confidence, and manual steps

### Code rewriting
- Rewrites a subset of safe patterns automatically
- Returns:
  - rewritten code
  - edits
  - warnings
  - manual review flag
  - confidence score

### Component comparison
- Looks up component presence and migration status between v2 and v3
- Helps distinguish:
  - same component
  - renamed component
  - compound API migration
  - removed/unknown component

### Documentation corpus
- Uses generated v2/v3 docs optimized for migration lookup
- Supports component-only and full documentation outputs
- Exposes generated documentation as MCP resources

### Tailwind audit
- Detects outdated HeroUI/Tailwind patterns
- Helps prepare CSS and config changes before component rewrites

## 📦 Installation

### 1. Prerequisites
- **Node.js** (v18+) installed.
- A **HeroUI v2** project you want to migrate.

### 2. Setup the MCP Server
Clone this repository and install dependencies:
```bash
git clone https://github.com/sctg-development/heroui-migration-mcp.git
cd heroui-migration-mcp
npm install
npm run build
```

### 3. Build the documentation corpus

Before using the server seriously, generate the migration corpus and indexes:

```bash
npm run build-corpus -- --version all
npm run build-index -- --version all
npm run doctor
```

What these commands do:

- `build-corpus` generates v2/v3 documentation artifacts in `data/generated`
- `build-index` builds component indexes for faster and more reliable lookups
- `doctor` checks that the generated artifacts are present and healthy

### 4. Configure in Your MCP Client
Configure the server in your MCP client (e.g., Claude Desktop, Cursor, or other MCP-compatible editors):

```json
{
  "mcpServers": {
    "heroui-migration": {
      "command": "node",
      "args": ["/absolute/path/to/heroui-migration-mcp/dist/src/index.js"]
    }
  }
}
```

**Optional: Enable Legacy Tools** (for backward compatibility)
```json
{
  "mcpServers": {
    "heroui-migration": {
      "command": "node",
      "args": ["/absolute/path/to/heroui-migration-mcp/dist/src/index.js"],
      "env": {
        "LEGACY_TOOLS_ENABLED": "true"
      }
    }
  }
}
```

## 🎯 Recommended workflow

### Recommended Migration Process

### 1. Verify the corpus
Call `corpus_status` to confirm the generated documentation artifacts are ready.

### 2. Scan the target project
Call `scan_project` on the app directory you want to migrate, for example `apps/client`.

Expected outcome:
- list of affected files
- priority classification
- first overview of the migration scope

### 3. Analyze representative files
Use `analyze_file` on the files reported by the scan.

Focus first on:
- app providers
- layout and navbar files
- modal/dropdown/table usage
- auth and shell components
- shared UI primitives

### 4. Rewrite safe patterns
Use `rewrite_file` on files where the analysis indicates mostly safe changes.

Always review:
- imports
- compound component nesting
- modal structure
- hooks and overlay logic
- navbar-related code

### 5. Audit Tailwind
Use `audit_tailwind` on your Tailwind configuration before or during the migration.

### 6. Validate uncertain components
Use `compare_component` whenever a component mapping is unclear or looks suspicious.

### 7. Test incrementally
After each batch of changes:
- run TypeScript checks
- run lint
- run unit tests
- smoke-test critical UI flows


### Command Line Interface

The project also provides standalone CLI utilities:

```bash
# Build documentation corpus
npm run build-corpus -- --version all

# Build component indexes
npm run build-index -- --version all

# Check corpus health
npm run doctor

# Scan a target project
npm run scan-project -- --directory ./apps/client --force

# Audit Tailwind config
npm run audit-tailwind -- --file ./tailwind.config.ts

# Run the test suite
npm run test

# Run tests once
npm run test:run
```

## 💻 Development

### Running the Server

```bash
# Production mode
npm run start

# Development mode with auto-reload
npm run dev

# Using the MCP Inspector (test interface)
npm run inspect

# Inspector in watch mode
npm run inspect:dev
```

### Building & Testing

```bash
# Compile TypeScript
npm run build

# Run tests
npm run test

# Run tests (non-watch)
npm run test:run
```

## 📁 Project Architecture

src/
├── cli/         # command-line utilities
├── core/        # analysis, rewriting, migration logic, AST helpers
├── indexers/    # component/document indexing helpers
├── knowledge/   # mappings, aliases, migration knowledge
├── types/       # contracts and schemas
├── server.ts    # MCP server registration
└── index.ts     # stdio entry point

data/
├── generated/   # generated v2/v3 documentation corpus
└── index/       # generated component indexes

## 🔗 File Formats

Generated documentation is available in multiple formats:

| Format | Files | Purpose |
|--------|-------|---------|
| **Full Text** | `heroui-{v2,v3}-llms-full.txt` | Complete paginated documentation for LLMs |
| **Components Only** | `heroui-{v2,v3}-llms-components.txt` | Component reference only |
| **JSON Index** | `heroui-{v2,v3}-index.json` | Component metadata index |
| **Web Variant** | `heroui-v3-web-llms-full.txt` | v3 Web-specific documentation |
| **Native Variant** | `heroui-v3-native-llms-full.txt` | v3 React Native documentation |

## ⚠️ Migration guidance & Known Limitations

### What works well
This server is especially useful for:

- identifying migration hotspots quickly
- detecting common v2 imports and patterns
- converting many compound component cases
- generating structured rewrite diagnostics
- helping teams migrate incrementally

### What still needs review
Manual review is still recommended for:

- navbar-related code
- overlay logic and hook migration
- modal composition changes
- advanced Tailwind/theming patterns
- any rewrite with warnings or low confidence

## Known limitations

- Some migrations are heuristic and cannot be guaranteed correct automatically.
- HeroUI v3 beta may still evolve.
- Certain components or patterns require manual refactoring rather than direct renaming.
- Generated corpus health and project migration progress are related but not identical concerns.

## Best practices

- Start with `scan_project`, not `rewrite_file`
- Use `analyze_file` before rewriting complex files
- Review all warnings before committing changes
- Migrate in small batches
- Keep the original v2 branch available for comparison
- Re-run scans after each migration batch

---

## 📖 Official References

- [HeroUI Documentation](https://heroui.com/)
- [HeroUI GitHub](https://github.com/heroui-inc/heroui)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

## 📄 License

This project is released under the **GNU Affero General Public License v3.0 or later** (AGPL-3.0-or-later).

**Copyright © 2026** Ronan LE MEILLAT - SCTG Development

All source files include a header comment block with copyright information. The full license text is available in [LICENSE.md](LICENSE.md).

### What this means:

- ✅ **You can use, modify, and distribute** this software
- ✅ **You must include the original license** and copyright notice
- ✅ **You must disclose modifications** to the source code
- ⚠️ **You must distribute any derivative work** under the same AGPL-3.0+ license
- ⚠️ **Network usage counts as distribution** (if you modify and run this server, you must provide access to the source)

For more details, see the full [AGPL-3.0 License](LICENSE.md).


