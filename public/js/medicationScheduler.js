// medicationScheduler.js (frontend version)
// This file is for demonstration only. Note: Scheduling resets from the frontend is NOT secure or reliable for production!
// The backend should always handle resets. This is for your request/testing only.

// Example: Call the reset endpoint every minute (for testing)
function startMedicationResetTestScheduler() {
  setInterval(async () => {
    try {
      const response = await fetch('/api/medications/tracking/reset', { method: 'POST' });
      if (response.ok) {
        console.log('TEST: Medication reset triggered from frontend.');
      } else {
        console.error('TEST: Medication reset failed from frontend.');
      }
    } catch (error) {
      console.error('TEST: Error calling medication reset from frontend:', error);
    }
  }, 60 * 1000); // 1 minute
}

// Uncomment to enable test scheduler on page load
// document.addEventListener('DOMContentLoaded', startMedicationResetTestScheduler);
