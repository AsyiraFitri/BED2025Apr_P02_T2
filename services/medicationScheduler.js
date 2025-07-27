const medicationModel = require("../models/medicationModel");

// Daily medication tracking reset scheduler
// Function to schedule daily reset at 12:00 AM
function scheduleDailyReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight
  
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  // Schedule the first reset
  setTimeout(async () => {
    try {
      console.log('Running daily medication tracking reset...');
      await medicationModel.resetAllTracking();
      console.log('Daily medication tracking reset completed successfully');
    } catch (error) {
      console.error('Error during daily medication tracking reset:', error);
    }
    
    // Schedule recurring daily resets (every 24 hours)
    setInterval(async () => {
      try {
        console.log('Running daily medication tracking reset...');
        await medicationModel.resetAllTracking();
        console.log('Daily medication tracking reset completed successfully');
      } catch (error) {
        console.error('Error during daily medication tracking reset:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
  }, timeUntilMidnight);
  
  console.log(`Daily medication reset scheduled. Next reset in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
}

// Initialize the scheduler
function initializeScheduler() {
  console.log('Initializing medication tracking scheduler...');
  scheduleDailyReset();
}

module.exports = {
  initializeScheduler
};
