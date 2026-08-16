// Ollama & AI Service for enhancing worklog descriptions and generating standup summaries

export class OllamaService {
  /**
   * Smart rule-based enhancer fallback when Ollama is offline or on mobile without direct LAN
   */
  static enhanceRuleBased(text, style = 'professional', issueKey = '', issueSummary = '') {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return issueSummary ? `Completed implementation, testing, and documentation for ${issueSummary}.` : 'Worked on assigned tasks, code verification, and sprint deliverables.';
    }

    // Capitalize and format cleanly
    let base = trimmed;
    if (!base.endsWith('.')) base += '.';

    switch (style) {
      case 'bullets':
        return `• Executed tasks related to: ${base}\n• Conducted unit verification and bug fixes.\n• Synchronized changes with team sprint goals.`;
      
      case 'concise':
        return `[${issueKey || 'Jira'}] ${base.replace(/\.+$/, '')} - Completed & Verified.`;
      
      case 'ba':
        return `Requirements analysis & business logic review for: ${base} Validated user stories and edge-case criteria with stakeholders.`;

      case 'qa':
        return `Executed comprehensive test cases and QA verification for: ${base} Confirmed zero regressions and logged findings.`;

      case 'professional':
      default:
        if (/^(dev|development|coding|code|implemented|implementing)/i.test(base)) {
          return `Engineered and integrated core functionality for: ${base} Performed local testing and verified pull request readiness.`;
        }
        if (/^(fix|bug|fixed|fixing|debug)/i.test(base)) {
          return `Investigated, diagnosed, and resolved defects regarding: ${base} Verified fix with regression test scenarios.`;
        }
        if (/^(analysis|ba|review|requirements|meeting|standup)/i.test(base)) {
          return `Conducted functional analysis, stakeholder requirements alignment, and technical specification review for: ${base}`;
        }
        return `Successfully completed deliverables for: ${base} Ensured code quality and sprint milestone alignment.`;
    }
  }

  /**
   * Enhance work description using Ollama / Ollama Cloud / LLM
   */
  async enhanceText(text, { style = 'professional', issueKey = '', issueSummary = '', endpoint = 'http://localhost:11434', model = 'llama3.2', apiKey = '' } = {}) {
    const rawText = (text || '').trim() || issueSummary || 'worked on feature tasks';

    const prompt = `You are a professional Jira assistant. Enhance the following raw worklog notes into a concise, professional Jira worklog comment.
Style: ${style} (Focus on professional business and software delivery language).
Issue: ${issueKey ? `[${issueKey}] ${issueSummary}` : 'Task'}
Raw notes: "${rawText}"

Rules:
1. Output ONLY the enhanced worklog text.
2. Do NOT include markdown code blocks, quotes, or introductory remarks.
3. Keep it between 1 to 3 clear sentences.`;

    try {
      const cleanEndpoint = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
      const targetUrl = `${cleanEndpoint}/api/generate`;

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      // 4 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model || 'llama3.2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 120
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const output = data.response ? data.response.trim().replace(/^["']|["']$/g, '') : '';
        if (output) {
          return { enhancedText: output, provider: `Ollama (${model || 'AI'})` };
        }
      }
    } catch (err) {
      console.warn('Ollama request fallback:', err.message);
    }

    // Fallback to Smart Built-in Engine
    const fallbackText = OllamaService.enhanceRuleBased(text, style, issueKey, issueSummary);
    return { enhancedText: fallbackText, provider: 'Smart AI Engine' };
  }

  /**
   * Test Ollama connection
   */
  async testConnection(endpoint = 'http://localhost:11434', apiKey = '') {
    try {
      const cleanEndpoint = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const headers = { 'Accept': 'application/json' };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const res = await fetch(`${cleanEndpoint}/api/tags`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      const data = await res.json();
      const models = (data.models || []).map(m => m.name);
      return { success: true, models };
    } catch (err) {
      throw new Error(`Could not connect to Ollama at ${endpoint} (${err.message})`);
    }
  }
}

export const ollamaService = new OllamaService();
