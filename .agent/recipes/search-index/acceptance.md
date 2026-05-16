# Search Index Acceptance Checklist

- [ ] `src/data/search-index.json` exists and has at least six useful entries.
- [ ] Index entries cover contracts, recipes, and artifacts.
- [ ] Search filters visible cards.
- [ ] Type filter buttons work.
- [ ] All hrefs are hash links or HTTPS URLs.
- [ ] No secrets, credentials, private data, analytics, auth, API keys, or unsupported AI/live-search claims.
- [ ] `npm run build:search-index`, `npm run check:search-index`, and `npm run qa:full` pass.
