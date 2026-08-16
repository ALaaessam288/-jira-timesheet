import { storage } from './services/storage.js';
import { jiraApi } from './services/jiraApi.js';
import { ollamaService } from './services/ollamaService.js';
import {
  toJiraDateTimeString,
  toDateInputString,
  toDateTimeInputString,
  formatSecondsToTime,
  toSeconds,
  getFriendlyDateLabel,
  getWeekRange,
  showToast
} from './utils/helpers.js';

// Application State
const state = {
  settings: storage.getSettings(),
  favorites: storage.getFavorites(),
  recents: storage.getRecentIssues(),
  templates: storage.getTemplates(),
  history: storage.getHistory(),
  selectedIssue: null,
  activeFilter: 'favorites',
  selectedCalendarDate: null,
  isSubmitting: false,
  aiStyle: 'professional',
};

// DOM Elements Cache
const elements = {
  headerStatusDot: document.getElementById('headerStatusDot'),
  headerStatusText: document.getElementById('headerStatusText'),
  userAvatarInitials: document.getElementById('userAvatarInitials'),
  btnOpenSettings: document.getElementById('btnOpenSettings'),
  btnMobileSettings: document.getElementById('btnMobileSettings'),
  btnUserAvatar: document.getElementById('btnUserAvatar'),
  modalSettings: document.getElementById('modalSettings'),
  btnCloseSettingsModal: document.getElementById('btnCloseSettingsModal'),
  formSettings: document.getElementById('formSettings'),
  settingDomain: document.getElementById('settingDomain'),
  settingEmail: document.getElementById('settingEmail'),
  settingApiToken: document.getElementById('settingApiToken'),
  settingDailyGoal: document.getElementById('settingDailyGoal'),
  btnTestConnection: document.getElementById('btnTestConnection'),
  connectionStatusBanner: document.getElementById('connectionStatusBanner'),
  btnClearData: document.getElementById('btnClearData'),

  // Hero Summary
  heroDateFormatted: document.getElementById('heroDateFormatted'),
  heroDayTag: document.getElementById('heroDayTag'),
  statDailyGoal: document.getElementById('statDailyGoal'),
  statLoggedToday: document.getElementById('statLoggedToday'),
  heroProgressFill: document.getElementById('heroProgressFill'),
  heroBillableHours: document.getElementById('heroBillableHours'),
  heroNonBillableHours: document.getElementById('heroNonBillableHours'),
  heroRemainingHoursText: document.getElementById('heroRemainingHoursText'),

  // Form Elements & AI
  formLogWork: document.getElementById('formLogWork'),
  selectedIssueKey: document.getElementById('selectedIssueKey'),
  selectedIssueSummary: document.getElementById('selectedIssueSummary'),
  selectedIssueStatus: document.getElementById('selectedIssueStatus'),
  btnChangeIssue: document.getElementById('btnChangeIssue'),
  btnNoIssue: document.getElementById('btnNoIssue'),
  btnQuickSelectIssue: document.getElementById('btnQuickSelectIssue'),
  quickFavoritesList: document.getElementById('quickFavoritesList'),
  inputHours: document.getElementById('inputHours'),
  inputMinutes: document.getElementById('inputMinutes'),
  quickTimeChips: document.getElementById('quickTimeChips'),
  inputDateTime: document.getElementById('inputDateTime'),
  btnDateToday: document.getElementById('btnDateToday'),
  btnDateYesterday: document.getElementById('btnDateYesterday'),
  btnAiEnhance: document.getElementById('btnAiEnhance'),
  aiEnhanceText: document.getElementById('aiEnhanceText'),
  aiStylesBar: document.getElementById('aiStylesBar'),
  descTemplateChips: document.getElementById('descTemplateChips'),
  inputDescription: document.getElementById('inputDescription'),
  checkLogAnother: document.getElementById('checkLogAnother'),
  btnSubmitWorklog: document.getElementById('btnSubmitWorklog'),
  btnSubmitText: document.getElementById('btnSubmitText'),

  // Timesheet & Summary
  weeklyCalendarStrip: document.getElementById('weeklyCalendarStrip'),
  historyListContainer: document.getElementById('historyListContainer'),
  historyCount: document.getElementById('historyCount'),
  historyFilterLabel: document.getElementById('historyFilterLabel'),
  btnCopyStandup: document.getElementById('btnCopyStandup'),

  // Issue Selector Modal
  modalIssueSelector: document.getElementById('modalIssueSelector'),
  btnCloseIssueModal: document.getElementById('btnCloseIssueModal'),
  inputIssueSearch: document.getElementById('inputIssueSearch'),
  modalIssuesList: document.getElementById('modalIssuesList'),
  inputDirectKey: document.getElementById('inputDirectKey'),
  btnApplyDirectKey: document.getElementById('btnApplyDirectKey'),

  // Views & Sections
  viewTabs: document.querySelectorAll('.tab-btn'),
  mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
  cardLogWork: document.getElementById('cardLogWork'),
  cardTimesheetSummary: document.getElementById('cardTimesheetSummary'),
  viewFavoritesSection: document.getElementById('viewFavoritesSection'),
  favoritesFullList: document.getElementById('favoritesFullList'),
  btnAddCustomIssueBtn: document.getElementById('btnAddCustomIssueBtn'),
};

