# FitQuest Daily Commands Cheat Sheet

## Most Common Commands (99% of cases)

### Start of Each Work Day
```bash
git pull --rebase
```

### After Development, Ready to Deploy
```bash
# Commit code
git add . && git commit -m "describe your changes" && git push

# One-click deployment (Recommended)
./quick-deploy.sh
```

### Deploy Backend Only
```bash
./quick-deploy.sh backend
```

### Restart Frontend Only
```bash
./quick-deploy.sh frontend
```

## Specific Scenarios

### Scenario 1: Modified Backend API
```bash
git add . && git commit -m "fix: fix login API" && git push
./quick-deploy.sh backend
```

### Scenario 2: Modified Frontend UI
```bash
git add . && git commit -m "feat: add user avatar" && git push
./quick-deploy.sh frontend
```

### Scenario 3: Modified Environment Variables
```bash
cd backend
./fix-cloud-run-env.sh
```

### Scenario 4: Teammate Pushed New Code
```bash
git pull --rebase
./quick-deploy.sh
```

## Super Quick Commands

```bash
# One-liner: commit and deploy
git add . && git commit -m "update" && git push && ./quick-deploy.sh backend

# Check service status
curl https://comp90018-t8-g2.web.app/api/health
```

## When Things Go Wrong

```bash
# Check backend logs
gcloud logs tail --service=fitquest-api

# Redeploy
./quick-deploy.sh backend

# Check environment variables
cd backend && ./fix-cloud-run-env.sh
```

---

**Remember: 90% of the time, you just need to run `./quick-deploy.sh` and that's it!**
