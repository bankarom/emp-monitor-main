const { ipcRenderer } = require('electron');

// DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// Show/hide loading
function setLoading(isLoading) {
  if (isLoading) {
    loading.style.display = 'block';
    loginBtn.disabled = true;
  } else {
    loading.style.display = 'none';
    loginBtn.disabled = false;
  }
}

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Validate inputs
  if (!email || !password) {
    showError('Please enter email and password');
    return;
  }

  setLoading(true);
  errorMessage.style.display = 'none';

  try {
    // Send login request to main process
    const result = await ipcRenderer.invoke('login', email, password);
    
    if (result && result.success) {
      // Login successful - main process will handle the rest
      errorMessage.textContent = '✅ Login successful!';
      errorMessage.style.color = 'green';
      errorMessage.style.display = 'block';
      
      // The main process will close the window after login-success event
    } else {
      showError(result?.error || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Please try again.');
    setLoading(false);
  }
});

// Listen for login response from main process
ipcRenderer.on('login-success', () => {
  errorMessage.textContent = '✅ Login successful!';
  errorMessage.style.color = 'green';
  errorMessage.style.display = 'block';
  setLoading(false);
  setTimeout(() => {
    window.close();
  }, 1500);
});

ipcRenderer.on('login-error', (event, msg) => {
  showError(msg || '❌ Login failed');
  setLoading(false);
});

// Focus on email input when page loads
window.addEventListener('DOMContentLoaded', () => {
  emailInput.focus();
});