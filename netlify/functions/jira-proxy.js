exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Jira-Domain, X-Target-Path',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    let jsonBody = {};
    if (event.body) {
      try {
        jsonBody = JSON.parse(event.body);
      } catch {
        jsonBody = {};
      }
    }

    const rawHeaders = event.headers || {};
    const domain = jsonBody.domain || rawHeaders['x-jira-domain'] || rawHeaders['X-Jira-Domain'];
    const email = jsonBody.email;
    const apiToken = jsonBody.apiToken;
    let authHeader = jsonBody.authHeader || rawHeaders['authorization'] || rawHeaders['Authorization'];

    if (!authHeader && email && apiToken) {
      authHeader = 'Basic ' + Buffer.from(`${email.trim()}:${apiToken.trim()}`).toString('base64');
    }

    const targetPath = jsonBody.path || 
                       rawHeaders['x-target-path'] || 
                       rawHeaders['X-Target-Path'] || 
                       event.queryStringParameters?.path || 
                       '/rest/api/3/myself';
    
    const method = jsonBody.method || (event.httpMethod === 'POST' && jsonBody.path ? 'GET' : event.httpMethod);
    const forwardBody = jsonBody.body !== undefined ? jsonBody.body : undefined;

    if (!domain || !authHeader) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing Jira domain, email or API token' })
      };
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

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: responseData
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal proxy error' })
    };
  }
};
