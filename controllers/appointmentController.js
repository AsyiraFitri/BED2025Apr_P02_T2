const appointmentModel = require("../models/appointmentModel");

// Get all appointments by user ID
// - Uses validated user ID from middleware (req.validatedUserId)
// - Calls the model function to fetch all appointments for the user
async function getAppointmentsByUserId(req, res) {
  try {
    // Get validated user ID from middleware
    const userId = req.validatedUserId;
    
    // Call model to fetch appointments
    const appointments = await appointmentModel.getAppointmentsByUserId(userId);
    res.json(appointments);
  } catch (error) {
    console.error("Controller error (getAppointmentsByUserId):", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
}

// Get one appointment by ID
// - Uses validated appointment ID from middleware (req.validatedId)
// - Calls model to return a single appointment based on AppointmentID
async function getAppointmentById(req, res) {
  try {
    // Get validated appointment ID from middleware
    const id = req.validatedId;
    
    // Call model to fetch specific appointment
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
// - Uses validated appointment data from middleware (req.validatedData)
// - Calls the model to insert the validated appointment
async function createAppointment(req, res) {
  try {
    // Get validated appointment data from middleware
    const appointment = req.validatedData;
    
    // Call model to create appointment
    await appointmentModel.createAppointment(appointment);
    
    // Fetch the latest appointment for this user to get the ID
    const userAppointments = await appointmentModel.getAppointmentsByUserId(appointment.UserID);
    let appointmentId = null;
    
    if (userAppointments && userAppointments.length > 0) {
      // Get the most recent appointment (assuming it's the one we just created)
      const latestAppointment = userAppointments[userAppointments.length - 1];
      appointmentId = latestAppointment.AppointmentID;
    }
    
    res.status(201).json({ 
      message: "Appointment created successfully", 
      AppointmentID: appointmentId,
      appointment: { ...appointment, AppointmentID: appointmentId }
    });
  } catch (error) {
    console.error("Controller error (createAppointment):", error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
}

// Update appointment by ID
// - Uses validated ID from middleware (req.validatedId)
// - Uses validated appointment data from middleware (req.validatedData)
// - Updates appointment via model
async function updateAppointment(req, res) {
  try {
    // Get validated data from middleware
    const id = req.validatedId;
    const appointment = req.validatedData;
    
    // Call model to update appointment
    await appointmentModel.updateAppointment(id, appointment);
    res.json({ message: "Appointment updated successfully", appointment: { ...appointment, AppointmentID: id } });
  } catch (error) {
    console.error("Controller error (updateAppointment):", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
}

// Delete appointment by ID
// - Uses validated appointment ID from middleware (req.validatedId)
// - Calls model to delete the appointment from the database
async function deleteAppointment(req, res) {
  try {
    // Get validated appointment ID from middleware
    const id = req.validatedId;
    
    // Call model to delete appointment
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
