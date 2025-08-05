document.getElementById("verifyBtn").onclick = function () {
  fetch("http://localhost:3001/api/verify")
    .then((res) => res.json())
    .then((data) => alert("Kết quả: " + JSON.stringify(data)))
    .catch((err) => alert("Lỗi: " + err));
};
