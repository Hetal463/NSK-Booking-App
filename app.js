const userType = localStorage.getItem("userType");
const mobile = localStorage.getItem("mobile");
const sport = localStorage.getItem("sport");
document.getElementById("userType").innerText = userType;

const prices = {
  pickleball: 800,
  cricket: 1000
};

const maxQuota = 30;
const monthKey = new Date().toISOString().slice(0, 7); // "2025-06"
const quotaKey = `quota-${mobile}-${monthKey}`;
const usedHours = parseInt(localStorage.getItem(quotaKey)) || 0;

const today = new Date().toISOString().slice(0, 10); // "2025-06-18"
const bookingKey = `bookings-${today}-${sport}`;
const existingBookings = JSON.parse(localStorage.getItem(bookingKey)) || [];

document.getElementById("price").innerText = prices[sport];
document.getElementById("sportTitle").innerText =
  sport === "pickleball" ? "Pickleball Court Booking" : "Box Cricket Turf Booking";

if (userType === "member" && sport === "pickleball") {
  document.getElementById("quotaInfo").innerText = `Quota Used: ${usedHours} / ${maxQuota} hours`;
}

let selectedSlots = [];

function renderSlots() {
  const container = document.getElementById("slotsContainer");
  for (let i = 8; i <= 22; i++) {
    const slot = `${i}:00 - ${i + 1}:00`;
    const slotId = `slot-${i}`;
    const isBooked = existingBookings.includes(slot);

    container.innerHTML += `
      <div>
        <input type="checkbox" id="${slotId}" ${isBooked ? "disabled" : ""} onclick="toggleSlot('${slot}')" />
        <label for="${slotId}" style="${isBooked ? 'color:gray;text-decoration:line-through;' : ''}">${slot}</label>
      </div>`;
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
  const total = prices[sport] * selectedSlots.length;
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
    localStorage.setItem(quotaKey, newHours);
  }

  // Save bookings
  const updatedBookings = [...existingBookings, ...selectedSlots];
  localStorage.setItem(bookingKey, JSON.stringify(updatedBookings));

  // Redirect/pay/send
  if (userType === "non-member") {
    alert(`Redirecting to payment: ₹${total}`);
    window.open(`https://rzp.io/l/YOUR_PAYMENT_LINK`, "_blank");
  } else {
    alert(`Booking confirmed for ${selectedSlots.length} hour(s).`);
  }

  sendWhatsApp();
}

function sendWhatsApp() {
  const msg = `Hi, your booking for ${sport} (${selectedSlots.join(", ")}) on ${today} is confirmed at Nashik Sports Klub.`;
  const waURL = `https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`;
  window.open(waURL, "_blank");
}

renderSlots();
updateQuotaCheck();
