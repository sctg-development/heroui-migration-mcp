# HeroUI Migration MCP

**Version: 0.3.0**

A Model Context Protocol (MCP) server designed to streamline the migration of your **HeroUI v2** (formerly NextUI) projects to the newest **HeroUI v3**.

## 🚀 Overview

HeroUI v3 introduces significant changes, including a shift to **Compound Components** (dot-notation), a new CSS-only theming engine (Tailwind v4 ready), and refined Hook APIs. This MCP server provides a comprehensive suite of tools for:
- Scanning projects to identify v2 components and patterns
- Analyzing migration compatibility and requirements
- Transforming code with heuristic-driven AST rewrites
- Accessing comprehensive documentation for both versions
- Auditing Tailwind configurations

## ✨ Features

### 📊 Scanning & Analysis
- **`scan_project`**: Recursively scans a directory for files using legacy v2 components with priority classification.
- **`corpus_status`**: Checks presence and metadata of generated documentation artifacts.
- **`analyze_file`**: Performs detailed analysis of code for legacy imports, components, props, hooks, and Tailwind patterns.
- **`analyze_legacy_imports`**: Quick heuristic scanner for HeroUI/NextUI v2 imports and symbols.

### 🛠️ Code Transformation
- **`rewrite_file`**: Applies heuristic AST-based migrations to convert v2 code to v3 patterns, with detailed diagnostics:
    - Component renaming (e.g., `CardHeader` → `Card.Header`)
    - Hook migration (e.g., `useDisclosure` → `useOverlayState`)
    - Smart import replacement
- **`compare_component`**: Shows component presence/status between v2 and v3 with alias lookup and breaking changes.
- **`migrate_file_code`** *(legacy)*: Simpler v2→v3 transformation wrapper.

### 🎨 Configuration & Documentation
- **`audit_tailwind`**: Analyzes Tailwind configuration for legacy HeroUI patterns and v4-readiness.
- **`check_v3_compatibility`** *(legacy)*: Heuristic compliance check for v3 patterns.
- **`diff_component`** *(legacy)*: Side-by-side v2 vs v3 documentation comparison.
- **`get_navbar_v3_backport`** *(legacy)*: Generates a v3-compatible Navbar component (not yet native in v3).

### 📚 Documentation Access
- **Generated doc resources** (`heroui://generated/{name}`): Direct access to LLM-optimized v2, v3 Web, and v3 Native documentation.
- **`read_generated_v2_doc`** *(legacy)*: Read individual v2 LLM output files (components, full, index).
- **`read_generated_v3_doc`** *(legacy)*: Read individual v3 LLM output files (components, full, web, native, index).
- **`list_generated_v2_outputs`** *(legacy)*: List available v2 documentation files.
- **`list_generated_v3_outputs`** *(legacy)*: List available v3 documentation files.
- **`get_migration_guide`** *(legacy)*: Component-specific migration guidance.

### 🔍 Utilities
- **`resolve_alias`** *(legacy)*: Resolve canonical names and confidence for legacy component aliases.

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
npm run build-corpus
```

### 3. Configure in Your MCP Client
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

## 🎯 Usage Workflow

### Recommended Migration Process

1. **Prepare Documentation** (first time setup):
   ```bash
   npm run generate:heroui-v2:full
   npm run generate:heroui-v3:full
   ```

2. **Build Project Index** (optional, for faster lookups):
   ```bash
   npm run build-index
   ```

3. **Initial Scan** - Use your MCP client to call `scan_project`:
   - Identifies all files requiring migration
   - Returns priority classification for each file

4. **Analyze Files** - For each file, use `analyze_file` to:
   - Detect legacy imports and components
   - Identify prop changes and hook migrations needed
   - Flag potential breaking changes

5. **Transform Code** - Use `rewrite_file` to:
   - Apply AST-based transformations
   - Review suggested edits with confidence levels
   - Manually verify Navbar and complex components

6. **Verify Configuration** - Use `audit_tailwind` to:
   - Check Tailwind configuration for v2-specific patterns
   - Ensure v4 compatibility

7. **Final Check** - Use `compare_component` for any components you want double-checked

### Command Line Interface

The project includes several CLI utilities for non-MCP workflows:

```bash
# Scan a project directory for v2 components
npm run scan-project -- --directory ./src

# Audit Tailwind configuration
npm run audit-tailwind -- --file tailwind.config.ts

# Run health diagnostics
npm run doctor

# Build documentation corpus (generates v2/v3 docs)
npm run build-corpus

# Build component indexes for faster lookups
npm run build-index
```

### Code Export & Analysis

Additional development utilities:
```bash
# Export code to a directory
npm run export-code

# Run full test suite
npm run test

# Run single test execution
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

- **`src/core/`**: Core migration logic (AST transforms, analysis, Tailwind auditing)
- **`src/cli/`**: Command-line interface tools for standalone usage
- **`src/knowledge/`**: Component mappings, aliases, and migration rules
- **`src/indexers/`**: Documentation indexing and parsing utilities
- **`src/types/`**: Zod schemas and TypeScript contracts
- **`data/generated/`**: Generated documentation files (v2/v3 LLM outputs)
- **`data/index/`**: Component index references

## 🔗 File Formats

Generated documentation is available in multiple formats:

| Format | Files | Purpose |
|--------|-------|---------|
| **Full Text** | `heroui-{v2,v3}-llms-full.txt` | Complete paginated documentation for LLMs |
| **Components Only** | `heroui-{v2,v3}-llms-components.txt` | Component reference only |
| **JSON Index** | `heroui-{v2,v3}-index.json` | Component metadata index |
| **Web Variant** | `heroui-v3-web-llms-full.txt` | v3 Web-specific documentation |
| **Native Variant** | `heroui-v3-native-llms-full.txt` | v3 React Native documentation |

## ⚠️ Known Limitations & Notes

- **Navbar v3**: HeroUI v3 does not include a native Navbar component. Use `get_navbar_v3_backport` to generate a compatible implementation using v3 patterns.
- **Hooks**: v3 uses specific hooks (`useDialog`, `usePopover`, `useOverlayState`) instead of the generic `useDisclosure`. Refer to individual component docs for correct hook usage.
- **Confidence Levels**: Migration suggestions include confidence scores (0-1). Lower scores indicate heuristic guesses that should be manually verified.
- **Manual Review Required**: Complex components (navigation, modals, overlays) should always be manually reviewed after transformation.
- **Legacy Tools**: Some tools are marked as "legacy" but remain functional. They may be deprecated in future versions in favor of the public API tools.

## 🌟 Tips & Best Practices

1. **Start with analysis**: Use `analyze_file` before applying transformations to understand what changes are needed.
2. **Review with `compare_component`**: For critical components, always check side-by-side v2/v3 documentation.
3. **Test incrementally**: Migrate one file at a time and test thoroughly before moving to the next.
4. **Tailwind first**: Update `tailwind.config` and CSS before migrating component files.
5. **Keep v2 branch**: Maintain a git branch with original v2 code for reference during migration.
6. **Use corpus_status**: Run this before any analysis to ensure documentation is ready.

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

For more details, see the full [AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0.html).

---

> [!TIP]
> **Need help with Navbar?** The HeroUI v3 Navbar isn't natively available yet. Use `get_navbar_v3_backport` to generate a modern, compound-component compatible implementation.

> [!NOTE]
> **Hook Changes in v3**: `useDisclosure` is replaced with specific hooks like `useDialog`, `usePopover`, or the generic `useOverlayState` for custom open/close state management.