/**
 * Initialization
 */
function init() {
  // Set default active issue
  if (state.favorites && state.favorites.length > 0) {
    state.selectedIssue = state.favorites[0];
  } else {
    state.selectedIssue = {
      key: 'OB2601-666',
      summary: 'FAB MISR- Reverse Engineering for BRD Documentation for Existing Account Opening System & STP Retail Payroll',
      status: 'In Progress',
      type: 'Epic'
    };
  }

  // Set default datetime to now
  elements.inputDateTime.value = toDateTimeInputString(new Date());

  // Setup initial UI
  renderSelectedIssue();
  renderQuickFavorites();
  renderTemplateChips();
  updateHeroStats();
  renderWeeklyCalendar();
  renderHistoryList();
  renderFavoritesFullList();
  updateConnectionStatusUI();
  populateSettingsForm();
  updateSubmitButtonLabel();

  // Setup Event Listeners
  setupEventListeners();
}

const GENERAL_NO_ISSUE = {
  key: 'INTERNAL-WORK',
  summary: 'General Internal Tasks / Meetings / Overhead',
  status: 'GENERAL',
  type: 'Activity',
  isGeneral: true
};

/**
 * Event Listeners Registration
 */
function setupEventListeners() {
  // Navigation tabs
  elements.viewTabs.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  elements.mobileNavItems.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'btnMobileSettings') {
        openModal(elements.modalSettings);
      } else {
        switchView(btn.dataset.view);
      }
    });
  });

  // Settings Modal Triggers
  elements.btnOpenSettings.addEventListener('click', () => openModal(elements.modalSettings));
  elements.btnCloseSettingsModal.addEventListener('click', () => closeModal(elements.modalSettings));
  elements.btnUserAvatar.addEventListener('click', () => openModal(elements.modalSettings));

  // Settings Actions
  elements.formSettings.addEventListener('submit', handleSaveSettings);
  elements.btnTestConnection.addEventListener('click', handleTestConnection);
  elements.btnClearData.addEventListener('click', handleClearData);

  // Issue Selector & No Issue Triggers
  elements.btnChangeIssue.addEventListener('click', () => openIssueModal('favorites'));
  elements.btnQuickSelectIssue.addEventListener('click', () => openIssueModal('all'));
  elements.btnCloseIssueModal.addEventListener('click', () => closeModal(elements.modalIssueSelector));

  if (elements.btnNoIssue) {
    elements.btnNoIssue.addEventListener('click', () => {
      state.selectedIssue = GENERAL_NO_ISSUE;
      renderSelectedIssue();
      renderQuickFavorites();
      showToast('Selected: No Specific Issue (General Work)', 'info', 2000);
    });
  }

  // Issue Search & Filtering
  elements.inputIssueSearch.addEventListener('input', debounce(handleIssueSearch, 300));
  document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderModalIssuesList();
    });
  });

  // Direct Key Apply
  elements.btnApplyDirectKey.addEventListener('click', handleApplyDirectKey);
  elements.inputDirectKey.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyDirectKey();
    }
  });

  // Add Custom Issue from Favorites Tab
  if (elements.btnAddCustomIssueBtn) {
    elements.btnAddCustomIssueBtn.addEventListener('click', () => {
      const key = prompt('Enter Jira Issue Key (e.g. NXT-101):');
      if (key && key.trim()) {
        const summary = prompt('Enter Issue Summary/Title (optional):') || 'Custom Jira Task';
        const newIssue = {
          key: key.trim().toUpperCase(),
          summary: summary.trim(),
          status: 'TO DO',
          type: 'Task'
        };
        storage.toggleFavorite(newIssue);
        state.favorites = storage.getFavorites();
        renderFavoritesFullList();
        renderQuickFavorites();
        showToast(`Added ${newIssue.key} to Starred Issues`, 'success');
      }
    });
  }

  // Time Inputs & Quick Chips
  elements.inputHours.addEventListener('input', () => {
    highlightActiveTimeChip();
    updateSubmitButtonLabel();
  });
  elements.inputMinutes.addEventListener('input', () => {
    highlightActiveTimeChip();
    updateSubmitButtonLabel();
  });

  elements.quickTimeChips.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const timeVal = chip.dataset.time;
      applyTimePreset(timeVal);
    });
  });

  // AI Enhance & Style Chips
  if (elements.btnAiEnhance) {
    elements.btnAiEnhance.addEventListener('click', handleAiEnhance);
  }

  if (elements.aiStylesBar) {
    elements.aiStylesBar.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.aiStylesBar.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.aiStyle = chip.dataset.style;
        showToast(`AI Style: ${chip.textContent.trim()}`, 'info', 1500);
      });
    });
  }

  // Ollama Settings Test
  if (elements.btnTestOllama) {
    elements.btnTestOllama.addEventListener('click', handleTestOllama);
  }

  // Date Shortcuts
  elements.btnDateToday.addEventListener('click', () => {
    elements.btnDateToday.classList.add('active');
    elements.btnDateYesterday.classList.remove('active');
    elements.inputDateTime.value = toDateTimeInputString(new Date());
  });

  elements.btnDateYesterday.addEventListener('click', () => {
    elements.btnDateYesterday.classList.add('active');
    elements.btnDateToday.classList.remove('active');
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    yest.setHours(9, 0, 0, 0);
    elements.inputDateTime.value = toDateTimeInputString(yest);
  });

  // Form Submit
  elements.formLogWork.addEventListener('submit', handleLogWorkSubmit);

  // Copy Standup
  elements.btnCopyStandup.addEventListener('click', handleCopyStandup);

  // Global Escape & Backdrop Close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(elements.modalSettings);
      closeModal(elements.modalIssueSelector);
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  // Custom storage events
  window.addEventListener('jira:settings-updated', (e) => {
    state.settings = e.detail;
    updateConnectionStatusUI();
    updateHeroStats();
  });

  window.addEventListener('jira:favorites-updated', (e) => {
    state.favorites = e.detail;
    renderQuickFavorites();
    renderFavoritesFullList();
  });

  window.addEventListener('jira:history-updated', (e) => {
    state.history = e.detail;
    updateHeroStats();
    renderWeeklyCalendar();
    renderHistoryList();
  });
}

