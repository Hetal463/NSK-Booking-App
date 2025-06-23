// === Firebase Init ===
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
const db = firebase.database();

// === Constants ===
const PRICE = 800;
const timeSlots = [];
for (let h = 7; h <= 22; h++) timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];

let selectedSlots = [];

// === Helpers ===
function getWeekDates() {
  const today = new Date();
  const start = new Date(today.setDate(today.getDate() - today.getDay()));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(new Date(d));
  }
  return dates;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
}

function updateCartUI() {
  const cart = document.getElementById('cartSummary');
  const cartBar = document.getElementById('cartBar');
  cart.innerHTML = '';
  if (selectedSlots.length === 0) {
    cartBar.classList.add('hidden');
    return;
  }
  cartBar.classList.remove('hidden');
  selectedSlots.forEach(s => {
    const div = document.createElement('div');
    div.innerText = `${s.time} | ${s.date} | ${s.court}`;
    cart.appendChild(div);
  });
  document.getElementById('cartTotal').innerText = selectedSlots.length * PRICE;
}

function proceedToSummary() {
  const list = document.getElementById('summaryList');
  list.innerHTML = '';
  selectedSlots.forEach(s => {
    const li = document.createElement('li');
    li.innerText = `${s.court} — ${s.date} at ${s.time}`;
    list.appendChild(li);
  });
  document.getElementById('summaryTotal').innerText = selectedSlots.length * PRICE;
  document.getElementById('summaryPanel').classList.remove('hidden');
}

function confirmBooking() {
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  if (!name || !phone) return alert("Please enter all details");

  const gst = document.getElementById('includeGST').checked;
  const total = selectedSlots.length * PRICE;

  // === Save Booking to Firebase ===
  selectedSlots.forEach(s => {
    const ref = db.ref(`bookings/${s.date}/${s.time}/${s.court.replace(' ', '_')}`);
    ref.set({ name, phone, paid: total, gst });
  });

  // === Razorpay ===
  const options = {
    key: "rzp_test_dummyKEY123456789", // REPLACE with live key
    amount: total * 100,
    currency: "INR",
    name: "NSK Pickleball",
    description: "Slot Booking",
    handler: function () {
      // === WhatsApp Message ===
      const msg = `Booking Confirmed!\nName: ${name}\nPhone: ${phone}\nSlots:\n` +
        selectedSlots.map(s => `${s.date} – ${s.time} – ${s.court}`).join('\n') +
        `\nAmount Paid: ₹${total}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
      alert("Booking confirmed!");
      window.location.href = "home.html";
    },
    prefill: {
      name: name,
      contact: phone
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// === Build Grid ===
function buildGrid() {
  const grid = document.getElementById('slotGrid');
  grid.innerHTML = '';

  const dates = getWeekDates();
  document.getElementById('week-date-range').innerText =
    `${dates[0].toDateString()} - ${dates[6].toDateString()}`;

  // Headers
  grid.appendChild(document.createElement('div')); // empty corner
  for (let d = 0; d < 7; d++) {
    const head = document.createElement('div');
    head.className = 'slot-header';
    head.innerText = days[dates[d].getDay()] + `\n${dates[d].getDate()}`;
    grid.appendChild(head);
  }

  timeSlots.forEach(time => {
    // Time column
    const timeDiv = document.createElement('div');
    timeDiv.className = 'slot-time';
    timeDiv.innerText = time;
    grid.appendChild(timeDiv);

    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'slot-cell available';
      const dateKey = formatDateKey(dates[d]);
      cell.innerText = `₹${PRICE}\n1 left`;
      cell.onclick = () => {
        const key = `${dateKey}-${time}-Court 1`; // Only 1 court shown now
        const already = selectedSlots.find(s => s.key === key);
        if (already) {
          selectedSlots = selectedSlots.filter(s => s.key !== key);
          cell.classList.remove('selected');
        } else {
          selectedSlots.push({ key, date: dateKey, time, court: 'Court 1' });
          cell.classList.add('selected');
        }
        updateCartUI();
      };

      // Fetch booked slots
      const ref = db.ref(`bookings/${dateKey}/${time}/Court_1`);
      ref.once('value', snap => {
        if (snap.exists()) {
          cell.className = 'slot-cell booked';
          cell.innerText = 'Booked';
          cell.onclick = null;
        }
      });

      grid.appendChild(cell);
    }
  });
}

// === Init ===
window.onload = () => {
  buildGrid();
};
