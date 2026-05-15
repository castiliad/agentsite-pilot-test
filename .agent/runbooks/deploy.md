# Deployment runbook

## Target
GitHub Pages serves the static Astro build from the GitHub Actions artifact.

## Normal deployment
1. Confirm contracts and QA pass:
   ```bash
   npm run qa
   ```
2. Commit changes to `main`.
3. Push to GitHub.
4. GitHub Actions runs `.github/workflows/deploy.yml`.
5. Verify the live URL contains the hero text: `Ask for a website in natural language`.

## Manual verification commands
```bash
gh run list --workflow deploy.yml --limit 3
curl -L https://castiliad.github.io/agentsite-pilot-test/ | grep "Ask for a website in natural language"
```

## Rollback
Revert the problematic commit, run QA, and push `main` again. Do not rewrite public history unless explicitly approved.