/**
 * View Switcher
 */
function switchView(viewName) {
  // Update desktop tabs
  elements.viewTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });

  // Update mobile bottom nav
  elements.mobileNavItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  if (viewName === 'log-view') {
    elements.cardLogWork.style.display = 'block';
    elements.cardTimesheetSummary.style.display = 'block';
    elements.viewFavoritesSection.style.display = 'none';
  } else if (viewName === 'timesheet-view') {
    elements.cardLogWork.style.display = 'none';
    elements.cardTimesheetSummary.style.display = 'block';
    elements.viewFavoritesSection.style.display = 'none';
  } else if (viewName === 'favorites-view') {
    elements.cardLogWork.style.display = 'none';
    elements.cardTimesheetSummary.style.display = 'none';
    elements.viewFavoritesSection.style.display = 'block';
  }
}

/**
 * Render Active Selected Issue
 */
function renderSelectedIssue() {
  if (!state.selectedIssue) return;
  elements.selectedIssueKey.textContent = state.selectedIssue.key;
  elements.selectedIssueSummary.textContent = state.selectedIssue.summary || 'No summary provided';
  elements.selectedIssueStatus.textContent = state.selectedIssue.status || 'TO DO';

  const statusClass = (state.selectedIssue.status || '').toLowerCase().replace(/\s+/g, '-');
  elements.selectedIssueStatus.className = `issue-status-tag ${statusClass}`;

  // Update Type Icon with clean Atlassian SVG
  if (elements.selectedIssueTypeIcon) {
    const type = (state.selectedIssue.type || '').toLowerCase();
    if (type.includes('bug')) {
      elements.selectedIssueTypeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#DE350B" style="vertical-align:middle;"><rect width="16" height="16" rx="3" fill="#FFEBE6"/><circle cx="8" cy="8" r="3.5" fill="#DE350B"/></svg>`;
    } else if (type.includes('epic')) {
      elements.selectedIssueTypeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#6554C0" style="vertical-align:middle;"><rect width="16" height="16" rx="3" fill="#EAE6FF"/><polygon points="8 3 13 12 3 12" fill="#6554C0"/></svg>`;
    } else if (state.selectedIssue.isGeneral || type.includes('general') || type.includes('activity')) {
      elements.selectedIssueTypeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#0052CC" style="vertical-align:middle;"><rect width="16" height="16" rx="3" fill="#DEEBFF"/><rect x="4" y="5" width="8" height="6" rx="1" fill="#0052CC"/></svg>`;
    } else {
      elements.selectedIssueTypeIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#00875A" style="vertical-align:middle;"><rect width="16" height="16" rx="3" fill="#E3FCEF"/><rect x="4.5" y="4.5" width="7" height="7" rx="1" fill="#00875A"/></svg>`;
    }
  }
}

/**
 * Render Quick Starred Issues Pills
 */
function renderQuickFavorites() {
  elements.quickFavoritesList.innerHTML = '';
  const favs = state.favorites || [];

  if (favs.length === 0) {
    elements.quickFavoritesList.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">No starred issues. Search and pin issues to access them here.</span>';
    return;
  }

  favs.slice(0, 6).forEach(fav => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `template-chip ${state.selectedIssue?.key === fav.key ? 'active' : ''}`;
    chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#FFAB00" style="vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><strong>${fav.key}</strong> - ${fav.summary.substring(0, 24)}...`;
    chip.onclick = () => {
      state.selectedIssue = fav;
      renderSelectedIssue();
      renderQuickFavorites();
      showToast(`Selected issue: ${fav.key}`, 'info', 1500);
    };
    elements.quickFavoritesList.appendChild(chip);
  });
}

/**
 * Render Description Templates
 */
