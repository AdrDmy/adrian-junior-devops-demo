# adrian-junior-devops-demo

A minimal Node.js + Express service with a full CI/CD pipeline, used as a
runnable companion to the design submission in
`cloudfide-task-adrian-dmytryk/task2-cicd/`. The point of this repo is to
prove the workflows in the submission actually run — not just look right
on paper.

## What's here

| File | Purpose |
|---|---|
| `server.js` | Express app exposing `/health`, `/version`, `/` (with graceful `SIGTERM`). |
| `test/server.test.js` | Three endpoint tests using Node's built-in `node:test`. |
| `eslint.config.js` | ESLint 9 flat config. |
| `Dockerfile` | Multi-stage build → distroless nonroot final image. |
| `.dockerignore` | Keeps the build context small. |
| `.github/workflows/pr-checks.yaml` | Runs on every PR: lint, unit tests, CodeQL SAST, `npm audit`, hadolint, image build + Trivy scan (no push). |
| `.github/workflows/build-and-deploy.yaml` | Runs on push to `main`: builds the image with `provenance` + `sbom`, runs Trivy, pushes to GHCR under an immutable `<shortSHA>-<timestamp>` tag. |

The infra-repo bump + Argo CD sync + smoke-test steps from the original
design are intentionally out of scope here — they require infrastructure
(separate infra repo, Argo CD instance, real cluster) that doesn't exist
for this demo. Those parts live as concept artifacts in the submission.

## Run locally

```sh
npm ci
npm run lint
npm test
npm run audit:ci
npm start                                       # http://localhost:3000

# With Docker
docker build -t demo:local \
  --build-arg GIT_SHA=$(git rev-parse --short HEAD) \
  --build-arg APP_VERSION=local-test \
  --build-arg BUILD_DATE=$(date -u +%Y%m%dT%H%M%SZ) .
docker run --rm -p 3000:3000 demo:local
curl -sf http://localhost:3000/version
```

## CI proof

After the first PR + merge, links land here:

- Latest CI run: <https://github.com/AdrDmy/adrian-junior-devops-demo/actions>
- Published image: <https://github.com/AdrDmy/adrian-junior-devops-demo/pkgs/container/adrian-junior-devops-demo>
