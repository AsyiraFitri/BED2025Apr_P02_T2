const sql = require('mssql');
const dbConfig = require('../dbConfig');
const bcrypt = require("bcrypt");


async function findUserByEmail(email) {
    const pool = await sql.connect(dbConfig);
    const result = await pool
        .request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM Users WHERE email = @email");
    return result.recordset[0];
}

async function createUser(userData) {
    const { email, password, first_name, last_name, phone_number, role = 'user' } = userData;
    const pool = await sql.connect(dbConfig);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool
        .request()
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, hashedPassword)
        .input("first_name", sql.VarChar, first_name)
        .input("last_name", sql.VarChar, last_name)
        .input("phone_number", sql.VarChar, phone_number || null)
        .input("role", sql.VarChar, role)
        .query("INSERT INTO Users (email, password, first_name, last_name, phone_number, role) VALUES (@email, @password, @first_name, @last_name, @phone_number, @role)");

    return result;
}

async function updateUserPassword(email, newPassword) {
    const pool = await sql.connect(dbConfig);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool
        .request()
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, hashedPassword)
        .query("UPDATE Users SET password = @password WHERE email = @email");

    return result;
}


module.exports = { findUserByEmail, createUser, updateUserPassword };