function renderTemplateChips() {
  elements.descTemplateChips.innerHTML = '';
  const templates = state.templates || [];

  templates.slice(0, 5).forEach(tpl => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'template-chip';
    chip.textContent = tpl;
    chip.onclick = () => {
      elements.inputDescription.value = tpl;
      elements.inputDescription.focus();
    };
    elements.descTemplateChips.appendChild(chip);
  });
}

/**
 * Time Preset Management
 */
function applyTimePreset(timeStr) {
  let hours = 0;
  let minutes = 0;

  if (timeStr.endsWith('m')) {
    minutes = parseInt(timeStr.replace('m', ''), 10) || 0;
    hours = 0;
  } else if (timeStr.endsWith('h')) {
    hours = parseInt(timeStr.replace('h', ''), 10) || 0;
    minutes = 0;
  }

  elements.inputHours.value = hours;
  elements.inputMinutes.value = minutes;

  highlightActiveTimeChip(timeStr);
  updateSubmitButtonLabel();
}

function highlightActiveTimeChip(activePreset = null) {
  const currentHours = parseInt(elements.inputHours.value, 10) || 0;
  const currentMins = parseInt(elements.inputMinutes.value, 10) || 0;

  elements.quickTimeChips.querySelectorAll('.chip-btn').forEach(chip => {
    const chipTime = chip.dataset.time;
    let isMatch = false;

    if (activePreset) {
      isMatch = chipTime === activePreset;
    } else {
      if (chipTime.endsWith('h') && currentMins === 0 && parseInt(chipTime, 10) === currentHours) {
        isMatch = true;
      } else if (chipTime.endsWith('m') && currentHours === 0 && parseInt(chipTime, 10) === currentMins) {
        isMatch = true;
      }
    }

    chip.classList.toggle('active', isMatch);
  });
}

function updateSubmitButtonLabel() {
  const h = parseInt(elements.inputHours.value, 10) || 0;
  const m = parseInt(elements.inputMinutes.value, 10) || 0;
  const timeFormatted = formatSecondsToTime(toSeconds(h, m));
  elements.btnSubmitText.textContent = `Submit to Jira (${timeFormatted})`;
}

/**
 * Hero Daily Progress Stats
 */
