const OFFICES = {
  "office-1": {
    name: "Office 1",
    team: "Planning / Logistics / misc",
    desks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  "office-2": {
    name: "Office 2",
    team: "PM / Sales / Misc",
    desks: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
};

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
  "Desk 4": "Arjan",
  "Desk 8": "Erick",
  "Desk 9": "Rowan",
  "Desk 10": "Anniek",
};

const state = {
  selectedDate: "",
  selectedOffice: "office-1",
  selectedDesk: null,
  reservations: {},
};

const els = {
  dateInput: document.querySelector("#booking-date"),
  officeTabs: document.querySelectorAll(".office-tab"),
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

function getDeskIdsForOffice() {
  return OFFICES[state.selectedOffice].desks.map((deskNumber) => `Desk ${deskNumber}`);
}

function getDayReservations() {
  return state.reservations || {};
}

function getReservation(deskId) {
  return getDayReservations()[deskId] || null;
}

function getAssignedPerson(deskId) {
  return ASSIGNED_DESKS[deskId] || null;
}

function getDeskStatusLabel(deskId) {
  const assignedPerson = getAssignedPerson(deskId);
  const reservation = getReservation(deskId);

  if (assignedPerson) {
    return `Assigned to ${assignedPerson}`;
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

  els.selectedLabel.textContent = deskId;
  els.deskId.value = deskId;
  els.deskChoice.value = deskId;
  els.reserveButton.disabled = Boolean(reservation) || Boolean(assignedPerson);
  els.formTitle.textContent = assignedPerson
    ? `${deskId} is assigned`
    : reservation
      ? `${deskId} is reserved`
      : `Reserve ${deskId}`;
  els.formHelper.textContent = assignedPerson
    ? `Assigned to ${assignedPerson}.`
    : reservation
      ? "Current booking."
      : "Reservation details.";

  if (assignedPerson || reservation) {
    els.detailName.textContent = assignedPerson || reservation.name;
    els.detailTeam.textContent = assignedPerson ? "Assigned desk" : reservation.team || "Not specified";
    els.detailTime.textContent = assignedPerson ? "Always" : reservation.time;
    els.bookingDetails.hidden = false;
    els.cancelButton.hidden = Boolean(assignedPerson);
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
  const isSelected = state.selectedDesk === deskId;
  const button = document.createElement("button");
  const deskNumber = deskId.replace("Desk ", "");

  button.type = "button";
  button.className = [
    "desk",
    reservation ? "is-reserved" : "",
    assignedPerson ? "is-unavailable" : "",
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
      : reservation
        ? `${deskId}, reserved by ${reservation.name}`
        : `${deskId}, available`
  );
  button.addEventListener("click", () => selectDesk(deskId));

  button.innerHTML = `
    <span class="desk-number">${deskNumber}</span>
    ${assignedPerson ? `<span class="desk-person">${escapeHtml(assignedPerson)}</span>` : ""}
    ${reservation ? `<span class="desk-person">${escapeHtml(reservation.name)}</span>` : ""}
    <span class="desk-status">${assignedPerson ? "Assigned" : reservation ? "Reserved" : "Available"}</span>
  `;

  return button;
}

function renderList() {
  const officeDeskIds = getDeskIdsForOffice();
  const dayReservations = getDayReservations();
  const assignedRows = officeDeskIds
    .filter((deskId) => getAssignedPerson(deskId))
    .map((deskId) => [deskId, { name: getAssignedPerson(deskId), team: "Assigned desk", time: "Always" }]);
  const reservationRows = Object.entries(dayReservations).filter(([deskId]) => {
    return officeDeskIds.includes(deskId) && !getAssignedPerson(deskId);
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

function renderOfficeTabs() {
  els.officeTabs.forEach((tab) => {
    const active = tab.dataset.office === state.selectedOffice;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function renderDeskChoices() {
  const currentValue = state.selectedDesk || "";
  els.deskChoice.innerHTML = '<option value="">Select a desk</option>';

  getDeskIdsForOffice().forEach((deskId) => {
    const option = document.createElement("option");
    option.value = deskId;
    option.textContent = `${deskId} - ${getDeskStatusLabel(deskId)}`;
    els.deskChoice.append(option);
  });

  els.deskChoice.value = currentValue;
}

function render() {
  const office = OFFICES[state.selectedOffice];
  const officeDeskIds = getDeskIdsForOffice();
  const dayReservations = getDayReservations();
  const reservedCount = officeDeskIds.filter((deskId) => dayReservations[deskId]).length;
  const assignedCount = officeDeskIds.filter((deskId) => getAssignedPerson(deskId)).length;
  const availableCount = officeDeskIds.length - reservedCount - assignedCount;

  renderOfficeTabs();
  renderDeskChoices();
  els.mapDateLabel.textContent = `${office.name} availability for ${formatDisplayDate(state.selectedDate)}.`;
  els.availableCount.textContent = availableCount;
  els.reservedCount.textContent = reservedCount + assignedCount;
  els.selectedLabel.textContent = state.selectedDesk || "-";
  els.reservationListTitle.textContent = `${office.name} reservations for this date`;
  els.emptyState.textContent = `All ${officeDeskIds.length} desks in ${office.name} are available for the selected date.`;
  els.deskGrid.innerHTML = "";

  officeDeskIds.forEach((deskId) => {
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

els.officeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.selectedOffice = tab.dataset.office;
    resetSelection();
    render();
  });
});

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

  if (!state.selectedDesk || getReservation(state.selectedDesk) || getAssignedPerson(state.selectedDesk)) {
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
  const officeDeskIds = getDeskIdsForOffice();

  for (const deskId of officeDeskIds) {
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
