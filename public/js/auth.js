document.addEventListener("DOMContentLoaded", () => {
  // Section switching
  window.switchSection = (id) => {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };

  // Password visibility toggle
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  });

  // Helper function for API requests
  async function makeAuthRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Signup form
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
      const formData = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        phone_number: document.getElementById("phone_number").value || null
      };

      await makeAuthRequest("http://localhost:3000/api/auth/register", formData);
      alert("Sign up successful! Please login.");
      switchSection('loginSection');
      e.target.reset();
    } catch (error) {
      alert(error.message);
    }
  });

  // Login form
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
      const data = await makeAuthRequest("http://localhost:3000/api/auth/login", {
        email: document.getElementById("login_email").value,
        password: document.getElementById("login_password").value
      });

      // Store token and user data
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      alert("Login successful!");
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });

  // Forgot password form
  document.getElementById("forgotPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
      await makeAuthRequest("http://localhost:3000/api/auth/forgot-password", {
        email: document.getElementById("forgot_email").value
      });
      
      alert("Password reset link has been sent to your email");
      switchSection('loginSection');
    } catch (error) {
      alert(error.message);
    }
  });

  // Reset password form
  document.getElementById("resetPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      await makeAuthRequest(`http://localhost:3000/api/auth/reset-password/${token}`, {
        password: document.getElementById("reset_password").value
      });
      
      alert("Password has been reset successfully");
      window.location.href = "auth.html";
    } catch (error) {
      alert(error.message);
    }
  });

  // Logout button (works on any page with #logoutBtn)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();

      try {
        // Clear client-side stored data (sessionStorage)
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Redirect to login/signup page
        window.location.href = 'auth.html';
      } 
      catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred while logging out.');
      }
    });
  }
});