function updateHeroStats() {
  const todayStr = toDateInputString(new Date());
  const history = state.history || [];

  // Filter logs for today
  const todaysLogs = history.filter(item => {
    const itemDateStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
    return itemDateStr === todayStr;
  });

  let totalSeconds = 0;
  let billableSeconds = 0;
  let nonBillableSeconds = 0;

  todaysLogs.forEach(log => {
    const sec = log.timeSpentSeconds || 0;
    totalSeconds += sec;
    if (log.isBillable) {
      billableSeconds += sec;
    } else {
      nonBillableSeconds += sec;
    }
  });

  const dailyGoalHours = state.settings.dailyGoalHours || 8;
  const dailyGoalSeconds = dailyGoalHours * 3600;

  const totalHoursLogged = (totalSeconds / 3600).toFixed(1);
  const percent = Math.min(100, Math.round((totalSeconds / dailyGoalSeconds) * 100));

  elements.statDailyGoal.textContent = `${dailyGoalHours}.0h`;
  elements.statLoggedToday.textContent = `${totalHoursLogged}h`;
  elements.heroProgressFill.style.width = `${percent}%`;

  if (percent >= 100) {
    elements.heroProgressFill.classList.add('goal-reached');
    elements.statLoggedToday.style.color = 'var(--jira-green)';
  } else {
    elements.heroProgressFill.classList.remove('goal-reached');
    elements.statLoggedToday.style.color = 'var(--jira-cyan)';
  }

  const billableHours = (billableSeconds / 3600).toFixed(1);
  const nonBillableHours = (nonBillableSeconds / 3600).toFixed(1);

  elements.heroBillableHours.textContent = `${billableHours}h Billable`;
  elements.heroNonBillableHours.textContent = `${nonBillableHours}h Non-Billable`;

  const remainingSeconds = Math.max(0, dailyGoalSeconds - totalSeconds);
  if (remainingSeconds === 0) {
    elements.heroRemainingHoursText.textContent = `Daily target of ${dailyGoalHours}h reached`;
    elements.heroRemainingHoursText.style.color = 'var(--jira-green)';
  } else {
    const remHours = (remainingSeconds / 3600).toFixed(1);
    elements.heroRemainingHoursText.textContent = `${remHours}h remaining to complete daily goal`;
    elements.heroRemainingHoursText.style.color = 'var(--text-secondary)';
  }

  // Update date format
  const now = new Date();
  elements.heroDayTag.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Render Weekly Calendar Strip
 */
function renderWeeklyCalendar() {
  elements.weeklyCalendarStrip.innerHTML = '';
  const weekDays = getWeekRange(new Date());
  const history = state.history || [];
  const dailyGoalHours = state.settings.dailyGoalHours || 8;

  weekDays.forEach(day => {
    const dayStr = toDateInputString(day);
    const dayName = day.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = day.getDate();

    // Calculate hours logged on this day
    const dayLogs = history.filter(item => {
      const itemDateStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
      return itemDateStr === dayStr;
    });

    const totalDaySec = dayLogs.reduce((acc, cur) => acc + (cur.timeSpentSeconds || 0), 0);
    const totalDayHours = (totalDaySec / 3600).toFixed(1);
    const isCompleted = (totalDaySec / 3600) >= dailyGoalHours;
    const isSelected = state.selectedCalendarDate === dayStr;

    const dayCard = document.createElement('div');
    dayCard.className = `week-day-card ${isCompleted ? 'completed' : ''} ${isSelected ? 'active' : ''}`;
    dayCard.innerHTML = `
      <span class="week-day-name">${dayName}</span>
      <span class="week-day-number">${dayNum}</span>
      <span class="week-day-hours">${totalDayHours}h</span>
    `;

    dayCard.onclick = () => {
      if (state.selectedCalendarDate === dayStr) {
        state.selectedCalendarDate = null; // deselect to show all
        elements.historyFilterLabel.textContent = 'All Days';
      } else {
        state.selectedCalendarDate = dayStr;
        elements.historyFilterLabel.textContent = getFriendlyDateLabel(day);
      }
      renderWeeklyCalendar();
      renderHistoryList();
    };

    elements.weeklyCalendarStrip.appendChild(dayCard);
  });
}

/**
 * Render History Worklogs List
 */
function renderHistoryList() {
  elements.historyListContainer.innerHTML = '';
  let logs = state.history || [];

  if (state.selectedCalendarDate) {
    logs = logs.filter(item => {
      const itemDateStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
      return itemDateStr === state.selectedCalendarDate;
    });
  }

  elements.historyCount.textContent = logs.length;

  if (logs.length === 0) {
    elements.historyListContainer.innerHTML = `
      <div style="text-align:center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
        No worklogs found for this period. Log your first work entry above!
      </div>
    `;
    return;
  }

  logs.forEach(log => {
    const card = document.createElement('div');
    card.className = 'history-item-card';

    const timeFormatted = formatSecondsToTime(log.timeSpentSeconds);
    const friendlyDate = getFriendlyDateLabel(log.date || log.timestamp);
    const billableBadge = log.isBillable 
      ? `<span class="badge-pill-small billable">Billable</span>` 
      : `<span class="badge-pill-small" style="background:rgba(255,171,0,0.15); color:#ffd666;">Non-Billable</span>`;

    card.innerHTML = `
      <div class="history-main-content">
        <div class="history-key-row">
          <span style="font-family:'JetBrains Mono'; font-weight:700; color:var(--jira-blue-light);">${log.issueKey}</span>
          <span class="history-time-badge">${timeFormatted}</span>
          ${billableBadge}
          <span style="font-size:0.75rem; color:var(--text-muted); margin-left:auto;">${friendlyDate}</span>
        </div>
        <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">
          ${log.issueSummary || 'No summary'}
        </div>
        <div class="history-comment">
          "${log.comment || 'No description'}"
        </div>
      </div>
      <div class="history-actions">
        <button class="btn-icon-danger" title="Delete worklog entry" data-id="${log.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    const delBtn = card.querySelector('.btn-icon-danger');
    delBtn.onclick = () => {
      if (confirm(`Delete log entry for ${log.issueKey} (${timeFormatted})?`)) {
        storage.deleteHistoryEntry(log.id);
        showToast('Worklog entry removed', 'info');
      }
    };

    elements.historyListContainer.appendChild(card);
  });
}

/**
 * Handle Worklog Submission
 */
async function handleLogWorkSubmit(e) {
  e.preventDefault();

  if (!state.selectedIssue) {
    showToast('Please select a Jira issue first.', 'warning');
    return;
  }

  const hours = parseFloat(elements.inputHours.value) || 0;
  const minutes = parseFloat(elements.inputMinutes.value) || 0;
  const totalSeconds = toSeconds(hours, minutes);

  if (totalSeconds <= 0) {
    showToast('Please specify time spent (e.g. 8h).', 'warning');
    return;
  }

  const category = document.querySelector('input[name="workCategory"]:checked')?.value || 'Billable';
  const isBillable = category === 'Billable';
  const description = elements.inputDescription.value.trim() || 'Work logged via Mobile Timesheet App';
  const startedDateTime = elements.inputDateTime.value ? new Date(elements.inputDateTime.value) : new Date();
  const jiraStartedStr = toJiraDateTimeString(startedDateTime);

  // Set loading state
  state.isSubmitting = true;
  elements.btnSubmitWorklog.disabled = true;
  elements.btnSubmitText.textContent = 'Logging to Jira...';

  let syncedToJira = false;
  let syncError = null;

  const isGeneralIssue = state.selectedIssue.isGeneral || state.selectedIssue.key === 'NO-ISSUE';

  if (!isGeneralIssue) {
    try {
      const creds = state.settings;
      if (creds.domain && creds.email && creds.apiToken) {
        // Call Jira API
        await jiraApi.logWork(state.selectedIssue.key, {
          timeSpentSeconds: totalSeconds,
          started: jiraStartedStr,
          comment: `${description} [${category}]`
        }, creds);
        syncedToJira = true;
      } else {
        syncedToJira = false;
      }
    } catch (err) {
      syncError = err.message;
      console.error('Jira sync error:', err);
    }
  }

  // Save worklog entry locally
  const newEntry = storage.addWorklogToHistory({
    issueKey: state.selectedIssue.key,
    issueSummary: state.selectedIssue.summary,
    timeSpentSeconds: totalSeconds,
    timeSpentFormatted: formatSecondsToTime(totalSeconds),
    date: startedDateTime.toISOString(),
    started: jiraStartedStr,
    comment: description,
    isBillable,
    syncedToJira,
  });

  // Add to recents if not general
  if (!isGeneralIssue) {
    storage.addRecentIssue(state.selectedIssue);
  }

  // Add template if unique
  storage.addTemplate(description);

  state.isSubmitting = false;
  elements.btnSubmitWorklog.disabled = false;
  updateSubmitButtonLabel();

  if (isGeneralIssue) {
    showToast(`Logged ${formatSecondsToTime(totalSeconds)} for General Activity`, 'success', 3500);
  } else if (syncedToJira) {
    showToast(`Worklog submitted successfully to Jira (${state.selectedIssue.key}, ${formatSecondsToTime(totalSeconds)})`, 'success', 4000);
  } else if (syncError) {
    showToast(`Saved locally. Jira sync error: ${syncError}`, 'warning', 5000);
  } else {
    showToast(`Worklog saved to local timesheet (${formatSecondsToTime(totalSeconds)})`, 'success', 3500);
  }

  // Check if "Log another" is checked
  if (!elements.checkLogAnother.checked) {
    // Reset description or focus
    elements.inputDescription.value = 'Development & implementation of features';
  }
}

/**
 * Standup Summary Generator & Copy
 */
function handleCopyStandup() {
  const todayStr = toDateInputString(new Date());
  const history = state.history || [];
  const todaysLogs = history.filter(item => {
    const itemDateStr = item.date ? item.date.substring(0, 10) : toDateInputString(new Date(item.timestamp));
    return itemDateStr === todayStr;
  });

  if (todaysLogs.length === 0) {
    showToast('No work logged today yet to generate standup text.', 'warning');
    return;
  }

  const totalSec = todaysLogs.reduce((acc, cur) => acc + (cur.timeSpentSeconds || 0), 0);
  const totalHours = (totalSec / 3600).toFixed(1);

  let text = `[Daily Standup Report - ${todayStr}]\n`;
  text += `Total Logged: ${totalHours}h\n\n`;

  todaysLogs.forEach((log, index) => {
    text += `${index + 1}. [${log.issueKey}] (${log.timeSpentFormatted}) - ${log.comment}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showToast('Standup summary copied to clipboard', 'success', 3500);
  }).catch(() => {
    showToast('Failed to copy to clipboard automatically', 'error');
  });
}

function getStarSvg(isFav) {
  if (isFav) {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="#FFAB00" stroke="#FFAB00" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

/**
 * Issue Selector Modal & Filtering
 */
function openIssueModal(defaultTab = 'favorites') {
  state.activeFilter = defaultTab;
  document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === defaultTab);
  });
  elements.inputIssueSearch.value = '';
  renderModalIssuesList();
  openModal(elements.modalIssueSelector);
}

