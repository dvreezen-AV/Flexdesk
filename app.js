const DESK_IDS = Array.from({ length: 20 }, (_, index) => `Desk ${index + 1}`);

const DESKS = {
  "Desk 1": { office: "office-1", left: 5.2, top: 71.8 },
  "Desk 2": { office: "office-1", left: 5.2, top: 48.8 },
  "Desk 3": { office: "office-1", left: 16.4, top: 71.8 },
  "Desk 4": { office: "office-1", left: 16.4, top: 48.8 },
  "Desk 5": { office: "office-1", left: 20.2, top: 71.8 },
  "Desk 6": { office: "office-1", left: 20.2, top: 48.8 },
  "Desk 7": { office: "office-1", left: 31.6, top: 71.8 },
  "Desk 8": { office: "office-1", left: 31.6, top: 48.8 },
  "Desk 9": { office: "office-1", left: 35.4, top: 71.8 },
  "Desk 10": { office: "office-1", left: 35.4, top: 48.8 },
  "Desk 11": { office: "office-2", left: 51.7, top: 71.8 },
  "Desk 12": { office: "office-2", left: 63.3, top: 71.8 },
  "Desk 13": { office: "office-2", left: 63.3, top: 48.8 },
  "Desk 14": { office: "office-2", left: 67.1, top: 71.8 },
  "Desk 15": { office: "office-2", left: 67.1, top: 48.8 },
  "Desk 16": { office: "office-2", left: 78.5, top: 71.8 },
  "Desk 17": { office: "office-2", left: 78.5, top: 48.8 },
  "Desk 18": { office: "office-2", left: 82.3, top: 71.8 },
  "Desk 19": { office: "office-2", left: 82.3, top: 48.8 },
  "Desk 20": { office: "office-2", left: 94.4, top: 71.8 },
};

const ASSIGNED_DESKS = {
  "Desk 1": "Madrika",
  "Desk 2": "Niels Koolen",
  "Desk 3": "Nick Kelders",
  "Desk 4": "Ana Marval",
  "Desk 5": "Pieter Konst",
  "Desk 6": "Jolle Schrale",
  "Desk 7": "Erick/Chantal",
  "Desk 8": "Nassim",
  "Desk 9": "Rowan",
  "Desk 10": "Anniek",
  "Desk 12": "David van Leijenhorst",
  "Desk 16": "Marco Blomsma",
  "Desk 18": "Jeroen HR",
  "Desk 19": "Tim Fokker",
};
const SCHEDULED_ASSIGNED_DESKS = {
  "Desk 20": { person: "Dennis Dijk", from: "2026-09-01" },
};
const ASSIGNED_DESK_AVAILABLE_DAYS = {
  "Desk 5": [3],
  "Desk 6": [3, 4],
  "Desk 20": [5],
};
const ASSIGNED_DESK_AVAILABLE_RANGES = {
  "Desk 19": [{ from: "2026-09-07", until: "2026-09-25" }],
};
const TEMPORARILY_UNAVAILABLE_UNTIL = "2026-05-21";
const TEMPORARILY_UNAVAILABLE_DESKS = new Set(["Desk 11", "Desk 13", "Desk 15", "Desk 20"]);

const state = {
  selectedDate: "",
  selectedDesk: null,
  reservations: {},
};

const els = {
  dateInput: document.querySelector("#booking-date"),
  mapDateLabel: document.querySelector("#map-date-label"),
  deskGrid: document.querySelector("#desk-grid"),
  availableCount: document.querySelector("#available-count"),
  reservedCount: document.querySelector("#reserved-count"),
  selectedLabel: document.querySelector("#selected-label"),
  form: document.querySelector("#reservation-form"),
  deskId: document.querySelector("#desk-id"),
  deskChoice: document.querySelector("#desk-choice"),
  personName: document.querySelector("#person-name"),
  teamName: document.querySelector("#team-name"),
  timeSlot: document.querySelector("#time-slot"),
  reserveButton: document.querySelector("#reserve-button"),
  formTitle: document.querySelector("#form-title"),
  formHelper: document.querySelector("#form-helper"),
  bookingDetails: document.querySelector("#booking-details"),
  detailName: document.querySelector("#detail-name"),
  detailTeam: document.querySelector("#detail-team"),
  detailTime: document.querySelector("#detail-time"),
  cancelButton: document.querySelector("#cancel-button"),
  reservationListTitle: document.querySelector("#reservation-list-title"),
  reservationItems: document.querySelector("#reservation-items"),
  emptyState: document.querySelector("#empty-state"),
  clearDemo: document.querySelector("#clear-demo"),
};

