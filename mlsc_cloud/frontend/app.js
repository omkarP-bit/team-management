const userTab = document.getElementById("userTab");
const adminTab = document.getElementById("adminTab");
const userPanel = document.getElementById("userPanel");
const adminPanel = document.getElementById("adminPanel");

const userForm = document.getElementById("userForm");
const userCodeInput = document.getElementById("userCodeInput");
const userSubmitButton = document.getElementById("userSubmitButton");
const userStatusMessage = document.getElementById("userStatusMessage");
const userResultBox = document.getElementById("userResultBox");
const userPlaceholderBox = document.getElementById("userPlaceholderBox");
const userTeamNameValue = document.getElementById("userTeamNameValue");
const userUrlValue = document.getElementById("userUrlValue");
const userUsernameValue = document.getElementById("userUsernameValue");
const userPasswordValue = document.getElementById("userPasswordValue");
const userTeamSizeValue = document.getElementById("userTeamSizeValue");
const userMemberCount = document.getElementById("userMemberCount");
const userMembersList = document.getElementById("userMembersList");
const joinNameInput = document.getElementById("joinNameInput");
const joinPhoneInput = document.getElementById("joinPhoneInput");
const joinEmailInput = document.getElementById("joinEmailInput");
const joinBtn = document.getElementById("joinBtn");

const adminLookupForm = document.getElementById("adminLookupForm");
const adminSaveForm = document.getElementById("adminSaveForm");
const adminTokenInput = document.getElementById("adminTokenInput");
const adminCodeInput = document.getElementById("adminCodeInput");
const adminLookupButton = document.getElementById("adminLookupButton");
const adminStatusMessage = document.getElementById("adminStatusMessage");
const adminEditorPlaceholder = document.getElementById("adminEditorPlaceholder");
const selectedCodeLabel = document.getElementById("selectedCodeLabel");
const adminTeamNameInput = document.getElementById("adminTeamNameInput");
const adminUrlInput = document.getElementById("adminUrlInput");
const adminUsernameInput = document.getElementById("adminUsernameInput");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminTeamSizeInput = document.getElementById("adminTeamSizeInput");
const adminMembersInput = document.getElementById("adminMembersInput");
const adminSaveButton = document.getElementById("adminSaveButton");
const adminPhoneLookupInput = document.getElementById("adminPhoneLookupInput");
const adminPhoneLookupBtn = document.getElementById("adminPhoneLookupBtn");
const adminPhoneResult = document.getElementById("adminPhoneResult");

let selectedAdminCode = "";
let currentCode = "";

function setToneStatus(element, message, tone = "neutral") {
  element.textContent = message;
  element.className = "status-msg " + tone;
}

function isCodeValid(code) {
  return /^\d{4,10}$/.test(code);
}

function setActiveTab(tab) {
  const showUser = tab === "user";
  userPanel.classList.toggle("hidden", !showUser);
  adminPanel.classList.toggle("hidden", showUser);
  userTab.classList.toggle("active", showUser);
  adminTab.classList.toggle("active", !showUser);
}

function setUserLoading(isLoading) {
  userCodeInput.disabled = isLoading;
  userSubmitButton.disabled = isLoading;
  userSubmitButton.textContent = isLoading ? "Checking..." : "Get Credentials";
}

function setAdminLookupLoading(isLoading) {
  adminTokenInput.disabled = isLoading;
  adminCodeInput.disabled = isLoading;
  adminLookupButton.disabled = isLoading;
  adminLookupButton.textContent = isLoading ? "Checking..." : "Find or Create ID";
}

function setAdminSaveLoading(isLoading) {
  adminSaveButton.disabled = isLoading;
  adminSaveButton.textContent = isLoading ? "Saving..." : "Save Team";
}

function renderMembers(members, teamSize) {
  userMemberCount.textContent = members.length;
  userTeamSizeValue.textContent = teamSize ?? 4;
  userMembersList.innerHTML = "";

  if (members.length === 0) {
    userMembersList.innerHTML = "<li style='color:#999;font-style:italic;font-size:0.82rem;padding:0.25rem 0;'>No members yet.</li>";
    return;
  }

  members.forEach((m) => {
    const name = typeof m === "object" ? m.name : m;
    const phone = typeof m === "object" ? m.phone : "";
    const email = typeof m === "object" ? m.email : "";
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="member-info">' +
        '<span class="member-name">' + name + '</span>' +
        '<span class="member-meta">' + phone + ' &bull; ' + email + '</span>' +
      '</div>' +
      '<button type="button" data-name="' + name + '" class="leave-btn">Leave</button>';
    userMembersList.appendChild(li);
  });

  userMembersList.querySelectorAll(".leave-btn").forEach(function(btn) {
    btn.addEventListener("click", function() { handleLeave(btn.dataset.name); });
  });
}

