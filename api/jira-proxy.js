export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Jira-Domain, X-Target-Path');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const jsonBody = req.body || {};
    const domain = jsonBody.domain || req.headers['x-jira-domain'] || req.headers['X-Jira-Domain'] || 'valleysoft.atlassian.net';
    const email = jsonBody.email || 'alaa.essam@valleysoft-eg.com';
    const apiToken = jsonBody.apiToken || process.env.JIRA_API_TOKEN || '';
    let authHeader = jsonBody.authHeader || req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader && email && apiToken) {
      authHeader = 'Basic ' + Buffer.from(`${email.trim()}:${apiToken.trim()}`).toString('base64');
    }

    const targetPath = jsonBody.path || jsonBody.endpoint || req.headers['x-target-path'] || '/rest/api/3/myself';
    const method = jsonBody.method || 'GET';
    const forwardBody = jsonBody.body !== undefined ? jsonBody.body : undefined;

    if (!domain || !authHeader) {
      return res.status(400).json({ error: 'Missing Jira domain, email or API token' });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const cleanPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath;
    const targetUrl = `https://${cleanDomain}${cleanPath}`;

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

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.status(response.status).send(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
}
