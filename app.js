const userType = localStorage.getItem("userType");
const mobile = localStorage.getItem("mobile");
const sport = localStorage.getItem("sport");
document.getElementById("userType").innerText = userType;

const prices = {
  pickleball: 800,
  cricket: 1000
};

const sportTitle = sport === "pickleball" ? "Pickleball Court Booking" : "Box Cricket Turf Booking";
document.getElementById("sportTitle").innerText = sportTitle;
document.getElementById("price").innerText = prices[sport];

let selectedSlots = [];

function renderSlots() {
  const container = document.getElementById("slotsContainer");
  for (let i = 8; i <= 22; i++) {
    const slot = `${i}:00 - ${i+1}:00`;
    const slotId = `slot-${i}`;
    container.innerHTML += `
      <div>
        <input type="checkbox" id="${slotId}" onclick="toggleSlot('${slot}')" />
        <label for="${slotId}">${slot}</label>
      </div>`;
  }
}

function toggleSlot(slot) {
  if (selectedSlots.includes(slot)) {
    selectedSlots = selectedSlots.filter(s => s !== slot);
  } else {
    selectedSlots.push(slot);
  }
}

function confirmBooking() {
  const total = prices[sport] * selectedSlots.length;
  if (userType === "member" && sport === "pickleball") {
    alert(`Booking confirmed for ${selectedSlots.length} hour(s). No payment needed.`);
    sendWhatsApp();
  } else {
    alert(`Redirecting to payment: ₹${total}`);
    window.open(`https://rzp.io/l/YOUR_PAYMENT_LINK`, "_blank");
    sendWhatsApp();
  }
}

function sendWhatsApp() {
  const msg = `Hi, your booking for ${sport} (${selectedSlots.join(", ")}) is confirmed at Nashik Sports Klub.`;
  const waURL = `https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`;
  window.open(waURL, "_blank");
}

renderSlots();