function formatDateForInput(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatDisplayDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

function getDayReservations() {
  return state.reservations || {};
}

function getReservation(deskId) {
  return getDayReservations()[deskId] || null;
}

function getWeekday(dateString) {
  return new Date(`${dateString}T12:00:00`).getDay();
}

function getAssignedPerson(deskId, date = state.selectedDate) {
  const availableRanges = ASSIGNED_DESK_AVAILABLE_RANGES[deskId] || [];

  if (availableRanges.some((range) => date >= range.from && date <= range.until)) {
    return null;
  }

  const availableDays = ASSIGNED_DESK_AVAILABLE_DAYS[deskId];

  if (availableDays && availableDays.includes(getWeekday(date))) {
    return null;
  }

  const scheduledAssignment = SCHEDULED_ASSIGNED_DESKS[deskId];

  if (scheduledAssignment && date >= scheduledAssignment.from) {
    return scheduledAssignment.person;
  }

  return ASSIGNED_DESKS[deskId] || null;
}

function isTemporarilyUnavailable(deskId) {
  return TEMPORARILY_UNAVAILABLE_DESKS.has(deskId) && state.selectedDate < TEMPORARILY_UNAVAILABLE_UNTIL;
}

function getDeskStatusLabel(deskId) {
  const assignedPerson = getAssignedPerson(deskId);
  const reservation = getReservation(deskId);

  if (assignedPerson) {
    return `Assigned to ${assignedPerson}`;
  }

  if (isTemporarilyUnavailable(deskId)) {
    return "Available from 21 May";
  }

  if (reservation) {
    return `Reserved by ${reservation.name}`;
  }

  return "Available";
}

function resetSelection() {
  state.selectedDesk = null;
  els.form.reset();
  els.deskChoice.value = "";
  els.reserveButton.disabled = true;
  els.formTitle.textContent = "Reserve a desk";
  els.formHelper.textContent = "No desk selected.";
  els.bookingDetails.hidden = true;
}

function selectDesk(deskId) {
  state.selectedDesk = deskId;
  const reservation = getReservation(deskId);
  const assignedPerson = getAssignedPerson(deskId);
  const temporarilyUnavailable = isTemporarilyUnavailable(deskId);

  els.selectedLabel.textContent = deskId;
  els.deskId.value = deskId;
  els.deskChoice.value = deskId;
  els.reserveButton.disabled = Boolean(reservation) || Boolean(assignedPerson) || temporarilyUnavailable;
  els.formTitle.textContent = assignedPerson
    ? `${deskId} is assigned`
    : temporarilyUnavailable
      ? `${deskId} is unavailable`
    : reservation
      ? `${deskId} is reserved`
      : `Reserve ${deskId}`;
  els.formHelper.textContent = assignedPerson
    ? `Assigned to ${assignedPerson}.`
    : temporarilyUnavailable
      ? "Available from 21 May."
    : reservation
      ? "Current booking."
      : "Reservation details.";

  if (assignedPerson || temporarilyUnavailable || reservation) {
    els.detailName.textContent = assignedPerson || (temporarilyUnavailable ? "Available from 21 May" : reservation.name);
    els.detailTeam.textContent = assignedPerson
      ? "Assigned desk"
      : temporarilyUnavailable
        ? "Temporarily unavailable"
        : reservation.team || "Not specified";
    els.detailTime.textContent = assignedPerson
      ? "Always"
      : temporarilyUnavailable
        ? "Until 21 May"
        : reservation.time;
    els.bookingDetails.hidden = false;
    els.cancelButton.hidden = Boolean(assignedPerson) || temporarilyUnavailable;
  } else {
    els.bookingDetails.hidden = true;
    els.cancelButton.hidden = false;
  }

  render();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

async function loadDayReservations() {
  const payload = await apiRequest(`/api/reservations?date=${state.selectedDate}`);
  state.reservations = payload.reservations;
}

function renderDesk(deskId) {
  const desk = DESKS[deskId];
  const reservation = getReservation(deskId);
  const assignedPerson = getAssignedPerson(deskId);
  const temporarilyUnavailable = isTemporarilyUnavailable(deskId);
  const isSelected = state.selectedDesk === deskId;
  const button = document.createElement("button");
  const deskNumber = deskId.replace("Desk ", "");

  button.type = "button";
  button.className = [
    "desk",
    reservation && !assignedPerson ? "is-reserved" : "",
    assignedPerson || temporarilyUnavailable ? "is-unavailable" : "",
    isSelected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  button.style.left = `${desk.left}%`;
  button.style.top = `${desk.top}%`;
  button.setAttribute("role", "listitem");
  button.setAttribute(
    "aria-label",
    assignedPerson
      ? `${deskId}, assigned to ${assignedPerson}`
      : temporarilyUnavailable
        ? `${deskId}, available from 21 May`
      : reservation
        ? `${deskId}, reserved by ${reservation.name}`
        : `${deskId}, available`
  );
  button.addEventListener("click", () => selectDesk(deskId));

  button.innerHTML = `
    <span class="desk-number">${deskNumber}</span>
    ${assignedPerson ? `<span class="desk-person">${escapeHtml(assignedPerson)}</span>` : ""}
    ${reservation && !assignedPerson ? `<span class="desk-person">${escapeHtml(reservation.name)}</span>` : ""}
    <span class="desk-status">${
      assignedPerson ? "Assigned" : temporarilyUnavailable ? "From 21 May" : reservation ? "Reserved" : "Available"
    }</span>
  `;

  return button;
}

function renderList() {
  const dayReservations = getDayReservations();
  const assignedRows = DESK_IDS
    .filter((deskId) => getAssignedPerson(deskId))
    .map((deskId) => [deskId, { name: getAssignedPerson(deskId), team: "Assigned desk", time: "Always" }]);
  const reservationRows = Object.entries(dayReservations).filter(([deskId]) => {
    return DESK_IDS.includes(deskId) && !getAssignedPerson(deskId) && !isTemporarilyUnavailable(deskId);
  });
  const rows = [...assignedRows, ...reservationRows].sort(([a], [b]) => {
    return Number(a.replace("Desk ", "")) - Number(b.replace("Desk ", ""));
  });

  els.emptyState.hidden = rows.length > 0;
  els.reservationItems.innerHTML = "";

  rows.forEach(([deskId, reservation]) => {
    const row = document.createElement("article");
    row.className = "reservation-row";
    row.innerHTML = `
      <strong>${escapeHtml(deskId)}</strong>
      <div>
        <strong>${escapeHtml(reservation.name)}</strong><br />
        <span>${escapeHtml(reservation.team || "No team listed")}</span>
      </div>
      <span>${escapeHtml(reservation.time)}</span>
    `;
    els.reservationItems.append(row);
  });
}

function renderDeskChoices() {
  const currentValue = state.selectedDesk || "";
  els.deskChoice.innerHTML = '<option value="">Select a desk</option>';

  DESK_IDS.forEach((deskId) => {
    const option = document.createElement("option");
    option.value = deskId;
    option.textContent = `${deskId} - ${getDeskStatusLabel(deskId)}`;
    els.deskChoice.append(option);
  });

  els.deskChoice.value = currentValue;
}

function render() {
  const dayReservations = getDayReservations();
  const reservedCount = DESK_IDS.filter((deskId) => {
    return dayReservations[deskId] && !getAssignedPerson(deskId) && !isTemporarilyUnavailable(deskId);
  }).length;
  const assignedCount = DESK_IDS.filter((deskId) => getAssignedPerson(deskId)).length;
  const temporarilyUnavailableCount = DESK_IDS.filter((deskId) => isTemporarilyUnavailable(deskId)).length;
  const availableCount = DESK_IDS.length - reservedCount - assignedCount - temporarilyUnavailableCount;

  renderDeskChoices();
  els.mapDateLabel.textContent = `Availability for ${formatDisplayDate(state.selectedDate)}.`;
  els.availableCount.textContent = availableCount;
  els.reservedCount.textContent = reservedCount + assignedCount + temporarilyUnavailableCount;
  els.selectedLabel.textContent = state.selectedDesk || "-";
  els.reservationListTitle.textContent = "Reservations for this date";
  els.emptyState.textContent = `All ${DESK_IDS.length} desks are available for the selected date.`;
  els.deskGrid.innerHTML = "";

  DESK_IDS.forEach((deskId) => {
    els.deskGrid.append(renderDesk(deskId));
  });

  renderList();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

els.deskChoice.addEventListener("change", () => {
  if (els.deskChoice.value) {
    selectDesk(els.deskChoice.value);
    return;
  }

  resetSelection();
  render();
});

els.dateInput.addEventListener("change", async () => {
  state.selectedDate = els.dateInput.value;
  resetSelection();
  await loadDayReservations();
  render();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (
    !state.selectedDesk ||
    getReservation(state.selectedDesk) ||
    getAssignedPerson(state.selectedDesk) ||
    isTemporarilyUnavailable(state.selectedDesk)
  ) {
    return;
  }

  const name = els.personName.value.trim();
  if (!name) {
    els.personName.focus();
    return;
  }

  try {
    const payload = await apiRequest("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        date: state.selectedDate,
        deskId: state.selectedDesk,
        name,
        team: els.teamName.value.trim(),
        time: els.timeSlot.value,
      }),
    });

    state.reservations = payload.reservations;
    els.form.reset();
    selectDesk(state.selectedDesk);
  } catch (error) {
    els.formHelper.textContent = error.message;
    await loadDayReservations();
    render();
  }
});

els.cancelButton.addEventListener("click", async () => {
  if (!state.selectedDesk || getAssignedPerson(state.selectedDesk)) {
    return;
  }

  const payload = await apiRequest("/api/reservations", {
    method: "DELETE",
    body: JSON.stringify({
      date: state.selectedDate,
      deskId: state.selectedDesk,
    }),
  });
  state.reservations = payload.reservations;
  selectDesk(state.selectedDesk);
});

els.clearDemo.addEventListener("click", async () => {
  const dayReservations = getDayReservations();

  for (const deskId of DESK_IDS) {
    if (dayReservations[deskId] && !getAssignedPerson(deskId)) {
      await apiRequest("/api/reservations", {
        method: "DELETE",
        body: JSON.stringify({
          date: state.selectedDate,
          deskId,
        }),
      });
    }
  }

  await loadDayReservations();
  resetSelection();
  render();
});

els.dateInput.value = formatDateForInput();
state.selectedDate = els.dateInput.value;
resetSelection();
loadDayReservations().then(render).catch((error) => {
  els.formHelper.textContent = error.message;
  render();
});
