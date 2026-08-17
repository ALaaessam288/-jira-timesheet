// Jira Cloud REST API Client with Netlify / Vite CORS Proxy support

class JiraApiService {
  formatDomain(domain) {
    if (!domain) return '';
    let d = domain.trim();
    d = d.replace(/^https?:\/\//, '');
    d = d.replace(/\/+$/, '');
    if (!d.includes('.')) {
      d = `${d}.atlassian.net`;
    }
    return d;
  }

  async request(path, options = {}, credentials = {}) {
    const domain = this.formatDomain(credentials.domain);
    const email = credentials.email ? credentials.email.trim() : '';
    const apiToken = credentials.apiToken ? credentials.apiToken.trim() : '';

    const payload = {
      domain,
      email,
      apiToken,
      path,
      method: options.method || 'GET',
      body: options.body
    };

    // Determine proxy endpoint: if on GitHub Pages, route through the serverless proxy
    let proxyUrl = '/api/jira-proxy';
    if (typeof window !== 'undefined' && window.location && window.location.hostname.includes('github.io')) {
      proxyUrl = 'https://jira-time-sheet.netlify.app/api/jira-proxy';
    }

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { rawText: responseText };
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Jira email or API Token (401 Unauthorized). Please check your API token.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden (403 Forbidden). You might not have permission to perform this action in Jira.');
        } else if (response.status === 404) {
          throw new Error(`Jira endpoint or issue not found (${path}). Check your Jira site URL.`);
        }
        
        const errorMsg = data?.errorMessages?.join(', ') || 
                         (data?.errors ? Object.values(data.errors).join(', ') : null) || 
                         data?.error || 
                         `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Could not connect to Jira API Proxy. If testing locally, make sure Vite server is running.');
      }
      throw err;
    }
  }

  /**
   * Test Jira connection and fetch current user profile
   */
  async testConnection(domain, email, apiToken) {
    const creds = { domain, email, apiToken };
    const user = await this.request('/rest/api/3/myself', { method: 'GET' }, creds);
    return {
      displayName: user.displayName || user.name || email,
      emailAddress: user.emailAddress || email,
      avatarUrl: user.avatarUrls?.['48x48'] || user.avatarUrls?.['32x32'] || '',
      accountId: user.accountId,
      timeZone: user.timeZone || 'UTC'
    };
  }

  /**
   * Fetch single Jira issue details
   */
  async getIssue(issueKey, credentials) {
    if (!issueKey) return null;
    const cleanKey = issueKey.trim().toUpperCase();
    try {
      const data = await this.request(`/rest/api/3/issue/${cleanKey}?fields=summary,status,issuetype,project`, {
        method: 'GET'
      }, credentials);

      return {
        key: data.key,
        summary: data.fields?.summary || '',
        status: data.fields?.status?.name || 'TO DO',
        type: data.fields?.issuetype?.name || 'Task',
        project: data.fields?.project?.name || data.key.split('-')[0]
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch all accessible Jira projects
   */
  async getProjects(credentials) {
    try {
      const data = await this.request('/rest/api/3/project', { method: 'GET' }, credentials);
      if (Array.isArray(data)) {
        return data.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
          avatarUrl: p.avatarUrls?.['24x24'] || ''
        }));
      }
      return [];
    } catch (e) {
      console.warn('Error fetching projects:', e.message);
      return [];
    }
  }

  /**
   * Fetch issues assigned to the current user via JQL
   */
  async getMyIssues(credentials) {
    try {
      const jql = encodeURIComponent('assignee = currentUser() order by updated desc');
      const data = await this.request(`/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,issuetype,project`, {
        method: 'GET'
      }, credentials);

      if (data && Array.isArray(data.issues)) {
        return data.issues.map(i => ({
          key: i.key || i.id,
          summary: i.fields?.summary || 'No summary',
          status: i.fields?.status?.name || 'TO DO',
          type: i.fields?.issuetype?.name || 'Task',
          project: i.fields?.project?.name || (i.key || '').split('-')[0]
        }));
      }
      return [];
    } catch (e) {
      console.warn('Error fetching my issues:', e.message);
      return [];
    }
  }

  /**
   * Fetch issues for a specific Jira project
   */
  async getProjectIssues(projectKey, credentials) {
    if (!projectKey) return [];
    try {
      const jql = encodeURIComponent(`project = "${projectKey}" order by updated desc`);
      const data = await this.request(`/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,issuetype,project`, {
        method: 'GET'
      }, credentials);

      if (data && Array.isArray(data.issues)) {
        return data.issues.map(i => ({
          key: i.key || i.id,
          summary: i.fields?.summary || 'No summary',
          status: i.fields?.status?.name || 'TO DO',
          type: i.fields?.issuetype?.name || 'Task',
          project: i.fields?.project?.name || projectKey
        }));
      }
      return [];
    } catch (e) {
      console.warn(`Error fetching project ${projectKey} issues:`, e.message);
      return [];
    }
  }

  /**
   * Fetch all live issues across JQL search, Agile boards, and history
   */
  async getAllLiveIssues(credentials) {
    const issuesMap = new Map();

    // 1. Fetch user's assigned issues
    try {
      const myIssues = await this.getMyIssues(credentials);
      myIssues.forEach(i => issuesMap.set(i.key, i));
    } catch (e) {
      console.warn('getMyIssues error:', e.message);
    }

    // 2. Fetch recent active issues via JQL
    try {
      const jql = encodeURIComponent('created is not empty order by updated desc');
      const recentsData = await this.request(`/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,issuetype,project`, {
        method: 'GET'
      }, credentials);

      if (recentsData && Array.isArray(recentsData.issues)) {
        recentsData.issues.forEach(i => {
          if (!issuesMap.has(i.key)) {
            issuesMap.set(i.key, {
              key: i.key || i.id,
              summary: i.fields?.summary || 'No summary',
              status: i.fields?.status?.name || 'TO DO',
              type: i.fields?.issuetype?.name || 'Task',
              project: i.fields?.project?.name || (i.key || '').split('-')[0]
            });
          }
        });
      }
    } catch (e) {
      console.warn('JQL recents error:', e.message);
    }

    // 3. Fetch from Agile Boards
    try {
      const boardsData = await this.request('/rest/agile/1.0/board?maxResults=50', { method: 'GET' }, credentials);
      if (boardsData && Array.isArray(boardsData.values)) {
        for (const b of boardsData.values) {
          try {
            const bIssues = await this.request(`/rest/agile/1.0/board/${b.id}/issue?maxResults=100`, { method: 'GET' }, credentials);
            if (bIssues && Array.isArray(bIssues.issues)) {
              bIssues.issues.forEach(i => {
                if (!issuesMap.has(i.key)) {
                  issuesMap.set(i.key, {
                    key: i.key,
                    summary: i.fields?.summary || 'No summary',
                    status: i.fields?.status?.name || 'TO DO',
                    type: i.fields?.issuetype?.name || 'Task',
                    project: i.fields?.project?.name || i.key.split('-')[0]
                  });
                }
              });
            }
          } catch (e) {
            console.warn(`Error fetching board ${b.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching boards:', e.message);
    }

    // 4. Also fetch from Issue Picker history
    try {
      const pickerData = await this.request('/rest/api/3/issue/picker?showSubTasks=true', { method: 'GET' }, credentials);
      if (pickerData && Array.isArray(pickerData.sections)) {
        pickerData.sections.forEach(s => {
          (s.issues || []).forEach(i => {
            if (!issuesMap.has(i.key)) {
              issuesMap.set(i.key, {
                key: i.key,
                summary: i.summaryText || i.summary || 'Task',
                status: 'TO DO',
                type: 'Task',
                project: i.key.split('-')[0]
              });
            }
          });
        });
      }
    } catch (e) {}

    return Array.from(issuesMap.values());
  }

