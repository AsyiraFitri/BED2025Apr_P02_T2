const contactModel = require('../models/contactModel');

const createContact = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id; // get user ID from JWT

    const result = await contactModel.createContact(name, phone, userId);
    res.status(201).json({ message: 'Contact added successfully', data: result });
  } catch (err) {
    console.error('Error adding contact:', err);
    res.status(500).json({ error: 'Failed to add contact' });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = await contactModel.getAllContactsByUser(userId);
    res.json(contacts);
  } catch (err) {
    console.error('Error retrieving contacts:', err);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

module.exports = { createContact, getAllContacts };
