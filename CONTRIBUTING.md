# Contributing to PixelFlow

Thanks for your interest in contributing.

This document explains the expected workflow for proposing changes to PixelFlow.

## Code of Conduct
Be respectful, constructive, and collaborative in all discussions and reviews.

## Prerequisites
- Node.js 20+
- npm 10+
- Git

## Local Setup
1. Fork and clone the repository.
2. Install dependencies:
```bash
npm install
```
3. Start development server:
```bash
npm run dev
```
4. Open http://localhost:3001.

## Branching
- Create a focused branch from `main`.
- Use a clear branch name, for example:
  - `feat/inline-analytics-controls`
  - `fix/hls-buffering-state`
  - `docs/readme-improvements`

## Development Guidelines
- Keep changes scoped to one concern per pull request.
- Preserve existing architecture and naming conventions.
- Prefer TypeScript-safe patterns over `any`.
- Keep UI behavior consistent across desktop and mobile.
- Do not commit secrets, tokens, or private keys.

## Quality Checks
Run all checks before opening a pull request:
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Commit Guidance
Use clear, imperative commit messages:
- `feat: add inline analytics toggle`
- `fix: prevent play button state desync`
- `docs: add security reporting policy`

## Pull Request Checklist
Before requesting review, ensure:
- [ ] Changes are tested locally.
- [ ] `lint`, `typecheck`, `test`, and `build` pass.
- [ ] UI changes include screenshots or short video clips.
- [ ] Documentation is updated when behavior changes.
- [ ] PR description explains what changed and why.

## Reporting Bugs
When opening an issue, include:
- Environment (OS, Node version, browser)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs, errors, and screenshots

## Feature Requests
Please include:
- Problem statement
- Proposed solution
- Alternatives considered
- Any UX/API impact

## Security Issues
Do not open public issues for security vulnerabilities.
Follow the private reporting process in [SECURITY.md](SECURITY.md).

## Review and Merge Process
1. Maintainers review the PR.
2. Requested changes are addressed.
3. Checks must pass.
4. PR is approved and merged into `main`.

Thank you for helping improve PixelFlow.
