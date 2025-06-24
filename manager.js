// Firebase init
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

const courts = ['Court_1', 'Court_2', 'Court_3', 'Court_4'];
const turfs = ['Turf_1', 'Turf_2'];
const ADMIN_PASS = "nskadmin123";

document.getElementById("viewDate").value = new Date().toISOString().split("T")[0];

function verifyPassword() {
  const input = document.getElementById("adminPass").value;
  if (input === ADMIN_PASS) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadBookings();
  } else {
    alert("Incorrect password");
  }
}

function loadBookings() {
  const date = document.getElementById("viewDate").value;
  const sports = { Pickleball: courts, Cricket: turfs };
  const resultsDiv = document.getElementById("results");
  let html = "";
  let csv = [["Sport", "Court/Turf", "Time", "Mobile"]];

  Object.entries(sports).forEach(([sport, facilities]) => {
    html += `<h3>${sport}</h3>`;
    facilities.forEach(facility => {
      db.ref(`bookings/${date}`).once("value", snap => {
        let found = false;
        html += `<strong>${facility.replace('_', ' ')}:</strong><ul>`;
        timeLoop: for (let h = 7; h <= 22; h++) {
          const time = `${h.toString().padStart(2, '0')}:00`;
          const data = snap.val()?.[time]?.[facility];
          if (data) {
            html += `<li>${time} – ${data.phone || 'unknown'}</li>`;
            csv.push([sport, facility, time, data.phone || '']);
            found = true;
          }
        }
        if (!found) html += "<li>No bookings</li>";
        html += `</ul>`;
        resultsDiv.innerHTML = html;
        window.managerCSV = csv;
      });
    });
  });
}

function exportCSV() {
  const rows = window.managerCSV;
  const csvContent = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NSK_Bookings_${document.getElementById("viewDate").value}.csv`;
  a.click();
}