function handleIssueSearch() {
  renderModalIssuesList();
}

async function renderModalIssuesList() {
  elements.modalIssuesList.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted);">Loading issues...</div>';
  const query = elements.inputIssueSearch.value.trim().toLowerCase();
  let issues = [];

  if (state.activeFilter === 'favorites') {
    issues = state.favorites || [];
  } else if (state.activeFilter === 'recent') {
    issues = state.recents || [];
  } else if (state.activeFilter === 'my-issues') {
    // If Jira is connected, try to fetch live issues
    if (state.settings.domain && state.settings.email && state.settings.apiToken) {
      try {
        issues = await jiraApi.searchIssues(query, state.settings);
      } catch (e) {
        issues = state.favorites;
      }
    } else {
      issues = state.favorites;
    }
  } else {
    // All presets + favorites
    issues = [...state.favorites, ...state.recents];
  }

  // Filter by search query if present
  if (query) {
    issues = issues.filter(i => 
      i.key.toLowerCase().includes(query) || 
      (i.summary && i.summary.toLowerCase().includes(query))
    );
  }

  // Deduplicate by key
  const uniqueIssues = [];
  const seenKeys = new Set();
  issues.forEach(i => {
    if (!seenKeys.has(i.key)) {
      seenKeys.add(i.key);
      uniqueIssues.push(i);
    }
  });

  elements.modalIssuesList.innerHTML = '';

  // Add General Activity Option at the top
  const noIssueCard = document.createElement('div');
  const isNoIssueSelected = state.selectedIssue?.isGeneral || state.selectedIssue?.key === 'INTERNAL-WORK';
  noIssueCard.className = `issue-item-card ${isNoIssueSelected ? 'selected' : ''}`;
  noIssueCard.style.border = '1px solid rgba(0, 82, 204, 0.4)';
  noIssueCard.style.background = isNoIssueSelected ? 'rgba(0, 82, 204, 0.15)' : 'rgba(255, 255, 255, 0.02)';
  noIssueCard.innerHTML = `
    <div class="issue-item-main" style="cursor:pointer; width:100%;">
      <div class="issue-item-header">
        <span class="issue-item-key" style="color:#579DFF;">INTERNAL-WORK</span>
        <span class="issue-status-tag" style="background:rgba(0,82,204,0.2); color:#579DFF;">GENERAL ACTIVITY</span>
      </div>
      <div class="issue-item-summary">Log general administrative tasks, meetings, or internal project overhead</div>
    </div>
  `;
  noIssueCard.onclick = () => {
    state.selectedIssue = GENERAL_NO_ISSUE;
    renderSelectedIssue();
    renderQuickFavorites();
    closeModal(elements.modalIssueSelector);
    showToast('Selected: General Internal Activity', 'info', 2000);
  };
  elements.modalIssuesList.appendChild(noIssueCard);

  uniqueIssues.forEach(issue => {
    const isSelected = state.selectedIssue?.key === issue.key;
    const isFav = storage.isFavorite(issue.key);

    const card = document.createElement('div');
    card.className = `issue-item-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="issue-item-main">
        <div class="issue-item-header">
          <span class="issue-item-key">${issue.key}</span>
          <span class="issue-status-tag ${(issue.status || '').toLowerCase().replace(/\s+/g, '-')}">${issue.status || 'TO DO'}</span>
        </div>
        <div class="issue-item-summary">${issue.summary || 'No summary'}</div>
      </div>
      <button class="star-fav-btn ${isFav ? 'is-fav' : ''}" title="Star as favorite">
        ${getStarSvg(isFav)}
      </button>
    `;

    // Click to select
    card.querySelector('.issue-item-main').onclick = () => {
      state.selectedIssue = issue;
      renderSelectedIssue();
      renderQuickFavorites();
      closeModal(elements.modalIssueSelector);
      showToast(`Selected ${issue.key}`, 'info', 1500);
    };

    // Toggle Favorite
    const starBtn = card.querySelector('.star-fav-btn');
    starBtn.onclick = (e) => {
      e.stopPropagation();
      const updatedFavState = storage.toggleFavorite(issue);
      starBtn.innerHTML = getStarSvg(updatedFavState);
      starBtn.classList.toggle('is-fav', updatedFavState);
      state.favorites = storage.getFavorites();
      renderQuickFavorites();
      renderFavoritesFullList();
    };

    elements.modalIssuesList.appendChild(card);
  });
}

