# Vivida

Quickly switch and group your Firefox themes


  [![CI](https://github.com/CS3250Team3SP26/Vivida/actions/workflows/ci.yml/badge.svg)](https://github.com/CS3250Team3SP26/Vivida/actions) [![Lines](./badges/badge-lines.svg)](https://github.com/CS3250Team3SP26/Vivida/actions) [![Functions](./badges/badge-functions.svg)](https://github.com/CS3250Team3SP26/Vivida/actions) [![Branches](./badges/badge-branches.svg)](https://github.com/CS3250Team3SP26/Vivida/actions) [![Statements](./badges/badge-statements.svg)](https://github.com/CS3250Team3SP26/Vivida/actions) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=CS3250Team3SP26_Assignment1&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=CS3250Team3SP26_Assignment1)
  
---

## 2. Description

Vivida is a Firefox extension that brings order to your theme collection. Create named groups of themes and switch between them instantly from a simple popup. The days of digging through Firefox's settings everytime you want a fresh look is over.

---

## 3. Screenshots / Demo *(optional but recommended)*

Even a single screenshot of the popup UI goes a long way toward making the README feel polished. A placeholder is fine early on — it signals the README is being actively maintained.

---

## 4. Installation

Address **two audiences** under clearly separated sub-headers:

- **End users** — install from Firefox Add-ons (link when published)
- **Developers** — clone the repo, run `npm ci`, load as a temporary extension in Firefox

---

## 5. Usage

A brief walkthrough of the core user flow:
1. Creating a theme group
2. Adding themes to a group
3. Switching between groups

Numbered steps are appropriate here.

---

## 6. Development Setup

The most important section for teammates and graders. Include:

- **Prerequisites:** Node.js 20+, Firefox
- **Clone & install steps**
- **Key npm commands** (sourced from `package.json`):

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Watch mode for TDD |
| `npm run coverage:badges` | Generate coverage badge SVGs locally |
| `npm run docs` | Generate JSDoc documentation |

- **Loading in Firefox:** navigate to `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`

---

## 7. Project Structure

Include the file tree with brief inline comments explaining each major folder. The `extension-structure.md` file in the repo is the source for this.

```
Vivida/
├── .github/workflows/
│   ├── ci.yml                 # Runs lint + tests on every push/PR to main and develop
│   └── badges.yml             # Generates and commits coverage badges on new version tags
├── badges/                    # Auto-generated Jest coverage badge SVGs (committed to repo)
│   ├── badge-lines.svg
│   ├── badge-functions.svg
│   ├── badge-branches.svg
│   └── badge-statements.svg
├── src/
│   ├── manifest.json          # Extension manifest (required by Firefox)
│   ├── background/            # Background scripts, event listeners
│   ├── popup/                 # Popup UI shown when clicking the icon
│   ├── options/               # Settings/preferences page
│   ├── lib/                   # Shared business logic modules
│   └── icons/                 # Extension icons (16, 32, 48, 128px)
├── test/
│   ├── unit/                  # Unit tests for lib/ modules
│   └── integration/           # Integration tests
├── docs/                      # Generated JSDoc output (git-ignored)
├── package.json
└── README.md
```

---

## 8. Contributing / Definition of Done

Since this is a team project, this section documents your process. Include:

**Definition of Done** — a feature/fix is complete when:
1. No known defects
2. 90%+ unit test code coverage
3. 100% of API documented with JSDoc
4. User documentation up to date
5. All production code reviewed via pull request
6. `main` branch up to date and tagged by release

Also briefly describe the branch and PR workflow (feature branches → PR → review → merge to `develop` → `main`).

---

## 9. Tech Stack

A clean, scannable list:

- **Language:** JavaScript ES6+
- **Platform:** Firefox WebExtensions (Manifest V2)
- **Testing:** Jest with jsdom
- **Linting:** ESLint (flat config)
- **Documentation:** JSDoc
- **CI/CD:** GitHub Actions