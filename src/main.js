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
  isMultiDayMode: false,
  selectedMultiDays: [],
  selectedHistoryIds: new Set(),
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
  selectedIssueTypeIcon: document.getElementById('selectedIssueTypeIcon'),
  btnNoIssue: document.getElementById('btnNoIssue'),
  inputHours: document.getElementById('inputHours'),
  inputMinutes: document.getElementById('inputMinutes'),
  quickTimeChips: document.getElementById('quickTimeChips'),
  inputDateTime: document.getElementById('inputDateTime'),
  btnDateToday: document.getElementById('btnDateToday'),
  btnDateYesterday: document.getElementById('btnDateYesterday'),
  btnModeSingleDay: document.getElementById('btnModeSingleDay'),
  btnModeMultiDays: document.getElementById('btnModeMultiDays'),
  multiDaysCountBadge: document.getElementById('multiDaysCountBadge'),
  containerSingleDay: document.getElementById('containerSingleDay'),
  containerMultiDays: document.getElementById('containerMultiDays'),
  btnMultiSubRange: document.getElementById('btnMultiSubRange'),
  btnMultiSubWeek: document.getElementById('btnMultiSubWeek'),
  multiSubRangeContainer: document.getElementById('multiSubRangeContainer'),
  multiSubWeekContainer: document.getElementById('multiSubWeekContainer'),
  inputRangeFrom: document.getElementById('inputRangeFrom'),
  inputRangeTo: document.getElementById('inputRangeTo'),
  checkSkipWeekends: document.getElementById('checkSkipWeekends'),
  btnQuickThisWeek: document.getElementById('btnQuickThisWeek'),
  btnQuickLastWeek: document.getElementById('btnQuickLastWeek'),
  btnQuickThisMonth: document.getElementById('btnQuickThisMonth'),
  btnPresetSunThu: document.getElementById('btnPresetSunThu'),
  btnPresetMonFri: document.getElementById('btnPresetMonFri'),
  btnPresetAllWeek: document.getElementById('btnPresetAllWeek'),
  btnPresetClearDays: document.getElementById('btnPresetClearDays'),
  multiDaysGrid: document.getElementById('multiDaysGrid'),
  selectedDaysCountText: document.getElementById('selectedDaysCountText'),
  multiDaysTotalHoursText: document.getElementById('multiDaysTotalHoursText'),
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

  // Issue Selector Modal & Right Pane
  modalIssueSelector: document.getElementById('modalIssueSelector'),
  btnCloseIssueModal: document.getElementById('btnCloseIssueModal'),
  btnCloseIssueModalFooter: document.getElementById('btnCloseIssueModalFooter'),
  btnOpenAddCustomFromSelector: document.getElementById('btnOpenAddCustomFromSelector'),
  inputIssueSearch: document.getElementById('inputIssueSearch'),
  selectProjectFilter: document.getElementById('selectProjectFilter'),
  modalIssuesList: document.getElementById('modalIssuesList'),

  // Settings & Jira Connection Modal
  modalSettings: document.getElementById('modalSettings'),
  btnCloseSettingsModal: document.getElementById('btnCloseSettingsModal'),
  btnCancelSettings: document.getElementById('btnCancelSettings'),
  btnToggleTokenVisibility: document.getElementById('btnToggleTokenVisibility'),
  formSettings: document.getElementById('formSettings'),
  settingDomain: document.getElementById('settingDomain'),
  settingEmail: document.getElementById('settingEmail'),
  settingApiToken: document.getElementById('settingApiToken'),
  settingDailyGoal: document.getElementById('settingDailyGoal'),
  btnTestConnection: document.getElementById('btnTestConnection'),
  connectionStatusBanner: document.getElementById('connectionStatusBanner'),
  btnClearData: document.getElementById('btnClearData'),

  // Add / Update Custom Issue Modal
  modalAddCustomTicket: document.getElementById('modalAddCustomTicket'),
  customTicketModalTitle: document.getElementById('customTicketModalTitle'),
  btnCloseCustomTicketModal: document.getElementById('btnCloseCustomTicketModal'),
  btnCancelCustomTicket: document.getElementById('btnCancelCustomTicket'),
  formAddCustomTicket: document.getElementById('formAddCustomTicket'),
  inputCustomTicketKey: document.getElementById('inputCustomTicketKey'),
  inputCustomTicketSummary: document.getElementById('inputCustomTicketSummary'),
  selectCustomTicketType: document.getElementById('selectCustomTicketType'),
  inputCustomTicketOrder: document.getElementById('inputCustomTicketOrder'),
  checkCustomTicketStar: document.getElementById('checkCustomTicketStar'),

  // Custom Centered Confirmation Modal
  modalCustomConfirm: document.getElementById('modalCustomConfirm'),
  confirmModalAccent: document.getElementById('confirmModalAccent'),
  confirmModalIconBadge: document.getElementById('confirmModalIconBadge'),
  confirmModalTitle: document.getElementById('confirmModalTitle'),
  confirmModalSubtitle: document.getElementById('confirmModalSubtitle'),
  confirmModalMessage: document.getElementById('confirmModalMessage'),
  btnCancelConfirm: document.getElementById('btnCancelConfirm'),
  btnActionConfirm: document.getElementById('btnActionConfirm'),
  btnCloseConfirmModal: document.getElementById('btnCloseConfirmModal'),

  // Right-side Log Work Pane
  inputPaneIssueSearch: document.getElementById('inputPaneIssueSearch'),
  selectPaneProjectFilter: document.getElementById('selectPaneProjectFilter'),
  paneIssuesList: document.getElementById('paneIssuesList'),
  paneIssueCount: document.getElementById('paneIssueCount'),
  paneTabsContainer: document.getElementById('paneTabsContainer'),

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

  // Set default multi-day date range (Sunday to Thursday of current week)
  const weekDays = getWeekRange(new Date());
  if (elements.inputRangeFrom) elements.inputRangeFrom.value = toDateInputString(weekDays[0]);
  if (elements.inputRangeTo) elements.inputRangeTo.value = toDateInputString(weekDays[weekDays.length - 1]);
  calculateDatesFromRange();

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
  renderPaneIssuesList();

  // Populate projects in pane filter
  const creds = state.settings;
  if (creds.domain && creds.email && creds.apiToken) {
    jiraApi.getProjects(creds).then(projects => {
      if (Array.isArray(projects) && projects.length > 0) {
        cachedProjects = projects;
        const optionsHtml = '<option value="">Filter by Project: All Projects (41)</option>' +
          projects.map(p => `<option value="${p.key}">${p.key} - ${p.name}</option>`).join('');
        if (elements.selectPaneProjectFilter) elements.selectPaneProjectFilter.innerHTML = optionsHtml;
        if (elements.selectProjectFilter) elements.selectProjectFilter.innerHTML = optionsHtml;
      }
    }).catch(e => console.warn('Init projects load error:', e));
  }

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

