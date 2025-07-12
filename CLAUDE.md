# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the documentation website for 策引 (Plutus), an AI-powered investment assistant platform. Built with Docusaurus 3.0, it provides comprehensive documentation for users and developers of the investment platform.

## 🎯 Documentation Philosophy

**This is a PUBLIC, USER-FACING documentation repository.** All content should be:

- **User-friendly**: Written for product users, not developers
- **Accessible**: No code implementation details or technical internals
- **Practical**: Focus on how to use features, not how they work internally
- **Clear**: Use plain language and avoid technical jargon
- **Example-driven**: Provide practical configuration examples and use cases

**What to AVOID in this documentation:**
- Internal code snippets or implementation details
- Developer-specific technical explanations
- Backend system architecture details
- API implementation specifics
- Debugging code or system internals

**What to INCLUDE:**
- User configuration examples (JSON configurations)
- Step-by-step usage guides
- Feature explanations from user perspective
- Troubleshooting from user experience angle
- Best practices for strategy creation

## Architecture

### Technology Stack
- **Framework**: Docusaurus 3.0 (React-based static site generator)
- **Language**: TypeScript
- **Package Manager**: npm
- **Styling**: CSS Modules + custom CSS
- **Search**: Algolia DocSearch integration
- **Deployment**: Static site generation for hosting on Cloudflare Pages, Vercel, or similar

### Project Structure
```
docs/                           # Documentation content (Markdown files)
├── concepts/                   # Core platform concepts (AI agent, background, overview, risk analysis)
├── guides/                     # User guides (portfolio creation, analysis, notifications, FAQ)
├── primitives/                 # Component system documentation
│   ├── advanced/              # Advanced features (optimization, troubleshooting, case studies)
│   └── [architecture, composition, examples, getting-started, indicators, signals].md
└── strategies/                 # Investment strategy documentation

src/                           # Docusaurus source code
├── components/                # React components
├── css/                      # Custom styling
└── pages/                    # Custom pages

static/img/                    # Static assets (images, icons)
docusaurus.config.ts          # Main configuration file
sidebars.ts                   # Sidebar navigation structure
```

## Common Commands

### Development
```bash
npm install                    # Install dependencies
npm start                     # Start development server (localhost:3000)
npm run build                 # Build for production
npm run serve                 # Serve built site locally
npm run typecheck             # TypeScript type checking
```

### Docusaurus-specific
```bash
npm run clear                 # Clear Docusaurus cache
npm run swizzle               # Customize Docusaurus components
npm run write-translations    # Generate translation files
npm run write-heading-ids     # Generate heading IDs
```

## Key Configuration

### Internationalization
- Default locale: `zh-Hans` (Simplified Chinese)
- All content is in Chinese
- URLs and navigation use Chinese text

### Search Integration
- Algolia DocSearch configured with app ID `RPY9177W8B`
- Index name: `myinvestpilot`
- Search endpoint configured for production domain

### Deployment Configuration
- Production URL: `https://docs.myinvestpilot.com`
- GitHub organization: `myinvestpilot`
- Project name: `plutus`
- Build output directory: `build/`

## Content Guidelines

### Documentation Structure
1. **Concepts**: High-level platform concepts and AI features
2. **Guides**: Step-by-step user instructions
3. **Primitives**: Technical component system documentation
4. **Strategies**: Detailed investment strategy explanations

### File Naming
- Use lowercase with hyphens: `create-portfolio.md`
- Chinese content with English filenames for URL compatibility
- Category files use `_category_.json` for metadata

### Content Features
- Mermaid diagram support enabled
- Code syntax highlighting
- Responsive design for mobile/desktop
- Algolia search integration

## Development Notes

### TypeScript Configuration
- Extends `@docusaurus/tsconfig`
- Base URL set to project root
- Excludes `.docusaurus` and `build` directories

### Styling
- Custom CSS in `src/css/custom.css`
- Prism themes: GitHub (light) and Dracula (dark)
- Footer disabled in theme configuration

### Content Management
- All documentation content is in Markdown format
- Use relative links for internal documentation references
- Sidebar navigation auto-generated from `sidebars.ts`
- Category organization through `_category_.json` files