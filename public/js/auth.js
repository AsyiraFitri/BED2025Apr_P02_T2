document.addEventListener("DOMContentLoaded", () => {
  // Check authentication status and update navbar
  checkAuthAndUpdateNavbar();

  // Section switching
  window.switchSection = (id) => {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };

  // Function to decode JWT token without verification (client-side only)
  function decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  // Function to check if JWT token is expired
  function isTokenExpired(token) {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  // Function to check authentication status and update navbar
  function checkAuthAndUpdateNavbar() {
    const token = sessionStorage.getItem('token');
    let isLoggedIn = false;

    if (token) {
      // Check if token is valid and not expired
      if (!isTokenExpired(token)) {
        isLoggedIn = true;
        
        // Ensure backward compatibility: if user object doesn't exist, create it from JWT
        const existingUser = sessionStorage.getItem('user');
        if (!existingUser) {
          const decoded = decodeJWT(token);
          if (decoded) {
            const userObj = {
              UserID: decoded.id,
              email: decoded.email,
              first_name: decoded.first_name,
              last_name: decoded.last_name,
              role: decoded.role
            };
            sessionStorage.setItem('user', JSON.stringify(userObj));
          }
        }
      } else {
        // Token is expired, remove both token and user data
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    // Find the logout button in the navbar
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
      // Remove any existing event listeners
      logoutBtn.replaceWith(logoutBtn.cloneNode(true));
      const newLogoutBtn = document.getElementById('logoutBtn');
      
      if (isLoggedIn) {
        // User is logged in - show logout button
        console.log('Setting up logout button');
        newLogoutBtn.innerHTML = '<i class="fa fa-sign-out"></i> Logout';
        newLogoutBtn.href = '#';
        newLogoutBtn.onclick = function(e) {
          e.preventDefault();
          handleLogout();
        };
      } else {
        // User is not logged in - show login button
        console.log('Setting up login button');
        newLogoutBtn.innerHTML = '<i class="fa fa-sign-in"></i> Login';
        newLogoutBtn.href = 'auth.html';
        newLogoutBtn.onclick = null; // Let default href behavior work
      }
    } else {
      console.log('No logoutBtn element found');
    }
  }

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
    const captchaToken = grecaptcha.getResponse(); // get CAPTCHA response
      if (!captchaToken) {
    alert("Please complete the CAPTCHA.");
    return;
  }
    
    try {
      const data = await makeAuthRequest("http://localhost:3000/api/auth/login", {
        email: document.getElementById("login_email").value,
        password: document.getElementById("login_password").value,
        captchaToken
      });

      // Store the JWT token as primary source of truth
      sessionStorage.setItem('token', data.token);
      
      // For backward compatibility, also store user object for existing code
      const userObj = {
        UserID: data.user.UserID,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role: data.user.role || 'user'
      };
      sessionStorage.setItem('user', JSON.stringify(userObj));
      
      // Update navbar to show logout button
      checkAuthAndUpdateNavbar();
      
      // Redirect to dashboard
      alert("Login successful!");
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }finally {
    grecaptcha.reset(); // reset CAPTCHA after attempt
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

  function handleLogout() {
    try {
      // Clear both JWT token and user data for full logout
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Update navbar to show login button
      checkAuthAndUpdateNavbar();

      // Redirect to login/signup page
      window.location.href = 'auth.html';
    } 
    catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred while logging out.');
    }
  }

  // Global function to check if user is authenticated
  window.isUserAuthenticated = function() {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    
    // Check if token is not expired
    return !isTokenExpired(token);
  };

  // Global function to get current user data (backward compatible)
  window.getCurrentUser = function() {
    // First try to get from JWT token (primary source)
    const token = sessionStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      const decoded = decodeJWT(token);
      if (decoded) {
        return {
          id: decoded.id,
          UserID: decoded.id, // Backward compatibility
          email: decoded.email,
          first_name: decoded.first_name,
          last_name: decoded.last_name,
          role: decoded.role
        };
      }
    }
    
    // Fallback to sessionStorage user object for backward compatibility
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  // Global function to get JWT token
  window.getAuthToken = function() {
    const token = sessionStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      return null;
    }
    return token;
  };

  // Global function to update navbar from any page
  window.updateNavbar = function() {
    checkAuthAndUpdateNavbar();
  };
});