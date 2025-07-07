const MedicationModel = require('../models/medicationModel');

exports.getMedications = async (req, res) => {
  const data = await MedicationModel.getAll();
  res.json(data);
};

exports.addMedication = async (req, res) => {
  const newMed = req.body;
  await MedicationModel.create(newMed);
  res.status(201).json({ message: 'Medication added' });
};

exports.updateMedication = async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  await MedicationModel.update(id, updated);
  res.json({ message: 'Medication updated' });
};

exports.deleteMedication = async (req, res) => {
  const { id } = req.params;
  await MedicationModel.remove(id);
  res.json({ message: 'Medication deleted' });
};
