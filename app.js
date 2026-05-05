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
  const START_HOURS = Array.from({ length: 16 }, (_, i) => i + 8);
  const END_HOURS = Array.from({ length: 16 }, (_, i) => i + 9);
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
      "activityDialog",
      "activityForm",
      "activityTitle",
      "activityType",
      "activityColor",
      "activityNotes",
      "deleteActivityBtn",
      "importFileInput",
      "toast",
      "printRoot",
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
    document.getElementById("importBtn").addEventListener("click", () => els.importFileInput.click());
    els.importFileInput.addEventListener("change", importBackup);

    els.weekView.addEventListener("click", handleWeekClick);
    els.monthView.addEventListener("click", handleMonthClick);
    els.activityList.addEventListener("click", handleActivityListClick);
    els.activitiesView.addEventListener("click", handleActivitiesViewClick);

    els.entryTemplate.addEventListener("change", applyEntryTemplate);
    els.entryType.addEventListener("change", () => {
      const type = TYPES.find((item) => item.name === els.entryType.value);
      if (type) els.entryColor.value = type.color;
    });
    document.getElementById("saveEntryBtn").addEventListener("click", (event) => {
      event.preventDefault();
      saveEntryFromForm();
    });
    els.deleteEntryBtn.addEventListener("click", deleteEditingEntry);

    document.getElementById("saveActivityBtn").addEventListener("click", (event) => {
      event.preventDefault();
      saveActivityFromForm();
    });
    els.deleteActivityBtn.addEventListener("click", deleteEditingActivity);
  }

  function populateStaticSelects() {
    els.monthSelect.innerHTML = MONTHS.map((month) => `<option value="${month}">${MONTH_NAMES[month]} 2026</option>`).join("");
    els.entryStart.innerHTML = START_HOURS.map((hour) => `<option value="${hour}">${formatHour(hour)}</option>`).join("");
    els.entryEnd.innerHTML = END_HOURS.map((hour) => `<option value="${hour}">${formatHour(hour)}</option>`).join("");
    [els.entryType, els.activityType].forEach((select) => {
      select.innerHTML = TYPES.map((type) => `<option value="${escapeHtml(type.name)}">${escapeHtml(type.name)}</option>`).join("");
    });
  }

  function hydrateControls() {
    els.familyNameInput.value = state.familyName || "";
    els.kid1NameInput.value = kidById("kid1").name === "Kid 1" ? "" : kidById("kid1").name;
    els.kid2NameInput.value = kidById("kid2").name === "Kid 2" ? "" : kidById("kid2").name;
    els.replaceCopyToggle.checked = true;
    els.targetDateInput.value = fmtDate(addDays(state.selectedWeekStart, 7));
  }

  function render() {
    syncSelectors();
    renderActivityList();
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
    els.copyDaySelect.innerHTML = currentWeek()
      .map((day, index) => `<option value="${index}">${SHORT_DAYS[index]} ${day.getMonth() + 1}/${day.getDate()}</option>`)
      .join("");
    if (!els.copyDaySelect.value) els.copyDaySelect.value = "0";
    els.entryTemplate.innerHTML = `<option value="">Custom entry</option>` + state.activities.map((activity) => `<option value="${activity.id}">${escapeHtml(activity.title)}</option>`).join("");
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

    const rows = START_HOURS.map((hour) => {
      const timeCell = `<div class="week-cell time-cell">${formatHour(hour)}</div>`;
      const dayCells = week
        .map((day, dayIndex) => {
          const dateKey = fmtDate(day);
          const finalized = isFinalized(dateKey) ? " finalized" : "";
          const reward = dayIndex === 6 ? " reward" : "";
          const entries = entriesForSlot(dateKey, hour);
          const chips = entries.length
            ? entries.map(entryChip).join("")
            : `<span class="empty-hint">${dayIndex === 6 ? "Reward" : ""}</span>`;
          return `<div class="week-cell slot-cell${finalized}${reward}" data-date="${dateKey}" data-hour="${hour}">${chips}</div>`;
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
        const chips = entries.map((entry) => `<div class="mini-chip" style="background:${entry.color}">${formatHour(entry.start)} ${escapeHtml(entry.title)}</div>`).join("");
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

  function entryChip(entry) {
    const kid = kidById(entry.kidId);
    const kidPrefix = state.selectedKid === "both" ? `${kid.name}: ` : "";
    const details = `${formatHour(entry.start)}-${formatHour(entry.end)}${entry.location ? " | " + entry.location : ""}`;
    return `<button class="entry-chip" style="background:${entry.color}" data-entry-id="${entry.id}">
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
    openEntryDialog({ kidId, date: slot.dataset.date, start: Number(slot.dataset.hour), end: Number(slot.dataset.hour) + 1 });
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
    els.entryKid.value = entry.kidId || (state.selectedKid === "both" ? state.kids[0].id : state.selectedKid);
    els.entryDate.value = entry.date || state.selectedDate || state.selectedWeekStart;
    els.entryStart.value = String(entry.start || 8);
    els.entryEnd.value = String(entry.end || Number(els.entryStart.value) + 1);
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

  function saveEntryFromForm() {
    if (!els.entryForm.reportValidity()) return;
    const start = sanitizeHour(els.entryStart.value, 8, 23);
    let end = sanitizeHour(els.entryEnd.value, Math.min(24, start + 1));
    if (end <= start) end = Math.min(24, start + 1);
    const type = sanitizeType(els.entryType.value);
    const entry = {
      id: editingEntryId || id(),
      kidId: sanitizeKidId(els.entryKid.value),
      date: sanitizeDate(els.entryDate.value, state.selectedDate, true),
      start,
      end,
      title: sanitizeText(els.entryTitle.value, 80) || "Activity",
      type,
      color: sanitizeColor(els.entryColor.value, colorForType(type)),
      location: sanitizeText(els.entryLocation.value, 120),
      notes: sanitizeMultilineText(els.entryNotes.value, 800),
    };
    if (editingEntryId) {
      state.entries = state.entries.map((item) => (item.id === editingEntryId ? entry : item));
    } else {
      state.entries.push(entry);
    }
    state.selectedDate = entry.date;
    state.selectedMonth = Number(entry.date.slice(5, 7));
    state.selectedWeekStart = fmtDate(startOfWeek(toDate(entry.date)));
    saveState("Activity saved");
    els.entryDialog.close();
    render();
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
    const subtitle = `${state.familyName || "Family"} | 8:00 AM-11:00 PM Central Time`;
    const header = `<tr><th class="time-col">Time</th>${week.map((day, index) => `<th>${SHORT_DAYS[index]} ${day.getMonth() + 1}/${day.getDate()}${index === 6 ? " Reward" : ""}</th>`).join("")}</tr>`;
    const body = START_HOURS.map((hour) => {
      const cells = week
        .map((day) => {
          const entries = state.entries.filter((entry) => entry.kidId === kid.id && entry.date === fmtDate(day) && entry.start === hour);
          return `<td>${entries.map(printEntry).join("")}</td>`;
        })
        .join("");
      return `<tr><td class="time-col">${formatHour(hour)}</td>${cells}</tr>`;
    }).join("");
    return `<section class="print-page">${printHeader(title, subtitle, kid)}<table class="print-table">${header}${body}</table></section>`;
  }

  function printDayPage(kid) {
    const day = toDate(state.selectedDate || state.selectedWeekStart);
    const title = `${kid.name} | ${day.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
    const subtitle = `${state.familyName || "Family"} | Daily plan`;
    const body = START_HOURS.map((hour) => {
      const entries = state.entries.filter((entry) => entry.kidId === kid.id && entry.date === fmtDate(day) && entry.start === hour);
      return `<tr><td class="time-col">${formatHour(hour)}</td><td>${entries.map(printEntry).join("")}</td></tr>`;
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
            return `<td><strong>${day.getDate()}</strong><br />${entries.map((entry) => `${formatHour(entry.start)} ${escapeHtml(entry.title)}`).join("<br />")}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    return `<section class="print-page">${printHeader(title, subtitle, kid)}<table class="print-table print-month">${header}${rows}</table></section>`;
  }

  function printEntry(entry) {
    return `<div class="print-entry" style="background:${entry.color}">${escapeHtml(entry.title)}<br /><small>${formatHour(entry.start)}-${formatHour(entry.end)}${entry.location ? " | " + escapeHtml(entry.location) : ""}</small></div>`;
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
      els.saveStatus.textContent = "Saved locally";
    } catch (error) {
      els.saveStatus.textContent = "Save blocked";
      showToast("Browser blocked local save");
      return;
    }
    if (message) showToast(message);
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
    const start = sanitizeHour(entry.start, 8, 23);
    const end = Math.max(start + 1, sanitizeHour(entry.end, Math.min(24, start + 1)));
    const type = sanitizeType(entry.type);
    return {
      id: sanitizeId(entry.id),
      kidId: sanitizeKidId(entry.kidId),
      date,
      start,
      end: Math.min(24, end),
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

  function sanitizeHour(value, fallback, maxHour = 24) {
    const hour = Number(value);
    return Number.isInteger(hour) && hour >= 8 && hour <= maxHour ? hour : fallback;
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

  function entriesForSlot(dateKey, hour) {
    return entriesForDate(dateKey).filter((entry) => entry.start === hour).sort((a, b) => a.start - b.start || a.title.localeCompare(b.title));
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

  function formatHour(hour) {
    if (hour === 24) return "12:00 AM";
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalized = hour % 12 || 12;
    return `${normalized}:00 ${suffix}`;
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
