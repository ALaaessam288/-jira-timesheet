// Vercel Serverless Function for Free Cloud AI Worklog Enhancement
// Solves the issue where mobile phones cannot connect to localhost Ollama

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const { text, style, issueKey, issueSummary } = req.body || {};
    const rawText = (text || '').trim() || issueSummary || 'completed planned tasks and verification';

    const systemPrompt = `You are an expert Jira assistant. Transform raw work notes into a concise, professional Jira worklog entry.
Style: ${style || 'professional'}.
Issue: ${issueKey ? `[${issueKey}] ${issueSummary || ''}` : 'General Work'}
Raw Notes: "${rawText}"

Rules:
1. Return ONLY the enhanced text (1 to 2 sentences or clean bullet points).
2. No intro, no quotes, no markdown headers or conversational filler.`;

    // 1. Try Free Cloud AI Endpoint (Pollinations AI - fast, free, no API key needed)
    try {
      const cloudRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Enhance this note: ${rawText}` }
          ],
          model: 'openai',
          temperature: 0.3
        })
      });

      if (cloudRes.ok) {
        const enhanced = await cloudRes.text();
        if (enhanced && enhanced.trim()) {
          return res.status(200).json({
            enhancedText: enhanced.trim().replace(/^["']|["']$/g, ''),
            provider: 'Cloud AI (Free)'
          });
        }
      }
    } catch (err) {
      console.warn('Pollinations AI fallback:', err.message);
    }

    // 2. High-speed Smart Rule-based Engine fallback
    const fallbackText = getSmartEnhancedText(rawText, style, issueKey, issueSummary);
    return res.status(200).json({
      enhancedText: fallbackText,
      provider: 'Smart AI Engine'
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal AI Error' });
  }
}

function getSmartEnhancedText(text, style, issueKey, issueSummary) {
  const base = text.trim();
  switch (style) {
    case 'bullets':
      return `• Implemented deliverables for: ${base}\n• Conducted functional testing & code verification.\n• Verified zero regressions with test criteria.`;
    case 'concise':
      return `[${issueKey || 'Task'}] ${base.replace(/\.+$/, '')} - Completed & Verified.`;
    case 'ba':
      return `Conducted requirements analysis, functional specifications review, and stakeholder alignment for: ${base}`;
    case 'qa':
      return `Executed test cases, verified business logic, and confirmed bug-free status for: ${base}`;
    case 'professional':
    default:
      if (/^(dev|code|implement|coding|feature)/i.test(base)) {
        return `Engineered and integrated core functionality for: ${base}. Performed unit testing and ensured pull request readiness.`;
      }
      if (/^(fix|bug|issue|defect|error)/i.test(base)) {
        return `Investigated, diagnosed, and resolved defect regarding: ${base}. Verified fix with end-to-end testing.`;
      }
      if (/^(meeting|standup|sync|planning)/i.test(base)) {
        return `Participated in daily standup and team alignment meeting: ${base}. Discussed blockers and next sprint milestones.`;
      }
      return `Completed planned tasks for ${base}. Ensured code quality and sprint milestone alignment.`;
  }
}
