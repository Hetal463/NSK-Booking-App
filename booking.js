const firebaseConfig = {
  apiKey: "AIzaSyCYCvgKtc_EWI2QHuaLTkxNp0S7bq3BPgo",
  authDomain: "nsk-app-cbb07.firebaseapp.com",
  projectId: "nsk-app-cbb07",
  storageBucket: "nsk-app-cbb07.appspot.com",
  messagingSenderId: "1012343800963",
  appId: "1:1012343800963:web:4b695a8a871fe42fc2c7b6",
  databaseURL: "https://nsk-app-cbb07-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const startHour = 7;
const endHour = 23;
const courtCount = 4;
const price = 800;

const table = document.getElementById("slotTable");
const summaryList = document.getElementById("summaryList");
const totalPrice = document.getElementById("totalPrice");

const selectedSlots = [];

const today = new Date();
const weekdays = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  return d;
});

function formatTime(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function renderTable() {
  let html = "<tr><th>Time</th>";
  weekdays.forEach(d => {
    html += `<th>${d.toDateString().slice(0, 10)}</th>`;
  });
  html += "</tr>";

  for (let hour = startHour; hour < endHour; hour++) {
    html += `<tr><td>${formatTime(hour)}</td>`;
    weekdays.forEach(date => {
      const slotId = `${formatDate(date)}_${hour}`;
      html += `<td id="${slotId}" class="available">₹${price}<br><small>1 left</small></td>`;
    });
    html += "</tr>";
  }

  table.innerHTML = html;
  document.getElementById("gridStatus").innerText = "";

  document.querySelectorAll(".available").forEach(cell => {
    cell.addEventListener("click", () => toggleSlot(cell.id));
  });

  fetchBookings();
}

function toggleSlot(id) {
  const cell = document.getElementById(id);
  if (cell.classList.contains("booked")) return;

  if (selectedSlots.includes(id)) {
    selectedSlots.splice(selectedSlots.indexOf(id), 1);
    cell.classList.remove("selected");
  } else {
    selectedSlots.push(id);
    cell.classList.add("selected");
  }

  updateSummary();
}

function updateSummary() {
  summaryList.innerHTML = "";
  selectedSlots.forEach(slot => {
    const [date, hour] = slot.split("_");
    const time = formatTime(parseInt(hour));
    summaryList.innerHTML += `<li>${date}, ${time} - ₹${price}</li>`;
  });
  totalPrice.innerText = selectedSlots.length * price;
}

function fetchBookings() {
  weekdays.forEach(date => {
    for (let hour = startHour; hour < endHour; hour++) {
      const path = `bookings/${formatDate(date)}/${hour}`;
      db.ref(path).once("value", snapshot => {
        const bookedCount = snapshot.numChildren();
        for (let court = 1; court <= bookedCount; court++) {
          const cell = document.getElementById(`${formatDate(date)}_${hour}`);
          if (cell) {
            cell.classList.remove("available");
            cell.classList.add("booked");
            cell.innerHTML = `₹${price}<br><small>0 left</small>`;
          }
        }
      });
    }
  });
}

function proceedBooking() {
  const name = document.getElementById("fullName").value.trim();
  const mobile = document.getElementById("mobileNumber").value.trim();
  if (!name || !mobile || selectedSlots.length === 0) {
    alert("Please enter details and select slots.");
    return;
  }

  const amount = selectedSlots.length * price * 100;
  const options = {
    key: "rzp_test_YourKeyHere",
    amount,
    currency: "INR",
    name: "Nasik Sports Klub",
    description: "Slot Booking",
    handler: function () {
      selectedSlots.forEach(slot => {
        const [date, hour] = slot.split("_");
        db.ref(`bookings/${date}/${hour}`).push({ name, mobile });
      });
      alert("Booking successful!");

      // WhatsApp message
      const message = `Hello ${name}, your slots are booked at Nasik Sports Klub:\n${selectedSlots.map(s => {
        const [d, h] = s.split("_");
        return `- ${d}, ${formatTime(h)}`;
      }).join("\n")}`;
      window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, "_blank");

      window.location.reload();
    },
    prefill: {
      name,
      contact: mobile
    },
    theme: {
      color: "#708A62"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