  /**
   * Search Jira issues by keyword, key, or project using JQL and direct lookup
   */
  async searchIssues(query, credentials) {
    const q = (query || '').trim();
    const results = [];
    const seenKeys = new Set();

    // 1. If query is a specific issue key, fetch directly
    if (q && /^[A-Z0-9]+-\d+$/i.test(q)) {
      const directIssue = await this.getIssue(q, credentials);
      if (directIssue) {
        results.push(directIssue);
        seenKeys.add(directIssue.key);
      }
    }

    // 2. Search via JQL query
    if (q) {
      try {
        const jql = encodeURIComponent(`text ~ "${q}" or summary ~ "${q}" order by updated desc`);
        const jqlData = await this.request(`/rest/api/3/search/jql?jql=${jql}&maxResults=50&fields=summary,status,issuetype,project`, {
          method: 'GET'
        }, credentials);

        if (jqlData && Array.isArray(jqlData.issues)) {
          jqlData.issues.forEach(i => {
            if (!seenKeys.has(i.key)) {
              seenKeys.add(i.key);
              results.push({
                key: i.key,
                summary: i.fields?.summary || 'No summary',
                status: i.fields?.status?.name || 'TO DO',
                type: i.fields?.issuetype?.name || 'Task',
                project: i.fields?.project?.name || i.key.split('-')[0]
              });
            }
          });
        }
      } catch (e) {
        console.warn('JQL search error:', e.message);
      }
    }

    // 3. Also call Jira Cloud issue picker
    try {
      const pickerPath = q 
        ? `/rest/api/3/issue/picker?query=${encodeURIComponent(q)}&showSubTasks=true`
        : `/rest/api/3/issue/picker?showSubTasks=true`;

      const data = await this.request(pickerPath, { method: 'GET' }, credentials);

      if (data && data.sections) {
        data.sections.forEach(section => {
          (section.issues || []).forEach(item => {
            if (!seenKeys.has(item.key)) {
              seenKeys.add(item.key);
              results.push({
                key: item.key,
                summary: item.summaryText || item.summary || 'Task',
                status: 'TO DO',
                type: 'Task',
                project: item.key.split('-')[0]
              });
            }
          });
        });
      }
    } catch (e) {
      console.warn('Issue picker query error:', e.message);
    }

    return results;
  }

  /**
   * Post worklog to Jira issue
   */
  async logWork(issueKey, { timeSpentSeconds, started, comment }, credentials) {
    if (!issueKey) throw new Error('Please select an issue to log work on.');
    if (!timeSpentSeconds || timeSpentSeconds <= 0) throw new Error('Time spent must be greater than 0.');

    const body = {
      timeSpentSeconds: Math.round(timeSpentSeconds),
      started: started || new Date().toISOString(),
      comment: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment || 'Work logged via Mobile Timesheet App'
              }
            ]
          }
        ]
      }
    };

    return await this.request(`/rest/api/3/issue/${issueKey}/worklog`, {
      method: 'POST',
      body
    }, credentials);
  }
}

export const jiraApi = new JiraApiService();
