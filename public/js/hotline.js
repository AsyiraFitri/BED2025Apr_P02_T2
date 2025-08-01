window.addEventListener('DOMContentLoaded', loadHotlines);

async function loadHotlines() {
  try {
    const res = await fetch('/api/hotlines');
    const hotlines = await res.json();

    const leftCol = hotlines.slice(0, Math.ceil(hotlines.length / 2));
    const rightCol = hotlines.slice(Math.ceil(hotlines.length / 2));

    const html = `
      <div class="row">
        <div class="col">
          ${leftCol.map(h => formatHotline(h)).join('')}
        </div>
        <div class="col">
          ${rightCol.map(h => formatHotline(h)).join('')}
        </div>
      </div>
    `;
    document.getElementById('hotlines-container').innerHTML = html;
  } catch (err) {
    console.error('Failed to load hotlines:', err);
  }
}

function formatHotline(h) {
  return `
    <div class="hotline-card">
      <h4>${h.ServiceName}</h4>
      <p><strong>${h.Number}</strong><br>${h.Description}</p>
    </div>
  `;
}
function triggerSOS() {
  alert("🚨 Please call 999 immediately for police emergencies.");
  // Optionally: redirect to phone app or show hotline options
}