function showUserCredentials(data) {
  userTeamNameValue.textContent = data.team_name || "—";
  userUrlValue.textContent = data.url || "—";
  userUrlValue.href = data.url || "#";
  userUsernameValue.textContent = data.username;
  userPasswordValue.textContent = data.password;
  renderMembers(data.members || [], data.team_size || 4);
  userResultBox.classList.remove("hidden");
  userResultBox.classList.add("animate-in");
  userPlaceholderBox.classList.add("hidden");
}

function hideUserCredentials() {
  userResultBox.classList.add("hidden");
  userPlaceholderBox.classList.remove("hidden");
  currentCode = "";
}

function showAdminEditor(code, data) {
  data = data || {};
  selectedAdminCode = code;
  selectedCodeLabel.textContent = code;
  adminTeamNameInput.value = data.team_name || "";
  adminUrlInput.value = data.url || "";
  adminUsernameInput.value = data.username || "";
  adminPasswordInput.value = data.password || "";
  adminTeamSizeInput.value = data.team_size || 4;
  adminMembersInput.value = Array.isArray(data.members)
    ? data.members.map(function(m) { return typeof m === "object" ? m.name : m; }).join("\n")
    : "";
  adminEditorPlaceholder.classList.add("hidden");
  adminSaveForm.classList.remove("hidden");
}

async function handleUserSubmit(event) {
  event.preventDefault();
  const code = userCodeInput.value.trim();

  if (!isCodeValid(code)) {
    hideUserCredentials();
    setToneStatus(userStatusMessage, "Please enter a valid numeric ID (4-10 digits).", "error");
    return;
  }

  try {
    setUserLoading(true);
    setToneStatus(userStatusMessage, "Checking ID...", "neutral");

    const response = await window.fetch(API_BASE + "/api/get-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      hideUserCredentials();
      setToneStatus(userStatusMessage, data.message || "ID not found.", "error");
      return;
    }

    currentCode = code;
    showUserCredentials(data);
    setToneStatus(userStatusMessage, "Credentials loaded.", "success");
  } catch (error) {
    hideUserCredentials();
    setToneStatus(userStatusMessage, "Network error. Try again.", "error");
    console.error(error);
  } finally {
    setUserLoading(false);
  }
}

async function handleJoin() {
  const name = joinNameInput.value.trim();
  const phone = joinPhoneInput.value.trim();
  const email = joinEmailInput.value.trim();

  if (!name) { setToneStatus(userStatusMessage, "Enter your name.", "error"); return; }
  if (!phone) { setToneStatus(userStatusMessage, "Enter your phone number.", "error"); return; }
  if (!email) { setToneStatus(userStatusMessage, "Enter your email.", "error"); return; }
  if (!currentCode) return;

  try {
    joinBtn.disabled = true;
    joinBtn.textContent = "Joining...";

    const response = await window.fetch(API_BASE + "/api/join-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: currentCode, name, phone, email })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setToneStatus(userStatusMessage, data.message || "Could not join.", "error");
      return;
    }

    joinNameInput.value = "";
    joinPhoneInput.value = "";
    joinEmailInput.value = "";
    renderMembers(data.members, Number(userTeamSizeValue.textContent));
    setToneStatus(userStatusMessage, name + " joined the team.", "success");
  } catch (error) {
    setToneStatus(userStatusMessage, "Network error. Try again.", "error");
    console.error(error);
  } finally {
    joinBtn.disabled = false;
    joinBtn.textContent = "Join Team";
  }
}

async function handleLeave(name) {
  if (!currentCode) return;

  try {
    const response = await window.fetch(API_BASE + "/api/leave-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: currentCode, name })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setToneStatus(userStatusMessage, data.message || "Could not leave.", "error");
      return;
    }

    renderMembers(data.members, Number(userTeamSizeValue.textContent));
    setToneStatus(userStatusMessage, name + " left the team.", "success");
  } catch (error) {
    setToneStatus(userStatusMessage, "Network error. Try again.", "error");
    console.error(error);
  }
}

