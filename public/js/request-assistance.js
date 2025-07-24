document.addEventListener("DOMContentLoaded", () => {
  // Toggle mobile menu
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      const navMenu = document.querySelector(".nav-menu");
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    });
  }

  // Handle Save button
  const saveBtn = document.querySelector(".btn-primary");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      const category = document.getElementById("category").value;
      const description = document.getElementById("description").value;
      const requestDate = document.getElementById("request-date").value;
      const requestTime = document.getElementById("request-time").value;

      if (!category || !description || !requestDate || !requestTime) {
        return alert("Please fill out all fields.");
      }

      const userID = 1; // Replace with session-based user ID if available

      const requestData = {
        userID,
        category,
        description,
        request_date: requestDate,
        request_time: requestTime,
        status: "Pending"
      };

      try {
        const res = await fetch("http://localhost:3000/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData)
        });

        const result = await res.json();

        if (res.ok) {
          alert("Request submitted successfully!");
          fetchRequests(); // reload request list
        } else {
          alert(result.error || "Submission failed.");
        }
      } catch (err) {
        console.error("Submission error:", err);
        alert("Server error occurred.");
      }
    });
  }

  // Handle cancel buttons
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      if (confirm("Are you sure you want to cancel this request?")) {
        this.closest(".request-item").remove();
      }
    });
  });

  // Initial fetch of existing requests
  fetchRequests();
});

async function fetchRequests() {
  try {
    console.log("Fetching requests...");
    const res = await fetch("http://localhost:3000/api/requests");
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Data received:", data);
    
    // Make sure data is an array
    if (Array.isArray(data)) {
      renderRequests(data);
    } else {
      console.error("Expected array, got:", typeof data, data);
      renderRequests([]); // Render empty array
    }
  } catch (error) {
    console.error("Error fetching requests:", error);
    renderRequests([]); // Render empty array on error
  }
}
function renderRequests(requests) {
  const requestsContainer = document.querySelector(".requests-section");
   if (!Array.isArray(requests) || requests.length === 0) {
    requestsContainer.innerHTML = `
      <h2 class="section-title">My Requests</h2>
      <div class="request-item">
        <p>No requests found.</p>
      </div>
    `;
    return;
  }
  
  requestsContainer.innerHTML = `
    <h2 class="section-title">My Requests</h2>
    ${requests.map(request => `
      <div class="request-item">
        <div class="request-header">
          <div><div class="request-date">${formatDate(request.request_date)}</div></div>
          <div class="request-time">${formatTime(request.request_time)}</div>
        </div>
        <div class="request-title">${capitalizeFirst(request.category)}</div>
        <div class="request-description">${request.description}</div>
        <div class="request-footer">
          <div>
            <div style="font-weight: 500; font-size: 14px; color: var(--dark-gray); margin-bottom: 4px;">Status</div>
            <span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span>
          </div>
          ${request.status !== "Completed" ? '<button class="cancel-btn">Cancel</button>' : ""}
        </div>
      </div>
    `).join("")}
  `;

  // Rebind cancel buttons
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      if (confirm("Are you sure you want to cancel this request?")) {
        this.closest(".request-item").remove();
        // Optionally call backend DELETE here
      }
    });
  });
}
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", weekday: "long" });
}

function formatTime(timeStr) {
  const [hour, minute] = timeStr.split(":");
  return `${(+hour % 12 || 12)}:${minute}${+hour >= 12 ? "PM" : "AM"}`;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

