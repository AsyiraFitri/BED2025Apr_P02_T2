// Import necessary modules
const bcrypt = require('bcrypt');            // For hashing passwords securely
const sql = require('mssql');                // For SQL Server database connection
const config = require('./dbConfig');        // Database configuration
const SALT_ROUNDS = 10;                      // Number of salt rounds for bcrypt

// hecks if a password is already hashed.
// bcrypt hashes start with "$2a$", "$2b$" or "$2y$" and are 60 characters long.
async function isPasswordHashed(password) {
    return password && password.length === 60 && password.startsWith('$2');
}

// Main function to hash plain-text passwords in the database.
async function hashDatabasePasswords() {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await sql.connect(config);

        console.log('Fetching all users...');
        const result = await pool.request()
            .query('SELECT UserID, email, password FROM Users');
        const users = result.recordset;
        console.log(`Found ${users.length} users in database`);

        // Initialize counters for reporting
        let unhashedCount = 0;
        let hashedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        // Loop through all users
        for (const user of users) {
            if (await isPasswordHashed(user.password)) {
                // Password is already hashed, no action needed
                hashedCount++;
                console.log(`User ${user.email}: Already hashed (${user.password.substring(0, 20)}...)`);
            } 
            else {
                // Plain-text password detected, needs to be hashed
                unhashedCount++;
                console.log(`User ${user.email}: Plain text password (${user.password})`);

                try {
                    // Hash the plain-text password
                    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

                    // Update the hashed password in the database
                    await pool.request()
                        .input('UserID', sql.Int, user.UserID)
                        .input('HashedPassword', sql.VarChar, hashedPassword)
                        .query('UPDATE Users SET password = @HashedPassword WHERE UserID = @UserID');

                    updatedCount++;
                    console.log(`Updated password for ${user.email}`);
                } 
                catch (error) {
                    // Log any update errors
                    errorCount++;
                    console.error(`Error updating ${user.email}: ${error.message}`);
                }
            }
        }

        // Print summary report
        console.log('\nSummary:');
        console.log('================================');
        console.log(`Total users: ${users.length}`);
        console.log(`Already hashed: ${hashedCount}`);
        console.log(`Plain text passwords: ${unhashedCount}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);

        // Final status message
        if (updatedCount > 0) {
            console.log('\nPassword update completed successfully!');
        } 
        else if (unhashedCount === 0) {
            console.log('\nNo passwords needed updating - all are already hashed.');
        }
    } 
    catch (error) {
        // Handle connection or query errors
        console.error('Database error:', error.message);
        process.exit(1);
    } 
    finally {
        // Always close the DB connection
        if (pool) {
            await pool.close();
            console.log('\nDatabase connection closed');
        }
    }
}

// Handle script interruption (e.g. Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\nScript interrupted by user');
    process.exit(0);
});

// Start the script: always hash passwords from the database
hashDatabasePasswords();
