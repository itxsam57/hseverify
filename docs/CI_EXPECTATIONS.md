# CI Expectations

The `Worker foundation checks` workflow installs pinned dependencies and executes `npm run check`. A passing workflow confirms route-manifest validation, strict TypeScript checking, ESLint validation and a Next.js production build for the pull-request commit.

Until that workflow succeeds, local syntax and manifest checks are evidence of source review only, not a complete production-build validation.
