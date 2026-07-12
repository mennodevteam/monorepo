---
name: doc-sync-and-clarity
description: |
  Ensures that the agent thoroughly reads documentation before executing tasks, updates relevant documentation (such as READMEs, rules, architecture guides, and internal docs) when finalizing changes, and proactively asks the user clarifying questions to resolve any ambiguity.
---

# Documentation Alignment & User Clarity Skill

This skill enforces strict documentation standards and clear user communication guidelines for all development tasks in the workspace.

## Objectives
1. **Read Wisely**: Proactively find and read documentation before writing any code.
2. **Sync & Document**: Update/refine documentation as part of completing any task.
3. **Clarify Proactively**: Prevent errors and assumptions by asking the user clarifying questions.

---

## 1. Reading Documentation First

Before starting any implementation, bug fix, or refactoring task:
- **Use graphify:** Check if `graphify-out/graph.json` exists in the project root. If it does, always check the graph first using `graphify query "<question>"` to understand the dependencies, architecture, and code flow related to the task before writing code or running broad searches.
- Locate relevant files in the workspace (e.g., `README.md`, `ARCHITECTURE.md`, `.agent/rules/*.md`, `.agent/skills/*`).
- Check existing `knowledge/` items or conversation summaries to learn about past decisions.
- Read through files to align with existing design systems, directory structures, and code patterns.

---

## 2. Syncing and Updating Documentation

When finalizing a task (before marking it complete):
- Review your code changes and identify which documents (e.g., APIs, architectural design, component descriptions, setup commands) need to be updated to match the new reality.
- Make necessary edits to markdown documentation or comments.
- If you introduced new rules or patterns, document them under the `.agent/rules/` directory or in the corresponding package README.

---

## 3. Communication and Clarification

To ensure high alignment with the user:
- If a user request is ambiguous, do not assume or guess.
- Ask targeted, easy-to-understand questions.
- Prefer formatting questions as direct multiple-choice options or bullet points.
- Respond in the user's preferred language (e.g., Persian) to maintain natural and smooth alignment.
