// 1. Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyCYCvgKtc_EWI2QHuaLTkxNp0S7bq3BPgo",
  authDomain: "nsk-app-cbb07.firebaseapp.com",
  databaseURL: "https://nsk-app-cbb07-default-rtdb.firebaseio.com",
  projectId: "nsk-app-cbb07",
  storageBucket: "nsk-app-cbb07.appspot.com",
  messagingSenderId: "1012343800963",
  appId: "1:1012343800963:web:4b695a8a871fe42fc2c7b6"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 2. User & sport
const sport = localStorage.getItem("sport") || "pickleball";
const userType = localStorage.getItem("userType") || "non-member";
document.getElementById("sportLabel").innerText = sport.toUpperCase();
document.getElementById("priceLabel").innerText = sport === "pickleball" ? 800 : 1000;

// 3. Facility options
const facilitySelect = document.getElementById("facilitySelect");
facilitySelect.innerHTML = "";
const courtCount = sport === "pickleball" ? 4 : 2;
for (let i = 1; i <= courtCount; i++) {
  const opt = document.createElement("option");
  opt.value = `Court ${i}`;
  opt.innerText = `Court ${i}`;
  facilitySelect.appendChild(opt);
}

// 4. Date setup
const todayStr = new Date().toISOString().split("T")[0];
document.getElementById("bookingDate").value = todayStr;
document.getElementById("bookingDate").min = todayStr;

// 5. Timeslots
const timeSlots = [];
for (let h = 7; h < 23; h++) {
  const start = `${String(h).padStart(2, '0')}:00`;
  const end = `${String(h+1).padStart(2, '0')}:00`;
  timeSlots.push(`${start} - ${end}`);
}

// 6. Booking selection
let selectedSlots = []; // [{slot, court}]
function toggleSlot(slot, court, isBooked) {
  if (isBooked) return;
  const key = `${slot}__${court}`;
  const index = selectedSlots.findIndex(s => s.key === key);
  if (index >= 0) {
    selectedSlots.splice(index, 1);
  } else {
    selectedSlots.push({ slot, court, key });
  }
  updateSummary();
  renderSlots();
}

function updateSummary() {
  const list = document.getElementById("summaryList");
  if (selectedSlots.length === 0) {
    list.innerText = "No slots selected";
    document.getElementById("totalAmount").innerText = "0";
    return;
  }

  list.innerHTML = selectedSlots.map(s => `<div>✅ ${s.court} – ${s.slot}</div>`).join("");
  const price = sport === "pickleball" ? 800 : 1000;
  document.getElementById("totalAmount").innerText = price * selectedSlots.length;
}

// 7. Render slots from Firebase
function renderSlots() {
  const court = facilitySelect.value;
  const date = document.getElementById("bookingDate").value;
  const grid = document.getElementById("slotGrid");
  grid.innerHTML = "<p>Loading slots...</p>";

  db.ref(`bookings/${date}/${sport}/${court}`).once("value", snap => {
    const booked = snap.val() || {};
    grid.innerHTML = "";

    const table = document.createElement("table");
    table.classList.add("slot-table");

    const tbody = document.createElement("tbody");
    timeSlots.forEach(slot => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.innerText = slot;
      tr.appendChild(tdTime);

      const tdStatus = document.createElement("td");
      const isBooked = booked[slot];

      const key = `${slot}__${court}`;
      const isSelected = selectedSlots.some(s => s.key === key);

      tdStatus.className = isBooked ? "booked" : isSelected ? "selected" : "available";
      tdStatus.innerText = isBooked ? "Booked" : isSelected ? "Selected" : "Available";
      tdStatus.onclick = () => toggleSlot(slot, court, isBooked);

      tr.appendChild(tdStatus);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    grid.appendChild(table);
  });
}

renderSlots();

// 8. Confirm booking
function confirmBooking() {
  if (selectedSlots.length === 0) {
    alert("Please select at least one slot.");
    return;
  }

  const name = document.getElementById("userName").value;
  const mobile = document.getElementById("userPhone").value;
  if (!name || !mobile) return alert("Enter name and mobile");

  const date = document.getElementById("bookingDate").value;
  const price = sport === "pickleball" ? 800 : 1000;
  const total = selectedSlots.length * price;

  const updates = {};
  selectedSlots.forEach(s => {
    updates[`bookings/${date}/${sport}/${s.court}/${s.slot}`] = mobile;
  });

  const saveToFirebase = () => {
    db.ref().update(updates, err => {
      if (err) {
        alert("Booking failed.");
      } else {
        sendWhatsApp(name, mobile);
      }
    });
  };

  if (userType === "non-member") {
    const options = {
      key: "rzp_test_YourKeyHere", // Replace with your Razorpay key
      amount: total * 100,
      currency: "INR",
      name: "Nashik Sports Klub",
      description: `${sport} booking (${selectedSlots.length} slots)`,
      handler: saveToFirebase,
      prefill: { name, contact: mobile },
      theme: { color: "#708A62" }
    };
    new Razorpay(options).open();
  } else {
    saveToFirebase();
  }
}

// 9. WhatsApp confirmation
function sendWhatsApp(name, mobile) {
  const date = document.getElementById("bookingDate").value;
  const msg = `✅ *Booking Confirmed!*\n\n👤 ${name}\n📱 ${mobile}\n📅 Date: ${date}\n🏓 Sport: ${sport.toUpperCase()}\n\n⏰ Slots:\n${selectedSlots.map(s => `• ${s.court} – ${s.slot}`).join("\n")}\n\n📌 Nashik Sports Klub\nOpp. Sula Vineyards, Nashik\n\nThanks for booking!`;

  const link = `https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
}
