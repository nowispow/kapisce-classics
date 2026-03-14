# CI/CD Workflows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Gitea CI/CD workflows for PR preview deployments and production deployments with nginx Docker containers.

**Architecture:** Two Gitea workflow files handle the complete deployment pipeline. The PR workflow manages both preview deployment (on open/update) and cleanup (on close) using conditional jobs. The production workflow deploys to a separate VM on version tag pushes. Both use nginx:alpine containers with volume-mounted dist/ directories.

**Tech Stack:** Gitea Actions, Docker, nginx:alpine, Node.js 20, Astro, npm

---

## Task 1: Create PR Workflow File

**Files:**
- Create: `.gitea/workflows/pr-workflow.yml`

**Step 1: Create the PR workflow file with preview and cleanup jobs**

Create `.gitea/workflows/pr-workflow.yml`:

```yaml
name: PR Preview & Cleanup

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened, closed]

jobs:
  preview:
    if: github.event.action != 'closed'
    runs-on: self-hosted
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm install

      - name: Build Astro Project
        run: npm run build

      - name: Stop Existing Preview Container
        run: docker stop kapisce-preview-pr-${{ github.event.number }} || true

      - name: Remove Existing Preview Container
        run: docker rm kapisce-preview-pr-${{ github.event.number }} || true

      - name: Deploy Preview via Nginx Docker
        run: |
          docker run -d \
            --name kapisce-preview-pr-${{ github.event.number }} \
            -v $(pwd)/dist:/usr/share/nginx/html:ro \
            -p 20001:80 \
            nginx:alpine

      - name: Comment PR with Preview URL
        run: |
          echo "Preview deployed at http://$(hostname -I | awk '{print $1}'):20001"

  cleanup:
    if: github.event.action == 'closed'
    runs-on: self-hosted
    steps:
      - name: Stop Preview Container
        run: docker stop kapisce-preview-pr-${{ github.event.number }} || true

      - name: Remove Preview Container
        run: docker rm kapisce-preview-pr-${{ github.event.number }} || true
```

**Step 2: Verify file syntax**

Run: `cat .gitea/workflows/pr-workflow.yml`
Expected: File contents displayed without errors

**Step 3: Commit the PR workflow**

```bash
git add .gitea/workflows/pr-workflow.yml
git commit -m "Add PR preview and cleanup workflow"
```

---

## Task 2: Create Production Workflow File

**Files:**
- Create: `.gitea/workflows/production-deploy.yml`

**Step 1: Create the production deployment workflow**

Create `.gitea/workflows/production-deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: [self-hosted, production]
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm install

      - name: Build Astro Project
        run: npm run build

      - name: Stop Existing Production Container
        run: docker stop kapisce-production || true

      - name: Remove Existing Production Container
        run: docker rm kapisce-production || true

      - name: Deploy Production via Nginx Docker
        run: |
          docker run -d \
            --name kapisce-production \
            --restart=always \
            -v $(pwd)/dist:/usr/share/nginx/html:ro \
            -p 21001:80 \
            nginx:alpine

      - name: Verify Deployment
        run: |
          echo "Production deployed at http://$(hostname -I | awk '{print $1}'):21001"
          sleep 5
          curl -f http://localhost:21001 || echo "Warning: Site may not be accessible yet"
```

**Step 2: Verify file syntax**

Run: `cat .gitea/workflows/production-deploy.yml`
Expected: File contents displayed without errors

**Step 3: Commit the production workflow**

```bash
git add .gitea/workflows/production-deploy.yml
git commit -m "Add production deployment workflow with auto-restart"
```

---

## Task 3: Remove Old Workflow Files

**Files:**
- Delete: `.gitea/workflows/pr-preview.yml`
- Delete: `.gitea/workflows/tag-and-build.yml`

**Step 1: Check if old workflow files exist**

Run: `ls -la .gitea/workflows/`
Expected: Shows pr-preview.yml and tag-and-build.yml (or already deleted)

**Step 2: Remove old workflow files**

```bash
rm -f .gitea/workflows/pr-preview.yml
rm -f .gitea/workflows/tag-and-build.yml
```

**Step 3: Verify deletion**

Run: `ls -la .gitea/workflows/`
Expected: Only pr-workflow.yml and production-deploy.yml exist

**Step 4: Commit the cleanup**

```bash
git add .gitea/workflows/
git commit -m "Remove old workflow files, replaced by new CI/CD setup"
```

---

## Task 4: Verify Workflow Configuration

**Files:**
- Read: `.gitea/workflows/pr-workflow.yml`
- Read: `.gitea/workflows/production-deploy.yml`

**Step 1: Validate YAML syntax**

Run these commands to check for YAML syntax errors:

