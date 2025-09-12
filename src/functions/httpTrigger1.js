const { app } = require('@azure/functions');

// Pre-encoded Looker Studio URL template; replace the single "25-001" token
const TEMPLATE = "https://lookerstudio.google.com/reporting/91fce37d-05d5-4512-805d-ccebd0980517/page/PolTF?params=%7B%22df4%22:%22include%25EE%2580%25800%25EE%2580%2580EQ%25EE%2580%258025-001%22%7D";
const BATCH_PATTERN = /^[0-9]{2}-[0-9]{3}$/;

app.http('redirect', {
    methods: ['GET', 'HEAD'],
    authLevel: 'anonymous',
    // Route captures batch from path root, e.g., /25-001
    route: '{batch}',
    handler: async (request, context) => {
        const batch = (request.params?.batch || '').trim();
        const isValid = BATCH_PATTERN.test(batch);

        if (!isValid) {
            const msg = 'Invalid batch format. Expected NN-NNN, e.g., 25-001.';
            context.log('Invalid request', {
                host: new URL(request.url).host,
                path: new URL(request.url).pathname,
                batch,
                statusCode: 400
            });
            // For HEAD, omit body; for GET, return plain text message
            return request.method === 'HEAD'
                ? { status: 400 }
                : { status: 400, headers: { 'Content-Type': 'text/plain' }, body: msg };
        }

        // Replace the single placeholder occurrence "25-001" with the actual batch. Do not double-encode.
        const location = TEMPLATE.replace('25-001', batch);

        const statusCode = 302; // Switch to 301 once confirmed in production
        context.log('Redirecting', {
            host: new URL(request.url).host,
            path: new URL(request.url).pathname,
            batch,
            target: location,
            statusCode
        });

        return {
            status: statusCode,
            headers: {
                Location: location,
                'Cache-Control': 'no-store' // avoid caching while validating; relax later
            }
        };
    }
});
