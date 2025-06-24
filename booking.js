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
const auth = firebase.auth();
const db = firebase.firestore();

let userName = "";
let userPhone = "";
let userUID = "";

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("You are not logged in");
    window.location.href = "login.html";
    return;
  }
  userUID = user.uid;
  userPhone = user.phoneNumber;

  const userDoc = db.collection("users").doc(userUID);
  const snap = await userDoc.get();

  if (!snap.exists()) {
    const namePrompt = prompt("Welcome! Please enter your full name:");
    if (namePrompt) {
      await userDoc.set({
        name: namePrompt,
        phone: userPhone,
        createdAt: new Date()
      });
      userName = namePrompt;
    } else {
      alert("Name required.");
      return;
    }
  } else {
    const data = snap.data();
    userName = data.name || "";
  }

  document.getElementById("fullName").value = userName;
  document.getElementById("mobileNumber").value = userPhone;

  loadSlotGrid();
});

let selectedSlots = [];

function loadSlotGrid() {
  const container = document.getElementById("slotGridContainer");
  container.innerHTML = "";
  const grid = document.createElement("table");
  grid.style.width = "100%";
  grid.style.borderCollapse = "collapse";
  const startHour = 7;
  const endHour = 23;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  // Header row
  const header = grid.insertRow();
  header.insertCell().innerText = "Time";
  days.forEach(d => {
    const cell = header.insertCell();
    cell.innerText = d.toDateString().slice(0, 10);
    cell.style.fontWeight = "bold";
  });

  for (let h = startHour; h <= endHour; h++) {
    const row = grid.insertRow();
    const time = `${h.toString().padStart(2, "0")}:00`;
    row.insertCell().innerText = time;
    for (let d = 0; d < 7; d++) {
      const cell = row.insertCell();
      const slotId = `${days[d].toISOString().split("T")[0]}_${time}`;
      cell.innerText = "₹800";
      cell.style.cursor = "pointer";
      cell.style.textAlign = "center";
      cell.style.padding = "5px";
      cell.style.border = "1px solid #ccc";
      cell.id = slotId;

      db.collection("bookings").doc(slotId).get().then(doc => {
        if (doc.exists) {
          cell.innerText = "Booked";
          cell.style.backgroundColor = "#f8d7da";
          cell.style.color = "#721c24";
          cell.style.cursor = "not-allowed";
        } else {
          cell.onclick = () => toggleSlot(slotId, cell);
        }
      });
    }
  }

  container.appendChild(grid);
  document.getElementById("slotGridStatus").style.display = "none";
}

function toggleSlot(slotId, cell) {
  const index = selectedSlots.indexOf(slotId);
  if (index > -1) {
    selectedSlots.splice(index, 1);
    cell.style.backgroundColor = "";
  } else {
    selectedSlots.push(slotId);
    cell.style.backgroundColor = "#c3e6cb";
  }

  const total = selectedSlots.length * 800;
  document.getElementById("bookingTotal").innerText = `Total: ₹${total}`;
}

document.getElementById("payButton").addEventListener("click", async () => {
  if (selectedSlots.length === 0) return alert("No slots selected.");

  const amount = selectedSlots.length * 800 * 100;

  const options = {
    key: "rzp_test_YourKeyHere", // replace with your Razorpay key
    amount: amount,
    currency: "INR",
    name: "Nashik Sports Klub",
    description: "Court Booking",
    handler: async function (response) {
      for (const slot of selectedSlots) {
        await db.collection("bookings").doc(slot).set({
          name: userName,
          phone: userPhone,
          slot: slot,
          timestamp: new Date()
        });
      }

      // WhatsApp confirmation
      const msg = `Hello ${userName}, your booking is confirmed for the following slots:\n\n${selectedSlots.join("\n")}\n\n- Nashik Sports Klub`;
      const whatsappLink = `https://wa.me/${userPhone.replace("+", "")}?text=${encodeURIComponent(msg)}`;
      window.open(whatsappLink, "_blank");
      alert("Booking confirmed! Redirecting to WhatsApp.");
      window.location.href = "index.html";
    },
    prefill: {
      name: userName,
      contact: userPhone
    },
    theme: {
      color: "#708A62"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
});
