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

  // Signup form
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      first_name: document.getElementById("first_name").value,
      last_name: document.getElementById("last_name").value,
      phone_number: document.getElementById("phone_number").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    };

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Sign up successful! Please login.");
        switchSection('loginSection');
        e.target.reset();
      } else {
        throw new Error(data.error || "Sign up failed");
      }
    } catch (error) {
      alert(error.message);
      console.error("Signup error:", error);
    }
  });

  // Login form
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      email: document.getElementById("login_email").value,
      password: document.getElementById("login_password").value
    };

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data in session storage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        
        alert("Login successful!");
        window.location.href = "index.html";
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      alert(error.message);
      console.error("Login error:", error);
    }
  });

  // Forgot password form
  document.getElementById("forgotPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("forgot_email").value;

    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password reset link has been sent to your email");
        switchSection('loginSection');
      } else {
        throw new Error(data.error || "Failed to send reset link");
      }
    } catch (error) {
      alert(error.message);
      console.error("Forgot password error:", error);
    }
  });

  // Reset password form
  document.getElementById("resetPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const password = document.getElementById("reset_password").value;

    try {
      const response = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password has been reset successfully");
        window.location.href = "temp-login.html";
      } else {
        throw new Error(data.error || "Failed to reset password");
      }
    } catch (error) {
      alert(error.message);
      console.error("Reset password error:", error);
    }
  });
});

// document.addEventListener("DOMContentLoaded", () => {
//   // section switch
//   window.switchSection = (id) => {
//     document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
//     document.getElementById(id).classList.add("active");
// }
// });
//   // signup form
//   document.getElementById("signupForm").addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const first_name = document.getElementById("first_name").value;
//     const last_name = document.getElementById("last_name").value;
//     const phone_number = document.getElementById("phone_number").value;
//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;

//     const payload = {
//       first_name,
//       last_name,
//       phone_number: phone_number || null, // optional
//       email,
//       password,
//     };

//     try {
//       const res = await fetch("http://localhost:3000/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//       });

//       const data = await res.json();

//       if (res.ok) {
//         alert("Sign up successful!");
//         //window.location.href = "login.html"; // Redirect to login
//         signupForm.reset();
//       document.getElementById("signupSection").style.display = "none";
//       document.getElementById("loginSection").style.display = "block";
//       } else {
//         alert(data.error || "Sign up failed");
//       }
//     } catch (err) {
//       alert("Server error: " + err.message);
//     }
//   });
//   document.querySelector(".toggle-password").addEventListener("click", () => {
//   const passwordInput = document.getElementById("password");
//   const type = passwordInput.type === "password" ? "text" : "password";
//   passwordInput.type = type;
// });
//  // login form
//   document.getElementById("loginForm").addEventListener("submit", async (e) => {
// async function loginUser(email, password) {
//           try {
//             const response = await fetch('http://localhost:3000/api/auth/login', {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();

//             if (response.ok) {
//               // Store token and user data
//               sessionStorage.setItem('token', data.token);
//               sessionStorage.setItem('user', JSON.stringify(data.user));
              
//               console.log('JWT Token:', data.token);
//               return data.token;
//             } else {
//               throw new Error(data.message);
//             }
//           } catch (error) {
//             console.error('Login error:', error);
//             throw error;
//           }
//         }

//         // Define the handleLogin function
//         function handleLogin() {
//           const email = document.getElementById("email").value;
//           const password = document.getElementById("password").value;

//           loginUser(email, password)
//             .then(token => {
//               alert('Login successful!');
//               window.location.href = 'index.html';
//             })
//             .catch(error => {
//               console.error('Login failed:', error);
//               alert('Login failed: ' + error.message);
//             });
//         }

//         // Form submission handler
//         document.getElementById("loginForm").addEventListener("submit", (e) => {
//           e.preventDefault();
//           handleLogin();
//         });
//  // forgot password
//   document.getElementById("forgotPasswordForm").addEventListener("submit", async (e) => {
//          e.preventDefault();
//       const email = document.getElementById("forgot_email").value;

//       try {
//         const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email }),
//         });

//         const data = await res.json();
//         alert(data.message || data.error);
//       } catch (err) {
//         alert("Error sending reset email.");
//         console.error(err);
//       }
//   });   
//   // reset password
//   document.getElementById("resetPasswordForm").addEventListener("submit", async (e) => {
//  e.preventDefault();
//       const password = document.getElementById("reset_password").value;
//       const params = new URLSearchParams(window.location.search);
//       const token = params.get("token");

//       try {
//         const res = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ password }),
//         });

//         const data = await res.json();
//         alert(data.message || data.error);
//         if (data.message) window.location.href = "login.html";
//       } catch (err) {
//         alert("Error resetting password.");
//         console.error(err);
//       }
//     });
//   });    

