/**
 * Atlassian Rovo AI Teammate Service
 * Provides smart agents, automated worklog drafting, weekly goal auditing, and natural language timesheet assistance.
 */

import { storage } from './storage.js';
import { formatSecondsToTime, toDateInputString, getWeekRange } from '../utils/helpers.js';

export class RovoService {
  constructor() {
    this.agentName = 'Atlassian Rovo';
    this.version = '2.0-Enterprise';
  }

  /**
   * Draft a high-impact corporate worklog description based on current issue context
   */
  async draftIssueWorklog(issue, customNotes = '') {
    if (!issue) {
      return {
        reply: "Please select a Jira ticket first, and I'll immediately craft a tailored worklog description for you!",
        actionText: null
      };
    }

    const key = issue.key || 'TASK';
    const summary = issue.summary || 'Sprint deliverable execution';
    const notes = (customNotes || '').trim();

    const promptText = notes || summary;

    try {
      const res = await fetch('/api/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptText,
          style: 'professional',
          issueKey: key,
          issueSummary: summary
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhancedText) {
          return {
            reply: `Here is your **Rovo-crafted worklog** for **${key}**:\n\n> "${data.enhancedText}"`,
            actionText: data.enhancedText
          };
        }
      }
    } catch (e) {
      console.warn('Rovo Cloud AI unavailable, generating local intelligence:', e);
    }

    // Local Rovo synthesis fallback
    let synthesized = `Executed core engineering and analysis deliverables for ${key} (${summary}). Validated functional requirements, conducted peer verification, and ensured compliance with sprint milestones.`;
    if (notes) {
      synthesized = `Addressed key deliverables for ${key}: ${notes}. Conducted testing and documentation to ensure pull request readiness.`;
    }

