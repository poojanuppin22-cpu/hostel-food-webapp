/* ============================================================
   Common helpers + initial data
============================================================ */

function $get(key, defVal) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defVal;
  } catch {
    return defVal;
  }
}

function $set(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Ensure storage structure is valid
(function initStorage() {
  // foods per meal
  let foods = $get("foods", null);
  if (!foods || typeof foods !== "object" || Array.isArray(foods)) {
    foods = { tiffin: [], lunch: [], dinner: [], snack: [] };
  } else {
    ["tiffin", "lunch", "dinner", "snack"].forEach(m => {
      if (!Array.isArray(foods[m])) foods[m] = [];
    });
  }
  $set("foods", foods);

  // master food list (veg / non-veg)
  if (!$get("masterFoods")) {
    const master = {
      tiffin: [
        { item: "Idli", type: "veg" },
        { item: "Dosa", type: "veg" },
        { item: "Vada", type: "veg" },
        { item: "Pongal", type: "veg" },
        { item: "Upma", type: "veg" },
        { item: "Egg Dosa", type: "non-veg" },
        { item: "Omelette", type: "non-veg" },
        { item: "Masala Dosa", type: "veg" },
        { item: "Bread Omelette", type: "non-veg" },
        { item: "Aloo Paratha", type: "veg" }
      ],
      lunch: [
        { item: "Veg Meals", type: "veg" },
        { item: "Rice + Sambar", type: "veg" },
        { item: "Veg Biryani", type: "veg" },
        { item: "Chicken Biryani", type: "non-veg" },
        { item: "Dal Tadka", type: "veg" },
        { item: "Paneer Curry", type: "veg" },
        { item: "Egg Curry Rice", type: "non-veg" },
        { item: "Curd Rice", type: "veg" },
        { item: "Tomato Rice", type: "veg" },
        { item: "Lemon Rice", type: "veg" }
      ],
      dinner: [
        { item: "Chapati Curry", type: "veg" },
        { item: "Parotta Kurma", type: "veg" },
        { item: "Veg Fried Rice", type: "veg" },
        { item: "Egg Fried Rice", type: "non-veg" },
        { item: "Chicken Curry Rice", type: "non-veg" },
        { item: "Veg Noodles", type: "veg" },
        { item: "Egg Noodles", type: "non-veg" },
        { item: "Paneer Butter Masala", type: "veg" },
        { item: "Dal Rice", type: "veg" },
        { item: "Jeera Rice", type: "veg" }
      ],
      snack: [
        { item: "Samosa", type: "veg" },
        { item: "Bajji", type: "veg" },
        { item: "Pakoda", type: "veg" },
        { item: "Sandwich", type: "veg" },
        { item: "Maggi", type: "veg" },
        { item: "Egg Puff", type: "non-veg" },
        { item: "Tea & Biscuits", type: "veg" },
        { item: "Bun", type: "veg" },
        { item: "Banana", type: "veg" },
        { item: "Mixture", type: "veg" }
      ]
    };
    $set("masterFoods", master);
  }

  if (!$get("students"))      $set("students", []);
  if (!$get("requests"))      $set("requests", []);
  if (!$get("votes"))         $set("votes", []);
  if (!$get("ratings"))       $set("ratings", []);
  if (!$get("leftover"))      $set("leftover", []);
  if (!$get("mealAttendance"))$set("mealAttendance", []);
})();

/* small util */
function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}

/* ============================================================
   LOGIN / AUTH
============================================================ */

function handleLogin() {
  const u = (document.getElementById("username") || { value: "" }).value.trim();
  const p = (document.getElementById("password") || { value: "" }).value.trim();
  if (!u || !p) return alert("Enter username & password");

  // admin login
  if (u === "admin" && p === "1234") {
    localStorage.setItem("role", "admin");
    location.href = "admin.html";
    return;
  }

  // student login
  const students = $get("students", []);
  const found = students.find(s => s.name === u && s.password === p);
  if (!found) return alert("Invalid login or not approved by admin");

  localStorage.setItem("role", "student");
  localStorage.setItem("studentName", u);
  location.href = "student.html";
}

function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("studentName");
  location.href = "index.html";
}

function prefillAdmin() {
  const u = document.getElementById("username");
  const p = document.getElementById("password");
  if (u) u.value = "admin";
  if (p) p.value = "1234";
}

