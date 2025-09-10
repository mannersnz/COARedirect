<task>
We are building a redirect service that redirects users to a Looker Studio from Google service. 
</task>

<background>
You want coa.nzhops.co.nz/{batch} (e.g., 25-001) to 301-redirect to a fixed Looker Studio URL where that batch number is embedded inside the params query string.

Recommended approach: Azure Front Door + Azure Functions
- Front Door: custom domain, TLS, edge performance.
- Azure Function (HTTP trigger): captures the batch slug and issues the redirect. This makes the odd Looker “params” encoding simple and reliable.

Plan
1) DNS and domain
- In Azure Front Door, add custom domain coa.nzhops.co.nz with managed cert.
- DNS: CNAME coa.nzhops.co.nz → your Front Door endpoint.

2) Backend
- Create a Function App (Node.js 20, Consumption plan) + Application Insights.
- Add the Function origin to Front Door; route all paths /* to the Function.

3) Implement redirect logic
- Pattern: /^[0-9]{2}-[0-9]{3}$/ for batch like 25-001.
- Use a URL template and replace the batch placeholder exactly once.
- Use 302 while testing; switch to 301 when confirmed.

Node.js (Azure Functions v4) example
- file: Redirect/index.js
- function.json routes all GETs to this function

function.json:
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"],
      "route": "{batch}"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}

index.js:
const TEMPLATE = "https://lookerstudio.google.com/reporting/91fce37d-05d5-4512-805d-ccebd0980517/page/PolTF?params=%7B%22df4%22:%22include%25EE%2580%25800%25EE%2580%2580EQ%25EE%2580%258025-001%22%7D";

module.exports = async function (context, req) {
  const batch = (req.params.batch || "").trim();
  const isValid = /^[0-9]{2}-[0-9]{3}$/.test(batch);
  if (!isValid) {
    context.res = { status: 400, body: "Invalid batch format. Expected NN-NNN, e.g., 25-001." };
    return;
  }

  // Replace the single placeholder occurrence “25-001” with the actual batch.
  // The Looker params segment is already URL-encoded; do not double-encode.
  const location = TEMPLATE.replace("25-001", batch);

  // Use 302 during testing; flip to 301 when stable.
  context.res = {
    status: 302, // change to 301 when you’re ready
    headers: { Location: location }
  };
};

4) Testing flow
- Deploy the Function.
- In Front Door, point origin to the Function. Wait for propagation.
- Test:
  - https://coa.nzhops.co.nz/25-001 → should 302 to the Looker URL with 25-001 in params.
  - Try another, e.g., 24-123.
- After confirming, change 302 to 301 and redeploy.

5) Hardening and observability
- Log requestHost, path, batch, statusCode, and target to App Insights.
- Add a robots.txt route if you don’t want these indexed.
- Optional: Add a default route for “/” to a help page or 404.

6) CI/CD
- Simple: Azure “Deploy to Function App” via GitHub Actions on main.
- IaC later with Bicep/Terraform if you want reproducible environments.

Notes
- The Looker “params” is already percent-encoded. Replacing only the “25-001” token avoids double-encoding issues.
- If you might need other formats later, widen the regex or add a whitelist.

If you want, I can provide a GitHub-ready minimal repo (host.json, local.settings.json template, package.json, action workflow) for a one-push deploy.
</background>