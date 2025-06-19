// Firebase config
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

const MANAGER_PASSWORD = "nskadmin123";
const today = new Date().toISOString().split("T")[0];
document.getElementById("viewDate").value = today;

// Verify manager access
function verifyPassword() {
  const input = document.getElementById("adminPass").value;
  if (input === MANAGER_PASSWORD) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadBookings();
  } else {
    alert("Incorrect password.");
  }
}

// Load bookings by date
function loadBookings() {
  const date = document.getElementById("viewDate").value;
  const sports = ["pickleball", "cricket"];
  let csv = [["Sport", "Slot", "Mobile"]];
  let html = "";

  sports.forEach(sport => {
    db.ref(`bookings/${date}/${sport}`).once("value", snap => {
      const data = snap.val();
      html += `<h3>${sport.toUpperCase()}</h3><ul>`;
      if (data) {
        for (const slot in data) {
          const mobile = data[slot];
          html += `<li><strong>${slot}</strong> – ${mobile}</li>`;
          csv.push([sport, slot, mobile]);
        }
      } else {
        html += `<li>No bookings</li>`;
      }
      html += "</ul>";
      document.getElementById("results").innerHTML = html;
      window.managerCSV = csv;
    });
  });
}

// Export bookings to CSV
function exportCSV() {
  const csvText = window.managerCSV.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvText], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NSK_Bookings_${document.getElementById("viewDate").value}.csv`;
  a.click();
}

// Bind date picker
document.getElementById("viewDate").addEventListener("change", loadBookings);