/* ============================================================
   REQUEST ACCESS  (index.html)
============================================================ */

function requestAccess() {
  const name = (document.getElementById("reqName") || { value: "" }).value.trim();
  const pwd  = (document.getElementById("reqPwd")  || { value: "" }).value.trim();
  if (!name || !pwd) return alert("Enter name and password");

  const students = $get("students", []);
  const reqs     = $get("requests", []);

  if (students.some(s => s.name === name)) return alert("Already approved. Please login.");
  if (reqs.some(r => r.name === name))     return alert("You already requested. Wait for admin.");

  reqs.push({
    name,
    password: pwd,
    at: new Date().toLocaleString()
  });
  $set("requests", reqs);
  alert("Request sent to admin");
}

/* ============================================================
   ADMIN: REQUESTS + STUDENTS
============================================================ */

function renderRequests() {
  const box = document.getElementById("requestsList");
  if (!box) return;

  const reqs = $get("requests", []);
  box.innerHTML = "";

  reqs.slice().reverse().forEach((r, idxInv) => {
    const i = reqs.length - 1 - idxInv;   // real index
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${r.name}</strong>
        <span class="small-muted">(${r.at})</span>
      </div>
      <div>
        <button class="btn" onclick="approveRequest(${i})">Approve</button>
        <button class="btn secondary" onclick="rejectRequest(${i})">Reject</button>
      </div>
    `;
    box.appendChild(li);
  });
}

function approveRequest(i) {
  const reqs = $get("requests", []);
  const r = reqs.splice(i, 1)[0];
  $set("requests", reqs);

  const students = $get("students", []);
  students.push({ name: r.name, password: r.password });
  $set("students", students);

  alert(r.name + " approved as student");
  renderAdmin();
}

function rejectRequest(i) {
  const reqs = $get("requests", []);
  reqs.splice(i, 1);
  $set("requests", reqs);
  alert("Request rejected");
  renderAdmin();
}

function addStudent() {
  const name = (document.getElementById("newStudentName") || { value: "" }).value.trim();
  const pwd  = (document.getElementById("newStudentPwd")  || { value: "" }).value.trim();
  if (!name || !pwd) return alert("Enter username and password");

  const students = $get("students", []);
  if (students.some(s => s.name === name)) return alert("Student already exists");

  students.push({ name, password: pwd });
  $set("students", students);
  renderAdmin();
}

function removeStudent(i) {
  const students = $get("students", []);
  if (!confirm("Remove " + students[i].name + "?")) return;
  students.splice(i, 1);
  $set("students", students);
  renderAdmin();
}

/* ============================================================
   ADMIN: MENU MANAGEMENT  (checkbox list)
============================================================ */

function populateMasterSelect() {
  const meal = document.getElementById("menuMealSelect").value;
  const master = $get("masterFoods", {});
  const box = document.getElementById("checkboxFoodList");
  if (!box) return;

  box.innerHTML = "";

  (master[meal] || []).forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "food-checkbox-item";
    row.innerHTML = `
      <input type="checkbox" class="masterCheck" value="${index}">
      <span>${item.item} <small>[${item.type}]</small></span>
    `;
    box.appendChild(row);
  });

  const otherRow = document.createElement("div");
  otherRow.className = "food-checkbox-item";
  otherRow.innerHTML = `<button class="btn secondary" onclick="showOtherInput()">Add Custom Food</button>`;
  box.appendChild(otherRow);
}

function addSelectedFoods() {
  const meal = document.getElementById("menuMealSelect").value;
  const master = $get("masterFoods", {});
  const foods  = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });

  const checks = Array.from(document.querySelectorAll(".masterCheck:checked"));
  if (checks.length < 2) return alert("Please select at least 2 items");

  const current = Array.isArray(foods[meal]) ? foods[meal] : [];
  const selected = checks.map(c => master[meal][Number(c.value)]);
  const combined = current.concat(selected);

  // rule: if there is any non-veg, at least one veg item must be present
  const vegCount     = combined.filter(f => f.type === "veg").length;
  const nonvegCount  = combined.filter(f => f.type === "non-veg").length;
  if (vegCount === 0 && nonvegCount > 0) {
    return alert("Cannot create non-veg only menu. Add at least one veg item.");
  }

  foods[meal] = combined;
  $set("foods", foods);

  document.querySelectorAll(".masterCheck").forEach(c => (c.checked = false));
  renderAdmin();
}

function showOtherInput() {
  const row = document.getElementById("otherRow");
  if (row) row.style.display = "block";
}
function hideOtherInput() {
  const row = document.getElementById("otherRow");
  if (row) row.style.display = "none";
}

function addOtherToMaster() {
  const meal = document.getElementById("menuMealSelect").value;
  const name = (document.getElementById("otherName") || { value: "" }).value.trim();
  const type = document.getElementById("otherType").value;
  if (!name) return alert("Enter food name");

  const master = $get("masterFoods", {});
  if (!master[meal]) master[meal] = [];
  master[meal].push({ item: name, type });
  $set("masterFoods", master);

  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  if (!foods[meal]) foods[meal] = [];
  foods[meal].push({ item: name, type });
  $set("foods", foods);

  document.getElementById("otherName").value = "";
  hideOtherInput();
  renderAdmin();
}

function removeMenuItem(meal, idx) {
  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  if (!Array.isArray(foods[meal])) foods[meal] = [];
  foods[meal].splice(idx, 1);
  $set("foods", foods);
  renderAdmin();
}

function clearMenu() {
  if (!confirm("Clear all menus for all meals?")) return;
  $set("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  renderAdmin();
}

/* ============================================================
   LEFTOVER  (admin + leftover.html)
============================================================ */

function saveLeftover() {
  const food = (document.getElementById("leftFood") || { value: "" }).value.trim();
  const qty  = (document.getElementById("leftQty")  || { value: "" }).value.trim();
  if (!food || !qty) return alert("Enter food and quantity");

  const left = $get("leftover", []);
  left.push({
    food,
    qty: Number(qty),
    at: new Date().toLocaleString()
  });
  $set("leftover", left);

  if (document.getElementById("leftFood")) document.getElementById("leftFood").value = "";
  if (document.getElementById("leftQty"))  document.getElementById("leftQty").value  = "";

  renderAdmin();
  drawAllCharts();
}

function clearLeftover() {
  if (!confirm("Clear leftover history?")) return;
  $set("leftover", []);
  renderAdmin();
  drawAllCharts();
}

function toggleLeftFromMenu() {
  const block = document.getElementById("leftFromMenu");
  const sel   = document.getElementById("leftFromMenuSelect");
  if (!block || !sel) return;

  if (block.style.display === "block") {
    block.style.display = "none";
    return;
  }

  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  const all = [];
  ["tiffin", "lunch", "dinner", "snack"].forEach(meal => {
    (foods[meal] || []).forEach(f => all.push(f));
  });

  if (!all.length) {
    alert("No menu items available");
    return;
  }

  sel.innerHTML = "";
  all.forEach((f, i) => {
    const op = document.createElement("option");
    op.value = f.item;
    op.innerText = f.item;
    sel.appendChild(op);
  });

  block.style.display = "block";
}

function useLeftFromMenu() {
  const sel = document.getElementById("leftFromMenuSelect");
  if (!sel || !sel.value) return alert("Select a food item");
  const input = document.getElementById("leftFood");
  if (input) input.value = sel.value;
  document.getElementById("leftFromMenu").style.display = "none";
}

function renderLeftoverFull() {
  const ul = document.getElementById("leftListFull");
  if (!ul) return;
  const left = $get("leftover", []);
  ul.innerHTML = "";

  left.slice().reverse().forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${l.food}</strong> - ${l.qty} kg <span class="small-muted">${l.at}</span>`;
    ul.appendChild(li);
  });

  drawAllCharts();
}

