# Feature request runbook

1. Capture the requester language verbatim.
2. Translate it into:
   - audience
   - desired sections
   - claims allowed
   - claims explicitly not allowed
   - deployment or maintenance constraints
3. Check against `.agent/site.contract.yaml`, `.agent/brand.contract.yaml`, and `.agent/payment.contract.yaml`.
4. If the request touches approval-required areas from `AGENTS.md`, stop and request approval.
5. Add or update a plan in `.hermes/plans/` for non-trivial work.
6. Implement in small commits when practical.
7. Run `npm run qa` and capture the result in the handoff.
8. Verify GitHub Pages after deployment.
