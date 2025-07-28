document.addEventListener("DOMContentLoaded", () => {
  // api base url and token setup
  const apiBaseUrl = "http://localhost:3000";
  const token = sessionStorage.getItem('token');  // jwt stored in sessionStorage
  const user = JSON.parse(sessionStorage.getItem('user'));  // retrieve user object from sessionStorage
  const userId = user.UserID;
  const savedPlacesList = document.getElementById("savedPlacesList");
  const addPlaceModal = document.getElementById("addPlaceModal");
  const closeModalBtn = document.querySelector(".close-btn");
  const savePlaceBtn = document.getElementById("savePlaceBtn");

  let showEditButtons = false;
  let currentEditPlaceId = null; // track the place being edited

  // function to load saved places from backend
  async function loadSavedPlaces() {
    if (!token) {
      console.error("no token found, please log in.");
      return;
    }

    if (!user.UserID) {
      console.error("no userid is found, please log in.");
      return;
    }

    try {
      // fetch request to get places data
      const response = await fetch(`${apiBaseUrl}/api/places/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}` // send token in headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("error:", error.error);
        return;
      }

      // display fetched places on the page
      const places = await response.json();
      displaySavedPlaces(places);
    } catch (error) {
      console.error("error loading saved places:", error);
    }
  }

  // function to display saved places with optional edit/delete buttons
  function displaySavedPlaces(places) {
    savedPlacesList.innerHTML = ""; // clear the list first
    places.forEach((place) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item");

      // generate place item content
      li.innerHTML = `
        <strong>${place.PlaceName}</strong><br/>
        <span>${place.Address}</span><br/>
        ${showEditButtons ? `
          <button class="btn btn-warning btn-sm edit-btn" data-place-id="${place.PlaceID}">edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-place-id="${place.PlaceID}">delete</button>
        ` : ""}
      `;

      // add click event to prompt for adding place
      li.addEventListener("click", () => promptAddPlace(place));

      savedPlacesList.appendChild(li);

      // add event listener for edit button
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

      // add event listener for delete button
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

  // function to prompt user to add place to "from" or "to" in a custom modal
  function promptAddPlace(place) {
    // create custom modal with buttons for from and to
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
      <div class="modal-content">
        <p>do you want to add "${place.PlaceName}" to your route?<br>
            if no, click <strong>cancel</strong><br>
            if yes, click <strong>from</strong> and/or <strong>to</strong> to add location.
        </p>

        <button class="btn btn-primary" id="addToFromBtn">from</button>
        <button class="btn btn-secondary" id="addToToBtn">to</button>
        <button class="btn btn-danger" id="cancelAddBtn">cancel</button>
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
      fetchNotes();
    });

    addToToBtn.addEventListener("click", () => {
      document.getElementById("toSelect").value = place.Address;
      closeCustomModal(modal);
      fetchNotes();
    });

    cancelAddBtn.addEventListener("click", () => {
      closeCustomModal(modal);
      fetchNotes();
    });
  }

  // function to close and remove custom modal
  function closeCustomModal(modal) {
    modal.style.display = "none";
    document.body.removeChild(modal);
  }

  // function to add a new place after confirmation and validation
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
      // fetch request to add a new place
      const response = await fetch(`${apiBaseUrl}/api/places`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,  
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(placeData),
      });

      const result = await response.json();
      if (response.status === 201) {
        alert(result.message);
        loadSavedPlaces(); // reload saved places
        closeModal();
      } else {
        alert("failed to add place!");
      }
    } catch (error) {
      console.error("error adding place:", error);
    }
  }

  // function to populate modal for editing a selected place
  function editPlace(placeId) {
    fetch(`${apiBaseUrl}/api/places/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`, // send token in headers
      }
    })
      .then(res => res.json())
      .then(places => {
        console.log("fetched places:", places);
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

  // function to update place after confirmation and validation
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
      // fetch request to update place
      const response = await fetch(`${apiBaseUrl}/api/places/${placeId}`, {
        method: "PUT",
        headers: { 
          'Authorization': `Bearer ${token}`,  
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        loadSavedPlaces(); // reload saved places
        closeModal();
      } else {
        alert("failed to update place!");
      }
    } catch (error) {
      console.error("error updating place:", error);
    }
  }

  // function to delete place after confirmation
  async function deletePlace(placeId) {
    try {
      // fetch request to delete place
      const response = await fetch(`${apiBaseUrl}/api/places/${placeId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`  // corrected to use backticks
        },
        method: "DELETE",
      });

      const result = await response.json();
      if (response.status === 200) {
        alert(result.message);
        loadSavedPlaces(); // reload saved places
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
    document.querySelector("#addPlaceModal h3").textContent = "add new place";
    savePlaceBtn.textContent = "save place";
    currentEditPlaceId = null;
  });
    // close modal and reset fields
  closeModalBtn.addEventListener("click", closeModal);

  // function to close modal and reset fields
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
