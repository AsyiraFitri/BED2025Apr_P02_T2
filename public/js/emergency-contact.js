document.querySelector(".btn-primary").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const relationship = document.getElementById("relationship").value;
  const phone = document.getElementById("phone").value;
  const note = document.getElementById("note").value;

  try {
    const res = await fetch("http://localhost:3000/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
       'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   body: JSON.stringify({ name, relationship, phone, note })
    });

    if (!res.ok) throw new Error("Failed to add contact");

    await loadContacts(); // Refresh contact list
  } catch (err) {
    console.error("Error adding contact:", err);
  }
});

async function loadContacts() {
  try {
    const res = await fetch("http://localhost:3000/api/requests");
    const contacts = await res.json();

    const container = document.querySelector(".requests-section");
    container.innerHTML = contacts.map(c => `
      <div class="contact-card">
        <h4>${c.Name} ${c.IsStarred ? "⭐" : ""}</h4>
        <p>(${c.Relationship})<br>Phone: ${c.Phone}</p>
        <button class="btn btn-sm btn-outline-danger">Edit</button>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading contacts:", err);
  }
}

loadContacts();
