document.getElementById("verifyBtn").onclick = function () {
  fetch("/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lot_id: "your_lot_id_here" }),
  })
    .then((res) => res.json())
    .then((data) => alert("Result " + JSON.stringify(data)))
    .catch((err) => alert("Error: " + err));
};
