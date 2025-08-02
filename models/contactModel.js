const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function getAllContactsByUser(userId) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          ContactID,
          Name,
          Relationship,
          PhoneNumber,
          Note,
          IsStarred,
          user_id
        FROM EmergencyContact 
        WHERE user_id = @userId 
        ORDER BY IsStarred DESC, Name ASC
      `);
    
    console.log(`Found ${result.recordset.length} contacts for user ${userId}`);
    return result.recordset;
  } catch (error) {
    console.error('Database error in getAllContactsByUser:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

async function createContact({ name, relationship, phone, note, isStarred, userId }) {
  let pool;
  try {
    console.log('Creating contact with userId:', userId);
    
    if (!userId) {
      throw new Error('userId is required');
    }

    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar(100), name)
      .input('relationship', sql.NVarChar(100), relationship)
      .input('phone', sql.NVarChar(20), phone)
      .input('note', sql.NVarChar(255), note)
      .input('isStarred', sql.Bit, isStarred ? 1 : 0)
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO EmergencyContact (Name, Relationship, PhoneNumber, Note, IsStarred, user_id)
        OUTPUT INSERTED.ContactID, INSERTED.Name, INSERTED.Relationship, INSERTED.PhoneNumber, 
               INSERTED.Note, INSERTED.IsStarred, INSERTED.user_id
        VALUES (@name, @relationship, @phone, @note, @isStarred, @userId)
      `);

    if (result.recordset.length === 0) {
      throw new Error('Failed to create contact - no data returned');
    }

    console.log('Contact created successfully:', result.recordset[0]);
    return result.recordset[0];
  } catch (error) {
    console.error('Database error in createContact:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
async function deleteContact(contactId, userId) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('contactId', sql.Int, contactId)
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM EmergencyContact
        WHERE ContactID = @contactId AND user_id = @userId
      `);

    // Return true if a row was deleted
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error('Database error in deleteContact:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
async function getContactById(contactId, userId) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('contactId', sql.Int, contactId)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT ContactID, Name, Relationship, PhoneNumber, Note, IsStarred, user_id
        FROM EmergencyContact
        WHERE ContactID = @contactId AND user_id = @userId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error('Database error in getContactById:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
async function updateContact(contactId, userId, { name, relationship, phone, note, isStarred }) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('contactId', sql.Int, contactId)
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar(100), name)
      .input('relationship', sql.NVarChar(100), relationship)
      .input('phone', sql.NVarChar(20), phone)
      .input('note', sql.NVarChar(255), note)
      .input('isStarred', sql.Bit, isStarred ? 1 : 0)
      .query(`
        UPDATE EmergencyContact
        SET 
          Name = @name,
          Relationship = @relationship,
          PhoneNumber = @phone,
          Note = @note,
          IsStarred = @isStarred
        WHERE ContactID = @contactId AND user_id = @userId
      `);

    // Returns true if a row was updated
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error('Database error in updateContact:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}


module.exports = {
  getAllContactsByUser,
  createContact,
    getContactById,
  updateContact,
  deleteContact
};