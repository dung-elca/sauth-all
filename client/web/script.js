const HOST = "http://sg.dungnguyen.uk:3001";

let currentLotId = "your_lot_id_here";
let checkInterval = null;

async function checkVerificationStatus() {
  try {
    const response = await fetch(`${HOST}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lot_id: currentLotId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === "verified") {
        // Stop checking
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }

        // Close modal
        const modal = document.getElementById("fullscreen-modal");
        modal.style.display = "none";
        const iframe = document.getElementById("modal-iframe");
        iframe.src = "";

        // Hide continue button and show verified text
        const buttonContainer = document.querySelector(".button-container");
        buttonContainer.innerHTML =
          '<div class="verified-text">✓ Verified</div>';
      }
    }
  } catch (err) {
    console.error("Error checking verification status:", err);
  }
}

document.getElementById("verifyBtn").onclick = function () {
  fetch(`${HOST}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lot_id: currentLotId }),
  })
    .then((res) => res.json())
    .then((url) => {
      const modal = document.getElementById("fullscreen-modal");
      const iframe = document.getElementById("modal-iframe");
      iframe.src = url;
      modal.style.display = "flex";

      // Start checking verification status every second
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      checkInterval = setInterval(checkVerificationStatus, 1000);
    })
    .catch((err) => alert("Error: " + err));
};

document.getElementById("close-modal").onclick = function () {
  const modal = document.getElementById("fullscreen-modal");
  modal.style.display = "none";
  const iframe = document.getElementById("modal-iframe");
  iframe.src = "";

  // Stop checking when modal is manually closed
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};
