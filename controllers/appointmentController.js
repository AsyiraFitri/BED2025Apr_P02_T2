const AppointmentModel = require('../public/models/appointmentModel');

exports.getAppointments = async (req, res) => {
  const data = await AppointmentModel.getAll();
  res.json(data);
};

exports.addAppointment = async (req, res) => {
  const newAppointment = req.body;
  await AppointmentModel.create(newAppointment);
  res.status(201).json({ message: 'Appointment added' });
};

exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  await AppointmentModel.update(id, updated);
  res.json({ message: 'Appointment updated' });
};

exports.deleteAppointment = async (req, res) => {
  const { id } = req.params;
  await AppointmentModel.remove(id);
  res.json({ message: 'Appointment deleted' });
};
