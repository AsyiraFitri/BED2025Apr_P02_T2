// Improved contact form submission
document.querySelector(".btn-primary").addEventListener("click", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const relationship = document.getElementById("relationship").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const note = document.getElementById("note").value.trim();

  if (!name || !phone) {
    showMessage("Name and Phone are required!", "error");
    return;
  }

  const token = sessionStorage.getItem('token');
  if (!token) {
    showMessage("Please log in to add or update contacts", "error");
    // Redirect to login page after showing message (give it a short delay so user can see the message)
  setTimeout(() => {
    window.location.href = 'auth.html'
  }, 1500);

    return;
  }

  const contactData = { name, relationship, phone, note, isStarred: false };

  try {
    let res;
    if (editingContactId) {
      // Update
      res = await fetch(`http://localhost:3000/api/contacts/${editingContactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(contactData)
      });
    } else {
      // Create
      res = await fetch("http://localhost:3000/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(contactData)
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || (editingContactId ? "Failed to update contact" : "Failed to add contact"));
    }

    showMessage(editingContactId ? "Contact updated successfully!" : "Contact added successfully!", "success");

    // Reset form
    document.getElementById("name").value = "";
    document.getElementById("relationship").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("note").value = "";
    editingContactId = null;
    document.querySelector(".btn-primary").textContent = "Add Contact";

    await loadContacts();

  } catch (err) {
    console.error("Error submitting contact:", err);
    showMessage(err.message || "Error submitting contact", "error");
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
async function deleteContact(contactId) {
  if (!confirm("Are you sure you want to delete this contact?")) return;

  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showMessage("Please log in to delete contacts", "error");
      return;
    }

    const res = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete contact");
    }

    showMessage("Contact deleted successfully!", "success");
    await loadContacts();
  } catch (err) {
    console.error("Error deleting contact:", err);
    showMessage(err.message || "Error deleting contact", "error");
  }
}
let editingContactId = null;

async function editContact(contactId) {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showMessage("Please log in to edit contacts", "error");
      return;
    }

    const res = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to load contact");
    }

    const contact = await res.json();

    // Populate form
    document.getElementById("name").value = contact.Name || '';
    document.getElementById("relationship").value = contact.Relationship || '';
    document.getElementById("phone").value = contact.PhoneNumber || '';
    document.getElementById("note").value = contact.Note || '';

    editingContactId = contactId;
    document.querySelector(".btn-primary").textContent = "Update Contact";
    // Change button text to "Update"
    document.querySelector(".btn-primary").textContent = "Update Contact";

  } catch (err) {
    console.error("Error loading contact:", err);
    showMessage(err.message || "Error loading contact", "error");
  }
}


// Load contacts on page load
loadContacts();