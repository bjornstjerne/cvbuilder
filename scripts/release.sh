#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi

MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then
  echo "Usage: npm run release -- \"your commit message\""
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ]; then
  echo "Error: could not determine current branch."
  exit 1
fi

# Stage all tracked/untracked changes in the repo.
git add -A

# Skip commit/push if no staged changes.
if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "$MESSAGE"
  git push origin "$BRANCH"
fi

# Deploy latest local state to production.
npx vercel --prod --yes
