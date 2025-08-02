window.addEventListener('DOMContentLoaded', loadHotlines);

async function loadHotlines() {
  try {
    console.log('Fetching hotlines...'); // Debug log
    
    const res = await fetch('http://localhost:3000/api/hotlines');
    
    console.log('Response status:', res.status); // Debug log
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const hotlines = await res.json();
    
    console.log('Hotlines received:', hotlines); // Debug log
    
    if (!hotlines || hotlines.length === 0) {
      document.getElementById('hotlines-container').innerHTML = 
        '<div class="alert alert-warning">No emergency hotlines available.</div>';
      return;
    }

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
    document.getElementById('hotlines-container').innerHTML = 
      `<div class="alert alert-danger">Failed to load hotlines: ${err.message}</div>`;
  }
}

function formatHotline(h) {
  // Handle different possible column names
  const serviceName = h.ServiceName || h.service_name || 'Emergency Service';
  const phoneNumber = h.PhoneNumber || h.Number || h.phone_number || 'N/A';
  const description = h.Description || h.description || 'Emergency hotline service';
  
  return `
    <div class="hotline-card">
      <h4>${serviceName}</h4>
      <p>
        <strong>
          <a href="tel:${phoneNumber}" class="phone-link">
            <i class="fas fa-phone"></i> ${phoneNumber}
          </a>
        </strong>
        <br>
        ${description}
      </p>
      <button class="btn btn-danger btn-sm mt-2" onclick="callHotline('${phoneNumber}')">
        <i class="fas fa-phone"></i> Call Now
      </button>
    </div>
  `;
}

function callHotline(number) {
  if (confirm(`Do you want to call ${number}?`)) {
    window.location.href = `tel:${number}`;
  }
}

function triggerSOS() {
  if (confirm("🚨 This will call emergency services (999). Continue?")) {
    window.location.href = "tel:999";
  }
}