# Demo Data & Showcase Procedure Plan

- [x] Create a Node.js-based seed script (`scripts/seed.js`) that uses the same data as `seed_data.js` and `comprehensive_seed.js`. Using Node avoids Docker `mongosh` idiosyncrasies and is more robust.
- [x] Update `package.json` to include an `npm run db:seed` command.
- [x] Provide the user with a step-by-step Demo Showcase procedure (Markdown format) exactly detailing the UI flow and what to say/show for each screen.
- [x] Ensure all mock data maps appropriately to the UI (Alerts, Dashboard, Incident Response) by validating against the schema.

## Review Section
*Review: The user asked to retry. The data has been fully structured into an easier Node.js script. The `package.json` makes it 1 command to populate all charts in the dashboard. A beautifully structured Markdown file has been produced for the walkthrough.*
