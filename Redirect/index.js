const TEMPLATE = "https://lookerstudio.google.com/reporting/91fce37d-05d5-4512-805d-ccebd0980517/page/PolTF?params=%7B%22df4%22:%22include%25EE%2580%25800%25EE%2580%2580EQ%25EE%2580%258025-001%22%7D";

module.exports = async function (context, req) {
  const batch = (req.params.batch || "").trim();
  const isValid = /^[0-9]{2}-[0-9]{3}$/.test(batch);

  if (!isValid) {
    context.log("Invalid batch format", { path: req?.url, batch });
    context.res = {
      status: 400,
      body: "Invalid batch format. Expected NN-NNN, e.g., 25-001."
    };
    return;
  }

  // The Looker params segment is already URL-encoded; do not double-encode.
  // Replace only the single placeholder token once.
  const location = TEMPLATE.replace("25-001", batch);

  // Use 302 during testing; change to 301 when confirmed stable.
  context.log("Redirecting", { batch, location });
  context.res = {
    status: 302,
    headers: { Location: location }
  };
};

