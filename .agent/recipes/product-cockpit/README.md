# Product Cockpit recipe

`product-cockpit` is a static AgentSite pattern for pages that should feel like an operating room: clear status, crisp context, visible proof, explicit constraints, and one safe next step.

## Use it when

- The brief describes a product, service, internal tool, launch, or pilot that needs a premium landing page.
- Visitors need to understand what the thing is, who it serves, what evidence exists, and what action to take.
- The site can be built from static copy, repo-local artifacts, documented screenshots, contracts, or user-provided facts.

## Avoid it when

- The requester expects real-time metrics, live dashboards, account data, or operational telemetry.
- The content depends on unverified customer outcomes, testimonials, logos, or performance claims.
- The project requires payment, analytics, authentication, a database, or server runtime and those changes have not been approved in the contracts.

## Suggested page composition

1. **Hero cockpit** — short promise, audience marker, static/no-payment boundary when relevant, and primary CTA.
2. **Operating context** — what decision this page helps a visitor make.
3. **Cockpit panels** — compact cards for status, workflow, proof, constraints, and handoff evidence.
4. **Proof artifacts** — real repo-local files, contracts, QA commands, screenshots, or provided facts.
5. **Boundaries** — what is draft, planned, not live, not connected, or approval-required.
6. **Next step** — one CTA that is safe under the current contracts.

## Visual guidance

The default visual preset is `cockpit-dark`: dark premium background, high-contrast editorial type, mono labels, panel borders, restrained accent colors, and dashboard-inspired grouping. It should signal operational clarity, not fake live telemetry.

## Copy rules

- Prefer concrete labels such as "contract", "runbook", "QA command", "static build", and "approval required".
- Use "planned", "draft", or "proposed" for anything not implemented.
- Do not invent numbers, customers, screenshots, integrations, or performance outcomes.
- Avoid terms like "live status", "real-time", or "automated telemetry" unless they are literally true and contract-approved.

## Minimal config example

```json
{
  "name": "Example Product",
  "repo": "example-product",
  "owner": "example-owner",
  "brief": "Static landing page for an example product pilot.",
  "out": "./example-product",
  "recipes": ["product-cockpit"],
  "visualPreset": "cockpit-dark"
}
```

The generator now renders this UI automatically when config includes `recipes: ["product-cockpit"]`, `visualPreset: "cockpit-dark"`, or `visualPreset: "product-cockpit"`. Default generation remains unchanged when the recipe/preset is not selected.
