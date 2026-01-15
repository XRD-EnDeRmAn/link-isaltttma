function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

// Sayfa yüklendiğinde önceki tema tercihini uygula
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
});


// URL Kısaltma İşlemi
document.getElementById('shortenForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const originalUrl = document.getElementById('originalUrl').value;
  const customAlias = document.getElementById('customAlias').value;
  const linkPassword = document.getElementById('linkPassword').value;
  const resultDiv = document.getElementById('result');
  const shortUrlEl = document.getElementById('shortUrl');

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original: originalUrl,
        customLink: customAlias,
        link_password: linkPassword
      })
    });

    const data = await response.json();
    if (data.error) {
      alert("Hata: " + data.error);
    } else {
      // data.message örn: "Kısaltılmış link: http://localhost:3000/abc123"
      const parts = data.message.split(':');
      const shortLink = parts.slice(1).join(':').trim();
      shortUrlEl.href = shortLink;
      shortUrlEl.textContent = shortLink;
      resultDiv.classList.remove('hidden');
    }
  } catch (err) {
    alert("Sunucu hatası: " + err.message);
  }
});

// QR Kod Oluşturma İşlemi
document.getElementById('qrForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const qrShortLink = document.getElementById('qrShortLink').value;
  const qrResultDiv = document.getElementById('qrResult');
  const qrImage = document.getElementById('qrImage');

  try {
    const shortCode = qrShortLink.split('/').pop();
    const response = await fetch(`/api/qrcode?short=${shortCode}`);
    const data = await response.json();
    if (data.qrCode) {
      qrImage.src = data.qrCode;
      qrResultDiv.classList.remove('hidden');
    } else {
      alert("QR Kod oluşturulamadı.");
    }
  } catch (err) {
    alert("QR Kod oluşturma hatası: " + err.message);
  }
});

// Link Raporlama İşlemi
document.getElementById('reportForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const reportLink = document.getElementById('reportLink').value;
  const reportReason = document.getElementById('reportReason').value;
  const reportMessage = document.getElementById('reportMessage');

  try {
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ short: reportLink, reason: reportReason })
    });

    const data = await response.json();
    reportMessage.textContent = data.message || data.error;
    reportMessage.style.color = data.error ? 'red' : 'green';
  } catch (err) {
    reportMessage.textContent = "Hata: " + err.message;
    reportMessage.style.color = 'red';
  }
});
