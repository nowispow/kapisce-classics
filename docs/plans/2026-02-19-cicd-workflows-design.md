# CI/CD Workflows Design

**Date:** 2026-02-19
**Status:** Approved
**Author:** Claude Code

## Overview

This document describes the CI/CD pipeline design for the Kapisce Classics Astro static site. The pipeline supports PR preview deployments and production deployments via Gitea workflows, with nginx Docker containers serving the built static assets.

## Goals

- Automated PR preview deployments for development branch merges to main
- Automated production deployments on version tag releases
- Separate infrastructure for preview (2GB VM) and production (dedicated VM)
- Automatic cleanup of preview containers when PRs close
- Zero-downtime production deployments with automatic restart on reboot

## Architecture Overview

### Workflow Files

**1. `.gitea/workflows/pr-workflow.yml`** - PR Lifecycle Management
- **Triggers:** `pull_request` events with types `[opened, synchronize, reopened, closed]` targeting `main` branch
- **Runner:** `runs-on: self-hosted` (2GB VM)
- **Jobs:**
  - **Preview Job** (conditional: `github.event.action != 'closed'`)
    - Builds and deploys preview on PR open/update
  - **Cleanup Job** (conditional: `github.event.action == 'closed'`)
    - Stops and removes preview container when PR closes/merges

**2. `.gitea/workflows/production-deploy.yml`** - Production Deployment
- **Triggers:** Push to tags matching `v*` pattern (e.g., `v1.0.0`)
- **Runner:** `runs-on: [self-hosted, production]` (dedicated production VM)
- **Jobs:**
  - Single deployment job that builds and deploys to production

### Deployment Targets

| Environment | Container Name | Port Mapping | VM | Restart Policy |
|-------------|----------------|--------------|-----|----------------|
| PR Preview | `kapisce-preview-pr-<PR_NUMBER>` | Host 20001 → Container 80 | 2GB VM | None (ephemeral) |
| Production | `kapisce-production` | Host 21001 → Container 80 | Production VM | `--restart=always` |

Both environments use `nginx:alpine` Docker images with read-only volume mounts to the built `dist/` directory.

## Workflow Structure & Steps

### PR Workflow - Preview Job

Runs when: PR opened, synchronized, or reopened

```yaml
steps:
1. Checkout code
2. Setup Node.js 20 with npm cache
3. Install dependencies (npm install)
4. Build Astro project (npm run build)
5. Stop existing preview container (if exists)
6. Remove existing preview container (if exists)
7. Deploy new nginx container:
   - Name: kapisce-preview-pr-${{ github.event.number }}
   - Volume: $(pwd)/dist:/usr/share/nginx/html:ro
   - Port: 20001:80
   - No restart policy
```

### PR Workflow - Cleanup Job

Runs when: PR closed or merged

```yaml
steps:
1. Stop preview container by PR number
2. Remove preview container by PR number
```

Uses `|| true` for idempotency (handles already-stopped containers gracefully).

### Production Workflow

Runs when: Version tag pushed (e.g., `v1.0.0`)

```yaml
steps:
1. Checkout code
2. Setup Node.js 20 with npm cache
3. Install dependencies (npm install)
4. Build Astro project (npm run build)
5. Stop existing production container (if running)
6. Remove existing production container (if exists)
7. Deploy new nginx container:
   - Name: kapisce-production
   - Volume: $(pwd)/dist:/usr/share/nginx/html:ro
   - Port: 21001:80
   - Restart policy: --restart=always
```

## Configuration & Infrastructure

### Gitea Secrets

**None required.** Both runners are self-hosted and deploy locally via Docker. No SSH keys or external credentials needed.

### Runner Requirements

**Preview Runner (2GB VM):**
- Label: `self-hosted` (default)
- Docker installed with runner user permissions
- Port 20001 available
- Sufficient disk space for workspace and Docker images

**Production Runner (Production VM):**
- Labels: `self-hosted, production`
- Docker installed with runner user permissions
- Port 21001 available
- Sufficient resources for production builds

### Workspace Management

