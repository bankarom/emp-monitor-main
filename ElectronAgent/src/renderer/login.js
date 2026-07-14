const { ipcRenderer } = require('electron');
const axios = require('axios');
const storage = require('../utils/storage');
const config = require('../utils/config');

// DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const toggleConfigBtn = document.getElementById('toggleConfig');
const serverConfig = document.getElementById('serverConfig');
const desktopApiUrlInput = document.getElementById('desktopApiUrl');
const storeLogsApiUrlInput = document.getElementById('storeLogsApiUrl');

// Toggle advanced settings
toggleConfigBtn.addEventListener('click', () => {
  if (serverConfig.style.display === 'none') {
    serverConfig.style.display = 'block';
    toggleConfigBtn.textContent = 'Hide Advanced Settings';
    
    // Load saved URLs
    const savedUrls = storage.getApiUrls();
    if (savedUrls.desktopUrl) {
      desktopApiUrlInput.value = savedUrls.desktopUrl;
    } else {
      desktopApiUrlInput.value = config.DESKTOP_API_URL;
    }
    
    if (savedUrls.storeLogsUrl) {
      storeLogsApiUrlInput.value = savedUrls.storeLogsUrl;
    } else {
      storeLogsApiUrlInput.value = config.STORE_LOGS_API_URL;
    }
  } else {
    serverConfig.style.display = 'none';
    toggleConfigBtn.textContent = 'Advanced Settings';
  }
});

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 5000);
}

// Show/hide loading
function setLoading(isLoading) {
  if (isLoading) {
    loading.classList.add('show');
    loginBtn.disabled = true;
  } else {
    loading.classList.remove('show');
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

  // Get custom API URLs if provided
  let desktopApiUrl = config.DESKTOP_API_URL;
  let storeLogsApiUrl = config.STORE_LOGS_API_URL;
  
  if (serverConfig.style.display !== 'none') {
    if (desktopApiUrlInput.value.trim()) {
      desktopApiUrl = desktopApiUrlInput.value.trim();
    }
    if (storeLogsApiUrlInput.value.trim()) {
      storeLogsApiUrl = storeLogsApiUrlInput.value.trim();
    }
    
    // Save custom URLs
    storage.saveApiUrls(desktopApiUrl, storeLogsApiUrl);
  }

  setLoading(true);
  errorMessage.classList.remove('show');

  try {
    // Attempt login
    const response = await axios.post(`${desktopApiUrl}${config.LOGIN_ENDPOINT}`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.success) {
      // Extract token and user data
      const token = response.data.token || response.data.data?.token;
      const user = response.data.user || response.data.data?.user || response.data.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      // Save token and user info
      storage.saveToken(token);
      storage.saveUserInfo({
        email: user.email || email,
        employee_id: user.employee_id || user.id,
        organization_id: user.organization_id,
        name: user.name || user.first_name ? `${user.first_name} ${user.last_name || ''}` : email
      });

      // Notify main process
      ipcRenderer.send('login-success');
      
    } else {
      showError(response.data?.message || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;
      
      if (status === 401) {
        showError('Invalid email or password');
      } else if (status === 404) {
        showError('Login endpoint not found. Check server URL.');
      } else if (status === 500) {
        showError('Server error. Please try again later.');
      } else {
        showError(message || `Login failed (Error ${status})`);
      }
    } else if (error.request) {
      // No response received
      showError('Cannot connect to server. Check your network and server URL.');
    } else {
      // Other error
      showError('Login failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
});

// Pre-fill email if saved (for convenience)
window.addEventListener('DOMContentLoaded', () => {
  const userInfo = storage.getUserInfo();
  if (userInfo && userInfo.email) {
    emailInput.value = userInfo.email;
    passwordInput.focus();
  } else {
    emailInput.focus();
  }
});
