# NZ Hops COA Redirect

Redirects `https://coa.nzhops.co.nz/{batch}` (e.g., `25-001`) to a fixed Looker Studio report, embedding the `batch` into the pre‑encoded params.

## How it works
- Azure Functions (Node.js 20) HTTP trigger with route `/{batch}`.
- Validates `batch` against `^[0-9]{2}-[0-9]{3}$` and issues a redirect (302 while testing; switch to 301 when confirmed).

## Local development
Prereqs: Node 20, Azure Functions Core Tools v4, Azurite (optional) for local storage.

1) Copy `local.settings.json.example` to `local.settings.json`.
2) Start locally:
   - `npm start` (requires Core Tools installed globally)
3) Invoke: `http://localhost:7071/25-001`.

## Deployment (GitHub Actions)
This repo includes `.github/workflows/deploy.yml` which deploys on pushes to `main`.

Required repository secrets:
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Paste the publish profile XML from your Function App.
- `AZURE_FUNCTIONAPP_NAME`: The name of your Function App resource (e.g., `coaredirect-prod`).

The workflow uses `azure/functions-action@v1` to deploy the package in this repo to your Function App.

## Notes
- The Looker params are already percent‑encoded. The function replaces the single `25-001` token without double‑encoding.
- `host.json` sets `routePrefix` to empty so the route is `/{batch}` (not `/api/{batch}`).
