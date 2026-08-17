// LocalStorage persistence service for Jira Settings, Favorites, and Worklog History

const STORAGE_KEYS = {
  SETTINGS: 'jira_logger_settings_v1',
  FAVORITES: 'jira_logger_favorites_v1',
  RECENT_ISSUES: 'jira_logger_recents_v1',
  TEMPLATES: 'jira_logger_templates_v1',
  HISTORY: 'jira_logger_history_v1',
};

// Default initial settings
const DEFAULT_SETTINGS = {
  domain: 'valleysoft.atlassian.net',
  email: 'alaa.essam@valleysoft-eg.com',
  apiToken: '',
  displayName: 'Alaa Harb',
  avatarUrl: '',
  dailyGoalHours: 8,
  defaultBillable: true,
  isConnected: false,
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  aiStyle: 'professional',
};

// Default preset issues inspired by user's workflow
const DEFAULT_FAVORITES = [
  {
    key: 'OB2601-666',
    summary: 'FAB MISR- Reverse Engineering for BRD Documentation for Existing Account Opening System & STP Retail Payroll',
    status: 'In Progress',
    type: 'Epic',
    isBillable: true
  },
  {
    key: 'AAIB2311-39',
    summary: 'BA Analysis - HBD - Bulk Opening Accounts',
    status: 'TO DO',
    type: 'Story',
    isBillable: true
  },
  {
    key: 'HDB2101-948',
    summary: 'HDB - CA Processes Implementation & Verification',
    status: 'IN PROGRESS',
    type: 'Task',
    isBillable: true
  },
  {
    key: 'NXT260401-138',
    summary: 'Bank NXT - Unsecured Credit Card Process Documentation',
    status: 'IN PROGRESS',
    type: 'Task',
    isBillable: true
  },
  {
    key: 'AT-100',
    summary: 'Corporate Account Integration & Workflows',
    status: 'IN PROGRESS',
    type: 'Task',
    isBillable: true
  },
  {
    key: 'NXT260401-143',
    summary: '[TC-ACK-001] Service Acknowledgement Flow',
    status: 'SUCCESS',
    type: 'Story',
    isBillable: true
  },
  {
    key: 'OB2601-666',
    summary: 'FAB MIS Integration & Daily Data Sync',
    status: 'IN PROGRESS',
    type: 'Improvement',
    isBillable: true
  }
];

// Default description templates
const DEFAULT_TEMPLATES = [
  'Development & implementation of features',
  'Bug fixes, unit testing & code verification',
  'BA Analysis, requirements review & design',
  'Daily standup, sprint planning & team sync',
  'Code review, PR revisions & deployment prep',
  'Client feedback implementation & QA support',
  'Documentation & API integration testing'
];

class StorageService {
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        apiToken: parsed.apiToken || DEFAULT_SETTINGS.apiToken,
        domain: parsed.domain || DEFAULT_SETTINGS.domain,
        email: parsed.email || DEFAULT_SETTINGS.email,
        isConnected: true
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('jira:settings-updated', { detail: settings }));
  }

  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!data) return DEFAULT_FAVORITES;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && !parsed.some(f => f.key === 'OB2601-666')) {
        parsed.unshift(DEFAULT_FAVORITES[0]);
      }
      return parsed;
    } catch {
      return DEFAULT_FAVORITES;
    }
  }

  saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('jira:favorites-updated', { detail: favorites }));
  }

  toggleFavorite(issue) {
    const favorites = this.getFavorites();
    const index = favorites.findIndex(f => f.key === issue.key);
    let updated;
    let isFav = false;

    if (index >= 0) {
      updated = favorites.filter(f => f.key !== issue.key);
      isFav = false;
    } else {
      updated = [{
        key: issue.key,
        summary: issue.summary || issue.fields?.summary || 'No summary',
        status: issue.status || issue.fields?.status?.name || 'TO DO',
        type: issue.type || issue.fields?.issuetype?.name || 'Task',
        isBillable: true
      }, ...favorites];
      isFav = true;
    }

    this.saveFavorites(updated);
    return isFav;
  }

  isFavorite(issueKey) {
    return this.getFavorites().some(f => f.key === issueKey);
  }

  getRecentIssues() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENT_ISSUES);
      return data ? JSON.parse(data) : DEFAULT_FAVORITES.slice(0, 4);
    } catch {
      return DEFAULT_FAVORITES.slice(0, 4);
    }
  }

  addRecentIssue(issue) {
    const recents = this.getRecentIssues();
    const filtered = recents.filter(r => r.key !== issue.key);
    const updated = [{
      key: issue.key,
      summary: issue.summary || issue.fields?.summary || 'No summary',
      status: issue.status || issue.fields?.status?.name || 'TO DO',
      type: issue.type || issue.fields?.issuetype?.name || 'Task',
    }, ...filtered].slice(0, 15); // keep last 15
    localStorage.setItem(STORAGE_KEYS.RECENT_ISSUES, JSON.stringify(updated));
  }

  getTemplates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  }

  saveTemplates(templates) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    window.dispatchEvent(new CustomEvent('jira:templates-updated', { detail: templates }));
  }

  addTemplate(text) {
    if (!text || !text.trim()) return;
    const list = this.getTemplates();
    if (!list.includes(text.trim())) {
      const updated = [text.trim(), ...list];
      this.saveTemplates(updated);
    }
  }

  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getWorklogHistory() {
    return this.getHistory();
  }

  addWorklogToHistory(entry) {
    const history = this.getHistory();
    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
      ...entry
    };
    const updated = [newEntry, ...history];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jira:history-updated', { detail: updated }));
    return newEntry;
  }

  deleteHistoryEntry(id) {
    const history = this.getHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('jira:history-updated', { detail: updated }));
  }

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.RECENT_ISSUES);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    window.location.reload();
  }
}

export const storage = new StorageService();
