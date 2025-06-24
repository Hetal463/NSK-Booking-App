// Firebase Setup
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
  let html = `<table border="1" style="border-collapse: collapse; width: 100%; text-align: center;"><thead><tr><th>Time</th>`;
  dates.forEach(d => {
    const [y, m, day] = d.split("-");
    html += `<th>${day}/${m}</th>`;
  });
  html += `</tr></thead><tbody>`;

  for (let hour = startHour; hour <= endHour; hour++) {
    html += `<tr><td>${formatTime(hour)}</td>`;
    dates.forEach(date => {
      const slotId = `${date}-${hour}`;
      html += `<td id="${slotId}" class="slot" onclick="toggleSlot('${slotId}')">₹${price}</td>`;
    });
    html += `</tr>`;
  }

  html += `</tbody></table>`;
  grid.innerHTML = html;
  document.getElementById("loader").style.display = 'none';
  document.getElementById("mainContent").style.display = 'flex';
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
    alert("Please login and select at least one slot.");
    return;
  }

  const options = {
    key: "rzp_test_YourKeyHere",
    amount: total * 100,
    currency: "INR",
    name: "Nashik Sports Klub",
    description: "Slot Booking",
    handler: function (response) {
      db.collection("bookings").add({
        name,
        phone,
        slots: selectedSlots,
        total,
        paymentId: response.razorpay_payment_id,
        timestamp: new Date()
      }).then(() => {
        window.open(`https://wa.me/91${phone}?text=Hi ${name}, your slots (${selectedSlots.join(", ")}) are booked at NSK.`, "_blank");
        alert("Booking successful!");
      });
    },
    prefill: { name, contact: phone }
  };
  new Razorpay(options).open();
}

// 🔐 Wait for login and then render everything
auth.onAuthStateChanged(user => {
  if (user) {
    const phone = user.phoneNumber;
    const userDoc = db.collection("users").doc(phone);

    userDoc.get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("userName").value = data.name || "";
        document.getElementById("userPhone").value = phone;
      } else {
        const name = prompt("Enter your full name:");
        userDoc.set({ name });
        document.getElementById("userName").value = name;
        document.getElementById("userPhone").value = phone;
      }
      renderGrid();
    }).catch(err => {
      console.error("Firestore error:", err);
    });
  } else {
    window.location.href = "login.html";
  }
});
