async function fetchConfigStatus() {
  try {
    const res = await fetch("/status");
    if (res.status === 200) {
      return await res.json();
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

function updateConfigDisplay(data) {
  document.getElementById("clientIdInfo").textContent =
    data?.clientId || "Not configured";
  document.getElementById("clientSecretInfo").textContent =
    data?.clientSecret || "Not configured";
  document.getElementById("apiKeyInfo").textContent =
    data?.apiKey || "Not configured";
  document.getElementById("maxTryInfo").textContent =
    data?.max_try || "Not configured";
  document.getElementById("expireDurationInfo").textContent =
    data?.expired_duration || "Not configured";
}

function openModal() {
  // Pre-fill form with current values
  const currentClientId = document.getElementById("clientIdInfo").textContent;
  const currentClientSecret =
    document.getElementById("clientSecretInfo").textContent;
  const currentApiKey = document.getElementById("apiKeyInfo").textContent;
  const currentMaxTry = document.getElementById("maxTryInfo").textContent;
  const currentExpireDuration =
    document.getElementById("expireDurationInfo").textContent;

  document.getElementById("clientId").value =
    currentClientId !== "Not configured" ? currentClientId : "";
  document.getElementById("clientSecret").value =
    currentClientSecret !== "Not configured" ? currentClientSecret : "";
  document.getElementById("apiKey").value =
    currentApiKey !== "Not configured" ? currentApiKey : "";
  document.getElementById("maxTry").value =
    currentMaxTry !== "Not configured" ? currentMaxTry : "";
  document.getElementById("expireDuration").value =
    currentExpireDuration !== "Not configured" ? currentExpireDuration : "";

  document.getElementById("configModal").style.display = "block";
}

function closeModal() {
  document.getElementById("configModal").style.display = "none";
}

async function renderConfigPage() {
  const data = await fetchConfigStatus();
  updateConfigDisplay(data);
}

// Modal event handlers
document.addEventListener("DOMContentLoaded", function () {
  renderConfigPage();

  // Edit button click handler
  document.getElementById("editConfigBtn").onclick = openModal;

  // Close modal handlers
  document.querySelector(".close").onclick = closeModal;

  // Close modal when clicking outside
  window.onclick = function (event) {
    const modal = document.getElementById("configModal");
    if (event.target === modal) {
      closeModal();
    }
  };
});

document.getElementById("configForm").onsubmit = async function (e) {
  e.preventDefault();
  const clientId = document.getElementById("clientId").value;
  const clientSecret = document.getElementById("clientSecret").value;
  const apiKey = document.getElementById("apiKey").value;
  const max_try = parseInt(document.getElementById("maxTry").value);
  const expired_duration = parseInt(
    document.getElementById("expireDuration").value
  );
  const msg = document.getElementById("configMsg");
  msg.className = "config-msg";
  msg.innerHTML = "";
  try {
    const res = await fetch("/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        apiKey,
        max_try,
        expired_duration,
      }),
    });
    const result = await res.json();
    closeModal();
    if (res.ok) {
      msg.classList.add("show", "success");
      msg.innerHTML = '<span class="icon">✔️</span>' + result.message;
      renderConfigPage();
      setTimeout(() => {
        msg.classList.remove("show", "success");
        msg.innerHTML = "";
      }, 2000);
    } else {
      msg.classList.add("show", "error");
      msg.innerHTML =
        '<span class="icon">❌</span>' +
        (result.error || "Failed to save config.");
      setTimeout(() => {
        msg.classList.remove("show", "error");
        msg.innerHTML = "";
      }, 2500);
    }
  } catch (err) {
    closeModal();
    msg.classList.add("show", "error");
    msg.innerHTML = '<span class="icon">❌</span>Network error.';
    setTimeout(() => {
      msg.classList.remove("show", "error");
      msg.innerHTML = "";
    }, 2500);
  }
};
