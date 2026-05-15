# Initial site build plan

## Request implemented
Create a premium static landing page for AgentSite Pilot, an experimental service for turning natural-language website requests into agent-maintained GitHub Pages links.

## Steps actually taken
1. Checked local tooling and GitHub CLI authentication.
2. Created a new Astro static project structure under `/home/alxndrc/agentsite-pilot-test`.
3. Added contract files in `.agent/` before deployment:
   - site contract
   - brand contract
   - disabled payment contract
   - deployment and feature-request runbooks
4. Built a restrained developer/control-plane landing page with sections for hero, workflow, status, QA gates, maintenance, and next request CTA.
5. Added lightweight Node QA checks for contracts, claims, SEO, and links.
6. Added GitHub Actions Pages deployment workflow.
7. Ran local QA and build.
8. Created a public GitHub repository, pushed `main`, enabled GitHub Pages via Actions, and verified the live page.

## Next improvement plan
- Add a reusable project generator for the contract files and QA scripts.
- Add screenshot capture and visual regression checks for mobile and desktop.
- Create a structured intake schema that can be filled from natural language.
- Add a deployment verifier script that polls GitHub Pages and records evidence automatically.
- Turn this manual plan into a template playbook for future subagents.
