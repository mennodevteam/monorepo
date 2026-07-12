# Project Rules for Menno Nx Monorepo

## Use graphify First
Always look for `graphify-out/graph.json` before performing searches or answering questions about the codebase architecture, file relationships, or project content.
- If it exists, use `/graphify query "<question>"` to trace dependencies and navigate.
- Refrain from doing manual folder-wide greps if the graph can explain the relationship.
