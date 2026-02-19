# CI/CD Workflows Test Plan

**Date:** 2026-02-19
**Purpose:** Verify PR preview and production deployment workflows function correctly

---

## Prerequisites

Before testing, ensure:

- [ ] Gitea runners are online and registered
  - Preview runner: Label `self-hosted` on 2GB VM
  - Production runner: Labels `self-hosted, production` on production VM
- [ ] Both runners have Docker installed and accessible
- [ ] Ports available:
  - Preview VM: Port 20001
  - Production VM: Port 21001
- [ ] Development branch pushed to origin with all workflow files

---

## Test 1: PR Preview Deployment

**Objective:** Verify PR creation triggers preview deployment on port 20001

### Steps:

1. **Create Pull Request**
   ```
   Navigate to Gitea: https://git.kapisce.com/selipso/kapisce-classics
   Create PR: development → main
   ```

2. **Monitor Workflow**
   - Go to Actions tab in Gitea
   - Locate `pr-workflow.yml` execution
   - Verify "preview" job starts

3. **Check Workflow Logs**
   - Click on the running workflow
   - Verify each step completes:
     - ✓ Checkout Code
     - ✓ Setup Node.js
     - ✓ Install Dependencies
     - ✓ Build Astro Project
     - ✓ Stop/Remove Existing Container
     - ✓ Deploy Preview via Nginx
     - ✓ Log Preview URL

4. **Verify Container Running**
   ```bash
   # SSH to preview VM
   docker ps | grep kapisce-preview
   ```
   **Expected:** One container named `kapisce-preview-pr-<NUMBER>` running

5. **Access Preview Site**
   ```
   http://<preview-vm-ip>:20001
   ```
   **Expected:** Site loads correctly, displays Astro content

6. **Update PR (Test Re-deployment)**
   - Push a new commit to development branch
   - Verify workflow runs again
   - Confirm preview updates with new content

### Expected Results:
- [ ] Workflow completes successfully (green checkmark)
- [ ] Preview container running on port 20001
- [ ] Site accessible and displays correctly
- [ ] Updates trigger re-deployment

### Troubleshooting:
- If workflow fails at "Install Dependencies": Check Node.js version on runner
- If container won't start: Check port 20001 not in use (`netstat -tuln | grep 20001`)
- If site doesn't load: Check Docker logs (`docker logs kapisce-preview-pr-<NUMBER>`)

---

## Test 2: PR Cleanup

**Objective:** Verify PR closure removes preview container

### Steps:

1. **Close or Merge PR**
   - Close the test PR (or merge it)

2. **Monitor Cleanup Workflow**
   - Go to Actions tab
   - Locate new `pr-workflow.yml` execution
   - Verify "cleanup" job runs (not "preview" job)

3. **Check Cleanup Logs**
   - Click on cleanup workflow
   - Verify steps:
     - ✓ Stop Preview Container
     - ✓ Remove Preview Container

4. **Verify Container Removed**
   ```bash
   # SSH to preview VM
   docker ps -a | grep kapisce-preview
   ```
   **Expected:** No preview containers found

5. **Verify Port Released**
   ```bash
   netstat -tuln | grep 20001
   ```
   **Expected:** Port 20001 not in use

### Expected Results:
- [ ] Cleanup workflow completes successfully
- [ ] Preview container stopped and removed
- [ ] Port 20001 released

### Troubleshooting:
- If container persists: Manually remove with `docker stop <name> && docker rm <name>`
- If cleanup workflow doesn't trigger: Check PR event types in workflow file

---

## Test 3: Production Deployment

**Objective:** Verify version tag triggers production deployment on port 21001

### Steps:

1. **Create and Push Version Tag**
   ```bash
   git tag v0.0.1-test
   git push origin v0.0.1-test
   ```

2. **Monitor Production Workflow**
   - Go to Actions tab
   - Locate `production-deploy.yml` execution
   - Verify job runs on production runner

3. **Check Workflow Logs**
   - Click on running workflow
   - Verify each step completes:
     - ✓ Checkout Code
     - ✓ Setup Node.js
     - ✓ Install Dependencies
     - ✓ Build Astro Project
     - ✓ Stop/Remove Existing Container
     - ✓ Deploy Production via Nginx
     - ✓ Verify Deployment

4. **Verify Container Running**
   ```bash
   # SSH to production VM
   docker ps | grep kapisce-production
   ```
   **Expected:** Container named `kapisce-production` running on port 21001

