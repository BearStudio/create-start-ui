# create-start-ui

CLI scaffolding tool that creates Start UI projects (web and native targets). Downloads a GitHub repo tarball, extracts it, and copies files to the user's directory.

## Commands

- `pnpm build` — bundle with `@vercel/ncc` to `dist/`
- `pnpm check` — lint and format with Biome
- `pnpm dev` — link CLI globally + build in watch mode
- No test suite (test script is a no-op)

## Code Style

Enforced by Biome 2.x (`biome.json`) and git hooks (lefthook):

- Single quotes, always semicolons
- Space indentation, 120 char line width, LF line endings
- Import order (with blank line separators): node builtins, then packages, then `@/` aliases, then relative paths — sorted lexicographically within each group
- Biome recommended lint rules enabled
- Pre-commit hook runs `biome check --write` on staged files
- Pre-push hook runs `biome check` on pushed files

## TypeScript

- Strict mode with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
- Target ES2022, module NodeNext, ESM (`"type": "module"`)
- Path alias: `@/*` maps to `src/*`
- All imports must use `.js` extension (NodeNext module resolution)
- Global type declarations live in `globals.d.ts`

## Error Handling Patterns

- Wrap async calls with `Future.fromPromise()` from `@swan-io/boxed`
- On error: call `captureException()` + `debug()` + `spinner.fail()` + `process.exit(code)`
- Use `Option.fromNullable()` for nullable values
- Use `.match({ Ok, Error })` for branching on `Future` results
- Use `ts-pattern` `match().with().exhaustive()` for discriminated unions (e.g., target type)

## File Map

- `src/index.ts` — entry point: parses CLI args, orchestrates scaffolding flow (download, extract, copy, git init, pnpm install, target-specific scripts)
- `src/functions.ts` — core functions: `checkEnv`, `downloadAndSaveRepoTarball`, `extractTemplateFolder`, `copyFilesToNewProject`, `ensureExampleFile`
- `src/lib/cli.ts` — Commander program definition with CLI options (`--branch`, `--type`, `--skip-install`, `--skip-git-init`, `--verbose`)
- `src/lib/conf.ts` — persistent user config via `conf` package (stores `allowTelemetry`)
- `src/lib/debug.ts` — verbose-only logging, reads `global.isVerbose`
- `src/lib/repos.ts` — repo URLs and default branches for web/native targets, exports `Target` type
- `src/lib/sentry.ts` — Sentry init and `captureException`, respects telemetry opt-in
- `src/lib/spinner.ts` — shared `ora` spinner instance
- `src/target/web/index.ts` — post-setup for web target (prints docs link)
- `src/target/native/index.ts` — post-setup for native target (placeholder with TODOs)
- `globals.d.ts` — global type declarations (`isVerbose`)
- `biome.json` — Biome linter/formatter config
- `lefthook.yml` — git hooks config