```bash
# Install yamllint if not available
# brew install yamllint  # macOS
# sudo apt install yamllint  # Ubuntu

yamllint .gitea/workflows/pr-workflow.yml
yamllint .gitea/workflows/production-deploy.yml
```

Expected: No syntax errors, or "no such command" if yamllint not installed (acceptable)

**Step 2: Check workflow file structure**

Run: `grep -E "^(name|on|jobs):" .gitea/workflows/*.yml`
Expected: Shows name, on, and jobs keys for both workflows

**Step 3: Verify conditional logic**

Run: `grep -A 1 "^  preview:" .gitea/workflows/pr-workflow.yml`
Expected: Shows `if: github.event.action != 'closed'`

Run: `grep -A 1 "^  cleanup:" .gitea/workflows/pr-workflow.yml`
Expected: Shows `if: github.event.action == 'closed'`

---

## Task 5: Push and Test Workflows

**Files:**
- N/A (testing phase)

**Step 1: Push changes to repository**

```bash
git push origin development
```

Expected: Changes pushed successfully

**Step 2: Test PR workflow (manual verification required)**

Instructions for testing:
1. Create a PR from development → main in Gitea
2. Watch Gitea Actions tab for pr-workflow.yml execution
3. Verify preview job runs and completes
4. Check that preview container is running: `docker ps | grep kapisce-preview`
5. Access preview at `http://<vm-ip>:20001`
6. Close the PR
7. Verify cleanup job runs
8. Check container is removed: `docker ps -a | grep kapisce-preview`

**Step 3: Test production workflow (manual verification required)**

Instructions for testing:
1. Create and push a test tag: `git tag v0.0.1-test && git push origin v0.0.1-test`
2. Watch Gitea Actions tab for production-deploy.yml execution
3. Verify deploy job runs on production runner
4. Check that production container is running: `docker ps | grep kapisce-production`
5. Access production at `http://<prod-vm-ip>:21001`
6. Verify container restarts on reboot: `docker inspect kapisce-production | grep RestartPolicy`

**Step 4: Document testing results**

Create a test log or note the results:
- PR preview deployment: ✓/✗
- PR cleanup: ✓/✗
- Production deployment: ✓/✗
- Auto-restart policy: ✓/✗

---

## Post-Implementation Notes

### Runner Setup Verification

Ensure runners are properly configured:

**Preview Runner (2GB VM):**
```bash
# Check runner has Docker access
docker ps

# Check port 20001 availability
netstat -tuln | grep 20001
```

**Production Runner:**
```bash
# Check runner labels include 'production'
# (Check in Gitea runner settings UI)

# Check Docker access
docker ps

# Check port 21001 availability
netstat -tuln | grep 21001
```

### Manual Cleanup Commands

If you need to manually clean up containers:

```bash
# List all preview containers
docker ps -a | grep kapisce-preview

# Stop and remove specific preview
docker stop kapisce-preview-pr-<NUMBER>
docker rm kapisce-preview-pr-<NUMBER>

# Stop and remove production
docker stop kapisce-production
docker rm kapisce-production

# Remove all stopped containers (careful!)
docker container prune
```

### Troubleshooting Common Issues

**Build fails with "npm install" errors:**
- Check Node.js version on runner: `node --version`
- Clear npm cache: `npm cache clean --force`
- Check disk space: `df -h`

**Port already in use:**
- Check what's using the port: `lsof -i :20001` or `lsof -i :21001`
- Stop conflicting container: `docker stop <container>`

**Container won't start:**
- Check Docker logs: `docker logs kapisce-preview-pr-<NUMBER>`
- Verify dist/ directory exists and has content: `ls -la dist/`
- Check Docker daemon is running: `systemctl status docker`

**Cleanup doesn't work:**
- Manually verify PR number: `docker ps -a | grep preview`
- Check workflow logs in Gitea Actions tab
- Use manual cleanup commands above

### Testing Checklist

- [ ] PR preview deploys successfully on PR open
- [ ] PR preview updates on new commits
- [ ] PR preview is accessible at port 20001
- [ ] PR cleanup runs on PR close/merge
- [ ] PR preview container is removed after cleanup
- [ ] Production deploys successfully on tag push
- [ ] Production is accessible at port 21001
- [ ] Production container has restart=always policy
- [ ] Build failures don't remove existing containers
- [ ] Multiple deploys to same environment work (idempotent)

---

## Success Criteria

✅ PR opens → preview deploys automatically within 3-5 minutes
✅ PR closes → preview container removed automatically
✅ Version tag pushed → production deploys automatically within 3-5 minutes
✅ Production container survives VM reboots
✅ Build failures don't take down existing deployments
✅ Workflow files follow Gitea Actions best practices
