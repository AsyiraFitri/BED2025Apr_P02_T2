const appointmentModel = require('../models/appointmentModel');

// GET appointments by user ID
async function getAppointmentsByUserId(req, res) {
  const userId = parseInt(req.params.userid, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    const appointments = await appointmentModel.getAppointmentsByUserId(userId);
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

// GET appointment by appointment ID
async function getAppointmentById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid appointment ID' });
  }
  try {
    const appointment = await appointmentModel.getAppointmentById(id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
}

// POST create a new appointment
async function createAppointment(req, res) {
  try {
    const appointment = {
      date: req.body.Date,                         // string from frontend; converted to Date in model
      AppointmentTime: req.body.Time,
      Title: req.body.Title,
      Location: req.body.Location,
      DoctorName: req.body.DoctorName,
      Notes: req.body.Notes || 'No special instructions',
      UserID: 1  // hardcoded user id for now, replace with req.session.userId when auth ready
    };

    await appointmentModel.createAppointment(appointment);
    res.status(201).json({ message: 'Appointment created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
}

// PUT update appointment by ID
async function updateAppointment(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid appointment ID' });

  try {
    const appointment = {
      AppointmentDate: req.body.Date,
      AppointmentTime: req.body.Time,
      Title: req.body.Title,
      Location: req.body.Location,
      DoctorName: req.body.DoctorName,
      Notes: req.body.Notes || 'No special instructions'
    };

    await appointmentModel.updateAppointment(id, appointment);
    res.json({ message: 'Appointment updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
}

// DELETE appointment by ID
async function deleteAppointment(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid appointment ID' });

  try {
    await appointmentModel.deleteAppointment(id);
    res.json({ message: 'Appointment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
}

module.exports = {
  getAppointmentsByUserId,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
