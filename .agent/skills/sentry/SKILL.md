---
name: sentry
description: |
  Provides tools and instructions for inspecting production Sentry issues, events, errors, stacktraces, and project metrics using the local Sentry token.
---

# Sentry Skill for Menno Monorepo

This skill provides guidelines and API commands for querying Sentry (`https://sentry.hamravesh.com`) to inspect production errors, stack traces, and issue trends.

## Authentication
The Sentry personal token is stored locally in `.sentry_token` (git-ignored).

To read the token in terminal commands:
```bash
SENTRY_TOKEN=$(cat .sentry_token)
```

## Sentry API Endpoints

- **Sentry URL**: `https://sentry.hamravesh.com`
- **Organization Slug**: `menno`
- **Projects**:
  - `backend` (id: 10302)
  - `customer` (id: 10303)

### 1. List Projects
```bash
curl -s -H "Authorization: Bearer $(cat .sentry_token)" "https://sentry.hamravesh.com/api/0/organizations/menno/projects/"
```

### 2. List Recent Issues for a Project
```bash
# Customer app issues
curl -s -H "Authorization: Bearer $(cat .sentry_token)" "https://sentry.hamravesh.com/api/0/projects/menno/customer/issues/?statsPeriod=14d&query=is:unresolved"

# Backend issues
curl -s -H "Authorization: Bearer $(cat .sentry_token)" "https://sentry.hamravesh.com/api/0/projects/menno/backend/issues/?statsPeriod=14d&query=is:unresolved"
```

### 3. Get Issue Details & Stack Trace
```bash
curl -s -H "Authorization: Bearer $(cat .sentry_token)" "https://sentry.hamravesh.com/api/0/issues/<issue_id>/"
curl -s -H "Authorization: Bearer $(cat .sentry_token)" "https://sentry.hamravesh.com/api/0/issues/<issue_id>/events/latest/"
```
