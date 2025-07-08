const medicationModel = require('../models/medicationModel');

// GET all medications by user ID
async function getMedicationsByUserId(req, res) {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const medications = await medicationModel.getMedicationsByUserId(userId);
    res.json(medications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
}

// GET medication by medication ID
async function getMedicationById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid medication ID' });

  try {
    const medication = await medicationModel.getMedicationById(id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    res.json(medication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch medication' });
  }
}

// POST create new medication
async function createMedication(req, res) {
  try {
    const medication = req.body;
    await medicationModel.createMedication(medication);
    res.status(201).json({ message: 'Medication created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create medication' });
  }
}

// PUT update medication by medication ID
async function updateMedication(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid medication ID' });

  try {
    const medication = req.body;
    await medicationModel.updateMedication(id, medication);
    res.json({ message: 'Medication updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update medication' });
  }
}

// DELETE medication by medication ID
async function deleteMedication(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid medication ID' });

  try {
    await medicationModel.deleteMedication(id);
    res.json({ message: 'Medication deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete medication' });
  }
}

module.exports = {
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  updateMedication,
  deleteMedication
};
