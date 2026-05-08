(function () {
  "use strict";

  const STORAGE_KEY = "kids-schedule-studio-v1";
  const MONTHS = [5, 6, 7, 8, 9, 10, 11, 12];
  const MONTH_NAMES = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAY_START_MINUTES = 5 * 60;
  const DAY_END_MINUTES = 24 * 60;
  const TIME_STEP_MINUTES = 15;
  const GRID_HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
  const TIME_OPTIONS = Array.from(
    { length: (DAY_END_MINUTES - DAY_START_MINUTES) / TIME_STEP_MINUTES + 1 },
    (_, i) => DAY_START_MINUTES + i * TIME_STEP_MINUTES,
  );
  const START_TIME_OPTIONS = TIME_OPTIONS.slice(0, -1);
  const END_TIME_OPTIONS = TIME_OPTIONS.slice(1);
  const MIN_ENTRY_DATE = "2026-05-01";
  const MAX_ENTRY_DATE = "2026-12-31";
  const MIN_DISPLAY_DATE = "2026-04-27";
  const MAX_DISPLAY_DATE = "2027-01-03";
  const MAX_ACTIVITIES = 200;
  const MAX_ENTRIES = 5000;
  const TYPES = [
    { name: "Classes", color: "#2d7dd2" },
    { name: "Summer Camps", color: "#ffb703" },
    { name: "Activities", color: "#0a9396" },
    { name: "Training", color: "#f45d48" },
    { name: "Learning", color: "#6a4c93" },
    { name: "Family", color: "#2a9d8f" },
    { name: "Reward", color: "#f77f00" },
  ];

  const defaultState = () => ({
    version: 1,
    familyName: "",
    kids: [
      { id: "kid1", name: "Kid 1", color: "#2d7dd2", icon: "robot" },
      { id: "kid2", name: "Kid 2", color: "#0a9396", icon: "rocket" },
    ],
    selectedView: "week",
    theme: "light",
    selectedKid: "kid1",
    selectedMonth: 5,
    selectedWeekStart: "2026-05-04",
    selectedDate: "2026-05-04",
    activities: [
      { id: id(), title: "Math Class", type: "Classes", color: "#2d7dd2", notes: "" },
      { id: id(), title: "Reading Time", type: "Learning", color: "#6a4c93", notes: "" },
      { id: id(), title: "Summer Camp", type: "Summer Camps", color: "#ffb703", notes: "" },
      { id: id(), title: "Sports Training", type: "Training", color: "#f45d48", notes: "" },
      { id: id(), title: "Sunday Reward", type: "Reward", color: "#f77f00", notes: "" },
    ],
    entries: [],
    finalized: {},
  });

  let state = loadState();
  let editingEntryId = null;
  let editingActivityId = null;
  let toastTimer = null;

  const els = {};
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    populateStaticSelects();
    hydrateControls();
    bindEvents();
    render();
  }

  function cacheElements() {
    [
      "familyNameInput",
      "kid1NameInput",
      "kid2NameInput",
      "monthSelect",
      "weekSelect",
      "kidSelect",
      "copyDaySelect",
      "replaceCopyToggle",
      "targetDateInput",
      "activityList",
      "stageTitle",
      "stageSubtitle",
      "weekView",
      "monthView",
      "activitiesView",
      "entryDialog",
      "entryForm",
      "entryDialogTitle",
      "entryKid",
      "entryDate",
      "entryStart",
      "entryEnd",
      "entryTemplate",
      "entryTitle",
      "entryType",
      "entryColor",
      "entryLocation",
      "entryNotes",
      "deleteEntryBtn",
      "copyEntryBtn",
      "activityDialog",
      "activityForm",
      "activityTitle",
      "activityType",
      "activityColor",
      "activityNotes",
      "deleteActivityBtn",
      "importFileInput",
      "scheduleInsights",
      "bulkScheduleTopBtn",
      "themeToggleBtn",
      "bulkDialog",
      "bulkForm",
      "bulkKid",
      "bulkTemplate",
      "bulkStartDate",
      "bulkEndDate",
      "bulkStart",
      "bulkEnd",
      "bulkTitle",
      "bulkType",
      "bulkColor",
      "bulkLocation",
      "bulkNotes",
      "bulkReplaceToggle",
      "calendarDialog",
      "calendarForm",
      "calendarPlatform",
      "calendarInstructions",
      "toast",
      "printRoot",
      "manualSaveBtn",
      "saveStatus",
    ].forEach((key) => {
      els[key] = document.getElementById(key);
    });
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedView = button.dataset.view;
        saveState();
        render();
      });
    });

    els.familyNameInput.addEventListener("input", () => {
      state.familyName = els.familyNameInput.value.trim();
      saveState("Saved family");
    });
    els.manualSaveBtn.addEventListener("click", manualSave);
    els.kid1NameInput.addEventListener("input", () => updateKidName("kid1", els.kid1NameInput.value));
    els.kid2NameInput.addEventListener("input", () => updateKidName("kid2", els.kid2NameInput.value));
    els.monthSelect.addEventListener("change", () => {
      state.selectedMonth = Number(els.monthSelect.value);
      const monthWeeks = weeksForMonth(state.selectedMonth);
      state.selectedWeekStart = fmtDate(monthWeeks[0][0]);
      state.selectedDate = firstInMonth(state.selectedMonth);
      saveState();
      render();
    });
    els.weekSelect.addEventListener("change", () => {
      state.selectedWeekStart = els.weekSelect.value;
      state.selectedDate = els.weekSelect.value;
      saveState();
      render();
    });
    els.kidSelect.addEventListener("change", () => {
      state.selectedKid = els.kidSelect.value;
      saveState();
      render();
    });
    els.copyDaySelect.addEventListener("change", saveState);
    els.replaceCopyToggle.addEventListener("change", saveState);
    els.targetDateInput.addEventListener("change", saveState);

    document.getElementById("addEntryBtn").addEventListener("click", () => openEntryDialog({}));
    document.getElementById("newActivityBtn").addEventListener("click", () => openActivityDialog());
    document.getElementById("copyDayNextBtn").addEventListener("click", copySelectedDayToNextWeek);
    document.getElementById("copyWeekNextBtn").addEventListener("click", copySelectedWeekToNextWeek);
    document.getElementById("copyDayTargetBtn").addEventListener("click", copySelectedDayToTarget);
    document.getElementById("finalizeWeekBtn").addEventListener("click", finalizeCurrentWeek);
    document.getElementById("printWeekBtn").addEventListener("click", () => printSchedule("week"));
    document.getElementById("printDayBtn").addEventListener("click", () => printSchedule("day"));
    document.getElementById("printMonthBtn").addEventListener("click", () => printSchedule("month"));
    document.getElementById("exportBtn").addEventListener("click", exportBackup);
    document.getElementById("exportIcsBtn").addEventListener("click", openCalendarExportDialog);
    document.getElementById("importBtn").addEventListener("click", () => els.importFileInput.click());
    els.importFileInput.addEventListener("change", importBackup);
    els.bulkScheduleTopBtn.addEventListener("click", openBulkDialog);
    els.themeToggleBtn.addEventListener("click", toggleTheme);

    els.weekView.addEventListener("click", handleWeekClick);
    els.monthView.addEventListener("click", handleMonthClick);
    els.activityList.addEventListener("click", handleActivityListClick);
    els.activitiesView.addEventListener("click", handleActivitiesViewClick);

    els.entryTemplate.addEventListener("change", applyEntryTemplate);
    els.entryType.addEventListener("change", () => {
      const type = TYPES.find((item) => item.name === els.entryType.value);
      if (type) els.entryColor.value = type.color;
    });
    els.bulkTemplate.addEventListener("change", applyBulkTemplate);
    els.bulkType.addEventListener("change", () => {
      const type = TYPES.find((item) => item.name === els.bulkType.value);
      if (type) els.bulkColor.value = type.color;
    });
    els.calendarPlatform.addEventListener("change", renderCalendarExportInstructions);
    document.getElementById("saveEntryBtn").addEventListener("click", (event) => {
      event.preventDefault();
      saveEntryFromForm();
    });
    els.deleteEntryBtn.addEventListener("click", deleteEditingEntry);
    els.copyEntryBtn.addEventListener("click", copyEntryFromForm);

    document.getElementById("saveActivityBtn").addEventListener("click", (event) => {
      event.preventDefault();
      saveActivityFromForm();
    });
    document.getElementById("saveBulkBtn").addEventListener("click", (event) => {
      event.preventDefault();
      saveBulkSchedule();
    });
    document.getElementById("downloadCalendarBtn").addEventListener("click", (event) => {
      event.preventDefault();
      exportIcs();
    });
    els.deleteActivityBtn.addEventListener("click", deleteEditingActivity);
  }

  function populateStaticSelects() {
    els.monthSelect.innerHTML = MONTHS.map((month) => `<option value="${month}">${MONTH_NAMES[month]} 2026</option>`).join("");
    els.entryStart.innerHTML = START_TIME_OPTIONS.map((minutes) => `<option value="${minutes}">${formatTime(minutes)}</option>`).join("");
    els.entryEnd.innerHTML = END_TIME_OPTIONS.map((minutes) => `<option value="${minutes}">${formatTime(minutes)}</option>`).join("");
    els.bulkStart.innerHTML = START_TIME_OPTIONS.map((minutes) => `<option value="${minutes}">${formatTime(minutes)}</option>`).join("");
    els.bulkEnd.innerHTML = END_TIME_OPTIONS.map((minutes) => `<option value="${minutes}">${formatTime(minutes)}</option>`).join("");
    [els.entryType, els.activityType, els.bulkType].forEach((select) => {
      select.innerHTML = TYPES.map((type) => `<option value="${escapeHtml(type.name)}">${escapeHtml(type.name)}</option>`).join("");
    });
  }

  function hydrateControls() {
    applyTheme();
    els.familyNameInput.value = state.familyName || "";
    els.kid1NameInput.value = kidById("kid1").name === "Kid 1" ? "" : kidById("kid1").name;
    els.kid2NameInput.value = kidById("kid2").name === "Kid 2" ? "" : kidById("kid2").name;
    els.replaceCopyToggle.checked = true;
    els.targetDateInput.value = fmtDate(addDays(state.selectedWeekStart, 7));
    renderCalendarExportInstructions();
  }

  function render() {
    applyTheme();
    syncSelectors();
    renderActivityList();
    renderInsights();
    renderStage();
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === state.selectedView);
    });
  }

  function syncSelectors() {
    els.monthSelect.value = String(state.selectedMonth);
    const weeks = allWeeks();
    els.weekSelect.innerHTML = weeks
      .map((week) => {
        const start = fmtDate(week[0]);
        const label = `${week[0].toLocaleString("en-US", { month: "short", day: "numeric" })} - ${week[6].toLocaleString("en-US", { month: "short", day: "numeric" })}`;
        return `<option value="${start}">${label}</option>`;
      })
      .join("");
    if (!weeks.some((week) => fmtDate(week[0]) === state.selectedWeekStart)) {
      state.selectedWeekStart = "2026-05-04";
    }
    els.weekSelect.value = state.selectedWeekStart;
    els.kidSelect.innerHTML = [
      ...state.kids.map((kid) => `<option value="${kid.id}">${escapeHtml(kid.name)}</option>`),
      `<option value="both">Both kids</option>`,
    ].join("");
    els.kidSelect.value = state.selectedKid;
    els.entryKid.innerHTML = state.kids.map((kid) => `<option value="${kid.id}">${escapeHtml(kid.name)}</option>`).join("");
    els.bulkKid.innerHTML = [
      ...state.kids.map((kid) => `<option value="${kid.id}">${escapeHtml(kid.name)}</option>`),
      `<option value="both">Both kids</option>`,
    ].join("");
    els.bulkKid.value = state.selectedKid;
    els.copyDaySelect.innerHTML = currentWeek()
      .map((day, index) => `<option value="${index}">${SHORT_DAYS[index]} ${day.getMonth() + 1}/${day.getDate()}</option>`)
      .join("");
    if (!els.copyDaySelect.value) els.copyDaySelect.value = "0";
    els.entryTemplate.innerHTML = `<option value="">Custom entry</option>` + state.activities.map((activity) => `<option value="${activity.id}">${escapeHtml(activity.title)}</option>`).join("");
    els.bulkTemplate.innerHTML = `<option value="">Custom schedule</option>` + state.activities.map((activity) => `<option value="${activity.id}">${escapeHtml(activity.title)}</option>`).join("");
  }

  function renderStage() {
    els.weekView.classList.toggle("hidden", state.selectedView !== "week");
    els.monthView.classList.toggle("hidden", state.selectedView !== "month");
    els.activitiesView.classList.toggle("hidden", state.selectedView !== "activities");
    if (state.selectedView === "week") {
      renderWeek();
    } else if (state.selectedView === "month") {
      renderMonth();
    } else {
      renderActivitiesBoard();
    }
  }

  function renderWeek() {
    const week = currentWeek();
    const kidLabel = state.selectedKid === "both" ? "Both Kids" : kidById(state.selectedKid).name;
    els.stageTitle.textContent = `${week[0].toLocaleString("en-US", { month: "long", day: "numeric" })} - ${week[6].toLocaleString("en-US", { month: "long", day: "numeric" })} | ${kidLabel}`;
    els.stageSubtitle.textContent = "Click a time slot to add plans, then copy a day or week when it repeats.";

    const headers = [`<div class="week-cell header-cell">Time</div>`]
      .concat(
        week.map((day, index) => {
          const outside = !MONTHS.includes(day.getMonth() + 1);
          const reward = index === 6 ? " reward" : "";
          return `<div class="week-cell header-cell${reward}" data-date="${fmtDate(day)}">${SHORT_DAYS[index]} ${day.getMonth() + 1}/${day.getDate()}${outside ? " *" : ""}</div>`;
        }),
      )
      .join("");

    const rows = GRID_HOURS.map((hour) => {
      const slotStart = hour * 60;
      const timeCell = `<div class="week-cell time-cell">${formatTime(slotStart)}</div>`;
      const dayCells = week
        .map((day, dayIndex) => {
          const dateKey = fmtDate(day);
          const finalized = isFinalized(dateKey) ? " finalized" : "";
          const reward = dayIndex === 6 ? " reward" : "";
          const entries = entriesForSlot(dateKey, slotStart);
          const conflict = entries.some((entry) => entryHasConflict(entry)) ? " conflict" : "";
          const chips = entries.length
            ? entries.map((entry) => entryChip(entry, slotStart)).join("")
            : `<span class="empty-hint">${dayIndex === 6 ? "Reward" : ""}</span>`;
          return `<div class="week-cell slot-cell${finalized}${reward}${conflict}" data-date="${dateKey}" data-time="${slotStart}">${chips}</div>`;
        })
        .join("");
      return timeCell + dayCells;
    }).join("");

    const rewardRow = `<div class="reward-row">
      <div class="reward-cell">Sunday</div>
      ${week
        .map((day, index) => {
          const dateKey = fmtDate(day);
          const done = isFinalized(dateKey) ? "Finalized" : index === 6 ? "Reward notes" : "";
          return `<div class="reward-cell" data-date="${dateKey}">${escapeHtml(done)}</div>`;
        })
        .join("")}
    </div>`;

    els.weekView.innerHTML = `<div class="week-grid">${headers}${rows}</div>${rewardRow}`;
  }

  function renderMonth() {
    const month = state.selectedMonth;
    els.stageTitle.textContent = `${MONTH_NAMES[month]} 2026`;
    els.stageSubtitle.textContent = "Select a day to jump into the weekly planner.";
    const header = DAY_NAMES.map((day, index) => `<div class="month-head${index === 6 ? " reward" : ""}">${index === 6 ? "Sunday Reward" : day}</div>`).join("");
    const days = weeksForMonth(month)
      .flat()
      .map((day) => {
        const dateKey = fmtDate(day);
        const outside = day.getMonth() + 1 !== month ? " outside" : "";
        const reward = day.getDay() === 0 ? " reward" : "";
        const finalized = isFinalized(dateKey) ? " finalized" : "";
        const entries = entriesForDate(dateKey).slice(0, 5);
        const chips = entries.map((entry) => `<div class="mini-chip" style="background:${entry.color}">${formatTime(entry.start)} ${escapeHtml(entry.title)}</div>`).join("");
        return `<div class="day-card${outside}${reward}${finalized}" data-date="${dateKey}">
          <div class="date-number">${day.getDate()} ${SHORT_DAYS[(day.getDay() + 6) % 7]}</div>
          <div class="day-summary">${chips || `<span class="empty-hint">Open</span>`}</div>
        </div>`;
      })
      .join("");
    els.monthView.innerHTML = `<div class="month-grid">${header}${days}</div>`;
  }

  function renderActivityList() {
    els.activityList.innerHTML = state.activities
      .map(
        (activity) => `<div class="activity-item">
          <span class="activity-dot" style="background:${activity.color}"></span>
          <div><strong>${escapeHtml(activity.title)}</strong><span>${escapeHtml(activity.type)}</span></div>
          <button class="small-button" data-edit-activity="${activity.id}">Edit</button>
        </div>`,
      )
      .join("");
  }

  function renderInsights() {
    const weekDates = currentWeek().map(fmtDate);
    const scope = kidsInScope();
    const weekEntries = state.entries.filter((entry) => scope.includes(entry.kidId) && weekDates.includes(entry.date));
    const conflictCount = conflictPairs(scope, weekDates).length;
    const longBlockCount = weekEntries.filter((entry) => entry.end - entry.start > 1).length;
    const finalizedCount = weekDates.filter((dateKey) => scope.every((kidId) => state.finalized[`${kidId}:${dateKey}`])).length;
    const nextEntry = weekEntries.slice().sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0];
    const nextText = nextEntry ? `${SHORT_DAYS[(toDate(nextEntry.date).getDay() + 6) % 7]} ${formatTime(nextEntry.start)} ${nextEntry.title}` : "No activities this week";
    els.scheduleInsights.innerHTML = [
      insightItem("Week items", String(weekEntries.length)),
      insightItem("Conflicts", String(conflictCount), conflictCount ? "danger" : "good"),
      insightItem("Long blocks", String(longBlockCount)),
      insightItem("Final days", `${finalizedCount}/7`, finalizedCount === 7 ? "good" : ""),
      insightItem("Next", nextText),
    ].join("");
  }

  function insightItem(label, value, tone = "") {
    return `<div class="insight-item${tone ? " " + tone : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>`;
  }

  function renderActivitiesBoard() {
    els.stageTitle.textContent = "Reusable Activities";
    els.stageSubtitle.textContent = "Build activity blocks once, then use them when scheduling.";
    els.activitiesView.innerHTML = `<div class="activities-board">
      ${state.activities
        .map(
          (activity) => `<article class="activity-card">
            <div class="activity-card-bar" style="background:${activity.color}"></div>
            <h3>${escapeHtml(activity.title)}</h3>
            <p>${escapeHtml(activity.type)}${activity.notes ? " | " + escapeHtml(activity.notes) : ""}</p>
            <button class="small-button" data-edit-activity="${activity.id}">Edit</button>
          </article>`,
        )
        .join("")}
    </div>`;
  }

  function entryChip(entry, slotStart = entry.start) {
    const kid = kidById(entry.kidId);
    const kidPrefix = state.selectedKid === "both" ? `${kid.name}: ` : "";
    const isContinuation = slotStart > entry.start;
    const details = hourBlockDetails(entry, slotStart);
    const conflict = entryHasConflict(entry) ? " conflict" : "";
    return `<button class="entry-chip${isContinuation ? " continued" : ""}${conflict}" style="background:${entry.color}" data-entry-id="${entry.id}">
      ${escapeHtml(kidPrefix + entry.title)}
      <small>${escapeHtml(details)}</small>
    </button>`;
  }

  function handleWeekClick(event) {
    const entryButton = event.target.closest("[data-entry-id]");
    if (entryButton) {
      const entry = state.entries.find((item) => item.id === entryButton.dataset.entryId);
      if (entry) openEntryDialog(entry);
      return;
    }
    const slot = event.target.closest(".slot-cell");
    if (!slot) return;
    state.selectedDate = slot.dataset.date;
    const kidId = state.selectedKid === "both" ? state.kids[0].id : state.selectedKid;
    const start = Number(slot.dataset.time);
    openEntryDialog({ kidId, date: slot.dataset.date, start, end: Math.min(DAY_END_MINUTES, start + 60) });
  }

  function handleMonthClick(event) {
    const card = event.target.closest("[data-date]");
    if (!card) return;
    const dateKey = card.dataset.date;
    state.selectedDate = dateKey;
    state.selectedWeekStart = fmtDate(startOfWeek(toDate(dateKey)));
    state.selectedView = "week";
    saveState();
    render();
  }

  function handleActivityListClick(event) {
    const button = event.target.closest("[data-edit-activity]");
    if (!button) return;
    const activity = state.activities.find((item) => item.id === button.dataset.editActivity);
    if (activity) openActivityDialog(activity);
  }

  function handleActivitiesViewClick(event) {
    handleActivityListClick(event);
  }

  function openEntryDialog(entry) {
    editingEntryId = entry.id || null;
    els.entryDialogTitle.textContent = editingEntryId ? "Edit Activity" : "Add Activity";
    els.deleteEntryBtn.style.display = editingEntryId ? "inline-flex" : "none";
    els.copyEntryBtn.style.display = editingEntryId ? "inline-flex" : "none";
    els.entryKid.value = entry.kidId || (state.selectedKid === "both" ? state.kids[0].id : state.selectedKid);
    els.entryDate.value = entry.date || state.selectedDate || state.selectedWeekStart;
    const start = sanitizeTime(entry.start, 8 * 60, false);
    const end = sanitizeTime(entry.end, Math.min(DAY_END_MINUTES, start + 60), true);
    els.entryStart.value = String(start);
    els.entryEnd.value = String(end > start ? end : Math.min(DAY_END_MINUTES, start + 60));
    els.entryTemplate.value = "";
    els.entryTitle.value = entry.title || "";
    els.entryType.value = entry.type || "Classes";
    els.entryColor.value = entry.color || colorForType(els.entryType.value);
    els.entryLocation.value = entry.location || "";
    els.entryNotes.value = entry.notes || "";
    els.entryDialog.showModal();
  }

  function applyEntryTemplate() {
    const activity = state.activities.find((item) => item.id === els.entryTemplate.value);
    if (!activity) return;
    els.entryTitle.value = activity.title;
    els.entryType.value = activity.type;
    els.entryColor.value = activity.color;
    els.entryNotes.value = activity.notes || "";
  }

  function openBulkDialog() {
    const week = currentWeek();
    const startDate = isEntryDate(state.selectedDate) ? state.selectedDate : fmtDate(week.find((day) => isEntryDate(fmtDate(day))) || toDate(MIN_ENTRY_DATE));
    const defaultEnd = fmtDate(addDays(startDate, 4));
    els.bulkKid.value = state.selectedKid;
    els.bulkTemplate.value = "";
    els.bulkStartDate.value = startDate;
    els.bulkEndDate.value = isEntryDate(defaultEnd) ? defaultEnd : startDate;
    els.bulkStart.value = String(8 * 60);
    els.bulkEnd.value = String(16 * 60);
    els.bulkTitle.value = "School";
    els.bulkType.value = "Learning";
    els.bulkColor.value = colorForType("Learning");
    els.bulkLocation.value = "";
    els.bulkNotes.value = "";
    els.bulkReplaceToggle.checked = true;
    setBulkWeekdays([1, 2, 3, 4, 5]);
    els.bulkDialog.showModal();
  }

  function applyBulkTemplate() {
    const activity = state.activities.find((item) => item.id === els.bulkTemplate.value);
    if (!activity) return;
    els.bulkTitle.value = activity.title;
    els.bulkType.value = activity.type;
    els.bulkColor.value = activity.color;
    els.bulkNotes.value = activity.notes || "";
  }

  function saveBulkSchedule() {
    if (!els.bulkForm.reportValidity()) return;
    const startDate = sanitizeDate(els.bulkStartDate.value, MIN_ENTRY_DATE, true);
    const endDate = sanitizeDate(els.bulkEndDate.value, startDate, true);
    if (!startDate || !endDate || toDate(endDate) < toDate(startDate)) {
      showToast("Choose a valid date range");
      return;
    }
    const weekdays = selectedBulkWeekdays();
    if (!weekdays.length) {
      showToast("Choose at least one weekday");
      return;
    }
    const start = sanitizeTime(els.bulkStart.value, 8 * 60, false);
    let end = sanitizeTime(els.bulkEnd.value, Math.min(DAY_END_MINUTES, start + 60), true);
    if (end <= start) end = Math.min(DAY_END_MINUTES, start + TIME_STEP_MINUTES);
    const type = sanitizeType(els.bulkType.value);
    const kidIds = els.bulkKid.value === "both" ? state.kids.map((kid) => kid.id) : [sanitizeKidId(els.bulkKid.value)];
    const title = sanitizeText(els.bulkTitle.value, 80) || "Activity";
    const dates = datesInRange(startDate, endDate).filter((dateKey) => weekdays.includes(toDate(dateKey).getDay()));
    const newEntries = dates.flatMap((date) =>
      kidIds.map((kidId) => ({
        id: id(),
        kidId,
        date,
        start,
        end,
        title,
        type,
        color: sanitizeColor(els.bulkColor.value, colorForType(type)),
        location: sanitizeText(els.bulkLocation.value, 120),
        notes: sanitizeMultilineText(els.bulkNotes.value, 800),
      })),
    );
    if (!newEntries.length) {
      showToast("No matching dates in range");
      return;
    }
    const availableSlots = Math.max(0, MAX_ENTRIES - state.entries.length);
    const entriesToAdd = newEntries.slice(0, availableSlots);
    if (!entriesToAdd.length) {
      showToast("Schedule is full. Export backup before adding more.");
      return;
    }
    if (els.bulkReplaceToggle.checked) {
      state.entries = state.entries.filter((entry) => !entriesToAdd.some((candidate) => sameScheduleTarget(entry, candidate) && rangesOverlap(entry, candidate)));
    }
    state.entries.push(...entriesToAdd);
    selectEntryDate(entriesToAdd[0].date);
    saveState(`${entriesToAdd.length} bulk item${entriesToAdd.length === 1 ? "" : "s"} added`);
    els.bulkDialog.close();
    render();
  }

  function setBulkWeekdays(days) {
    els.bulkForm.querySelectorAll("[name='bulkWeekday']").forEach((checkbox) => {
      checkbox.checked = days.includes(Number(checkbox.value));
    });
  }

  function selectedBulkWeekdays() {
    return Array.from(els.bulkForm.querySelectorAll("[name='bulkWeekday']:checked")).map((checkbox) => Number(checkbox.value));
  }

  function saveEntryFromForm() {
    if (!els.entryForm.reportValidity()) return;
    const entry = entryFromForm(editingEntryId || id());
    if (!entry) return;
    if (editingEntryId) {
      state.entries = state.entries.map((item) => (item.id === editingEntryId ? entry : item));
    } else {
      state.entries.push(entry);
    }
    selectEntryDate(entry.date);
    saveState(entry.end - entry.start > 60 ? "Bulk time block saved" : "Activity saved");
    els.entryDialog.close();
    render();
  }

  function copyEntryFromForm() {
    if (!editingEntryId || !els.entryForm.reportValidity()) return;
    const entry = entryFromForm(id());
    if (!entry) return;
    state.entries.push(entry);
    selectEntryDate(entry.date);
    saveState("Activity copied");
    els.entryDialog.close();
    render();
  }

  function entryFromForm(entryId) {
    const start = sanitizeTime(els.entryStart.value, 8 * 60, false);
    let end = sanitizeTime(els.entryEnd.value, Math.min(DAY_END_MINUTES, start + 60), true);
    if (end <= start) end = Math.min(DAY_END_MINUTES, start + TIME_STEP_MINUTES);
    const type = sanitizeType(els.entryType.value);
    const date = sanitizeDate(els.entryDate.value, state.selectedDate, true);
    if (!date) {
      showToast("Choose a May-Dec 2026 date");
      return null;
    }
    return {
      id: entryId,
      kidId: sanitizeKidId(els.entryKid.value),
      date,
      start,
      end,
      title: sanitizeText(els.entryTitle.value, 80) || "Activity",
      type,
      color: sanitizeColor(els.entryColor.value, colorForType(type)),
      location: sanitizeText(els.entryLocation.value, 120),
      notes: sanitizeMultilineText(els.entryNotes.value, 800),
    };
  }

  function selectEntryDate(dateKey) {
    state.selectedDate = dateKey;
    state.selectedMonth = Number(dateKey.slice(5, 7));
    state.selectedWeekStart = fmtDate(startOfWeek(toDate(dateKey)));
  }

  function deleteEditingEntry() {
    if (!editingEntryId) return;
    state.entries = state.entries.filter((entry) => entry.id !== editingEntryId);
    saveState("Activity deleted");
    els.entryDialog.close();
    render();
  }

  function openActivityDialog(activity = null) {
    editingActivityId = activity ? activity.id : null;
    els.deleteActivityBtn.style.display = editingActivityId ? "inline-flex" : "none";
    els.activityTitle.value = activity ? activity.title : "";
    els.activityType.value = activity ? activity.type : "Classes";
    els.activityColor.value = activity ? activity.color : colorForType(els.activityType.value);
    els.activityNotes.value = activity ? activity.notes || "" : "";
    els.activityDialog.showModal();
  }

  function saveActivityFromForm() {
    if (!els.activityForm.reportValidity()) return;
    const type = sanitizeType(els.activityType.value);
    const activity = {
      id: editingActivityId || id(),
      title: sanitizeText(els.activityTitle.value, 80) || "Activity",
      type,
      color: sanitizeColor(els.activityColor.value, colorForType(type)),
      notes: sanitizeMultilineText(els.activityNotes.value, 800),
    };
    if (editingActivityId) {
      state.activities = state.activities.map((item) => (item.id === editingActivityId ? activity : item));
    } else {
      state.activities.push(activity);
    }
    saveState("Reusable activity saved");
    els.activityDialog.close();
    render();
  }

  function deleteEditingActivity() {
    if (!editingActivityId) return;
    state.activities = state.activities.filter((activity) => activity.id !== editingActivityId);
    saveState("Reusable activity deleted");
    els.activityDialog.close();
    render();
  }

  function copySelectedDayToNextWeek() {
    const source = currentWeek()[Number(els.copyDaySelect.value || 0)];
    const target = addDays(source, 7);
    copyDay(fmtDate(source), fmtDate(target), els.replaceCopyToggle.checked);
  }

  function copySelectedDayToTarget() {
    const target = els.targetDateInput.value;
    if (!target) {
      showToast("Choose a target date");
      return;
    }
    const source = currentWeek()[Number(els.copyDaySelect.value || 0)];
    copyDay(fmtDate(source), target, els.replaceCopyToggle.checked);
  }

  function copySelectedWeekToNextWeek() {
    const sourceStart = state.selectedWeekStart;
    const targetStart = fmtDate(addDays(sourceStart, 7));
    copyWeek(sourceStart, targetStart, els.replaceCopyToggle.checked);
  }

  function copyDay(sourceDate, targetDate, replaceTarget) {
    if (!isSupportedDate(sourceDate) || !isEntryDate(targetDate)) {
      showToast("Choose a May-Dec 2026 target date");
      return;
    }
    const scope = kidsInScope();
    if (replaceTarget) {
      state.entries = state.entries.filter((entry) => !(entry.date === targetDate && scope.includes(entry.kidId)));
    }
    const copies = state.entries
      .filter((entry) => entry.date === sourceDate && scope.includes(entry.kidId))
      .map((entry) => ({ ...entry, id: id(), date: targetDate }));
    state.entries.push(...copies);
    state.selectedDate = targetDate;
    state.selectedWeekStart = fmtDate(startOfWeek(toDate(targetDate)));
    state.selectedMonth = Number(targetDate.slice(5, 7));
    saveState(`${copies.length} item${copies.length === 1 ? "" : "s"} copied`);
    render();
  }

  function copyWeek(sourceStart, targetStart, replaceTarget) {
    const targetDates = Array.from({ length: 7 }, (_, index) => fmtDate(addDays(targetStart, index)));
    const hasSchedulableTargetDay = targetDates.some(isEntryDate);
    if (!isSupportedDate(sourceStart) || !hasSchedulableTargetDay) {
      showToast("Target week is outside May-Dec 2026");
      return;
    }
    const scope = kidsInScope();
    const sourceDates = Array.from({ length: 7 }, (_, index) => fmtDate(addDays(sourceStart, index)));
    if (replaceTarget) {
      state.entries = state.entries.filter((entry) => !(targetDates.includes(entry.date) && scope.includes(entry.kidId)));
    }
    const copies = state.entries
      .filter((entry) => sourceDates.includes(entry.date) && scope.includes(entry.kidId))
      .map((entry) => {
        const offset = sourceDates.indexOf(entry.date);
        return { ...entry, id: id(), date: targetDates[offset] };
      })
      .filter((entry) => isEntryDate(entry.date));
    state.entries.push(...copies);
    state.selectedWeekStart = targetStart;
    state.selectedDate = targetStart;
    state.selectedMonth = Number(targetStart.slice(5, 7));
    saveState(`${copies.length} week item${copies.length === 1 ? "" : "s"} copied`);
    render();
  }

  function finalizeCurrentWeek() {
    const scope = kidsInScope();
    currentWeek().forEach((day) => {
      const dateKey = fmtDate(day);
      scope.forEach((kidId) => {
        state.finalized[`${kidId}:${dateKey}`] = true;
      });
    });
    saveState("Week finalized");
    render();
  }

  function printSchedule(mode) {
    const kids = state.selectedKid === "both" ? state.kids : [kidById(state.selectedKid)];
    const pages = kids.map((kid) => {
      if (mode === "month") return printMonthPage(kid);
      if (mode === "day") return printDayPage(kid);
      return printWeekPage(kid);
    });
    els.printRoot.innerHTML = pages.join("");
    document.body.classList.add("printing");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.body.classList.remove("printing");
        els.printRoot.innerHTML = "";
      }, 400);
    }, 80);
  }

  function printHeader(title, subtitle, kid) {
    const img = kid.icon === "rocket" ? "./assets/cartoon_rocket.png" : "./assets/cartoon_robot.png";
    return `<div class="print-header">
      <div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div>
      <img src="${img}" alt="" />
    </div>`;
  }

  function printWeekPage(kid) {
    const week = currentWeek();
    const title = `${kid.name} | Week of ${week[0].toLocaleString("en-US", { month: "short", day: "numeric" })} - ${week[6].toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const subtitle = `${state.familyName || "Family"} | ${formatTime(DAY_START_MINUTES)}-${formatTime(DAY_END_MINUTES)} Central Time`;
    const header = `<tr><th class="time-col">Time</th>${week.map((day, index) => `<th>${SHORT_DAYS[index]} ${day.getMonth() + 1}/${day.getDate()}${index === 6 ? " Reward" : ""}</th>`).join("")}</tr>`;
    const body = GRID_HOURS.map((hour) => {
      const slotStart = hour * 60;
      const cells = week
        .map((day) => {
          const entries = entriesForPrintSlot(kid.id, fmtDate(day), slotStart);
          return `<td>${entries.map((entry) => printEntry(entry, slotStart)).join("")}</td>`;
        })
        .join("");
      return `<tr><td class="time-col">${formatTime(slotStart)}</td>${cells}</tr>`;
    }).join("");
    return `<section class="print-page">${printHeader(title, subtitle, kid)}<table class="print-table">${header}${body}</table></section>`;
  }

  function printDayPage(kid) {
    const day = toDate(state.selectedDate || state.selectedWeekStart);
    const title = `${kid.name} | ${day.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
    const subtitle = `${state.familyName || "Family"} | Daily plan`;
    const body = GRID_HOURS.map((hour) => {
      const slotStart = hour * 60;
      const entries = entriesForPrintSlot(kid.id, fmtDate(day), slotStart);
      return `<tr><td class="time-col">${formatTime(slotStart)}</td><td>${entries.map((entry) => printEntry(entry, slotStart)).join("")}</td></tr>`;
    }).join("");
    return `<section class="print-page">${printHeader(title, subtitle, kid)}<table class="print-table"><tr><th class="time-col">Time</th><th>Activity</th></tr>${body}</table></section>`;
  }

  function printMonthPage(kid) {
    const month = state.selectedMonth;
    const title = `${kid.name} | ${MONTH_NAMES[month]} 2026`;
    const subtitle = `${state.familyName || "Family"} | Monthly schedule`;
    const header = `<tr>${DAY_NAMES.map((day, index) => `<th>${index === 6 ? "Sunday Reward" : day}</th>`).join("")}</tr>`;
    const rows = weeksForMonth(month)
      .map((week) => {
        const cells = week
          .map((day) => {
            const dateKey = fmtDate(day);
            const entries = state.entries.filter((entry) => entry.kidId === kid.id && entry.date === dateKey);
            return `<td><strong>${day.getDate()}</strong><br />${entries.map((entry) => `${formatTime(entry.start)} ${escapeHtml(entry.title)}`).join("<br />")}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    return `<section class="print-page">${printHeader(title, subtitle, kid)}<table class="print-table print-month">${header}${rows}</table></section>`;
  }

  function printEntry(entry, slotStart = entry.start) {
    const details = hourBlockDetails(entry, slotStart);
    return `<div class="print-entry${slotStart > entry.start ? " continued" : ""}" style="background:${entry.color}">${escapeHtml(entry.title)}<br /><small>${escapeHtml(details)}</small></div>`;
  }

  function exportBackup() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kids-schedule-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup exported");
  }

  function openCalendarExportDialog() {
    renderCalendarExportInstructions();
    els.calendarDialog.showModal();
  }

  function renderCalendarExportInstructions() {
    if (!els.calendarInstructions) return;
    const platform = calendarPlatform();
    const option = calendarExportOptions()[platform];
    els.calendarInstructions.innerHTML = `<div class="instruction-card">
      <strong>${escapeHtml(option.title)}</strong>
      <p>${escapeHtml(option.summary)}</p>
      <ol>${option.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      <small>${escapeHtml(option.note)}</small>
    </div>`;
  }

  function exportIcs() {
    const platform = calendarPlatform();
    const option = calendarExportOptions()[platform];
    const scope = kidsInScope();
    const entries = state.entries.filter((entry) => scope.includes(entry.kidId)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
    if (!entries.length) {
      showToast("No calendar items to export");
      return;
    }
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kids Schedule Studio//Family Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Kids Schedule Studio",
      "X-WR-TIMEZONE:America/Chicago",
    ];
    entries.forEach((entry) => {
      const kid = kidById(entry.kidId);
      const description = [entry.type, entry.notes].filter(Boolean).join("\\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${entry.id}@kids-schedule-studio.local`,
        `DTSTAMP:${utcStamp(new Date())}`,
        `DTSTART;TZID=America/Chicago:${icsDateTime(entry.date, entry.start)}`,
        `DTEND;TZID=America/Chicago:${icsDateTime(entry.date, entry.end)}`,
        `SUMMARY:${escapeIcsText(`${kid.name}: ${entry.title}`)}`,
        `CATEGORIES:${escapeIcsText(entry.type)}`,
      );
      if (entry.location) lines.push(`LOCATION:${escapeIcsText(entry.location)}`);
      if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    downloadText(lines.join("\r\n"), `kids-schedule-studio-${option.slug}-${state.selectedKid}-${new Date().toISOString().slice(0, 10)}.ics`, "text/calendar");
    showToast(`${option.shortName} file exported`);
    els.calendarDialog.close();
  }

  function calendarPlatform() {
    return ["apple", "outlook", "google"].includes(els.calendarPlatform.value) ? els.calendarPlatform.value : "apple";
  }

  function calendarExportOptions() {
    return {
      apple: {
        slug: "apple-calendar",
        shortName: "Apple Calendar",
        title: "Apple Calendar on MacBook",
        summary: "Best for the built-in Calendar app on your MacBook, iPhone, or iPad through iCloud.",
        steps: [
          "Download the .ics file.",
          "Double-click the downloaded file on your MacBook.",
          "Choose the calendar where you want to import these activities.",
          "Confirm Import in Apple Calendar.",
        ],
        note: "If iCloud Calendar is enabled, Apple can sync the imported events to your Apple devices.",
      },
      outlook: {
        slug: "outlook-calendar",
        shortName: "Outlook",
        title: "Outlook Calendar",
        summary: "Best for Microsoft Outlook on Mac, Windows, or Outlook on the web.",
        steps: [
          "Download the .ics file.",
          "In Outlook, open Calendar.",
          "Choose Add calendar or Import calendar.",
          "Select Upload from file, choose this .ics file, then import it to the calendar you want.",
        ],
        note: "Exact labels can vary between Outlook desktop and Outlook web, but the file type is the same .ics calendar file.",
      },
      google: {
        slug: "google-calendar",
        shortName: "Google Calendar",
        title: "Google Calendar",
        summary: "Best for importing the schedule into a Google account calendar.",
        steps: [
          "Download the .ics file.",
          "Open Google Calendar in your browser.",
          "Go to Settings, then Import & export.",
          "Choose the .ics file and select the Google calendar to import into.",
        ],
        note: "Google import is manual for privacy. This app does not connect to your Google account.",
      },
    };
  }

  function downloadText(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        state = normalizeState(imported);
        saveState("Backup imported");
        hydrateControls();
        render();
      } catch (error) {
        showToast("Could not import backup");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function updateKidName(kidId, value) {
    const kid = kidById(kidId);
    kid.name = sanitizeText(value, 60) || (kidId === "kid1" ? "Kid 1" : "Kid 2");
    saveState("Saved kid name");
    render();
  }

  function saveState(message = "Saved locally") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      els.saveStatus.textContent = `Auto-saved ${currentTimeLabel()}`;
    } catch (error) {
      els.saveStatus.textContent = "Save blocked";
      showToast("Browser blocked local save");
      return;
    }
    if (message) showToast(message);
  }

  function manualSave() {
    saveState(`Saved now at ${currentTimeLabel()}`);
    els.saveStatus.textContent = `Saved now ${currentTimeLabel()}`;
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState(`${state.theme === "dark" ? "Dark" : "Light"} mode saved`);
  }

  function applyTheme() {
    const theme = state.theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    if (els.themeToggleBtn) {
      els.themeToggleBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
      els.themeToggleBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function currentTimeLabel() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      return defaultState();
    }
  }

  function normalizeState(input) {
    const safeInput = input && typeof input === "object" ? input : {};
    const base = defaultState();
    const selectedDate = sanitizeDate(safeInput.selectedDate, base.selectedDate);
    const selectedWeekStart = fmtDate(startOfWeek(sanitizeDate(safeInput.selectedWeekStart, base.selectedWeekStart)));
    const selectedMonth = MONTHS.includes(Number(safeInput.selectedMonth)) ? Number(safeInput.selectedMonth) : Number(selectedDate.slice(5, 7));
    return {
      ...base,
      familyName: sanitizeText(safeInput.familyName, 80),
      kids: normalizeKids(safeInput.kids, base.kids),
      selectedView: ["week", "month", "activities"].includes(safeInput.selectedView) ? safeInput.selectedView : base.selectedView,
      theme: ["light", "dark"].includes(safeInput.theme) ? safeInput.theme : base.theme,
      selectedKid: ["kid1", "kid2", "both"].includes(safeInput.selectedKid) ? safeInput.selectedKid : base.selectedKid,
      selectedMonth: MONTHS.includes(selectedMonth) ? selectedMonth : base.selectedMonth,
      selectedWeekStart,
      selectedDate,
      activities: normalizeActivities(safeInput.activities, base.activities),
      entries: normalizeEntries(safeInput.entries),
      finalized: normalizeFinalized(safeInput.finalized),
    };
  }

  function normalizeKids(inputKids, baseKids) {
    const imported = Array.isArray(inputKids) ? inputKids : [];
    return baseKids.map((baseKid, index) => {
      const source = imported[index] && typeof imported[index] === "object" ? imported[index] : {};
      return {
        ...baseKid,
        id: baseKid.id,
        name: sanitizeText(source.name, 60) || baseKid.name,
        color: sanitizeColor(source.color, baseKid.color),
        icon: baseKid.icon,
      };
    });
  }

  function normalizeActivities(inputActivities, fallbackActivities) {
    const source = Array.isArray(inputActivities) ? inputActivities : fallbackActivities;
    return source.slice(0, MAX_ACTIVITIES).map(normalizeActivity).filter(Boolean);
  }

  function normalizeActivity(activity) {
    if (!activity || typeof activity !== "object") return null;
    const type = sanitizeType(activity.type);
    return {
      id: sanitizeId(activity.id),
      title: sanitizeText(activity.title, 80) || "Activity",
      type,
      color: sanitizeColor(activity.color, colorForType(type)),
      notes: sanitizeMultilineText(activity.notes, 800),
    };
  }

  function normalizeEntries(inputEntries) {
    if (!Array.isArray(inputEntries)) return [];
    return inputEntries.slice(0, MAX_ENTRIES).map(normalizeEntry).filter(Boolean);
  }

  function normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") return null;
    const date = sanitizeDate(entry.date, null, true);
    if (!date) return null;
    const start = sanitizeTime(entry.start, 8 * 60, false);
    const end = Math.max(start + TIME_STEP_MINUTES, sanitizeTime(entry.end, Math.min(DAY_END_MINUTES, start + 60), true));
    const type = sanitizeType(entry.type);
    return {
      id: sanitizeId(entry.id),
      kidId: sanitizeKidId(entry.kidId),
      date,
      start,
      end: Math.min(DAY_END_MINUTES, end),
      title: sanitizeText(entry.title, 80) || "Activity",
      type,
      color: sanitizeColor(entry.color, colorForType(type)),
      location: sanitizeText(entry.location, 120),
      notes: sanitizeMultilineText(entry.notes, 800),
    };
  }

  function normalizeFinalized(finalized) {
    if (!finalized || typeof finalized !== "object" || Array.isArray(finalized)) return {};
    return Object.keys(finalized).reduce((output, key) => {
      const [kidId, date] = key.split(":");
      if ((kidId === "kid1" || kidId === "kid2") && isSupportedDate(date) && finalized[key] === true) {
        output[`${kidId}:${date}`] = true;
      }
      return output;
    }, {});
  }

  function sanitizeText(value, maxLength) {
    return String(value || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function sanitizeMultilineText(value, maxLength) {
    return String(value || "")
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function sanitizeId(value) {
    const candidate = sanitizeText(value, 90);
    return /^[A-Za-z0-9._:-]+$/.test(candidate) ? candidate : id();
  }

  function sanitizeKidId(value) {
    return value === "kid2" ? "kid2" : "kid1";
  }

  function sanitizeType(value) {
    return TYPES.some((type) => type.name === value) ? value : TYPES[0].name;
  }

  function sanitizeColor(value, fallback) {
    const candidate = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.toLowerCase() : fallback;
  }

  function sanitizeTime(value, fallback, allowEnd) {
    const raw = Number(value);
    const fallbackMinutes = normalizeTimeNumber(fallback);
    const minutes = normalizeTimeNumber(raw);
    const max = allowEnd ? DAY_END_MINUTES : DAY_END_MINUTES - TIME_STEP_MINUTES;
    if (Number.isInteger(minutes) && minutes >= DAY_START_MINUTES && minutes <= max && minutes % TIME_STEP_MINUTES === 0) {
      return minutes;
    }
    return fallbackMinutes;
  }

  function normalizeTimeNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 8 * 60;
    if (number >= 0 && number <= 24) return number * 60;
    return Math.round(number);
  }

  function sanitizeDate(value, fallback, entryOnly = false) {
    const candidate = String(value || "");
    const valid = entryOnly ? isEntryDate(candidate) : isSupportedDate(candidate);
    if (valid) return candidate;
    if (!fallback) return null;
    const fallbackValue = String(fallback);
    if (entryOnly && isEntryDate(fallbackValue)) return fallbackValue;
    if (!entryOnly && isSupportedDate(fallbackValue)) return fallbackValue;
    return null;
  }

  function isEntryDate(value) {
    return isCalendarDate(value) && value >= MIN_ENTRY_DATE && value <= MAX_ENTRY_DATE;
  }

  function isSupportedDate(value) {
    return isCalendarDate(value) && value >= MIN_DISPLAY_DATE && value <= MAX_DISPLAY_DATE;
  }

  function isCalendarDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    return fmtDate(toDate(value)) === value;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 1700);
  }

  function currentWeek() {
    const start = toDate(state.selectedWeekStart);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  function allWeeks() {
    const first = startOfWeek(new Date(2026, 4, 1));
    const last = startOfWeek(new Date(2026, 11, 31));
    const weeks = [];
    for (let cursor = first; cursor <= last; cursor = addDays(cursor, 7)) {
      weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    }
    return weeks;
  }

  function weeksForMonth(month) {
    const first = new Date(2026, month - 1, 1);
    const start = startOfWeek(first);
    const last = new Date(2026, month, 0);
    const end = startOfWeek(last);
    const weeks = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 7)) {
      weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    }
    return weeks;
  }

  function entriesForSlot(dateKey, slotStart) {
    return entriesForDate(dateKey).filter((entry) => entryOverlapsSlot(entry, slotStart)).sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
  }

  function entriesForPrintSlot(kidId, dateKey, slotStart) {
    return state.entries
      .filter((entry) => entry.kidId === kidId && entry.date === dateKey && entryOverlapsSlot(entry, slotStart))
      .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
  }

  function entryOverlapsSlot(entry, slotStart) {
    const slotEnd = slotStart + 60;
    return entry.start < slotEnd && entry.end > slotStart;
  }

  function entryHasConflict(entry) {
    return state.entries.some((other) => entriesConflict(entry, other));
  }

  function conflictPairs(scope = kidsInScope(), dates = null) {
    const scopedEntries = state.entries.filter((entry) => scope.includes(entry.kidId) && (!dates || dates.includes(entry.date)));
    const pairs = [];
    for (let index = 0; index < scopedEntries.length; index += 1) {
      for (let compare = index + 1; compare < scopedEntries.length; compare += 1) {
        if (entriesConflict(scopedEntries[index], scopedEntries[compare])) pairs.push([scopedEntries[index], scopedEntries[compare]]);
      }
    }
    return pairs;
  }

  function entriesConflict(first, second) {
    return first.id !== second.id && sameScheduleTarget(first, second) && rangesOverlap(first, second);
  }

  function sameScheduleTarget(first, second) {
    return first.kidId === second.kidId && first.date === second.date;
  }

  function rangesOverlap(first, second) {
    return first.start < second.end && second.start < first.end;
  }

  function hourBlockDetails(entry, slotStart) {
    const slotEnd = slotStart + 60;
    const fitsInsideSlot = entry.start >= slotStart && entry.end <= slotEnd;
    if (fitsInsideSlot) {
      return `${formatTime(entry.start)}-${formatTime(entry.end)}${entry.location ? " | " + entry.location : ""}`;
    }
    const segmentStart = Math.max(entry.start, slotStart);
    const segmentEnd = Math.min(entry.end, slotEnd);
    return `${formatTime(segmentStart)}-${formatTime(segmentEnd)} blocked | Ends ${formatTime(entry.end)}${entry.location ? " | " + entry.location : ""}`;
  }

  function datesInRange(startDate, endDate) {
    const dates = [];
    for (let cursor = toDate(startDate); cursor <= toDate(endDate); cursor = addDays(cursor, 1)) {
      const dateKey = fmtDate(cursor);
      if (isEntryDate(dateKey)) dates.push(dateKey);
    }
    return dates;
  }

  function entriesForDate(dateKey) {
    const scope = kidsInScope();
    return state.entries.filter((entry) => entry.date === dateKey && scope.includes(entry.kidId)).sort((a, b) => a.start - b.start);
  }

  function kidsInScope() {
    return state.selectedKid === "both" ? state.kids.map((kid) => kid.id) : [state.selectedKid];
  }

  function isFinalized(dateKey) {
    return kidsInScope().some((kidId) => state.finalized[`${kidId}:${dateKey}`]);
  }

  function kidById(kidId) {
    return state.kids.find((kid) => kid.id === kidId) || state.kids[0];
  }

  function colorForType(typeName) {
    return (TYPES.find((type) => type.name === typeName) || TYPES[0]).color;
  }

  function firstInMonth(month) {
    return `2026-${String(month).padStart(2, "0")}-01`;
  }

  function toDate(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function fmtDate(dateValue) {
    const date = toDate(dateValue);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function addDays(dateValue, days) {
    const date = toDate(dateValue);
    date.setDate(date.getDate() + days);
    return date;
  }

  function startOfWeek(dateValue) {
    const date = toDate(dateValue);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(date, diff);
  }

  function formatTime(minutes) {
    const normalizedMinutes = Number(minutes) === DAY_END_MINUTES ? 0 : Number(minutes);
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalizedHour = hour % 12 || 12;
    return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  function icsDateTime(dateKey, minutes) {
    const adjustedDate = minutes >= DAY_END_MINUTES ? fmtDate(addDays(dateKey, Math.floor(minutes / DAY_END_MINUTES))) : dateKey;
    const adjustedMinutes = minutes % DAY_END_MINUTES;
    const hour = Math.floor(adjustedMinutes / 60);
    const minute = adjustedMinutes % 60;
    return `${adjustedDate.replace(/-/g, "")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
  }

  function utcStamp(date) {
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}${String(date.getUTCSeconds()).padStart(2, "0")}Z`;
  }

  function escapeIcsText(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function id() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
})();
