// Improved contact form submission
document.querySelector(".btn-primary").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const relationship = document.getElementById("relationship").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const note = document.getElementById("note").value.trim();

  // Basic validation
  if (!name || !phone) {
    showMessage("Name and Phone are required!", "error");
    return;
  }

  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showMessage("Please log in to add contacts", "error");
      return;
    }

    const res = await fetch("http://localhost:3000/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, relationship, phone, note, isStarred: false })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add contact");
    }

    // Success feedback
    showMessage("Contact added successfully!", "success");
    
    // Clear form
    document.getElementById("name").value = "";
    document.getElementById("relationship").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("note").value = "";
    
    // Refresh contact list
    await loadContacts();
    
  } catch (err) {
    console.error("Error adding contact:", err);
    showMessage(err.message || "Error adding contact", "error");
  }
});

async function loadContacts() {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showMessage("Please log in to view contacts", "error");
      return;
    }

    const res = await fetch("http://localhost:3000/api/contacts", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to load contacts");
    }

    const contacts = await res.json();
    
    const container = document.querySelector(".requests-section");
    if (contacts.length === 0) {
      container.innerHTML = '<p class="text-muted">No contacts found. Add your first contact!</p>';
      return;
    }

    container.innerHTML = contacts.map(c => `
      <div class="contact-card mb-3 p-3 border rounded">
        <h4>${escapeHtml(c.Name)} ${c.IsStarred ? "⭐" : ""}</h4>
        <p class="mb-2">
          <strong>Relationship:</strong> ${escapeHtml(c.Relationship || 'Not specified')}<br>
          <strong>Phone:</strong> ${escapeHtml(c.PhoneNumber)}<br>
          ${c.Note ? `<strong>Note:</strong> ${escapeHtml(c.Note)}` : ''}
        </p>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editContact(${c.ContactID})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteContact(${c.ContactID})">Delete</button>
      </div>
    `).join("");
    
  } catch (err) {
    console.error("Error loading contacts:", err);
    showMessage(err.message || "Error loading contacts", "error");
  }
}

// Utility functions
function showMessage(message, type = "info") {
  // Remove existing messages
  const existingMessage = document.querySelector('.alert-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create new message
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-message`;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load contacts on page load
loadContacts();