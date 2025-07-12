const appointmentModel = require("../models/appointmentModel");

// Get all appointments by user ID
// - Calls the model function to fetch all appointments for the user
async function getAppointmentsByUserId(req, res) {
  try {
    const userId = parseInt(req.params.userid);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const appointments = await appointmentModel.getAppointmentsByUserId(userId);
    res.json(appointments);
  } catch (error) {
    console.error("Controller error (getAppointmentsByUserId):", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
}

// Get one appointment by ID
// - Calls model to return a single appointment based on AppointmentID
async function getAppointmentById(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const appointment = await appointmentModel.getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Controller error (getAppointmentById):", error);
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
}

// Create a new appointment
// - Builds an appointment object and calls the model to insert it
async function createAppointment(req, res) {
  try {
    const appointment = {
      date: req.body.Date,
      AppointmentTime: req.body.Time,
      Title: req.body.Title,
      Location: req.body.Location,
      DoctorName: req.body.DoctorName,
      Notes: req.body.Notes || "No special instructions",
      UserID: 1 // Replace with req.user.userID when JWT is implemented
    };

    await appointmentModel.createAppointment(appointment);
    res.status(201).json({ message: "Appointment created successfully" });
  } catch (error) {
    console.error("Controller error (createAppointment):", error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
}

// Update appointment by ID
// - Validates ID, builds new appointment object and updates via model
async function updateAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const appointment = {
      AppointmentDate: req.body.Date,
      AppointmentTime: req.body.Time,
      Title: req.body.Title,
      Location: req.body.Location,
      DoctorName: req.body.DoctorName,
      Notes: req.body.Notes || "No special instructions"
    };

    await appointmentModel.updateAppointment(id, appointment);
    res.json({ message: "Appointment updated successfully" });
  } catch (error) {
    console.error("Controller error (updateAppointment):", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
}

// Delete appointment by ID
// - Calls model to delete the appointment from the database
async function deleteAppointment(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    await appointmentModel.deleteAppointment(id);
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Controller error (deleteAppointment):", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
}

module.exports = {
  getAppointmentsByUserId,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