/* ============================================================
   STUDENT: VOTING, RATING, ATTENDANCE
============================================================ */

function loadStudentVoting() {
  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });

  function fill(id, arr) {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = "";
    arr.forEach(a => {
      const op = document.createElement("option");
      op.value = a.item;
      op.innerText = a.item;
      s.appendChild(op);
    });
  }

  fill("voteTiffin", foods.tiffin);
  fill("voteLunch", foods.lunch);
  fill("voteDinner", foods.dinner);

  const snackBlock = document.getElementById("snackBlock");
  if (foods.snack && foods.snack.length) {
    if (snackBlock) snackBlock.style.display = "block";
    fill("voteSnack", foods.snack);
  } else {
    if (snackBlock) snackBlock.style.display = "none";
  }
}

function submitVoteMeal(meal) {
  if (localStorage.getItem("role") !== "student") {
    return alert("Login as student to vote");
  }
  const student = localStorage.getItem("studentName") || "Student";
  const idMap = {
    tiffin: "voteTiffin",
    lunch: "voteLunch",
    dinner: "voteDinner",
    snack: "voteSnack"
  };
  const sel = document.getElementById(idMap[meal]);
  if (!sel || !sel.value) return alert("Select a dish to vote");

  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  if (!foods[meal] || foods[meal].length < 2) {
    return alert("Admin must add at least 2 items for that meal");
  }

  const today = new Date().toLocaleDateString();
  const menuHash = JSON.stringify(foods[meal] || []);

  const votes = $get("votes", []);
  const exists = votes.find(
    v => v.student === student && v.meal === meal && v.date === today && v.menuHash === menuHash
  );
  if (exists) return alert("You already voted for this meal. You can vote again when menu changes.");

  votes.push({
    student,
    meal,
    vote: sel.value,
    date: today,
    menuHash,
    at: new Date().toLocaleString()
  });
  $set("votes", votes);
  alert("Vote recorded");
  renderAdmin();
}