- Both workflows build in the runner's workspace directory
- The `dist/` directory is volume-mounted into nginx containers (read-only)
- Old `dist/` directories are automatically overwritten by new builds
- Workspace cleanup is handled by Gitea runner automatically

### Container Lifecycle

**PR Preview Containers:**
- No restart policy (ephemeral)
- Should not survive VM reboots
- Explicitly stopped and removed on PR close
- Single active preview at a time (dev → main workflow)

**Production Container:**
- `--restart=always` policy (survives reboots)
- Replaced on each deployment (stop old, start new)
- Always running unless explicitly stopped

## Error Handling & Edge Cases

### Build Failures

- If `npm install` or `npm run build` fails, workflow stops and reports failure
- No deployment occurs on build failure
- **For PRs:** Previous preview container remains running until successful build
- **For production:** Existing production container keeps running until successful build
- This provides stability - broken builds don't take down working deployments

### Docker Conflicts

**Port Conflicts:**
- If port 20001 (preview) or 21001 (production) is already in use by a non-workflow container, deployment fails with clear error
- Manual intervention required to resolve

**Container Name Conflicts:**
- Prevented by stopping/removing existing containers before creating new ones
- All `docker stop` and `docker rm` commands use `|| true` for idempotency

### Multiple/Concurrent PRs

**Design Assumption:** Single active PR (dev → main branch workflow)

- If multiple PRs exist, most recently updated PR takes over port 20001
- Previous preview container is stopped/removed
- Cleanup job uses PR number to target specific container, preventing accidental removal of wrong preview

### Stale Preview Containers

- If cleanup workflow fails, preview container may persist
- Container naming pattern `kapisce-preview-pr-<number>` makes manual cleanup easy
- Production workflow never touches preview containers (different naming convention)

### Runner Availability

- **Preview runner down:** PR builds fail (expected behavior)
- **Production runner down:** Production deploys fail
  - Can be retried by pushing the tag again or creating a new tag

## Deployment Flow Examples

### PR Preview Deployment

```
1. Developer opens PR: dev → main
2. Gitea triggers pr-workflow.yml (preview job)
3. Workflow runs on self-hosted runner (2GB VM)
4. Builds Astro site, creates dist/
5. Stops/removes any existing preview container
6. Starts new nginx container on port 20001
7. Preview accessible at http://<vm-ip>:20001
```

### PR Cleanup

```
1. Developer merges/closes PR
2. Gitea triggers pr-workflow.yml (cleanup job)
3. Workflow stops kapisce-preview-pr-<number> container
4. Workflow removes container
5. Port 20001 freed for next preview
```

### Production Deployment

```
1. Developer pushes tag: git tag v1.0.0 && git push origin v1.0.0
2. Gitea triggers production-deploy.yml
3. Workflow runs on production runner (production VM)
4. Builds Astro site, creates dist/
5. Stops/removes existing production container
6. Starts new nginx container on port 21001 with --restart=always
7. Production site accessible at http://<prod-vm-ip>:21001
8. Container automatically restarts on VM reboot
```

## Non-Goals

- SSL/TLS termination (handled externally if needed)
- Blue-green deployments (simple stop-and-replace is sufficient)
- Health checks or rollback automation (manual verification acceptable)
- Multi-site hosting (single site per environment)
- Preview cleanup by age (explicit PR close cleanup only)

## Future Considerations

- If multiple concurrent PRs become common, implement dynamic port allocation (e.g., port 2000 + PR number)
- If preview runner disk fills up, add periodic cleanup of old Docker images
- If production needs zero-downtime deploys, implement blue-green pattern with two containers and port swapping
- If HTTPS is needed, mount SSL certificates and use nginx:alpine with custom config

## Success Criteria

- ✅ PR opens → preview deploys automatically within 3-5 minutes
- ✅ PR closes → preview container removed automatically
- ✅ Version tag pushed → production deploys automatically within 3-5 minutes
- ✅ Production container survives VM reboots
- ✅ Build failures don't take down existing deployments
- ✅ Multiple deploys to same environment are idempotent