async function handleApplyDirectKey() {
  const key = elements.inputDirectKey.value.trim().toUpperCase();
  if (!key) {
    showToast('Please enter a Jira Issue Key (e.g. AAIB2311-39)', 'warning');
    return;
  }

  showToast(`Fetching ${key} from Jira...`, 'info', 1500);

  let issue = {
    key: key,
    summary: `Jira Issue ${key}`,
    status: 'TO DO',
    type: 'Task'
  };

  // Try to fetch live issue details from Jira Cloud
  const creds = state.settings;
  if (creds.domain && creds.email && creds.apiToken) {
    try {
      const liveIssue = await jiraApi.getIssue(key, creds);
      if (liveIssue) {
        issue = liveIssue;
      }
    } catch (e) {
      console.warn('Could not fetch direct issue from Jira:', e.message);
    }
  }

  storage.addRecentIssue(issue);
  state.selectedIssue = issue;
  renderSelectedIssue();
  renderQuickFavorites();
  closeModal(elements.modalIssueSelector);
  elements.inputDirectKey.value = '';
  showToast(`Selected ${issue.key}: ${issue.summary.substring(0, 30)}...`, 'success', 2500);
}

/**
 * Starred Issues Tab Full View
 */
function renderFavoritesFullList() {
  if (!elements.favoritesFullList) return;
  elements.favoritesFullList.innerHTML = '';
  const favs = state.favorites || [];

  if (favs.length === 0) {
    elements.favoritesFullList.innerHTML = `
      <div style="padding:24px; text-align:center; color:var(--text-muted);">
        No starred issues yet. Click "+ Add Ticket Key" above to pin your frequent tickets.
      </div>
    `;
    return;
  }

  favs.forEach(fav => {
    const card = document.createElement('div');
    card.className = 'issue-item-card';
    card.innerHTML = `
      <div class="issue-item-main" style="cursor:pointer;">
        <div class="issue-item-header">
          <span class="issue-item-key">${fav.key}</span>
          <span class="issue-status-tag ${(fav.status || '').toLowerCase().replace(/\s+/g, '-')}">${fav.status || 'TO DO'}</span>
        </div>
        <div class="issue-item-summary">${fav.summary || 'No summary'}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="header-btn" style="padding:4px 10px; font-size:0.75rem;">Log Work</button>
        <button class="btn-icon-danger" title="Remove from favorites">&times;</button>
      </div>
    `;

    card.querySelector('.issue-item-main').onclick = () => {
      state.selectedIssue = fav;
      renderSelectedIssue();
      switchView('log-view');
      showToast(`Selected ${fav.key}`, 'info');
    };

    card.querySelector('.header-btn').onclick = () => {
      state.selectedIssue = fav;
      renderSelectedIssue();
      switchView('log-view');
    };

    card.querySelector('.btn-icon-danger').onclick = () => {
      storage.toggleFavorite(fav);
      state.favorites = storage.getFavorites();
      renderFavoritesFullList();
      renderQuickFavorites();
      showToast(`Removed ${fav.key} from starred`, 'info');
    };

    elements.favoritesFullList.appendChild(card);
  });
}