function rateFood(stars) {
  if (localStorage.getItem("role") !== "student") {
    return alert("Login as student to rate");
  }
  const student = localStorage.getItem("studentName") || "Student";
  const today = new Date().toLocaleDateString();
  const menuHash = JSON.stringify($get("foods", {})); // full menu

  let ratings = $get("ratings", []);

  const exists = ratings.find(
    r => r.student === student && r.date === today && r.menuHash === menuHash
  );
  if (exists) {
    return alert("You already rated for this menu. Rating resets when menu changes.");
  }

  let reason = "";
  if (stars < 3) {
    reason = prompt("You gave low rating. Please enter the reason:");
    if (!reason || !reason.trim()) {
      return alert("Reason is required for rating less than 3.");
    }
  }

  ratings.push({
    student,
    stars,
    reason: reason || "No reason",
    date: today,
    menuHash,
    at: new Date().toLocaleString()
  });
  $set("ratings", ratings);
  alert("Thank you for your feedback!");
  renderAdmin();
}

function toggleMeal(meal, value) {
  const radios = document.querySelectorAll(`input[name="${meal}"]`);
  radios.forEach(r => (r.checked = r.value === value));
}

function submitMealAttendance() {
  if (localStorage.getItem("role") !== "student") {
    return alert("Login as student");
  }

  const t = document.querySelector('input[name="tiffin"]:checked');
  const l = document.querySelector('input[name="lunch"]:checked');
  const s = document.querySelector('input[name="snacks"]:checked');
  const d = document.querySelector('input[name="dinner"]:checked');
  if (!t || !l || !s || !d) return alert("Select Coming / Not Coming for all meals");

  const list = $get("mealAttendance", []);
  list.push({
    student: localStorage.getItem("studentName") || "Student",
    date: new Date().toLocaleDateString(),
    tiffin: t.value,
    lunch: l.value,
    snacks: s.value,
    dinner: d.value,
    at: new Date().toLocaleTimeString()
  });
  $set("mealAttendance", list);
  alert("Meal attendance recorded");
  renderAdmin();
}

function clearMealAttendance() {
  if (!confirm("Clear all meal attendance?")) return;
  $set("mealAttendance", []);
  renderAdmin();
}

/* ============================================================
   ADMIN: RENDER DASHBOARD
============================================================ */

