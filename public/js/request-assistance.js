document.addEventListener("DOMContentLoaded", () => {
  // ===== MOBILE MENU TOGGLE =====
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu") || document.querySelector(".navbar-nav");
  
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      navMenu.classList.toggle("show");
    });

    // Close menu when clicking outside
    document.addEventListener("click", function(event) {
      if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
        navMenu.classList.remove("show");
      }
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
  btn.addEventListener("click", async function () {
    if (confirm("Are you sure you want to cancel this request?")) {
      const RequestID = this.dataset.id;
      await deleteRequest(RequestID);
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
    //debug line to see the structure of each request
    if (Array.isArray(data) && data.length > 0) {
      console.log("First request structure:", data[0]);
      console.log("Available keys:", Object.keys(data[0]));
    }
    
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
   // DEBUG
  console.log('DEBUG - requests:', requests);
  if (requests && requests.length > 0) {
    console.log('DEBUG - first request keys:', Object.keys(requests[0]));
    console.log('DEBUG - first request:', requests[0]);
  }
  
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
       ${request.status !== "Completed" ? `<button class="cancel-btn" data-id="${request.RequestID}">Cancel</button>` : ""}
        </div>
      </div>
    `).join("")}
  `;

  // Rebind cancel buttons
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", async function () {
      if (confirm("Are you sure you want to cancel this request?")) {
        const RequestID = this.dataset.id;
        await deleteRequest(RequestID); // Call your existing deleteRequest function
      }
    });
  });
}
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", weekday: "long" });
}

function formatTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return "N/A";
  const [hour, minute] = timeStr.split(":");
  return `${(+hour % 12 || 12)}:${minute}${+hour >= 12 ? "PM" : "AM"}`;
}


function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
window.addEventListener("scroll", function () {
  const btn = document.getElementById("scrollTopBtn");
  btn.style.display = window.scrollY > 200 ? "block" : "none";
});

const scrollTopBtn = document.getElementById("scrollTopBtn");
if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
// Function to delete a request
async function deleteRequest(RequestID) {
  try {
    console.log('Attempting to delete request ID:', RequestID); // Debug log
    
    const res = await fetch(`http://localhost:3000/api/requests/${RequestID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    console.log('Response status:', res.status); // Debug log
    console.log('Response headers:', res.headers); // Debug log
    
    // Log the actual response text before trying to parse as JSON
    const responseText = await res.text();
    console.log('Raw response:', responseText); // Debug log

    // Only try to parse as JSON if it looks like JSON
    let result;
    if (responseText.startsWith('{') || responseText.startsWith('[')) {
      result = JSON.parse(responseText);
    } else {
      console.error('Server returned HTML instead of JSON:', responseText);
      alert('Server error - check console for details');
      return;
    }

    if (res.ok) {
      alert("Request cancelled successfully!");
      fetchRequests(); // Reload the list
    } else {
      alert(result.error || "Failed to cancel request.");
    }
  } catch (error) {
    console.error("Error cancelling request:", error);
    alert("Server error occurred.");
  }
}
// Function to update request status to completed
async function completeRequest(RequestID) {
  try {
    const res = await fetch(`http://localhost:3000/api/requests/${RequestID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Completed" })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Request marked as completed!");
      fetchRequests(); // Reload the list
    } else {
      alert(result.error || "Failed to update request.");
    }
  } catch (error) {
    console.error("Error updating request:", error);
    alert("Server error occurred.");
  }
}