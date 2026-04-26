const DESK_COUNT = 12;
const DESK_POSITIONS = [
  { left: 20.2, top: 44.5 },
  { left: 26.7, top: 44.5 },
  { left: 20.2, top: 67.1 },
  { left: 26.7, top: 67.1 },
  { left: 46.9, top: 44.5 },
  { left: 56.5, top: 44.5 },
  { left: 46.9, top: 67.1 },
  { left: 56.5, top: 67.1 },
  { left: 76.2, top: 44.5 },
  { left: 84.3, top: 44.5 },
  { left: 76.2, top: 67.1 },
  { left: 84.3, top: 67.1 },
];
const UNAVAILABLE_UNTIL = "2026-08-01";
const TEMPORARILY_UNAVAILABLE_DESKS = new Set(["Desk 1", "Desk 2", "Desk 3", "Desk 4"]);

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

function isTemporarilyUnavailable(deskId) {
  return TEMPORARILY_UNAVAILABLE_DESKS.has(deskId) && state.selectedDate < UNAVAILABLE_UNTIL;
}

function selectDesk(deskId) {
  state.selectedDesk = deskId;
  const reservation = getReservation(deskId);
  const unavailable = isTemporarilyUnavailable(deskId);

  els.selectedLabel.textContent = deskId;
  els.deskId.value = deskId;
  els.reserveButton.disabled = Boolean(reservation) || unavailable;
  els.formTitle.textContent = reservation
    ? `${deskId} is reserved`
    : unavailable
      ? `${deskId} is unavailable`
      : `Reserve ${deskId}`;
  els.formHelper.textContent = unavailable
    ? "Available again from 1 August."
    : reservation
      ? "Current booking."
      : "Reservation details.";

  if (reservation) {
    els.detailName.textContent = reservation.name;
    els.detailTeam.textContent = reservation.team || "Not specified";
    els.detailTime.textContent = reservation.time;
    els.bookingDetails.hidden = false;
  } else {
    els.bookingDetails.hidden = true;
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

function renderDesk(deskNumber) {
  const deskId = `Desk ${deskNumber}`;
  const reservation = getReservation(deskId);
  const unavailable = isTemporarilyUnavailable(deskId);
  const isSelected = state.selectedDesk === deskId;
  const button = document.createElement("button");

  button.type = "button";
  button.className = [
    "desk",
    reservation ? "is-reserved" : "",
    unavailable ? "is-unavailable" : "",
    isSelected ? "is-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  button.style.left = `${DESK_POSITIONS[deskNumber - 1].left}%`;
  button.style.top = `${DESK_POSITIONS[deskNumber - 1].top}%`;
  button.setAttribute("role", "listitem");
  button.setAttribute(
    "aria-label",
    unavailable
      ? `${deskId}, unavailable until 1 August`
      : reservation
      ? `${deskId}, reserved by ${reservation.name}`
      : `${deskId}, available`
  );
  button.addEventListener("click", () => selectDesk(deskId));

  button.innerHTML = `
    <span class="desk-number">${deskNumber}</span>
    ${reservation ? `<span class="desk-person">${escapeHtml(reservation.name)}</span>` : ""}
    <span class="desk-status">${unavailable ? "Until Aug" : reservation ? "Reserved" : "Available"}</span>
  `;

  return button;
}

function renderList() {
  const reservations = Object.entries(getDayReservations()).sort(([a], [b]) => {
    return Number(a.replace("Desk ", "")) - Number(b.replace("Desk ", ""));
  });

  els.emptyState.hidden = reservations.length > 0;
  els.reservationItems.innerHTML = "";

  reservations.forEach(([deskId, reservation]) => {
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

function render() {
  const dayReservations = getDayReservations();
  const reservedCount = Object.keys(dayReservations).length;
  const unavailableCount = Array.from(TEMPORARILY_UNAVAILABLE_DESKS).filter((deskId) => {
    return isTemporarilyUnavailable(deskId) && !dayReservations[deskId];
  }).length;

  els.mapDateLabel.textContent = `Availability for ${formatDisplayDate(state.selectedDate)}.`;
  els.availableCount.textContent = DESK_COUNT - reservedCount - unavailableCount;
  els.reservedCount.textContent = reservedCount + unavailableCount;
  els.selectedLabel.textContent = state.selectedDesk || "-";
  els.emptyState.textContent =
    unavailableCount > 0
      ? `${unavailableCount} desks are unavailable until August. The remaining desks are available for this date.`
      : "All 12 desks are available for the selected date.";
  els.deskGrid.innerHTML = "";

  for (let deskNumber = 1; deskNumber <= DESK_COUNT; deskNumber += 1) {
    els.deskGrid.append(renderDesk(deskNumber));
  }

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

els.dateInput.addEventListener("change", async () => {
  state.selectedDate = els.dateInput.value;
  state.selectedDesk = null;
  els.form.reset();
  els.reserveButton.disabled = true;
  els.formTitle.textContent = "Reserve a desk";
  els.formHelper.textContent = "No desk selected.";
  els.bookingDetails.hidden = true;
  await loadDayReservations();
  render();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.selectedDesk || getReservation(state.selectedDesk)) {
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
  if (!state.selectedDesk) {
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
  const payload = await apiRequest("/api/reservations", {
    method: "DELETE",
    body: JSON.stringify({
      date: state.selectedDate,
    }),
  });
  state.reservations = payload.reservations;
  state.selectedDesk = null;
  els.form.reset();
  els.reserveButton.disabled = true;
  els.formTitle.textContent = "Reserve a desk";
  els.formHelper.textContent = "No desk selected.";
  els.bookingDetails.hidden = true;
  render();
});

els.dateInput.value = formatDateForInput();
state.selectedDate = els.dateInput.value;
loadDayReservations().then(render).catch((error) => {
  els.formHelper.textContent = error.message;
  render();
});
