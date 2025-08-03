// This controller handles all CRUD operations for emergency contacts.
// It communicates with the contactModel for database queries and returns JSON responses.

const contactModel = require('../models/contactModel');

/** GET /api/contacts
* Retrieve all contacts for the currently authenticated user */ 

async function getAllContacts(req, res) {
  try {
    const userId = req.user.id;
    const contacts = await contactModel.getAllContactsByUser(userId);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
}
/** POST /api/contacts
 * Create a new contact for the authenticated user */

async function createContact(req, res) {
  try {
    const userId = req.user.id;
    const { name, relationship, phone, note, isStarred } = req.body;

    const newContact = await contactModel.createContact({
      name: name.trim(),
      relationship: relationship?.trim() || '',
      phone: phone.trim(),
      note: note?.trim() || '',
      isStarred: Boolean(isStarred),
      userId
    });

    res.status(201).json({ 
      message: 'Contact added successfully', 
      data: newContact 
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error.code === 'EREQUEST' && error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Contact with this phone number already exists' });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
}
/** GET /api/contacts/:id
 * Retrieve a single contact by ID for the authenticated user */

async function getContactById(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const contact = await contactModel.getContactById(contactId, userId);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.status(200).json(contact);
  } catch (error) {
    console.error('Error retrieving contact:', error);
    res.status(500).json({ error: 'Failed to retrieve contact' });
  }
}
/** PATCH /api/contacts/:id
 * Update an existing contact for the authenticated user */
async function updateContact(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;
    const { name, relationship, phone, note, isStarred } = req.body;

    const updated = await contactModel.updateContact(contactId, userId, {
      name: name.trim(),
      relationship: relationship?.trim() || '',
      phone: phone.trim(),
      note: note?.trim() || '',
      isStarred: Boolean(isStarred)
    });

    if (!updated) {
      return res.status(404).json({ error: 'Contact not found or not authorized' });
    }

    res.status(200).json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
}

/** DELETE /api/contacts/:id
 * Delete a contact for the authenticated user */

async function deleteContact(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const deleted = await contactModel.deleteContact(contactId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found or not authorized' });
    }

    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
}

module.exports = {
  getAllContacts,
  createContact,
  getContactById,
  updateContact,
  deleteContact
};