5. **Access Production Site**
   ```
   http://<production-vm-ip>:21001
   ```
   **Expected:** Site loads correctly

6. **Verify Auto-Restart Policy**
   ```bash
   docker inspect kapisce-production | grep RestartPolicy -A 2
   ```
   **Expected:** Shows `"Name": "always"`

7. **Test Auto-Restart (Optional)**
   ```bash
   # Restart Docker daemon
   sudo systemctl restart docker

   # Wait a few seconds, then check
   docker ps | grep kapisce-production
   ```
   **Expected:** Container automatically restarted

### Expected Results:
- [ ] Workflow runs on production runner (not preview runner)
- [ ] Production container running on port 21001
- [ ] Site accessible and displays correctly
- [ ] Restart policy set to "always"
- [ ] Container survives Docker daemon restart

### Troubleshooting:
- If wrong runner executes: Check runner labels in Gitea settings
- If build fails: Check disk space on production VM (`df -h`)
- If container won't start: Check port 21001 availability
- If site doesn't load: Check nginx logs in container

---

## Test 4: Idempotency

**Objective:** Verify workflows can run multiple times safely

### Steps:

1. **Deploy Production Multiple Times**
   ```bash
   git tag v0.0.2-test
   git push origin v0.0.2-test
   ```
   - Wait for completion
   - Push another tag:
   ```bash
   git tag v0.0.3-test
   git push origin v0.0.3-test
   ```

2. **Verify Smooth Replacement**
   - Check only one `kapisce-production` container exists
   - Old container was stopped and removed cleanly
   - New container is running

3. **Test Preview Idempotency**
   - Open a new PR (or reopen previous)
   - Push multiple commits rapidly
   - Verify each deployment replaces the previous one cleanly

### Expected Results:
- [ ] Multiple deployments don't create duplicate containers
- [ ] Old containers cleanly replaced
- [ ] No port conflicts
- [ ] Site remains accessible throughout

---

## Test 5: Error Handling

**Objective:** Verify graceful failure when build errors occur

### Steps:

1. **Introduce Build Failure**
   - Create a branch with a syntax error in Astro code
   - Open PR with broken code

2. **Monitor Workflow**
   - Verify workflow fails at "Build Astro Project" step
   - No deployment happens after build failure

3. **Verify Existing Container Unaffected**
   ```bash
   docker ps | grep kapisce-preview
   ```
   **Expected:** Previous preview container still running (if any)

4. **Fix and Re-deploy**
   - Fix the syntax error
   - Push fix
   - Verify workflow succeeds and deploys

### Expected Results:
- [ ] Build failures stop workflow before deployment
- [ ] Existing containers remain untouched on failure
- [ ] Fixed code deploys successfully

---

## Success Criteria

All tests must pass:

- ✅ PR opens → preview deploys on port 20001
- ✅ PR updates → preview re-deploys
- ✅ PR closes → preview container removed
- ✅ Version tag → production deploys on port 21001
- ✅ Production container has `restart=always` policy
- ✅ Multiple deployments are idempotent
- ✅ Build failures don't affect existing containers
- ✅ Both sites accessible at correct ports

---

## Post-Test Cleanup

After testing is complete:

```bash
# Remove test tags
git tag -d v0.0.1-test v0.0.2-test v0.0.3-test
git push origin --delete v0.0.1-test v0.0.2-test v0.0.3-test

# Stop and remove test containers (if any)
docker stop kapisce-production
docker rm kapisce-production

# Close/delete test PRs in Gitea
```

---

## Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Workflow doesn't trigger | Runner offline | Check runner status in Gitea Settings → Actions |
| Build fails with "command not found" | Missing dependency on runner | Install Node.js 20 on runner VM |
| Container starts but site unreachable | Firewall blocking port | Open port 20001/21001 in firewall |
| Port already in use | Previous container not cleaned up | Manually stop/remove container |
| "Permission denied" for Docker | Runner user lacks Docker access | Add runner user to docker group |
| Workflow stuck "pending" | No runner with matching labels | Verify runner labels match workflow `runs-on` |

---

## Next Steps

Once all tests pass:

1. **Merge to Main**
   - Merge development branch to main
   - This makes workflows active for production use

2. **First Production Release**
   - Tag main with first real version: `v1.0.0`
   - Monitor production deployment

3. **Document Workflow**
   - Update team documentation with new CI/CD process
   - Share testing results with team

4. **Monitor Production**
   - Set up alerts for workflow failures
   - Monitor disk space on VMs
   - Review workflow logs regularly
