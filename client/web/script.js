document.getElementById("verifyBtn").onclick = function () {
  fetch("/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lot_id: "your_lot_id_here" }),
  })
    .then((res) => res.json())
    .then((url) => {
      const modal = document.getElementById("fullscreen-modal");
      const iframe = document.getElementById("modal-iframe");
      iframe.src = url;
      modal.style.display = "flex";
    })
    .catch((err) => alert("Error: " + err));
};

document.getElementById("close-modal").onclick = function () {
  const modal = document.getElementById("fullscreen-modal");
  modal.style.display = "none";
  const iframe = document.getElementById("modal-iframe");
  iframe.src = "";
};
