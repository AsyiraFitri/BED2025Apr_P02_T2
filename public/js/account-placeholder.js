document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded successfully");
    // Fetch the group ID from the URL
    document.getElementById('account-signin-submit').addEventListener('click', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value.trim();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store full user object in sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert('Invalid email or password');
            }
        } catch (err) {
            console.error('Login request failed:', err);
            alert('Server error.');
        }
    });

});