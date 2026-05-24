# CLAUDE.md — Consultrasporto

This file provides guidance for AI assistants working in this repository.

## Project Overview

**Consultrasporto** is an Italian deadline management system ("gestione scadenziario"). The project is in its initial bootstrap phase — no source code exists yet beyond the README and LICENSE.

- **License:** Apache 2.0
- **Language:** Italian (comments, variable names, and UI text will likely be in Italian)
- **Purpose:** Managing deadlines/expiry dates ("scadenze") for transport-related documents or compliance tasks

## Repository State

As of the initial commit, the repository contains only:
- `README.md` — one-line project description
- `LICENSE` — Apache 2.0
- `CLAUDE.md` — this file

No tech stack, dependencies, source structure, or CI configuration have been established yet.

## Git Workflow

- **Main branch:** `main` — protected; no direct commits
- **Feature branches:** create branches from `main` using descriptive names (e.g., `feature/scadenziario-ui`, `fix/date-validation`)
- **Commits:** write clear, descriptive messages; prefer English for commit messages unless the team decides otherwise
- **Push:** always use `git push -u origin <branch-name>`

## Development Conventions (to be enforced once tech stack is chosen)

### Naming
- Italian domain terms are expected in model/entity names (e.g., `Scadenza`, `Contratto`, `Fornitore`)
- Keep code identifiers in English or Italian consistently — decide at project start and document here

### Code Style
- Follow the linter/formatter configured for the chosen stack (add config files and document commands below)
- No commented-out code in commits
- No console.log / print debug statements in production code

### Comments
- Write comments only when the *why* is non-obvious
- Inline documentation (JSDoc, docstrings, etc.) should be in Italian if the codebase targets Italian-speaking developers

## Commands

> These sections will be filled in once the tech stack is established.

### Setup
```bash
# TODO: add dependency installation command
```

### Development
```bash
# TODO: add dev server start command
```

### Build
```bash
# TODO: add build command
```

### Test
```bash
# TODO: add test runner command
```

### Lint / Format
```bash
# TODO: add lint and format commands
```

## Project Structure (planned)

> Update this section when directories are created.

```
Consultrasporto/
├── CLAUDE.md
├── LICENSE
├── README.md
# TODO: add src/, docs/, tests/, config/ etc. as they are created
```

## Key Domain Concepts

| Italian term | English equivalent | Notes |
|---|---|---|
| scadenziario | deadline schedule | The core entity — a calendar of expiry dates |
| scadenza | deadline / expiry date | An individual deadline entry |
| contratto | contract | Likely source of deadlines |
| fornitore | supplier/vendor | Party whose documents expire |
| documento | document | License, certificate, permit, etc. |

## AI Assistant Notes

- When adding features, ask whether naming should be in Italian or English before creating new files/classes
- Prefer editing existing files over creating new ones
- Do not add error handling or abstractions beyond what the immediate task requires
- Do not create documentation files unless explicitly requested
- If the tech stack is undecided, surface options and trade-offs rather than picking unilaterally
- Keep commits atomic and on the correct feature branch (never push directly to `main`)
