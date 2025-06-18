const userType = localStorage.getItem("userType");
const mobile = localStorage.getItem("mobile");
const sport = localStorage.getItem("sport");
document.getElementById("userType").innerText = userType;

const prices = { pickleball: 800, cricket: 1000 };
const maxQuota = 30;
const todayStr = new Date().toISOString().split("T")[0];
const monthKey = new Date().toISOString().slice(0, 7);
const quotaKey = `quota-${mobile}-${monthKey}`;
let usedHours = parseInt(localStorage.getItem(quotaKey)) || 0;

let selectedSlots = [];
let selectedDate = todayStr;
let existingBookings = {};

document.getElementById("price").innerText = prices[sport];
document.getElementById("sportTitle").innerText =
  sport === "pickleball" ? "Pickleball Court Booking" : "Box Cricket Turf Booking";
document.getElementById("bookingDate").min = todayStr;
document.getElementById("bookingDate").value = todayStr;

function onDateChange() {
  selectedDate = document.getElementById("bookingDate").value;
  selectedSlots = [];
  loadBookingsFromFirebase();
}

function loadBookingsFromFirebase() {
  const ref = db.ref(`bookings/${selectedDate}/${sport}`);
  ref.once('value', snapshot => {
    existingBookings = snapshot.val() || {};
    renderSlots();
    updateQuotaCheck();
  });
}

function renderSlots() {
  const container = document.getElementById("slotsContainer");
  container.innerHTML = '';
  for (let i = 8; i <= 22; i++) {
    const slot = `${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`;
    const slotId = `slot-${i}`;
    const isBooked = existingBookings[slot];

    container.innerHTML += `
      <div>
        <input type="checkbox" id="${slotId}" ${isBooked ? "disabled" : ""} onclick="toggleSlot('${slot}')" />
        <label for="${slotId}" style="${isBooked ? 'color:gray;text-decoration:line-through;' : ''}">
          ${slot} ${isBooked ? `(Booked)` : ""}
        </label>
      </div>`;
  }

  if (userType === "member" && sport === "pickleball") {
    document.getElementById("quotaInfo").innerText = `Quota Used: ${usedHours} / ${maxQuota} hours`;
  }
}

function toggleSlot(slot) {
  if (selectedSlots.includes(slot)) {
    selectedSlots = selectedSlots.filter(s => s !== slot);
  } else {
    selectedSlots.push(slot);
  }
  updateQuotaCheck();
}

function updateQuotaCheck() {
  if (userType === "member" && sport === "pickleball") {
    const totalHours = usedHours + selectedSlots.length;
    const quotaInfo = document.getElementById("quotaInfo");
    quotaInfo.innerText = `Quota Used: ${usedHours} / ${maxQuota} hours`;

    const confirmBtn = document.getElementById("confirmBtn");
    if (totalHours > maxQuota) {
      quotaInfo.innerText += " ⚠️ Over quota!";
      confirmBtn.disabled = true;
      confirmBtn.innerText = "Quota Exceeded";
    } else {
      confirmBtn.disabled = false;
      confirmBtn.innerText = "Confirm Booking";
    }
  }
}

function confirmBooking() {
  if (selectedSlots.length === 0) {
    alert("Please select at least one slot.");
    return;
  }

  if (userType === "member" && sport === "pickleball") {
    const newHours = usedHours + selectedSlots.length;
    if (newHours > maxQuota) {
      alert("Booking exceeds your monthly quota.");
      return;
    }
    usedHours = newHours;
    localStorage.setItem(quotaKey, usedHours);
  }

  const updates = {};
  selectedSlots.forEach(slot => {
    updates[`bookings/${selectedDate}/${sport}/${slot}`] = mobile;
  });

  db.ref().update(updates, error => {
    if (error) {
      alert("Booking failed. Please try again.");
    } else {
      alert("Booking confirmed!");
      sendWhatsApp();
    }
  });
}

function sendWhatsApp() {
  const msg = `Hi, your booking for ${sport} (${selectedSlots.join(", ")}) on ${selectedDate} is confirmed at Nashik Sports Klub.`;
  const waURL = `https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`;
  window.open(waURL, "_blank");
}

onDateChange(); // initial load