async function handleAdminPhoneLookup() {
  const token = adminTokenInput.value.trim();
  const phone = adminPhoneLookupInput.value.trim();

  if (!token) { setToneStatus(adminStatusMessage, "Enter admin token first.", "error"); return; }
  if (!phone) { adminPhoneResult.innerHTML = "<p class='status-msg error'>Enter a phone number.</p>"; return; }

  try {
    adminPhoneLookupBtn.disabled = true;
    adminPhoneLookupBtn.textContent = "Checking...";

    const response = await window.fetch(API_BASE + "/api/admin/lookup-member", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ phone })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      adminPhoneResult.innerHTML = "<p class='status-msg error'>" + (data.message || "Lookup failed.") + "</p>";
      return;
    }

    if (!data.found) {
      adminPhoneResult.innerHTML = "<div class='phone-result-box not-found'>&#10007; No member found with this phone number.</div>";
    } else {
      adminPhoneResult.innerHTML =
        "<div class='phone-result-box found'>" +
          "&#10003; Member found in <strong>Team " + (data.team_name || data.team_code) + "</strong><br/>" +
          "<span style='font-size:0.85rem;'>Name: " + data.member.name + " &bull; Email: " + data.member.email + "</span>" +
        "</div>";
    }
  } catch (error) {
    adminPhoneResult.innerHTML = "<p class='status-msg error'>Network error. Try again.</p>";
    console.error(error);
  } finally {
    adminPhoneLookupBtn.disabled = false;
    adminPhoneLookupBtn.textContent = "Check Phone";
  }
}

async function handleAdminLookup(event) {
  event.preventDefault();
  const token = adminTokenInput.value.trim();
  const code = adminCodeInput.value.trim();

  if (!token) { setToneStatus(adminStatusMessage, "Enter admin token.", "error"); return; }
  if (!isCodeValid(code)) { setToneStatus(adminStatusMessage, "Please enter a valid numeric ID (4-10 digits).", "error"); return; }

  try {
    setAdminLookupLoading(true);
    setToneStatus(adminStatusMessage, "Checking ID...", "neutral");

    const response = await window.fetch(API_BASE + "/api/admin/get-credential", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setToneStatus(adminStatusMessage, data.message || "Lookup failed.", "error");
      return;
    }

    if (data.found) {
      showAdminEditor(code, data);
      setToneStatus(adminStatusMessage, "Team found. Edit and save.", "success");
    } else {
      showAdminEditor(code, {});
      setToneStatus(adminStatusMessage, "New team. Fill in details and save.", "success");
    }
  } catch (error) {
    setToneStatus(adminStatusMessage, "Network error. Try again.", "error");
    console.error(error);
  } finally {
    setAdminLookupLoading(false);
  }
}

async function handleAdminSave(event) {
  event.preventDefault();
  const token = adminTokenInput.value.trim();
  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value.trim();

  if (!selectedAdminCode) { setToneStatus(adminStatusMessage, "Search an ID first.", "error"); return; }
  if (!token) { setToneStatus(adminStatusMessage, "Enter admin token.", "error"); return; }
  if (!username || !password) { setToneStatus(adminStatusMessage, "Username and password are required.", "error"); return; }

  const members = adminMembersInput.value.split("\n").map(function(m) { return m.trim(); }).filter(Boolean);

  const payload = {
    code: selectedAdminCode,
    team_name: adminTeamNameInput.value.trim(),
    url: adminUrlInput.value.trim(),
    username,
    password,
    team_size: Number(adminTeamSizeInput.value) || 4,
    members
  };

  try {
    setAdminSaveLoading(true);
    setToneStatus(adminStatusMessage, "Saving...", "neutral");

    const response = await window.fetch(API_BASE + "/api/admin/update-credential", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      setToneStatus(adminStatusMessage, data.message || "Save failed.", "error");
      return;
    }

    setToneStatus(adminStatusMessage, "Team saved successfully.", "success");
  } catch (error) {
    setToneStatus(adminStatusMessage, "Network error. Try again.", "error");
    console.error(error);
  } finally {
    setAdminSaveLoading(false);
  }
}

async function copyValue(value, label) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    setToneStatus(userStatusMessage, label + " copied.", "success");
  } catch {
    setToneStatus(userStatusMessage, "Could not copy automatically.", "error");
  }
}

userTab.addEventListener("click", function() { setActiveTab("user"); });
adminTab.addEventListener("click", function() { setActiveTab("admin"); });
userForm.addEventListener("submit", handleUserSubmit);
adminLookupForm.addEventListener("submit", handleAdminLookup);
adminSaveForm.addEventListener("submit", handleAdminSave);
joinBtn.addEventListener("click", handleJoin);
adminPhoneLookupBtn.addEventListener("click", handleAdminPhoneLookup);

document.querySelectorAll(".copy-btn").forEach(function(button) {
  button.addEventListener("click", function() {
    if (button.dataset.copy === "user-url") copyValue(userUrlValue.textContent, "URL");
    else if (button.dataset.copy === "user-username") copyValue(userUsernameValue.textContent, "Username");
    else if (button.dataset.copy === "user-password") copyValue(userPasswordValue.textContent, "Password");
  });
});

setActiveTab("user");