function renderMealSummary() {
  const box = document.getElementById("mealSummary");
  if (!box) return;

  const list = $get("mealAttendance", []);
  const sum = {
    Tiffin: { Coming: 0, "Not Coming": 0 },
    Lunch: { Coming: 0, "Not Coming": 0 },
    Snacks: { Coming: 0, "Not Coming": 0 },
    Dinner: { Coming: 0, "Not Coming": 0 }
  };
  list.forEach(a => {
    sum.Tiffin[a.tiffin] = (sum.Tiffin[a.tiffin] || 0) + 1;
    sum.Lunch[a.lunch] = (sum.Lunch[a.lunch] || 0) + 1;
    sum.Snacks[a.snacks] = (sum.Snacks[a.snacks] || 0) + 1;
    sum.Dinner[a.dinner] = (sum.Dinner[a.dinner] || 0) + 1;
  });

  box.innerHTML = `
    <li>Tiffin: Coming ${sum.Tiffin.Coming} / Not Coming ${sum.Tiffin["Not Coming"]}</li>
    <li>Lunch: Coming ${sum.Lunch.Coming} / Not Coming ${sum.Lunch["Not Coming"]}</li>
    <li>Snacks: Coming ${sum.Snacks.Coming} / Not Coming ${sum.Snacks["Not Coming"]}</li>
    <li>Dinner: Coming ${sum.Dinner.Coming} / Not Coming ${sum.Dinner["Not Coming"]}</li>
  `;
}
function clearAttendance(){
  if(!confirm("Clear all attendance records?")) return;

  localStorage.removeItem("mealAttendance");
  localStorage.removeItem("attendance");

  alert("Attendance cleared");
  try { renderAdmin(); } catch(e){}
}
// -------------------------
// Helper: update visible stats
// -------------------------
function updateStats() {
  const students = $get("students", []);
  const votes = $get("votes", []);
  const left = $get("leftover", []);

  const statStudents = document.getElementById("statStudents");
  if (statStudents) statStudents.innerText = students.length;

  const statVotes = document.getElementById("statVotes");
  if (statVotes) statVotes.innerText = votes.length;

  const voteCountSpan = document.getElementById("voteCount");
  if (voteCountSpan) voteCountSpan.innerText = votes.length;

  const statLeft = document.getElementById("statLeft");
  if (statLeft) statLeft.innerText = left.length;
}

