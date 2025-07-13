document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded successfully");
    
    // Handle Sign In
    document.getElementById('account-signin-submit').addEventListener('click', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value.trim();

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store the token
                sessionStorage.setItem('token', data.token);
                
                // Store user information for frontend use
                if (data.user) {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                }
                
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert(data.error || 'Invalid email or password');
            }
        } catch (err) {
            console.error('Login request failed:', err);
            alert('Server error.');
        }
    });

    // Handle Sign Up
    document.getElementById('account-signup-submit').addEventListener('click', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('account-firstname').value.trim();
        const lastName = document.getElementById('account-lastname').value.trim();
        const email = document.getElementById('account-email').value.trim();
        const phoneNumber = document.getElementById('account-phone').value.trim();
        const password = document.getElementById('account-password').value.trim();

        // Basic validation
        if (!firstName || !lastName || !email || !password) {
            alert('Please fill in all required fields (First Name, Last Name, Email, Password)');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Password validation (minimum 6 characters)
        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    first_name: firstName,
                    last_name: lastName,
                    phone_number: phoneNumber,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please sign in.');
                // Clear the form
                document.getElementById('account-firstname').value = '';
                document.getElementById('account-lastname').value = '';
                document.getElementById('account-email').value = '';
                document.getElementById('account-phone').value = '';
                document.getElementById('account-password').value = '';
                
                // Switch to sign-in tab (you may need to add this functionality)
                const signinTab = document.querySelector('.signin-link');
                if (signinTab) {
                    signinTab.click();
                }
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration request failed:', err);
            alert('Server error.');
        }
    });

});