/**
 * AI Enhance Worklog Description Handler
 */
async function handleAiEnhance() {
  const currentText = elements.inputDescription.value.trim();
  elements.btnAiEnhance.classList.add('loading');
  elements.aiEnhanceText.textContent = 'Refining...';

  try {
    const res = await ollamaService.enhanceText(currentText, {
      style: state.aiStyle || 'professional',
      issueKey: state.selectedIssue?.key || '',
      issueSummary: state.selectedIssue?.summary || '',
      endpoint: state.settings.ollamaEndpoint || 'http://localhost:11434',
      model: state.settings.ollamaModel || 'llama3.2'
    });

    elements.inputDescription.value = res.enhancedText;
    showToast('Description refined successfully', 'success', 3000);
  } catch (err) {
    showToast(`Notice: ${err.message}`, 'warning');
  } finally {
    elements.btnAiEnhance.classList.remove('loading');
    elements.aiEnhanceText.textContent = 'Enhance';
  }
}

/**
 * Settings & Connection Management
 */
function populateSettingsForm() {
  const s = state.settings;
  elements.settingDomain.value = s.domain || 'valleysoft.atlassian.net';
  elements.settingEmail.value = s.email || '';
  elements.settingApiToken.value = s.apiToken || '';
  elements.settingDailyGoal.value = s.dailyGoalHours || 8;
}

function updateConnectionStatusUI() {
  const s = state.settings;
  elements.headerStatusDot.className = 'status-dot connected';

  if (s.isConnected && s.displayName) {
    elements.headerStatusText.textContent = `Online: ${s.displayName} (${s.domain || 'Jira Cloud'})`;
  } else if (s.domain) {
    elements.headerStatusText.textContent = `Online Mode (${s.domain})`;
  } else {
    elements.headerStatusText.textContent = 'Online Mode (Jira Cloud)';
  }

  // Update user initials
  if (s.displayName) {
    const parts = s.displayName.trim().split(' ');
    const initials = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
    elements.userAvatarInitials.textContent = initials;
  }
}

async function handleTestConnection() {
  const domain = elements.settingDomain.value.trim();
  const email = elements.settingEmail.value.trim();
  const apiToken = elements.settingApiToken.value.trim();

  if (!domain || !email || !apiToken) {
    showBanner('Please fill in Jira Domain, Email, and API Token before testing.', 'warning');
    return;
  }

  showBanner('Testing connection with Jira Cloud...', 'info');
  elements.btnTestConnection.disabled = true;

  try {
    const user = await jiraApi.testConnection(domain, email, apiToken);
    showBanner(`✅ Success! Authenticated as <strong>${user.displayName}</strong> (${user.emailAddress})`, 'success');
    
    // Update settings in memory
    state.settings.displayName = user.displayName;
    state.settings.avatarUrl = user.avatarUrl;
    state.settings.isConnected = true;
    updateConnectionStatusUI();
  } catch (err) {
    showBanner(`❌ Connection Failed: ${err.message}`, 'error');
    state.settings.isConnected = false;
    updateConnectionStatusUI();
  } finally {
    elements.btnTestConnection.disabled = false;
  }
}

function handleSaveSettings(e) {
  e.preventDefault();
  const domain = elements.settingDomain.value.trim();
  const email = elements.settingEmail.value.trim();
  const apiToken = elements.settingApiToken.value.trim();
  const dailyGoalHours = parseInt(elements.settingDailyGoal.value, 10) || 8;

  const newSettings = {
    ...state.settings,
    domain,
    email,
    apiToken,
    dailyGoalHours,
    isConnected: !!(domain && email && apiToken)
  };

  storage.saveSettings(newSettings);
  closeModal(elements.modalSettings);
  showToast('Settings saved successfully!', 'success');
}

function handleClearData() {
  if (confirm('Are you sure you want to reset all stored worklogs and settings?')) {
    storage.clearAllData();
  }
}

function showBanner(html, type = 'info') {
  elements.connectionStatusBanner.style.display = 'block';
  elements.connectionStatusBanner.innerHTML = html;
  
  const colors = {
    info: 'rgba(38, 132, 255, 0.15)',
    success: 'rgba(54, 179, 126, 0.18)',
    error: 'rgba(255, 86, 48, 0.18)',
    warning: 'rgba(255, 171, 0, 0.18)'
  };
  elements.connectionStatusBanner.style.background = colors[type] || colors.info;
}

/**
 * Modal Helpers
 */
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Debounce Utility
 */
function debounce(fn, wait = 250) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Start application
document.addEventListener('DOMContentLoaded', init);
