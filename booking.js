// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCYCvgKtc_EWI2QHuaLTkxNp0S7bq3BPgo",
  authDomain: "nsk-app-cbb07.firebaseapp.com",
  projectId: "nsk-app-cbb07",
  storageBucket: "nsk-app-cbb07.appspot.com",
  messagingSenderId: "1012343800963",
  appId: "1:1012343800963:web:4b695a8a871fe42fc2c7b6",
  measurementId: "G-EQQMSMX3MQ"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
const startHour = 7;
const endHour = 23;
const price = 800;
let selectedSlots = [];

function formatTime(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function getDatesForWeek() {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function renderGrid() {
  const grid = document.getElementById("slotGrid");
  const dates = getDatesForWeek();
  let html = `<table><thead><tr><th>Time</th>`;
  dates.forEach(d => {
    html += `<th>${d}</th>`;
  });
  html += `</tr></thead><tbody>`;

  for (let hour = startHour; hour <= endHour; hour++) {
    html += `<tr><td>${formatTime(hour)}</td>`;
    dates.forEach(date => {
      const slotId = `${date}-${hour}`;
      html += `<td class="slot" id="${slotId}" onclick="toggleSlot('${slotId}')">₹${price}</td>`;
    });
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  grid.innerHTML = html;
}

function toggleSlot(id) {
  const el = document.getElementById(id);
  if (el.classList.contains('booked')) return;

  if (selectedSlots.includes(id)) {
    selectedSlots = selectedSlots.filter(s => s !== id);
    el.classList.remove('selected');
  } else {
    selectedSlots.push(id);
    el.classList.add('selected');
  }
  updateSummary();
}

function updateSummary() {
  const summary = document.getElementById("summaryDetails");
  const total = selectedSlots.length * price;
  document.getElementById("totalAmount").textContent = total;
  summary.innerHTML = selectedSlots.map(s => `<div>${s.replace('-', ' at ')}</div>`).join("");
}

function proceedToPay() {
  const name = document.getElementById("userName").value;
  const phone = document.getElementById("userPhone").value;
  const total = selectedSlots.length * price;

  if (!name || !phone || total === 0) {
    alert("Fill all fields and select at least one slot.");
    return;
  }

  const options = {
    key: "rzp_test_YourKeyHere",
    amount: total * 100,
    currency: "INR",
    name: "Nashik Sports Klub",
    description: "Slot Booking",
    handler: function (response) {
      const bookingData = {
        name,
        phone,
        slots: selectedSlots,
        total,
        timestamp: new Date(),
        paymentId: response.razorpay_payment_id
      };
      db.collection("bookings").add(bookingData);
      window.open(`https://wa.me/91${phone}?text=Thank you ${name}, your booking is confirmed for ${selectedSlots.join(", ")}`, '_blank');
    },
    prefill: {
      name,
      contact: phone
    }
  };
  new Razorpay(options).open();
}

auth.onAuthStateChanged(user => {
  if (user) {
    const phone = user.phoneNumber;
    db.collection("users").doc(phone).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("userName").value = data.name;
        document.getElementById("userPhone").value = phone;
      } else {
        const name = prompt("Enter your name to complete registration:");
        db.collection("users").doc(phone).set({ name });
        document.getElementById("userName").value = name;
        document.getElementById("userPhone").value = phone;
      }
      document.getElementById("loader").style.display = 'none';
      document.getElementById("mainContent").style.display = 'flex';
      renderGrid();
    });
  } else {
    window.location.href = "login.html";
  }
});