let paneActiveFilter = 'my-issues';

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

  // Right-side Log Work Pane Event Listeners
  if (elements.inputPaneIssueSearch) {
    elements.inputPaneIssueSearch.addEventListener('input', debounce(renderPaneIssuesList, 300));
  }

  if (elements.selectPaneProjectFilter) {
    elements.selectPaneProjectFilter.addEventListener('change', () => renderPaneIssuesList());
  }

  document.querySelectorAll('.jira-pane-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.jira-pane-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      paneActiveFilter = tab.dataset.filter;
      renderPaneIssuesList();
    });
  });

  // Settings Modal Triggers
  if (elements.btnOpenSettings) elements.btnOpenSettings.addEventListener('click', () => openModal(elements.modalSettings));
  if (elements.btnCloseSettingsModal) elements.btnCloseSettingsModal.addEventListener('click', () => closeModal(elements.modalSettings));
  if (elements.btnUserAvatar) elements.btnUserAvatar.addEventListener('click', () => openModal(elements.modalSettings));

  // Settings Actions
  if (elements.formSettings) elements.formSettings.addEventListener('submit', handleSaveSettings);
  if (elements.btnTestConnection) elements.btnTestConnection.addEventListener('click', handleTestConnection);
  if (elements.btnClearData) elements.btnClearData.addEventListener('click', handleClearData);

  // Issue Selector Modal Close
  if (elements.btnCloseIssueModal) elements.btnCloseIssueModal.addEventListener('click', () => closeModal(elements.modalIssueSelector));

  if (elements.btnNoIssue) {
    elements.btnNoIssue.addEventListener('click', () => {
      state.selectedIssue = GENERAL_NO_ISSUE;
      renderSelectedIssue();
      renderPaneIssuesList();
      showToast('Selected: Non-Ticket Activity', 'info', 2000);
    });
  }

  // Issue Search & Filtering
  elements.inputIssueSearch.addEventListener('input', debounce(handleIssueSearch, 300));
  if (elements.selectProjectFilter) {
    elements.selectProjectFilter.addEventListener('change', () => {
      renderModalIssuesList();
    });
  }
  document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderModalIssuesList();
    });
  });

  // Browse and Star Issues from Favorites Tab
  if (elements.btnAddCustomIssueBtn) {
    elements.btnAddCustomIssueBtn.addEventListener('click', () => {
      openIssueModal('all');
      showToast('Browse and click the star icon to pin issues', 'info', 2500);
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

  // Single Day vs Multi-Days Mode Switcher
  if (elements.btnModeSingleDay && elements.btnModeMultiDays) {
    elements.btnModeSingleDay.addEventListener('click', () => {
      state.isMultiDayMode = false;
      elements.btnModeSingleDay.classList.add('active');
      elements.btnModeMultiDays.classList.remove('active');
      if (elements.containerSingleDay) elements.containerSingleDay.style.display = 'block';
      if (elements.containerMultiDays) elements.containerMultiDays.style.display = 'none';
      updateSubmitButtonLabel();
    });

    elements.btnModeMultiDays.addEventListener('click', () => {
      state.isMultiDayMode = true;
      elements.btnModeMultiDays.classList.add('active');
      elements.btnModeSingleDay.classList.remove('active');
      if (elements.containerSingleDay) elements.containerSingleDay.style.display = 'none';
      if (elements.containerMultiDays) elements.containerMultiDays.style.display = 'block';
      if (state.selectedMultiDays.length === 0) {
        calculateDatesFromRange();
      } else {
        renderMultiDaysSummary();
      }
      updateSubmitButtonLabel();
    });
  }

  // Multi-Days Sub-mode Toggle (Date Range vs Week Grid)
  if (elements.btnMultiSubRange && elements.btnMultiSubWeek) {
    elements.btnMultiSubRange.addEventListener('click', () => {
      elements.btnMultiSubRange.classList.add('active');
      elements.btnMultiSubWeek.classList.remove('active');
      if (elements.multiSubRangeContainer) elements.multiSubRangeContainer.style.display = 'block';
      if (elements.multiSubWeekContainer) elements.multiSubWeekContainer.style.display = 'none';
      calculateDatesFromRange();
    });

    elements.btnMultiSubWeek.addEventListener('click', () => {
      elements.btnMultiSubWeek.classList.add('active');
      elements.btnMultiSubRange.classList.remove('active');
      if (elements.multiSubRangeContainer) elements.multiSubRangeContainer.style.display = 'none';
      if (elements.multiSubWeekContainer) elements.multiSubWeekContainer.style.display = 'block';
      renderMultiDaysGrid();
    });
  }

  // Range Inputs & Checkbox Listeners
  if (elements.inputRangeFrom) elements.inputRangeFrom.addEventListener('change', calculateDatesFromRange);
  if (elements.inputRangeTo) elements.inputRangeTo.addEventListener('change', calculateDatesFromRange);
  if (elements.checkSkipWeekends) elements.checkSkipWeekends.addEventListener('change', calculateDatesFromRange);

  // Quick Range Presets
  if (elements.btnQuickThisWeek) elements.btnQuickThisWeek.addEventListener('click', () => setQuickRange('this-week'));
  if (elements.btnQuickLastWeek) elements.btnQuickLastWeek.addEventListener('click', () => setQuickRange('last-week'));
  if (elements.btnQuickThisMonth) elements.btnQuickThisMonth.addEventListener('click', () => setQuickRange('this-month'));

  // Multi-Days Presets
  if (elements.btnPresetSunThu) elements.btnPresetSunThu.addEventListener('click', () => setMultiDayPreset('sun-thu'));
  if (elements.btnPresetMonFri) elements.btnPresetMonFri.addEventListener('click', () => setMultiDayPreset('mon-fri'));
  if (elements.btnPresetAllWeek) elements.btnPresetAllWeek.addEventListener('click', () => setMultiDayPreset('all'));
  if (elements.btnPresetClearDays) elements.btnPresetClearDays.addEventListener('click', () => setMultiDayPreset('clear'));

  // Form Submit
  elements.formLogWork.addEventListener('submit', handleLogWorkSubmit);

  // Modal Controls & Actions
  if (elements.btnCloseIssueModalFooter) {
    elements.btnCloseIssueModalFooter.addEventListener('click', () => closeModal(elements.modalIssueSelector));
  }
  if (elements.btnOpenAddCustomFromSelector) {
    elements.btnOpenAddCustomFromSelector.addEventListener('click', () => {
      closeModal(elements.modalIssueSelector);
      openAddCustomIssueModal();
    });
  }
  if (elements.btnAddCustomIssueBtn) {
    elements.btnAddCustomIssueBtn.addEventListener('click', () => {
      openAddCustomIssueModal();
    });
  }
  if (elements.btnCloseCustomTicketModal) {
    elements.btnCloseCustomTicketModal.addEventListener('click', () => closeModal(elements.modalAddCustomTicket));
  }
  if (elements.btnCancelCustomTicket) {
    elements.btnCancelCustomTicket.addEventListener('click', () => closeModal(elements.modalAddCustomTicket));
  }
  if (elements.formAddCustomTicket) {
    elements.formAddCustomTicket.addEventListener('submit', handleAddCustomTicketSubmit);
  }
  if (elements.btnCancelSettings) {
    elements.btnCancelSettings.addEventListener('click', () => closeModal(elements.modalSettings));
  }
  if (elements.btnToggleTokenVisibility) {
    elements.btnToggleTokenVisibility.addEventListener('click', () => {
      const isPwd = elements.settingApiToken.type === 'password';
      elements.settingApiToken.type = isPwd ? 'text' : 'password';
      elements.btnToggleTokenVisibility.textContent = isPwd ? '🔒' : '👁️';
    });
  }

  // Quick Prefix Chips for Custom Ticket
  document.querySelectorAll('.custom-prefix-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prefix = chip.dataset.prefix;
      if (elements.inputCustomTicketKey) {
        elements.inputCustomTicketKey.value = prefix;
        elements.inputCustomTicketKey.focus();
      }
    });
  });

  // Copy Standup
  elements.btnCopyStandup.addEventListener('click', handleCopyStandup);

  // Global Escape & Backdrop Close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(elements.modalSettings);
      closeModal(elements.modalIssueSelector);
      closeModal(elements.modalAddCustomTicket);
      closeModal(elements.modalCustomConfirm);
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
    if (elements.cardLogWork) elements.cardLogWork.style.display = '';
    if (elements.cardTimesheetSummary) elements.cardTimesheetSummary.style.display = 'none';
    if (elements.viewFavoritesSection) elements.viewFavoritesSection.style.display = 'none';
  } else if (viewName === 'timesheet-view') {
    if (elements.cardLogWork) elements.cardLogWork.style.display = 'none';
    if (elements.cardTimesheetSummary) elements.cardTimesheetSummary.style.display = '';
    if (elements.viewFavoritesSection) elements.viewFavoritesSection.style.display = 'none';
  } else if (viewName === 'favorites-view') {
    if (elements.cardLogWork) elements.cardLogWork.style.display = 'none';
    if (elements.cardTimesheetSummary) elements.cardTimesheetSummary.style.display = 'none';
    if (elements.viewFavoritesSection) elements.viewFavoritesSection.style.display = 'block';
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
  if (!elements.quickFavoritesList) return;
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

function renderMultiDaysSummary() {
  const count = state.selectedMultiDays.length;
  if (elements.selectedDaysCountText) {
    elements.selectedDaysCountText.textContent = `${count} day${count === 1 ? '' : 's'}`;
  }
  if (elements.multiDaysCountBadge) {
    elements.multiDaysCountBadge.textContent = count;
    elements.multiDaysCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  const h = parseFloat(elements.inputHours.value) || 0;
  const m = parseFloat(elements.inputMinutes.value) || 0;
  const totalPerDaySec = toSeconds(h, m);
  const totalAllSec = totalPerDaySec * count;
  if (elements.multiDaysTotalHoursText) {
    elements.multiDaysTotalHoursText.textContent = formatSecondsToTime(totalAllSec);
  }
}

function calculateDatesFromRange() {
  if (!elements.inputRangeFrom || !elements.inputRangeTo) return;
  const fromVal = elements.inputRangeFrom.value;
  const toVal = elements.inputRangeTo.value;
  if (!fromVal || !toVal) return;

  const fromDate = new Date(fromVal);
  const toDate = new Date(toVal);
  if (fromDate > toDate) {
    showToast('From Date cannot be after To Date', 'warning', 2000);
    return;
  }

  const skipWeekends = elements.checkSkipWeekends ? elements.checkSkipWeekends.checked : false;
  const dates = [];
  const curr = new Date(fromDate);

  while (curr <= toDate) {
    const dayOfWeek = curr.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
    // Skip Friday (5) and Saturday (6) if enabled
    if (!skipWeekends || (dayOfWeek !== 5 && dayOfWeek !== 6)) {
      dates.push(toDateInputString(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }

  state.selectedMultiDays = dates;
  renderMultiDaysSummary();
  updateSubmitButtonLabel();
}

function setQuickRange(rangeType) {
  const now = new Date();
  let fromDate = new Date();
  let toDate = new Date();

  if (rangeType === 'this-week') {
    const weekDays = getWeekRange(now);
    fromDate = weekDays[0];
    toDate = weekDays[weekDays.length - 1];
  } else if (rangeType === 'last-week') {
    const lastWeekDate = new Date();
    lastWeekDate.setDate(now.getDate() - 7);
    const weekDays = getWeekRange(lastWeekDate);
    fromDate = weekDays[0];
    toDate = weekDays[weekDays.length - 1];
  } else if (rangeType === 'this-month') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  if (elements.inputRangeFrom) elements.inputRangeFrom.value = toDateInputString(fromDate);
  if (elements.inputRangeTo) elements.inputRangeTo.value = toDateInputString(toDate);
  calculateDatesFromRange();
}

function renderMultiDaysGrid() {
  if (!elements.multiDaysGrid) return;
  elements.multiDaysGrid.innerHTML = '';

  const weekDays = getWeekRange(new Date());
  weekDays.forEach(day => {
    const dayStr = toDateInputString(day);
    const isSelected = state.selectedMultiDays.includes(dayStr);
    const dayName = day.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = day.getDate();

    const card = document.createElement('div');
    card.className = `multi-day-card ${isSelected ? 'selected' : ''}`;
    card.dataset.date = dayStr;
    card.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-num">${dayNum}</span>
      <span class="check-icon">${isSelected ? '✓' : '○'}</span>
    `;

    card.addEventListener('click', () => {
      if (state.selectedMultiDays.includes(dayStr)) {
        state.selectedMultiDays = state.selectedMultiDays.filter(d => d !== dayStr);
      } else {
        state.selectedMultiDays.push(dayStr);
        state.selectedMultiDays.sort();
      }
      renderMultiDaysGrid();
      updateSubmitButtonLabel();
    });

    elements.multiDaysGrid.appendChild(card);
  });

  renderMultiDaysSummary();
}

function setMultiDayPreset(presetType) {
  const weekDays = getWeekRange(new Date());
  if (presetType === 'clear') {
    state.selectedMultiDays = [];
  } else if (presetType === 'all') {
    state.selectedMultiDays = weekDays.map(d => toDateInputString(d));
  } else if (presetType === 'sun-thu') {
    state.selectedMultiDays = weekDays.filter(d => {
      const dayIndex = d.getDay();
      return dayIndex >= 0 && dayIndex <= 4;
    }).map(d => toDateInputString(d));
  } else if (presetType === 'mon-fri') {
    state.selectedMultiDays = weekDays.filter(d => {
      const dayIndex = d.getDay();
      return dayIndex >= 1 && dayIndex <= 5;
    }).map(d => toDateInputString(d));
  }
  renderMultiDaysGrid();
  renderMultiDaysSummary();
  updateSubmitButtonLabel();
}

function updateSubmitButtonLabel() {
  const h = parseInt(elements.inputHours.value, 10) || 0;
  const m = parseInt(elements.inputMinutes.value, 10) || 0;
  const timeFormatted = formatSecondsToTime(toSeconds(h, m));
  
  if (state.isMultiDayMode && state.selectedMultiDays.length > 1) {
    const totalCount = state.selectedMultiDays.length;
    const totalSeconds = toSeconds(h, m) * totalCount;
    const totalTimeFormatted = formatSecondsToTime(totalSeconds);
    elements.btnSubmitText.textContent = `Submit to Jira (${timeFormatted}/day × ${totalCount} days = ${totalTimeFormatted})`;
  } else if (state.isMultiDayMode && state.selectedMultiDays.length === 1) {
    elements.btnSubmitText.textContent = `Submit to Jira (${timeFormatted} for 1 day)`;
  } else {
    elements.btnSubmitText.textContent = `Submit to Jira (${timeFormatted})`;
  }

  // Update multi days total hours if rendered
  if (state.isMultiDayMode && elements.multiDaysTotalHoursText) {
    const count = state.selectedMultiDays.length;
    elements.multiDaysTotalHoursText.textContent = formatSecondsToTime(toSeconds(h, m) * count);
  }
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
 * Render History Worklogs List with Bulk Delete
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

  // Bulk Action Bar
  const bulkBar = document.createElement('div');
  bulkBar.className = 'history-bulk-bar';
  bulkBar.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:6px 10px; margin-bottom:8px;';
  
  const allSelected = logs.length > 0 && logs.every(l => state.selectedHistoryIds.has(l.id));
  const selectedCount = state.selectedHistoryIds.size;

  bulkBar.innerHTML = `
    <label style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:var(--text-sub); cursor:pointer; margin:0;">
      <input type="checkbox" id="checkSelectAllHistory" ${allSelected ? 'checked' : ''} />
      <span>Select All (${logs.length})</span>
    </label>
    <div style="display:flex; align-items:center; gap:6px;">
      ${selectedCount > 0 ? `
        <button type="button" class="filter-chip" id="btnDeleteSelectedHistory" style="background:var(--jira-red); color:#fff; border-color:var(--jira-red); padding:3px 8px; font-size:0.72rem; font-weight:700;">
          🗑️ Delete Selected (${selectedCount})
        </button>
      ` : ''}
    </div>
  `;

  // Select All Event
  const checkSelectAll = bulkBar.querySelector('#checkSelectAllHistory');
  if (checkSelectAll) {
    checkSelectAll.addEventListener('change', (e) => {
      if (e.target.checked) {
        logs.forEach(l => state.selectedHistoryIds.add(l.id));
      } else {
        logs.forEach(l => state.selectedHistoryIds.delete(l.id));
      }
      renderHistoryList();
    });
  }

  // Delete Selected Event
  const btnDeleteSelected = bulkBar.querySelector('#btnDeleteSelectedHistory');
  if (btnDeleteSelected) {
    btnDeleteSelected.addEventListener('click', async () => {
      const selectedItems = (state.history || []).filter(l => state.selectedHistoryIds.has(l.id));
      if (selectedItems.length === 0) return;

      const confirmed = await showCustomConfirm({
        title: 'Bulk Delete Worklogs',
        subtitle: 'Permanent deletion from Jira & Timesheet',
        message: `Are you sure you want to permanently delete ${selectedItems.length} selected worklog(s) from Jira Cloud and your local Timesheet?`,
        confirmText: `Delete ${selectedItems.length} Worklogs`,
        type: 'danger'
      });

      if (confirmed) {
        const creds = state.settings || {};
        showToast(`Deleting ${selectedItems.length} worklogs...`, 'info', 2000);

        // Delete from Jira Cloud via API
        await jiraApi.bulkDeleteWorklogs(selectedItems, creds);

        // Delete from local storage
        storage.deleteHistoryEntriesBulk(Array.from(state.selectedHistoryIds));
        state.selectedHistoryIds.clear();

        state.history = storage.getHistory();
        updateHeroStats();
        renderWeeklyCalendar();
        renderHistoryList();

        showToast(`✓ Successfully deleted ${selectedItems.length} worklog entries!`, 'success', 3500);
      }
    });
  }

  elements.historyListContainer.appendChild(bulkBar);

  logs.forEach(log => {
    const card = document.createElement('div');
    const isSelected = state.selectedHistoryIds.has(log.id);
    card.className = `history-item-card ${isSelected ? 'selected' : ''}`;

    const timeFormatted = formatSecondsToTime(log.timeSpentSeconds);
    const friendlyDate = getFriendlyDateLabel(log.date || log.timestamp);
    const billableBadge = log.isBillable 
      ? `<span class="badge-pill-small billable">Billable</span>` 
      : `<span class="badge-pill-small" style="background:rgba(255,171,0,0.15); color:#ffd666;">Non-Billable</span>`;

    card.innerHTML = `
      <div style="display:flex; align-items:center; padding-right:8px;">
        <input type="checkbox" class="history-item-check" data-id="${log.id}" ${isSelected ? 'checked' : ''} style="cursor:pointer;" />
      </div>
      <div class="history-main-content">
        <div class="history-key-row">
          <span class="history-item-key" style="font-family:'JetBrains Mono'; font-weight:700; color:var(--jira-blue-light);">${log.issueKey}</span>
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

    // Item Checkbox Change
    const itemCheck = card.querySelector('.history-item-check');
    itemCheck.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.selectedHistoryIds.add(log.id);
      } else {
        state.selectedHistoryIds.delete(log.id);
      }
      renderHistoryList();
    });

    // Single Delete Button
    const delBtn = card.querySelector('.btn-icon-danger');
    delBtn.onclick = async () => {
      const confirmed = await showCustomConfirm({
        title: 'Delete Worklog Entry',
        subtitle: `${log.issueKey} (${timeFormatted})`,
        message: `Are you sure you want to delete worklog entry for ${log.issueKey} (${timeFormatted}) on ${log.date || 'today'} from Jira Cloud and your Timesheet?`,
        confirmText: 'Delete Entry',
        type: 'danger'
      });

      if (confirmed) {
        const creds = state.settings || {};
        if (log.jiraWorklogId && log.issueKey) {
          try {
            await jiraApi.deleteWorklog(log.issueKey, log.jiraWorklogId, creds);
          } catch (err) {
            console.warn('Jira delete error:', err);
          }
        }
        storage.deleteHistoryEntry(log.id);
        state.selectedHistoryIds.delete(log.id);
        state.history = storage.getHistory();
        updateHeroStats();
        renderWeeklyCalendar();
        renderHistoryList();
        showToast('✓ Worklog entry removed from Jira & Timesheet', 'info');
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
  const description = elements.inputDescription.value.trim();

  if (!description) {
    showToast('Please enter a work description.', 'warning');
    elements.inputDescription.focus();
    return;
  }

  const startedDateTime = elements.inputDateTime.value ? new Date(elements.inputDateTime.value) : new Date();
  const jiraStartedStr = toJiraDateTimeString(startedDateTime);

  // Set loading state
  state.isSubmitting = true;
  elements.btnSubmitWorklog.disabled = true;
  elements.btnSubmitText.textContent = 'Logging to Jira...';

  let syncedToJira = false;
  let syncError = null;

  const isGeneralIssue = state.selectedIssue.isGeneral || state.selectedIssue.key === 'NO-ISSUE';

  // Multi-Days Bulk Submission
  if (state.isMultiDayMode) {
    if (state.selectedMultiDays.length === 0) {
      showToast('Please select at least 1 day in Multiple Days mode.', 'warning');
      state.isSubmitting = false;
      elements.btnSubmitWorklog.disabled = false;
      updateSubmitButtonLabel();
      return;
    }

    const totalDays = state.selectedMultiDays.length;
    elements.btnSubmitText.textContent = `Logging ${totalDays} days to Jira...`;

    let successCount = 0;
    const creds = state.settings || {};

    for (let i = 0; i < state.selectedMultiDays.length; i++) {
      const dayStr = state.selectedMultiDays[i];
      const startedDate = new Date(`${dayStr}T09:00:00`);
      const jiraStartedStr = toJiraDateTimeString(startedDate);

      let syncedToJira = false;
      if (!isGeneralIssue) {
        try {
          await jiraApi.logWork(state.selectedIssue.key, {
            timeSpentSeconds: totalSeconds,
            started: jiraStartedStr,
            comment: description
          }, creds);
          syncedToJira = true;
          successCount++;
        } catch (err) {
          console.error(`Error logging work for ${dayStr}:`, err);
        }
      }

      storage.addWorklogToHistory({
        issueKey: state.selectedIssue.key,
        issueSummary: state.selectedIssue.summary,
        timeSpentSeconds: totalSeconds,
        timeSpentFormatted: formatSecondsToTime(totalSeconds),
        date: startedDate.toISOString(),
        started: jiraStartedStr,
        comment: description,
        isBillable,
        syncedToJira
      });
    }

    if (!isGeneralIssue) {
      storage.addRecentIssue(state.selectedIssue);
    }
    storage.addTemplate(description);

    state.isSubmitting = false;
    elements.btnSubmitWorklog.disabled = false;
    updateSubmitButtonLabel();

    state.history = storage.getHistory();
    updateHeroStats();
    renderWeeklyCalendar();
    renderHistoryList();

    if (!elements.checkLogAnother.checked) {
      elements.inputDescription.value = '';
    }

    const totalLoggedTime = formatSecondsToTime(totalSeconds * totalDays);
    showToast(`✓ Logged ${totalDays} days to Jira (${totalLoggedTime} total on ${state.selectedIssue.key})!`, 'success', 4500);
    return;
  }

  // Single Day Submission
  if (!isGeneralIssue) {
    try {
      const creds = state.settings || {};
      // Call Jira API via proxy
      await jiraApi.logWork(state.selectedIssue.key, {
        timeSpentSeconds: totalSeconds,
        started: jiraStartedStr,
        comment: description
      }, creds);
      syncedToJira = true;
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

  // Refresh history and stats
  state.history = storage.getHistory();
  updateHeroStats();
  renderWeeklyCalendar();
  renderHistoryList();

  if (isGeneralIssue) {
    showToast(`Logged ${formatSecondsToTime(totalSeconds)} for General Activity`, 'success', 3500);
  } else if (syncedToJira) {
    showToast(`Worklog submitted successfully to Jira (${state.selectedIssue.key}, ${formatSecondsToTime(totalSeconds)})`, 'success', 4000);
  } else if (syncError) {
    showToast(`Saved locally. Jira sync error: ${syncError}`, 'warning', 5000);
  } else {
    showToast(`Worklog saved to timesheet (${formatSecondsToTime(totalSeconds)})`, 'success', 3500);
  }

  // Check if "Log another" is checked
  if (!elements.checkLogAnother.checked) {
    elements.inputDescription.value = '';
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
let cachedProjects = null;

async function openIssueModal(defaultTab = 'my-issues') {
  state.activeFilter = defaultTab;
  document.querySelectorAll('.issue-tabs-filter .filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === defaultTab);
  });
  elements.inputIssueSearch.value = '';

  // Populate projects dropdown if not loaded
  const creds = state.settings;
  if (creds.domain && creds.email && creds.apiToken && elements.selectProjectFilter) {
    if (!cachedProjects) {
      try {
        cachedProjects = await jiraApi.getProjects(creds);
        if (Array.isArray(cachedProjects) && cachedProjects.length > 0) {
          elements.selectProjectFilter.innerHTML = '<option value="">All Projects (41 Projects)</option>' +
            cachedProjects.map(p => `<option value="${p.key}">${p.key} - ${p.name}</option>`).join('');
        }
      } catch (e) {
        console.warn('Projects dropdown load error:', e);
      }
    }
  }

  renderModalIssuesList();
  openModal(elements.modalIssueSelector);
}

function handleIssueSearch() {
  renderModalIssuesList();
}

async function renderModalIssuesList() {
  elements.modalIssuesList.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted);">Fetching live issues from Jira Cloud...</div>';
  const query = elements.inputIssueSearch.value.trim().toLowerCase();
  const selectedProject = elements.selectProjectFilter ? elements.selectProjectFilter.value : '';
  let issues = [];

  const creds = state.settings;
  const isJiraConnected = creds.domain && creds.email && creds.apiToken;

  if (selectedProject) {
    // If a specific project is selected from dropdown, fetch issues for that project
    if (isJiraConnected) {
      try {
        issues = await jiraApi.getProjectIssues(selectedProject, creds);
      } catch (e) {
        console.warn('Project issues load error:', e.message);
      }
    }
  } else if (state.activeFilter === 'favorites') {
    issues = state.favorites || [];
  } else if (state.activeFilter === 'recent') {
    issues = state.recents || [];
  } else if (state.activeFilter === 'my-issues') {
    if (isJiraConnected) {
      try {
        if (query) {
          issues = await jiraApi.searchIssues(query, creds);
        } else {
          issues = await jiraApi.getMyIssues(creds);
        }
      } catch (e) {
        console.warn('Error loading my issues:', e.message);
      }
    }
    // Combine with favorites
    issues = [...issues, ...(state.favorites || [])];
  } else {
    // All Jira Issues
    if (isJiraConnected) {
      try {
        if (query) {
          issues = await jiraApi.searchIssues(query, creds);
        } else {
          issues = await jiraApi.getAllLiveIssues(creds);
        }
      } catch (e) {
        console.warn('Error loading all live issues:', e.message);
      }
    }
    issues = [...issues, ...(state.favorites || []), ...(state.recents || [])];
  }

  // Filter by search query if present
  if (query) {
    issues = issues.filter(i => 
      (i.key && i.key.toLowerCase().includes(query)) || 
      (i.summary && i.summary.toLowerCase().includes(query)) ||
      (i.project && i.project.toLowerCase().includes(query))
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

/**
 * Render Right-Side Jira Issue Selector Pane (matching authentic Jira 2-column layout)
 */
async function renderPaneIssuesList() {
  if (!elements.paneIssuesList) return;
  elements.paneIssuesList.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.8rem;">Loading Jira issues...</div>';
  if (elements.paneIssueCount) elements.paneIssueCount.textContent = '...';

  const query = elements.inputPaneIssueSearch ? elements.inputPaneIssueSearch.value.trim().toLowerCase() : '';
  const selectedProject = elements.selectPaneProjectFilter ? elements.selectPaneProjectFilter.value : '';
  let issues = [];

  const creds = state.settings;
  const isJiraConnected = creds.domain && creds.email && creds.apiToken;

  if (selectedProject) {
    if (isJiraConnected) {
      try {
        issues = await jiraApi.getProjectIssues(selectedProject, creds);
      } catch (e) {
        console.warn('Pane project issues error:', e.message);
      }
    }
  } else if (paneActiveFilter === 'recent') {
    issues = state.recents || [];
  } else if (paneActiveFilter === 'favorites') {
    issues = state.favorites || [];
  } else if (paneActiveFilter === 'my-issues') {
    if (isJiraConnected) {
      try {
        if (query) {
          issues = await jiraApi.searchIssues(query, creds);
        } else {
          issues = await jiraApi.getMyIssues(creds);
        }
      } catch (e) {
        console.warn('Pane my issues error:', e.message);
      }
    }
    // Also merge with favorites
    issues = [...issues, ...(state.favorites || [])];
  } else {
    // All
    if (isJiraConnected) {
      try {
        if (query) {
          issues = await jiraApi.searchIssues(query, creds);
        } else {
          issues = await jiraApi.getAllLiveIssues(creds);
        }
      } catch (e) {
        console.warn('Pane all issues error:', e.message);
      }
    }
    issues = [...issues, ...(state.favorites || []), ...(state.recents || [])];
  }

  // Filter by search query if present
  if (query) {
    issues = issues.filter(i => 
      (i.key && i.key.toLowerCase().includes(query)) || 
      (i.summary && i.summary.toLowerCase().includes(query)) ||
      (i.project && i.project.toLowerCase().includes(query))
    );
  }

  // Deduplicate
  const uniqueIssues = [];
  const seenKeys = new Set();
  issues.forEach(i => {
    if (i && i.key && !seenKeys.has(i.key)) {
      seenKeys.add(i.key);
      uniqueIssues.push(i);
    }
  });

  if (elements.paneIssueCount) {
    elements.paneIssueCount.textContent = `${uniqueIssues.length} issues`;
  }

  elements.paneIssuesList.innerHTML = '';

  if (uniqueIssues.length === 0) {
    elements.paneIssuesList.innerHTML = `
      <div style="padding:28px 16px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
        No issues found in this filter.<br>Try changing the tab or project filter above.
      </div>
    `;
    return;
  }

  uniqueIssues.forEach(issue => {
    const isSelected = state.selectedIssue?.key === issue.key;
    const isFav = storage.isFavorite(issue.key);

    const card = document.createElement('div');
    card.className = `jira-pane-item ${isSelected ? 'selected' : ''}`;
    
    // Type Icon SVG
    const type = (issue.type || '').toLowerCase();
    let typeSvg = `<svg width="13" height="13" viewBox="0 0 16 16" fill="#00875A"><rect width="16" height="16" rx="2.5" fill="#E3FCEF"/><rect x="4.5" y="4.5" width="7" height="7" rx="1" fill="#00875A"/></svg>`;
    if (type.includes('bug')) {
      typeSvg = `<svg width="13" height="13" viewBox="0 0 16 16" fill="#DE350B"><rect width="16" height="16" rx="2.5" fill="#FFEBE6"/><circle cx="8" cy="8" r="3.5" fill="#DE350B"/></svg>`;
    } else if (type.includes('epic')) {
      typeSvg = `<svg width="13" height="13" viewBox="0 0 16 16" fill="#6554C0"><rect width="16" height="16" rx="2.5" fill="#EAE6FF"/><polygon points="8 3 13 12 3 12" fill="#6554C0"/></svg>`;
    } else if (type.includes('test')) {
      typeSvg = `<svg width="13" height="13" viewBox="0 0 16 16" fill="#00875A"><rect width="16" height="16" rx="2.5" fill="#E3FCEF"/><line x1="4" y1="8" x2="12" y2="8" stroke="#00875A" stroke-width="2"/></svg>`;
    }

    const statusClass = (issue.status || '').toLowerCase().replace(/\s+/g, '-');

    card.innerHTML = `
      <div class="jira-pane-item-info">
        ${typeSvg}
        <span class="jira-pane-item-key">[${issue.key}]</span>
        <span class="jira-pane-item-summary" title="${issue.summary}">${issue.summary}</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
        <span class="issue-status-tag ${statusClass}" style="font-size:0.65rem; padding:2px 6px;">${issue.status || 'TO DO'}</span>
        <button type="button" class="star-fav-btn ${isFav ? 'is-fav' : ''}" style="background:transparent; border:none; padding:2px; cursor:pointer;" title="Star issue">
          ${getStarSvg(isFav)}
        </button>
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.closest('.star-fav-btn')) return;
      state.selectedIssue = issue;
      storage.addRecentIssue(issue);
      renderSelectedIssue();
      renderPaneIssuesList();
      showToast(`Selected ${issue.key}`, 'info', 1500);
    };

    const starBtn = card.querySelector('.star-fav-btn');
    starBtn.onclick = (e) => {
      e.stopPropagation();
      const updatedFav = storage.toggleFavorite(issue);
      starBtn.innerHTML = getStarSvg(updatedFav);
      state.favorites = storage.getFavorites();
      renderFavoritesFullList();
      if (paneActiveFilter === 'favorites') {
        renderPaneIssuesList();
      }
    };

    elements.paneIssuesList.appendChild(card);
  });
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

async function handleClearData() {
  const confirmed = await showCustomConfirm({
    title: 'Reset All Data',
    subtitle: 'Clear all worklogs, credentials, and cache',
    message: 'Are you sure you want to permanently reset all stored Jira credentials, timesheet history, and custom favorites?',
    confirmText: 'Reset Everything',
    type: 'danger'
  });

  if (confirmed) {
    storage.clearAllData();
    closeModal(elements.modalSettings);
    showToast('All local data cleared successfully', 'info');
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
 * Custom Centered Confirmation Dialog System
 */
function showCustomConfirm({
  title = 'Confirm Action',
  subtitle = 'Please confirm to proceed',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) {
  return new Promise((resolve) => {
    if (!elements.modalCustomConfirm) {
      resolve(window.confirm(message));
      return;
    }

    elements.confirmModalTitle.textContent = title;
    elements.confirmModalSubtitle.textContent = subtitle;
    elements.confirmModalMessage.textContent = message;
    elements.btnActionConfirm.textContent = confirmText;
    elements.btnCancelConfirm.textContent = cancelText;

    // Apply color accents
    if (type === 'danger') {
      if (elements.confirmModalAccent) elements.confirmModalAccent.className = 'modal-accent-bar danger';
      if (elements.confirmModalIconBadge) elements.confirmModalIconBadge.className = 'modal-icon-badge danger';
      if (elements.btnActionConfirm) elements.btnActionConfirm.className = 'btn-modal-primary danger';
    } else if (type === 'warning') {
      if (elements.confirmModalAccent) elements.confirmModalAccent.className = 'modal-accent-bar warning';
      if (elements.confirmModalIconBadge) elements.confirmModalIconBadge.className = 'modal-icon-badge warning';
      if (elements.btnActionConfirm) elements.btnActionConfirm.className = 'btn-modal-primary';
    } else {
      if (elements.confirmModalAccent) elements.confirmModalAccent.className = 'modal-accent-bar';
      if (elements.confirmModalIconBadge) elements.confirmModalIconBadge.className = 'modal-icon-badge';
      if (elements.btnActionConfirm) elements.btnActionConfirm.className = 'btn-modal-primary';
    }

    function onConfirm() {
      cleanup();
      closeModal(elements.modalCustomConfirm);
      resolve(true);
    }

    function onCancel() {
      cleanup();
      closeModal(elements.modalCustomConfirm);
      resolve(false);
    }

    function cleanup() {
      elements.btnActionConfirm.removeEventListener('click', onConfirm);
      elements.btnCancelConfirm.removeEventListener('click', onCancel);
      elements.btnCloseConfirmModal.removeEventListener('click', onCancel);
    }

    elements.btnActionConfirm.addEventListener('click', onConfirm);
    elements.btnCancelConfirm.addEventListener('click', onCancel);
    elements.btnCloseConfirmModal.addEventListener('click', onCancel);

    openModal(elements.modalCustomConfirm);
  });
}

/**
 * Add / Edit Custom Issue & Task Dialog
 */
function openAddCustomIssueModal(issueToEdit = null) {
  if (issueToEdit) {
    elements.customTicketModalTitle.textContent = 'Edit Custom Issue';
    elements.inputCustomTicketKey.value = issueToEdit.key || '';
    elements.inputCustomTicketSummary.value = issueToEdit.summary || '';
    elements.selectCustomTicketType.value = issueToEdit.issueType || 'Task';
  } else {
    elements.customTicketModalTitle.textContent = 'Add Custom Issue / Task';
    elements.inputCustomTicketKey.value = '';
    elements.inputCustomTicketSummary.value = '';
    elements.selectCustomTicketType.value = 'Task';
  }
  openModal(elements.modalAddCustomTicket);
  if (elements.inputCustomTicketKey) elements.inputCustomTicketKey.focus();
}

function handleAddCustomTicketSubmit(e) {
  e.preventDefault();
  const key = (elements.inputCustomTicketKey.value || '').trim().toUpperCase();
  const summary = (elements.inputCustomTicketSummary.value || '').trim();
  const issueType = elements.selectCustomTicketType.value || 'Task';
  const shouldStar = elements.checkCustomTicketStar ? elements.checkCustomTicketStar.checked : true;

  if (!key || !summary) {
    showToast('Please provide both Issue Key and Summary', 'warning');
    return;
  }

  const newIssue = {
    id: `custom_${Date.now()}`,
    key,
    summary,
    issueType,
    status: 'In Progress',
    isFavorite: shouldStar,
    isCustom: true
  };

  // Add to recents
  storage.addRecentIssue(newIssue);
  state.recents = storage.getRecentIssues();

  // If starred, add to favorites
  if (shouldStar) {
    storage.toggleFavorite(newIssue);
    state.favorites = storage.getFavorites();
  }

  // Set as selected issue for worklog form
  state.selectedIssue = newIssue;
  renderSelectedIssue();
  renderQuickFavorites();
  renderFavoritesFullList();

  closeModal(elements.modalAddCustomTicket);
  closeModal(elements.modalIssueSelector);
  switchView('log-view');

  showToast(`✓ Issue ${newIssue.key} ready for logging!`, 'success', 3000);
}

/**
 * Modal Helpers (Centered & Smooth)
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
