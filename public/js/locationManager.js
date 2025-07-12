document.addEventListener("DOMContentLoaded", () => {
  const userId = 1; // replace with dynamic user ID
  const apiBaseUrl = "http://localhost:3000";

  const savedPlacesList = document.getElementById("savedPlacesList");
  const addPlaceModal = document.getElementById("addPlaceModal");
  const closeModalBtn = document.querySelector(".close-btn");
  const savePlaceBtn = document.getElementById("savePlaceBtn");

  let showEditButtons = false;
  let currentEditPlaceId = null; // track editing mode

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

      savedPlacesList.appendChild(li);
    });

    attachButtonListeners();
  }

  // attach event listeners to edit and delete buttons (only those with data-place-id)
  function attachButtonListeners() {
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const placeId = this.getAttribute("data-place-id");
        if (confirm("are you sure you want to delete this place?")) {
          deletePlace(placeId);
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach((button) => {
      // only add confirmation if button has data-place-id (exclude any other edit buttons)
      if (button.hasAttribute("data-place-id")) {
        button.addEventListener("click", function () {
          const placeId = this.getAttribute("data-place-id");
          if (confirm("do you want to edit this place?")) {
            editPlace(placeId);
          }
        });
      }
    });
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
          savePlaceBtn.textContent = "Update Place";
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
    showEditButtons = !showEditButtons; // toggle boolean flag
    editPlacesBtn.textContent = showEditButtons ? "Done" : "Edit"; // update toggle button text
    loadSavedPlaces();
  });

  // initial load of saved places on page ready
  loadSavedPlaces();
});
