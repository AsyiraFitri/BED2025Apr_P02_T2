const bcrypt = require('bcrypt');
const sql = require('mssql');
const config = require('./dbConfig');

// Configuration
const SALT_ROUNDS = 10; // same as authController.js

async function isPasswordHashed(password) {
    // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
    return password && password.length === 60 && password.startsWith('$2');
}

async function hashPassword(plainPassword) {
    try {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    } catch (error) {
        throw new Error(`Error hashing password: ${error.message}`);
    }
}

// Individual password hashing functionality
async function hashSinglePassword(plainPassword) {
    try {
        const hashedPassword = await hashPassword(plainPassword);
        
        console.log('========================');
        console.log('Password Hashing Result:');
        console.log('========================');
        console.log('Plain password:', plainPassword);
        console.log('Hashed password:', hashedPassword);
        console.log('========================');
        console.log('SQL UPDATE example:');
        console.log(`UPDATE Users SET password = '${hashedPassword}' WHERE email = 'user@example.com';`);
        console.log('========================');
        console.log('SQL INSERT example:');
        console.log(`INSERT INTO Users (email, password, first_name, last_name, role) VALUES ('user@example.com', '${hashedPassword}', 'First', 'Last', 'user');`);
        console.log('========================');
        
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

async function hashMultiplePasswords(passwords) {
    console.log('Hashing multiple passwords...\n');
    
    for (let i = 0; i < passwords.length; i++) {
        const password = passwords[i];
        console.log(`\n--- Password ${i + 1} of ${passwords.length} ---`);
        await hashSinglePassword(password);
    }
}

async function updateUserPasswords() {
    let pool;
    
    try {
        console.log('Connecting to database...');
        pool = await sql.connect(config);
        
        console.log('Fetching all users...');
        const result = await pool.request()
            .query('SELECT UserID, email, password FROM Users');
        
        const users = result.recordset;
        console.log(`Found ${users.length} users in database`);
        
        let unhashedCount = 0;
        let hashedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        
        console.log('Analyzing passwords...');
        console.log('======================');
        
        for (const user of users) {
            const isHashed = await isPasswordHashed(user.password);
            
            if (isHashed) {
                hashedCount++;
                console.log(`User ${user.email}: Already hashed (${user.password.substring(0, 20)}...)`);
            } else {
                unhashedCount++;
                console.log(`User ${user.email}: Plain text password (${user.password})`);
                
                try {
                    console.log(`Hashing password for ${user.email}...`);
                    const hashedPassword = await hashPassword(user.password);
                    
                    // Update the password in database
                    await pool.request()
                        .input('UserID', sql.Int, user.UserID)
                        .input('HashedPassword', sql.VarChar, hashedPassword)
                        .query('UPDATE Users SET password = @HashedPassword WHERE UserID = @UserID');
                    
                    updatedCount++;
                    console.log(`Updated password for ${user.email}`);
                    console.log(`New hash: ${hashedPassword.substring(0, 30)}...`);
                    
                } catch (error) {
                    errorCount++;
                    console.error(`Error updating ${user.email}: ${error.message}`);
                }
            }
        }
        
        console.log('\nSummary:');
        console.log('================================');
        console.log(`Total users: ${users.length}`);
        console.log(`Already hashed: ${hashedCount}`);
        console.log(`Plain text passwords: ${unhashedCount}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);
        
        if (updatedCount > 0) {
            console.log('\nPassword update completed successfully!');
            console.log('All users can now log in with their original passwords.');
        } else if (unhashedCount === 0) {
            console.log('\nNo passwords needed updating - all are already hashed.');
        }
        
    } catch (error) {
        console.error('Database error:', error.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\nDatabase connection closed');
        }
    }
}

// Confirmation prompt for database update
async function confirmUpdate() {
    return true;
}

// Main execution
async function main() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        
        // Check if user wants to hash individual passwords
        if (args.length > 0 && !args.includes('--update-database')) {
            console.log('Individual Password Hashing Mode');
            console.log('===================================\n');
            
            if (args.length === 1) {
                console.log('Hashing single password:', args[0]);
                await hashSinglePassword(args[0]);
            } else {
                console.log('Hashing multiple passwords:', args);
                await hashMultiplePasswords(args);
            }
            return;
        }
        
        // Database update mode (default behavior)
        console.log('Database Password Update Mode');
        console.log('=================================\n');
        
        if (await confirmUpdate()) {
            await updateUserPasswords();
        }
        
    } catch (error) {
        console.error('Script error:', error.message);
        process.exit(1);
    }
}

// Show usage information
function showUsage() {
    console.log('Password Utility - Usage Guide');
    console.log('=================================\n');
    console.log('Default Mode - Hash All Database Passwords:');
    console.log('  node password-utility.js');
    console.log('  node password-utility.js --update-database');
    console.log('\nIndividual Password Hashing:');
    console.log('  node password-utility.js "password1"');
    console.log('  node password-utility.js "password1" "password2" "password3"');
    console.log('\nExamples:');
    console.log('  node password-utility.js                    # Hash all database passwords');
    console.log('  node password-utility.js "admin123"         # Hash single password');
    console.log('  node password-utility.js "admin123" "user456" # Hash multiple passwords');
    console.log('\nNote: Database updates are performed immediately. Make sure to backup your database first!');
}

// Handle script termination
process.on('SIGINT', async () => {
    console.log('\n Script interrupted by user');
    process.exit(0);
});

// Show usage if no arguments provided
if (process.argv.length === 2) {
    // Default behavior: hash all database passwords
    main();
} else {
    // Run with arguments
    main();
}
