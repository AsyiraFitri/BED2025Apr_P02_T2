// helper function to retrieve user from sessionStorage
function getUserFromToken() {
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    return null;
  }

  // Split token into three parts: [header].[payload].[signature]
  const base64Payload = token.split('.')[1];

  // Decode the base64-encoded payload
  const decodedPayload = atob(base64Payload);

  // Parse the payload as JSON and return the user info
  try {
    const user = JSON.parse(decodedPayload);
    return user;  // This will be the decoded user data
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

function isTokenExpired(token) {
  if (!token) return true;
  const payload = JSON.parse(atob(token.split('.')[1]));
  const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
  return currentTime >= payload.exp;
}

// function to check authentication status
function checkUserAuthentication() {
  const token = sessionStorage.getItem('token');
  
  if (!token || isTokenExpired(token)) {
    alert('Please log in first');
    window.location.href = 'auth.html';
    return null;
  }

  try {
    const user = getUserFromToken();
    if (!user) {
      alert('Please log in again');
      sessionStorage.removeItem('token');
      window.location.href = 'auth.html';
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    alert('Please log in again');
    sessionStorage.removeItem('token');
    window.location.href = 'auth.html';
    return null;
  }
}

const token = sessionStorage.getItem('token');  // jwt stored in sessionStorage
const noteTextInput = document.getElementById("noteText");  // text input for note content
let editingNoteId = null;  // initially, no note is being edited

// wait for the dom to fully load before executing the code
document.addEventListener("DOMContentLoaded", () => {
  const user = checkUserAuthentication();
  if (!user) return; // stop execution if not authenticated
  // api base url and token setup
  const apiBaseUrl = "http://localhost:3000/api";  // api base url

  const fromSelect = document.getElementById("fromSelect");  // dropdown for "from address"
  const toSelect = document.getElementById("toSelect");  // dropdown for "to address"
  const noteModal = document.getElementById("noteModal");  // modal for adding/editing notes
  const saveNoteBtn = document.getElementById("saveNoteBtn");  // button to save the note
  const notesList = document.getElementById("notesList");  // list where notes will be displayed
  const userId = user.UserID || user.id;  // get the user id from the session storage

  // check if the user is authenticated
  if (!token) {
    console.error("no token found, please log in.");
    return;
  }

  if (!userId) {
    console.error("no userID is found, please log in.");
    return;
  }

  // function to get both selected addresses
  function getSelectedAddresses() {
    const fromAddress = fromSelect.value;
    const toAddress = toSelect.value;
    return { fromAddress, toAddress };
  }

  // function to check if at least one address is selected
  function areAddressesValid() {
    const { fromAddress, toAddress } = getSelectedAddresses();
    return fromAddress !== "" || toAddress !== "";  // at least one address should be set
  }

  // function to fetch notes for the selected addresses
  async function fetchNotes() {
    const { fromAddress, toAddress } = getSelectedAddresses();  // get both selected addresses

    // check if any address is selected
    if (!areAddressesValid()) {
      console.log("please select at least one address before fetching notes.");
      notesList.innerHTML = '<p>please select an address to view notes.</p>';
      return;  // don't fetch if neither address is selected
    }

    try {
      const allNotes = [];

      // fetch notes for the "from" address if set
      if (fromAddress !== "") {
        const responseFrom = await fetch(`${apiBaseUrl}/place-notes/${fromAddress}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`  // attach token in the authorization header
          }
        });

        if (!responseFrom.ok) {
          console.error("error fetching 'from' address notes");
        } else {
          const notesFrom = await responseFrom.json();
          allNotes.push(...notesFrom);  // add 'from' notes to allNotes
        }
      }

      // fetch notes for the "to" address if set
      if (toAddress !== "") {
        const responseTo = await fetch(`${apiBaseUrl}/place-notes/${toAddress}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`  // attach token in the authorization header
          }
        });

        if (!responseTo.ok) {
          console.error("error fetching 'to' address notes");
        } else {
          const notesTo = await responseTo.json();
          if (notesTo.length === 0) {
          allNotes.push({ address: toAddress, message: "No notes available for this address" });
        } else {
          allNotes.push(...notesTo);  // add 'to' notes to allNotes
        }
        }
      }

      // render the notes after fetching them
      renderNotes(allNotes);  // render all fetched notes (from either or both addresses)
    } catch (error) {
      console.error("error fetching notes:", error);
      notesList.innerHTML = '<p>failed to fetch notes. please try again later.</p>';
    }
  }

  // function to render notes in the dom
  function renderNotes(notes) {
    notesList.innerHTML = '';  // clear existing notes

    // check if there are no notes
    if (notes.length === 0) {
      notesList.innerHTML = '<p>no notes available.</p>';  // show a message if there are no notes
      return;
    }

    // group notes by address
    const groupedNotes = notes.reduce((groups, note) => {
      const address = note.Address;
      if (!groups[address]) {
        groups[address] = [];
      }
      groups[address].push(note);  // add note to the respective address group
      return groups;
    }, {});

    // loop through each address and display its notes
    for (const address in groupedNotes) {
        // create a div element for each address section
        const addressSection = document.createElement('div');
        // add class to the div element
        addressSection.classList.add('address-section');
        const addressHeader = document.createElement('h4');
        addressHeader.textContent = address;  // display the address as the header
        addressSection.appendChild(addressHeader);

        // loop through notes of the current address
        groupedNotes[address].forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.id = `note-${note.NoteID}`;
        noteElement.classList.add('note');
        noteElement.innerHTML = `
            <div class="note-text">
                <p>${note.NoteText}</p>
            </div>
            <div class="note-actions" id="noteActions" style="display:none";>
            <button onclick="editNote(${note.NoteID})">edit</button>
            <button onclick="deleteNote(${note.NoteID})">delete</button>
            </div>
            `;
        addressSection.appendChild(noteElement);
      });

      // append the address section to the notes list
      notesList.appendChild(addressSection);
    } 
  }

  // save a new note
  saveNoteBtn.addEventListener("click", async () => {
    const noteText = noteTextInput.value;
    if (!noteText) {
      alert("please enter a note.");
      return;
    }

    // check which radio button is selected
    const selectedRadio = document.querySelector('input[name="addressRadio"]:checked');
    const selectedAddress = selectedRadio ? selectedRadio.value : null;  // get value (from or to)

    // ensure that an address is selected
    if (!selectedAddress) {
      alert("please select either 'from address' or 'to address'.");
      return;
    }

    const { fromAddress, toAddress } = getSelectedAddresses();  // get both selected addresses

    try {
      const method = editingNoteId ? 'PUT' : 'POST';  // determine if we're editing or adding
      const allResponses = [];

      // determine which address to save the note for based on the radio selection
      if (selectedAddress === "from" && fromAddress) {
        const responseFrom = await fetch(`${apiBaseUrl}/place-notes${editingNoteId ? `/${editingNoteId}` : ''}`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // attach token to request
          },
          body: JSON.stringify({ userId, address: fromAddress, noteText })
        });
        allResponses.push(responseFrom);
      } else if (selectedAddress === "to" && toAddress) {
        const responseTo = await fetch(`${apiBaseUrl}/place-notes${editingNoteId ? `/${editingNoteId}` : ''}`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // attach token to request
          },
          body: JSON.stringify({ userId, address: toAddress, noteText })
        });
        allResponses.push(responseTo);
      }

      // wait for all save operations to complete and check if they were successful
      const responses = await Promise.all(allResponses);

      if (responses.some(response => !response.ok)) {
        throw new Error("error saving note");
      }

      noteTextInput.value = '';  // clear input field
      fetchNotes();  // re-fetch and display the updated notes
      noteModal.style.display = 'none';  // close the modal
    } catch (error) {
      console.error("error saving note:", error);
    }
  });

  // close the modal when the close button is clicked
  document.querySelector(".close").addEventListener("click", () => {
    noteModal.style.display = "none";
    editingNoteId = null;  // reset editing state
    saveNoteBtn.textContent = "save note";  // reset button text to "save note"
    document.getElementById("modalHeader").textContent = "Add note";  // reset header text
    document.getElementById("addressSelection").style.display = 'block'; 
  });

  // open the modal when the add note button is clicked
  document.getElementById("addnotebtn").addEventListener("click", () => {
    editingNoteId = null;  // reset editing state
    saveNoteBtn.textContent = "save note";  // reset button text to "save note"
    document.getElementById("modalHeader").textContent = "Add note";  // reset header text
    document.getElementById("addressSelection").style.display = 'block'
    noteTextInput.value = '';  // clear the input field
    noteModal.style.display = "block";  // show the modal
  });

  // fetch notes when the page loads (based on selected addresses)
  fetchNotes();

  // add event listeners to update notes when either address changes
  fromSelect.addEventListener("input", fetchNotes);
  toSelect.addEventListener("input", fetchNotes);

  // add an event listener for the global edit icon to toggle visibility of note actions
  const globalEditIcon = document.getElementById("editnotebtn");
  globalEditIcon.addEventListener("click", () => {
    const noteActions = document.querySelectorAll(".note-actions");
    noteActions.forEach(action => {
      action.style.display = action.style.display === "none" || action.style.display === "" ? "block" : "none";
    });
  });

  window.fetchNotes = fetchNotes;  // make fetchNotes available globally
});