function renderAdmin() {
  const isAdminPage = document.getElementById("requestsList") || document.getElementById("studentList");
  if (!isAdminPage) return; // don't run on login / student pages unnecessarily

  renderRequests();
  populateMasterSelect();
  
  // Students
  const students = $get("students", []);
  const sbox = document.getElementById("studentList");
  if (sbox) {
    sbox.innerHTML = "";
    students.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${s.name}</span>
        <button class="btn secondary" onclick="removeStudent(${i})">Delete</button>
      `;
      sbox.appendChild(li);
    });
    const countSpan = document.getElementById("studentCount") || document.getElementById("statStudents");
    if (countSpan) countSpan.innerText = students.length;
  }

  // Menu lists per meal
  const foods = $get("foods", { tiffin: [], lunch: [], dinner: [], snack: [] });
  ["tiffin", "lunch", "dinner", "snack"].forEach(meal => {
    const ul = document.getElementById("list_" + meal);
    if (!ul) return;
    ul.innerHTML = "";
    (foods[meal] || []).forEach((f, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${f.item} <small class="small-muted">[${f.type}]</small></span>
        <button class="btn secondary" onclick="removeMenuItem('${meal}', ${i})">Remove</button>
      `;
      ul.appendChild(li);
    });
    const c = document.getElementById("count_" + meal);
    if (c) c.innerText = (foods[meal] || []).length;
  });

  // Leftover list
  const left = $get("leftover", []);
  const leftBox = document.getElementById("leftListAdmin");
  if (leftBox) {
    leftBox.innerHTML = "";
    left.slice().reverse().forEach(l => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${l.food}</strong> — ${l.qty} kg <span class="small-muted">${l.at}</span>`;
      leftBox.appendChild(li);
    });
    const statLeft = document.getElementById("statLeft");
    if (statLeft) statLeft.innerText = left.length;
  }

  // Ratings: show only low-rating reviews + average
  const ratings = $get("ratings", []);
  const avgSpan = document.getElementById("avgRating");
  if (avgSpan) {
    const avg =
      ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(2)
        : "—";
    avgSpan.innerText = avg;
  }

  const lowBox = document.getElementById("lowRatingReviews");
  if (lowBox) {
    lowBox.innerHTML = "";
    ratings
      .filter(r => r.stars <= 2)
      .slice()
      .reverse()
      .forEach(r => {
        const li = document.createElement("li");
        li.innerHTML = `
          <div>${r.stars}⭐</div>
          <div class="small-muted">Reason: ${r.reason || "No reason"}</div>
          <div class="small-muted">${r.at}</div>
        `;
        lowBox.appendChild(li);
      });
  }

  // Votes
  const votes = $get("votes", []);
  const vbox = document.getElementById("votesListAdmin");
  if (vbox) {
    vbox.innerHTML = "";
    votes
      .slice()
      .reverse()
      .forEach(v => {
        const li = document.createElement("li");
        li.innerHTML = `${capitalize(v.meal)} → ${v.vote} <span class="small-muted">${v.at}</span>`;
        vbox.appendChild(li);
      });

    const voteCountSpan = document.getElementById("voteCount");
    if (voteCountSpan) voteCountSpan.innerText = votes.length;
    const statVotesSpan = document.getElementById("statVotes");
    if (statVotesSpan) statVotesSpan.innerText = votes.length;
  }

  // Top voted per meal (for Tiffin, Lunch, Dinner)
  const byMeal = {};
  votes.forEach(v => {
    if (!byMeal[v.meal]) byMeal[v.meal] = {};
    byMeal[v.meal][v.vote] = (byMeal[v.meal][v.vote] || 0) + 1;
  });

  const parts = [];
  ["tiffin", "lunch", "dinner"].forEach(m => {
    const obj = byMeal[m] || {};
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    if (entries.length) {
      parts.push(`${capitalize(m)}: ${entries[0][0]} (${entries[0][1]})`);
    } else {
      parts.push(`${capitalize(m)}: —`);
    }
  });

  const details = document.getElementById("topFoodDetails");
  if (details) details.innerText = parts.join(" | ");

  // Attendance list
  const attList = $get("mealAttendance", []);
  const abox = document.getElementById("attListAdmin");
  if (abox) {
    abox.innerHTML = "";
    attList
      .slice()
      .reverse()
      .forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${a.student} — ${a.date}
          (T: ${a.tiffin}, L: ${a.lunch}, S: ${a.snacks}, D: ${a.dinner})
          <span class="small-muted">${a.at}</span>
        `;
        abox.appendChild(li);
      });
  }

  renderMealSummary();
        // ✅ Update preparation suggestion only if panel exists
      const mealSelect = document.getElementById('prepMealSelect');
      const qtyInput = document.getElementById('perStudentQty');

      if (mealSelect && qtyInput) {
        const meal = mealSelect.value || 'lunch';
        const qty = parseFloat(qtyInput.value) || 0.25;
        renderPrepSuggestion(meal, qty);
      }

  drawAllCharts();
  // ensure the quick stats and related counts are updated
  try { updateStats(); } catch(e) { /* safe fallback */ }

}

function clearRatings() {
  if (!confirm("Clear all ratings?")) return;
  $set("ratings", []);
  renderAdmin();
}

function clearVotes() {
  if (!confirm("Clear all votes?")) return;
  $set("votes", []);
  renderAdmin();
}

/* ============================================================
   CHARTS (Leftover + simple attendance view)
============================================================ */

function drawAllCharts() {
  drawPie("leftPie");
  drawBar("leftBar");
  drawPie("leftPieFull");
  drawBar("leftBarFull");
}

function drawPie(id){
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const left = $get('leftover',[]);
  if (!left.length) return;

  // total qty per food
  const totals = {};
  left.forEach(l => {
    totals[l.food] = (totals[l.food] || 0) + Number(l.qty);
  });

  const labels = Object.keys(totals);
  const values = Object.values(totals);
  const sum = values.reduce((a,b)=>a+b,0);

  const colors = [
    "#ff7675","#74b9ff","#55efc4","#ffeaa7",
    "#a29bfe","#fd79a8","#81ecec","#fab1a0"
  ];

  let start = 0;
  const cx = canvas.width/2 + 30;
  const cy = canvas.height/2;
  const r = Math.min(canvas.width,canvas.height)/3.2;

  // draw slices
  values.forEach((v,i)=>{
    const angle = (v / sum) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.fillStyle = colors[i % colors.length];
    ctx.arc(cx,cy,r,start,start + angle);
    ctx.fill();
    start += angle;
  });

  // ✅ draw legend
  const legendX = 10;
  let legendY = 20;
  ctx.font = "14px Arial";

  labels.forEach((label,i)=>{
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(legendX, legendY, 14, 14);

    ctx.fillStyle = "#000";
    ctx.fillText(label, legendX + 20, legendY + 12);

    legendY += 22;
  });
}


