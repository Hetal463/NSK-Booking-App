// === Firebase Init ===
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

// === Constants ===
const PRICE = 800;
const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
const courtList = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];

let selectedSlots = [];

function getWeekDates() {
  const today = new Date();
  const start = new Date(today.setDate(today.getDate() - today.getDay()));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDate(dateObj) {
  return `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2,'0')}-${dateObj.getDate().toString().padStart(2,'0')}`;
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
    div.innerText = `${s.date} | ${s.time} | ${s.court}`;
    cart.appendChild(div);
  });
  document.getElementById('cartTotal').innerText = selectedSlots.length * PRICE;
}

function proceedToSummary() {
  const list = document.getElementById('summaryList');
  list.innerHTML = '';
  selectedSlots.forEach(s => {
    const li = document.createElement('li');
    li.innerText = `${s.date} – ${s.time} – ${s.court}`;
    list.appendChild(li);
  });
  document.getElementById('summaryTotal').innerText = selectedSlots.length * PRICE;
  document.getElementById('summaryPanel').classList.remove('hidden');
}

function confirmBooking() {
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  if (!name || !phone) return alert("Please fill name and mobile");

  const gst = document.getElementById('includeGST').checked;
  const total = selectedSlots.length * PRICE;

  selectedSlots.forEach(s => {
    const ref = db.ref(`bookings/${s.date}/${s.time}/${s.court.replace(' ', '_')}`);
    ref.set({ name, phone, paid: total, gst });
  });

  const msg = `✅ *Booking Confirmed!*\n👤 ${name}\n📱 ${phone}\n🗓️ Slots:\n` +
    selectedSlots.map(s => `• ${s.date} – ${s.time} – ${s.court}`).join('\n') +
    `\n💰 Total: ₹${total}`;

  const options = {
    key: "rzp_test_YourKeyHere", // 🔁 Replace with your live key
    amount: total * 100,
    currency: "INR",
    name: "Nashik Sports Klub",
    description: "Court Booking",
    prefill: { name, contact: phone },
    handler: () => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
      alert("Booking confirmed!");
      window.location.href = "home.html";
    }
  };
  new Razorpay(options).open();
}

function buildGrid() {
  const grid = document.getElementById("slotGrid");
  grid.innerHTML = '';

  const weekDates = getWeekDates();
  const dateLabels = weekDates.map(d => d.toDateString());

  document.getElementById("week-date-range").innerText =
    `${dateLabels[0]} – ${dateLabels[6]}`;

  // Build header row
  grid.appendChild(document.createElement('div')); // empty corner
  weekDates.forEach(d => {
    const header = document.createElement('div');
    header.className = 'slot-header';
    header.innerText = d.toDateString().split(' ').slice(0, 2).join(' ');
    grid.appendChild(header);
  });

  // Fetch all bookings first
  const fetches = [];
  weekDates.forEach(date => {
    const dateKey = formatDate(date);
    timeSlots.forEach(time => {
      courtList.forEach(court => {
        fetches.push(
          db.ref(`bookings/${dateKey}/${time}/${court.replace(' ', '_')}`).once('value')
            .then(snap => ({ key: `${dateKey}-${time}-${court}`, booked: snap.exists() }))
        );
      });
    });
  });

  Promise.all(fetches).then(results => {
    const bookedMap = {};
    results.forEach(res => bookedMap[res.key] = res.booked);

    timeSlots.forEach(time => {
      const timeDiv = document.createElement('div');
      timeDiv.className = 'slot-time';
      timeDiv.innerText = time;
      grid.appendChild(timeDiv);

      weekDates.forEach(date => {
        const dateKey = formatDate(date);
        const cell = document.createElement('div');
        const court = getCourtForDay(date.getDay());
        const key = `${dateKey}-${time}-${court}`;
        const isBooked = bookedMap[key];

        cell.className = isBooked ? 'slot-cell booked' : 'slot-cell available';
        cell.innerText = isBooked ? 'Booked' : `₹${PRICE}\n1 left`;

        if (!isBooked) {
          cell.onclick = () => {
            const already = selectedSlots.find(s =>
              s.date === dateKey && s.time === time && s.court === court
            );
            if (already) {
              selectedSlots = selectedSlots.filter(s =>
                !(s.date === dateKey && s.time === time && s.court === court)
              );
              cell.classList.remove('selected');
            } else {
              selectedSlots.push({ date: dateKey, time, court });
              cell.classList.add('selected');
            }
            updateCartUI();
          };
        }

        grid.appendChild(cell);
      });
    });
  });
}

function getCourtForDay(dayIndex) {
  // Optional: rotate between courts, or keep as Court 1–4 shown
  return courtList[dayIndex % 4];
}

window.onload = buildGrid;
