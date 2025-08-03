const contactModel = require('../models/contactModel');

async function getAllContacts(req, res) {
  try {
    // Debug: Check if user is properly authenticated
    console.log('User from token:', req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const contacts = await contactModel.getAllContactsByUser(userId);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
}

async function createContact(req, res) {
  try {
    // Debug: Check if user is properly authenticated
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { name, relationship, phone, note, isStarred } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }

    // Additional validation
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name is too long (max 100 characters)' });
    }
    
    if (phone.length > 20) {
      return res.status(400).json({ error: 'Phone number is too long (max 20 characters)' });
    }

    const newContact = await contactModel.createContact({
      name: name.trim(),
      relationship: relationship?.trim() || '',
      phone: phone.trim(),
      note: note?.trim() || '',
      isStarred: Boolean(isStarred),
      userId
    });

    console.log('Created contact:', newContact);

    res.status(201).json({ 
      message: 'Contact added successfully', 
      data: newContact 
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    
    // Handle specific database errors
    if (error.code === 'EREQUEST' && error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Contact with this phone number already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create contact' });
  }
}

async function getContactById(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

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

async function updateContact(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, relationship, phone, note, isStarred } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }

    // Additional validation as in createContact
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name is too long (max 100 characters)' });
    }
    if (phone.length > 20) {
      return res.status(400).json({ error: 'Phone number is too long (max 20 characters)' });
    }

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

async function deleteContact(req, res) {
  try {
    const contactId = req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

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