function drawBar(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const left = $get("leftover", []);
  if (!left.length) return;

  const totals = {};
  left.forEach(l => {
    totals[l.food] = (totals[l.food] || 0) + Number(l.qty);
  });

  const labels = Object.keys(totals);
  const values = Object.values(totals);
  const max = Math.max(...values);

  const baseY = canvas.height - 20;
  let x = 20;

  ctx.font = "10px sans-serif";

  values.forEach((v, i) => {
    const h = (v / max) * (canvas.height - 40);
    ctx.fillStyle = "#6c5ce7";
    ctx.fillRect(x, baseY - h, 40, h);
    ctx.fillStyle = "#000";
    ctx.fillText(labels[i], x, canvas.height - 6);
    x += 60;
  });
}

/* ============================================================
   AUTO INIT on each page
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Login page: show request count / student count if needed
  if (document.getElementById("loginPageMarker")) {
    // nothing heavy needed
  }

  // Student page
  if (document.getElementById("studentPageMarker")) {
    loadStudentVoting();
  }

  // Admin page
  if (document.getElementById("adminPageMarker")) {
    renderAdmin();
  }

  // Leftover full page
  if (document.getElementById("leftoverPageMarker")) {
    renderLeftoverFull();
  }
});
// ✅ FIX: Support old admin.html tab buttons
function openTab(event){
  const btn = event.currentTarget;
  const target = btn.getAttribute("data-target");

  // Remove active state from buttons
  document.querySelectorAll(".tab-btn")
    .forEach(b => b.classList.remove("active"));

  // Hide all panels
  document.querySelectorAll(".panel")
    .forEach(p => p.style.display = "none");

  // Activate clicked button
  btn.classList.add("active");

  // Show selected panel
  const panel = document.getElementById(target);
  if(panel) panel.style.display = "block";

  // Re-render admin UI safely
  if (typeof renderAdmin === "function") {
    renderAdmin();
  }
}
function calculatePrepForMeal(meal, perStudentQty = 0.25) {
  const today = new Date().toLocaleDateString();
  const votes = $get('votes', []).filter(v => v.meal === meal && (v.at || '').includes(today));

  const counts = {};
  votes.forEach(v => counts[v.vote] = (counts[v.vote] || 0) + 1);

  if (!Object.keys(counts).length)
    return { winners: [], required: {}, attendingCount: 0 };

  const max = Math.max(...Object.values(counts));
  const winners = Object.keys(counts).filter(f => counts[f] === max);

  const attendance = $get('mealAttendance', []).filter(a => a.date === today);
  const coming = new Set();
  attendance.forEach(a => { if (a[meal] === "Coming") coming.add(a.student); });

  const required = {};
  winners.forEach(d => required[d] = (coming.size * perStudentQty).toFixed(2));

  return { winners, required, attendingCount: coming.size };
}


function renderPrepSuggestion(meal, qty) {
  const box = document.getElementById('prepSuggestion');
  if (!box) return;

  const data = calculatePrepForMeal(meal, qty);

  if (!data.winners.length) {
    box.innerHTML = `<span class="small-muted">No votes yet for ${meal}.</span>`;
    return;
  }

  let html = `<strong>Students coming:</strong> ${data.attendingCount}<br>`;
  html += `<strong>Top item(s):</strong> ${data.winners.join(', ')}<br>`;
  html += `<ul style="margin-top:6px">`;

  data.winners.forEach(d => {
    html += `<li>${d} — Prepare <strong>${data.required[d]} kg</strong></li>`;
  });

  html += `</ul>`;
  box.innerHTML = html;
}

function updatePrepSuggestion() {
  const meal = document.getElementById('prepMealSelect').value;
  const qty = parseFloat(document.getElementById('perStudentQty').value) || 0.35;
  renderPrepSuggestion(meal, qty);
}
// ✅ Update preparation suggestion only if panel exists
const mealSelect = document.getElementById('prepMealSelect');
const qtyInput = document.getElementById('perStudentQty');

if (mealSelect && qtyInput) {
  const meal = mealSelect.value || 'lunch';
  const qty = parseFloat(qtyInput.value) || 0.35;
  renderPrepSuggestion(meal, qty);
}
