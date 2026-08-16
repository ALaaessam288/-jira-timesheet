import { defineConfig } from 'vite';

function jiraProxyPlugin() {
  return {
    name: 'jira-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/jira-proxy', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Jira-Domain, X-Target-Path');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        try {
          let chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const rawBody = Buffer.concat(chunks).toString();
          let jsonBody = {};
          try {
            jsonBody = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            jsonBody = {};
          }

          const domain = jsonBody.domain || req.headers['x-jira-domain'] || req.headers['X-Jira-Domain'];
          const email = jsonBody.email;
          const apiToken = jsonBody.apiToken;
          let authHeader = jsonBody.authHeader || req.headers['authorization'] || req.headers['Authorization'];

          if (!authHeader && email && apiToken) {
            authHeader = 'Basic ' + Buffer.from(`${email.trim()}:${apiToken.trim()}`).toString('base64');
          }

          const targetPath = jsonBody.path || '/rest/api/3/myself';
          const method = jsonBody.method || 'GET';
          const forwardBody = jsonBody.body !== undefined ? jsonBody.body : undefined;

          if (!domain || !authHeader) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing Jira domain, email or API token' }));
            return;
          }

          const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
          const cleanPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
          const targetUrl = `https://${cleanDomain}${cleanPath}`;

          console.log(`[Jira Proxy] ${method} -> ${targetUrl}`);

          const fetchOptions = {
            method: method,
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          };

          if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && forwardBody) {
            fetchOptions.body = typeof forwardBody === 'string' ? forwardBody : JSON.stringify(forwardBody);
          }

          const response = await fetch(targetUrl, fetchOptions);
          const responseData = await response.text();

          console.log(`[Jira Proxy] Status: ${response.status}`);

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
          res.statusCode = response.status;
          res.end(responseData);
        } catch (error) {
          console.error('[Jira Proxy Error]', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [jiraProxyPlugin()],
  server: {
    port: 3000,
    open: false,
    cors: true
  }
});
