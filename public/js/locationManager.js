document.addEventListener("DOMContentLoaded", () => {
  const userId = 1; // user id (replace with dynamic user ID)
  const apiBaseUrl = "http://localhost:3000";

  const savedPlacesList = document.getElementById("savedPlacesList");
  const addPlaceModal = document.getElementById("addPlaceModal");
  const closeModalBtn = document.querySelector(".close-btn");
  const savePlaceBtn = document.getElementById("savePlaceBtn");

  let showEditButtons = false;
  let currentEditPlaceId = null; // track the place being edited

  // load saved places from backend
  async function loadSavedPlaces() {
    try {
      const response = await fetch(`${apiBaseUrl}/places/${userId}`);
      const places = await response.json();
      displaySavedPlaces(places);
    } catch (error) {
      console.error("error loading saved places:", error);
    }
  }

  // display places in the list with optional edit/delete buttons
  function displaySavedPlaces(places) {
    savedPlacesList.innerHTML = "";
    places.forEach((place) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item");

      li.innerHTML = `
        <strong>${place.PlaceName}</strong><br/>
        <span>${place.Address}</span><br/>
        ${showEditButtons ? `
          <button class="btn btn-warning btn-sm edit-btn" data-place-id="${place.PlaceID}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-place-id="${place.PlaceID}">Delete</button>
        ` : ""}
      `;

      li.addEventListener("click", () => promptAddPlace(place));

      savedPlacesList.appendChild(li);

      const editButton = li.querySelector(".edit-btn");
      if (editButton) {
        editButton.addEventListener("click", function (event) {
          event.stopPropagation(); // prevent li click event
          const placeId = this.getAttribute("data-place-id");
          if (confirm("do you want to edit this place?")) {
            editPlace(placeId);
          }
        });
      }

      const deleteButton = li.querySelector(".delete-btn");
      if (deleteButton) {
        deleteButton.addEventListener("click", function (event) {
          event.stopPropagation(); // prevent li click event
          const placeId = this.getAttribute("data-place-id");
          if (confirm("are you sure you want to delete this place?")) {
            deletePlace(placeId);
          }
        });
      }
    });
  }

  // custom modal to prompt user to add place to "from" or "to"
  function promptAddPlace(place) {
    // create custom modal with buttons for from and to
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
      <div class="modal-content">
        <p>Do you want to add "${place.PlaceName}" to your route?<br>
            if NO, click <strong>Cancel</strong><br>
            if YES, click <strong>From</strong> and/or <strong>To</strong> to add location.
        </p>

        <button class="btn btn-primary" id="addToFromBtn">From</button>
        <button class="btn btn-secondary" id="addToToBtn">To</button>
        <button class="btn btn-danger" id="cancelAddBtn">Cancel</button>
      </div>
    `;

    // append modal to body
    document.body.appendChild(modal);

    // add event listeners for buttons
    const addToFromBtn = modal.querySelector("#addToFromBtn");
    const addToToBtn = modal.querySelector("#addToToBtn");
    const cancelAddBtn = modal.querySelector("#cancelAddBtn");

    addToFromBtn.addEventListener("click", () => {
      document.getElementById("fromSelect").value = place.Address;
      closeCustomModal(modal);
    });

    addToToBtn.addEventListener("click", () => {
      document.getElementById("toSelect").value = place.Address;
      closeCustomModal(modal);
    });

    cancelAddBtn.addEventListener("click", () => {
      closeCustomModal(modal);
    });
  }

  // close and remove custom modal
  function closeCustomModal(modal) {
    modal.style.display = "none";
    document.body.removeChild(modal);
  }

  // add a new place after confirmation and validation
  async function addNewPlace() {
    if (!confirm("do you want to add this new place?")) return;

    const placeName = document.getElementById("placeName").value;
    const address = document.getElementById("address").value;

    if (!placeName || !address) {
      alert("please fill in both fields!");
      return;
    }

    const placeData = { userId, placeName, address };

    try {
      const response = await fetch(`${apiBaseUrl}/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(placeData),
      });

      const result = await response.json();
      if (response.status === 201) {
        alert(result.message);
        loadSavedPlaces();
        closeModal();
      } else {
        alert("failed to add place!");
      }
    } catch (error) {
      console.error("error adding place:", error);
    }
  }

  // populate modal for editing a selected place
  function editPlace(placeId) {
    fetch(`${apiBaseUrl}/places/${userId}`)
      .then(res => res.json())
      .then(places => {
        const place = places.find(p => p.PlaceID === parseInt(placeId));
        if (place) {
          document.getElementById("placeName").value = place.PlaceName;
          document.getElementById("address").value = place.Address;
          currentEditPlaceId = place.PlaceID;
          document.querySelector("#addPlaceModal h3").textContent = "update place";
          savePlaceBtn.textContent = "update place";
          addPlaceModal.style.display = "block";
        }
      })
      .catch(err => console.error("error loading place for edit:", err));
  }

  // update place after confirmation and validation
  async function updatePlace(placeId) {
    if (!confirm("do you want to update this place?")) return;

    const placeName = document.getElementById("placeName").value;
    const address = document.getElementById("address").value;

    if (!placeName || !address) {
      alert("please fill in both fields!");
      return;
    }

    const updatedData = { placeName, address };

    try {
      const response = await fetch(`${apiBaseUrl}/places/${placeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        loadSavedPlaces();
        closeModal();
      } else {
        alert("failed to update place!");
      }
    } catch (error) {
      console.error("error updating place:", error);
    }
  }

  // delete place after confirmation
  async function deletePlace(placeId) {
    try {
      const response = await fetch(`${apiBaseUrl}/places/${placeId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (response.status === 200) {
        alert(result.message);
        loadSavedPlaces();
      } else {
        alert("failed to delete place!");
      }
    } catch (error) {
      console.error("error deleting place:", error);
    }
  }

  // open modal for adding new place
  document.getElementById("addPlaceBtn").addEventListener("click", () => {
    addPlaceModal.style.display = "block";
    savePlaceBtn.textContent = "save place";
    currentEditPlaceId = null;
  });

  // close modal and reset fields
  closeModalBtn.addEventListener("click", closeModal);

  function closeModal() {
    addPlaceModal.style.display = "none";
    document.getElementById("placeName").value = "";
    document.getElementById("address").value = "";
    currentEditPlaceId = null;
    savePlaceBtn.textContent = "save place";
  }

  // save or update place depending on mode
  savePlaceBtn.addEventListener("click", () => {
    if (currentEditPlaceId) {
      updatePlace(currentEditPlaceId);
    } else {
      addNewPlace();
    }
  });

  // toggle visibility of edit/delete buttons next to each place
  const editPlacesBtn = document.getElementById("editPlacesBtn");
  editPlacesBtn.addEventListener("click", () => {
    showEditButtons = !showEditButtons; // toggle visibility
    editPlacesBtn.textContent = showEditButtons ? "Done" : "Edit"; // update button text
    loadSavedPlaces();
  });

  // initial load of saved places
  loadSavedPlaces();
});
