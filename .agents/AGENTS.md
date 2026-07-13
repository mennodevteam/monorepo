# Project Rules for Menno Nx Monorepo

## Use graphify First
Always look for `graphify-out/graph.json` before performing searches or answering questions about the codebase architecture, file relationships, or project content.
- If it exists, use `/graphify query "<question>"` to trace dependencies and navigate.
- Refrain from doing manual folder-wide greps if the graph can explain the relationship.

## Deprecated Projects / پروژه‌های دپریکیت شده
The projects `admin`, `new-admin`, `app`, `new-app`, and `landing` are deprecated. Do not consider them or make changes to them unless explicitly asked by the user.
پروژه‌های `admin`، `new-admin`، `app`، `new-app` و `landing` دپریکیت شده‌اند. از ایجاد تغییر در آن‌ها یا در نظر گرفتنشان در وظایف خودداری کنید، مگر اینکه کاربر مستقیماً چنین درخواستی داشته باشد.