// function to handle note editing
async function editNote(noteId) {
  const noteElement = document.getElementById(`note-${noteId}`);

  if (!noteElement) {
    console.error("note element not found!");
    return;  // early return if the note element doesn't exist
  }

  const noteText = noteElement.querySelector('.note-text p').textContent;

  if (!noteText) {
    console.error("note text not found!");
    return;
  }

  noteTextInput.value = noteText;

  // set the editing mode
  editingNoteId = noteId;  // save the note ID to the editingNoteId variable

  // hide address selection dropdowns
  document.getElementById("addressSelection").style.display = 'none'; 

  // update the button text to "save changes"
  saveNoteBtn.textContent = "Save changes";  
  document.getElementById("modalHeader").textContent = "Editing Note";  // update header text
  noteModal.style.display = 'block';  // show the modal
}

// function to handle note deletion
async function deleteNote(noteId) {
  const confirmation = confirm("are you sure you want to delete this note?");
  if (!confirmation) {
    return;
  }
    // check if the token exists
  if (!token) {
    console.error("No token found, cannot delete note.");
    return;  // stop execution if no token is available
  }

  try {
    const response = await fetch(`${apiBaseUrl}/place-notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("error deleting the note");
    }

    fetchNotes();  // re-fetch and render updated notes
  } catch (error) {
    console.error("error deleting note:", error);
  }
}

// Clear the existing notes from the DOM
function clearNotes() {
  const notesList = document.getElementById('notesList');
  notesList.innerHTML = '';  // This will clear the notes list
}
