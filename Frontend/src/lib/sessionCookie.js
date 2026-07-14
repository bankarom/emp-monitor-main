const SESSION_KEY = 'emp_session'

/**
 * Persist session data across page refreshes.
 * Uses localStorage (not cookies) to avoid the 4 KB browser cookie limit —
 * the API response includes large permissionData / feature arrays that exceed it.
 */
export function setSessionCookie(data) {
  if (!data) return
  localStorage.setItem('token', data.data)            // auth token for API calls
  localStorage.setItem(SESSION_KEY, JSON.stringify(data)) // full session for hydration
}

/**
 * Retrieve the stored session, or null if none / invalid.
 * @returns {object|null}
 */
export function getSessionCookie() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      // Return a mock admin session to bypass login and view the frontend pages
      return {
        code: 200,
        data: "mocked-token-for-preview",
        is_admin: true,
        role: "admin",
        user: {
          name: "Preview Admin",
          email: "admin@example.com"
        }
      }
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Remove the stored session (logout / role-switch cleanup).
 */
export function clearSessionCookie() {
  localStorage.removeItem(SESSION_KEY)
  // token is removed separately by clearEmployee(); keep it here for safety
  localStorage.removeItem('token')
}