    return {
      reply: `Here is your **Rovo-crafted worklog** for **${key}**:\n\n> "${synthesized}"`,
      actionText: synthesized
    };
  }

  /**
   * Audit current week hours vs 40h goal
   */
  auditWeeklyHours(history = [], dailyGoalHours = 8) {
    const weekDays = getWeekRange(new Date());
    const weekStartStr = toDateInputString(weekDays[0]);
    const weekEndStr = toDateInputString(weekDays[weekDays.length - 1]);

    const weeklyLogs = (history || []).filter(item => {
      const itemDateStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
      return itemDateStr >= weekStartStr && itemDateStr <= weekEndStr;
    });

    let totalSeconds = 0;
    let billableSeconds = 0;
    const daysLogged = new Set();

    weeklyLogs.forEach(l => {
      totalSeconds += (l.timeSpentSeconds || 0);
      if (l.isBillable) billableSeconds += (l.timeSpentSeconds || 0);
      const dStr = l.date ? l.date.substring(0, 10) : toDateInputString(new Date(l.timestamp));
      daysLogged.add(dStr);
    });

    const targetWeekHours = dailyGoalHours * 5; // 40h
    const loggedHours = (totalSeconds / 3600).toFixed(1);
    const remainingHours = Math.max(0, targetWeekHours - (totalSeconds / 3600)).toFixed(1);
    const billableHours = (billableSeconds / 3600).toFixed(1);

    const percent = Math.min(100, Math.round((totalSeconds / (targetWeekHours * 3600)) * 100));

    let statusMsg = `🟢 **On Track**`;
    if (percent < 50) statusMsg = `🟠 **Needs Attention**`;
    if (percent >= 100) statusMsg = `🎉 **100% Goal Achieved!**`;

    const reply = `### 📊 Weekly Timesheet Audit (${weekStartStr} to ${weekEndStr})\n\n` +
      `- **Status:** ${statusMsg}\n` +
      `- **Total Logged:** \`${loggedHours}h\` of \`${targetWeekHours}h\` target (${percent}%)\n` +
      `- **Billable Work:** \`${billableHours}h\` | **Non-Billable:** \`${(loggedHours - billableHours).toFixed(1)}h\`\n` +
      `- **Remaining Hours:** \`${remainingHours}h\`\n` +
      `- **Active Days Logged:** \`${daysLogged.size} of 5 working days\`\n\n` +
      (remainingHours > 0 ? `💡 *Recommendation:* Use **Multiple Days** mode to log your remaining \`${remainingHours}h\` in seconds!` : `✨ Excellent job! Your timesheet is fully compliant.`);

    return { reply, actionText: null };
  }

  /**
   * Find missing days in the current work week
   */
  findMissingDays(history = []) {
    const weekDays = getWeekRange(new Date());
    // Egyptian work week: Sun (0) to Thu (4)
    const workDays = weekDays.filter(d => {
      const idx = d.getDay();
      return idx >= 0 && idx <= 4;
    });

    const loggedDateSet = new Set();
    (history || []).forEach(item => {
      const dStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
      loggedDateSet.add(dStr);
    });

    const missing = [];
    workDays.forEach(d => {
      const dStr = toDateInputString(d);
      if (!loggedDateSet.has(dStr)) {
        missing.push({
          dateStr: dStr,
          dayName: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
        });
      }
    });

    if (missing.length === 0) {
      return {
        reply: `🎉 **Zero Missing Days!** You have logged hours for all 5 working days of this week. Your timesheet is 100% complete!`,
        actionText: null
      };
    }

    const missingList = missing.map(m => `• **${m.dayName}** (\`${m.dateStr}\`)`).join('\n');
    const reply = `### 💡 Missing Worklog Dates Detected\n\nYou currently have **${missing.length} untracked work days** this week:\n\n${missingList}\n\n👉 *Click **Multiple Days** -> **Sun - Thu** to log 8h/day across these days in 1 click!*`;

    return { reply, actionText: null };
  }

  /**
   * Generate Scrum Standup Report
   */
  generateStandup(history = [], currentIssue = null) {
    const todayStr = toDateInputString(new Date());
    const todayLogs = (history || []).filter(item => {
      const dStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
      return dStr === todayStr;
    });

    let yesterdayOrDone = '• Completed sprint tasks & bug verifications.';
    if (todayLogs.length > 0) {
      yesterdayOrDone = todayLogs.map(l => `• [${l.issueKey}] ${l.comment || l.issueSummary} (${formatSecondsToTime(l.timeSpentSeconds)})`).join('\n');
    }

    const todayPlan = currentIssue 
      ? `• [${currentIssue.key}] Continue development & testing for ${currentIssue.summary}.` 
      : `• Continue active sprint task deliverables and stakeholder sync.`;

    const standup = `📢 **Daily Standup - ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}**\n\n` +
      `✅ **What I did:**\n${yesterdayOrDone}\n\n` +
      `🎯 **What I'm doing today:**\n${todayPlan}\n\n` +
      `🚫 **Blockers:**\n• None currently.`;

    return {
      reply: `Here is your **Rovo Daily Standup Report**:\n\n${standup}`,
      actionText: standup.replace(/[*#]/g, '')
    };
  }

  /**
   * Process Natural Language Query
   */
  async processQuery(query, { currentIssue, history, dailyGoal }) {
    const q = (query || '').toLowerCase().trim();

    if (!q) {
      return {
        reply: "How can I help with your Jira timesheet? You can ask me to **draft a worklog**, **audit your hours**, or **check missing days**.",
        actionText: null
      };
    }

    if (q.includes('draft') || q.includes('write') || q.includes('describe') || q.includes('comment')) {
      return await this.draftIssueWorklog(currentIssue, query);
    }

    if (q.includes('audit') || q.includes('hours') || q.includes('goal') || q.includes('total') || q.includes('40')) {
      return this.auditWeeklyHours(history, dailyGoal);
    }

    if (q.includes('missing') || q.includes('untracked') || q.includes('forgot') || q.includes('empty')) {
      return this.findMissingDays(history);
    }

    if (q.includes('standup') || q.includes('scrum') || q.includes('report') || q.includes('summary')) {
      return this.generateStandup(history, currentIssue);
    }

    // Default intelligent AI drafting
    return await this.draftIssueWorklog(currentIssue, query);
  }
}

export const rovoService = new RovoService();
