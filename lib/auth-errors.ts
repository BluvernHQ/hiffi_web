/**
 * Converts Firebase authentication error codes to user-friendly messages
 */
export function getFriendlyAuthError(error: any): string {
  const errorCode = error?.code || ""
  const errorMessage = error?.message || ""

  // Firebase Auth error codes
  if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
    return "Invalid email or password. Please check your credentials and try again."
  }

  if (errorCode === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in or use a different email."
  }

  if (errorCode === "auth/weak-password") {
    return "Password is too weak. Please use at least 6 characters."
  }

  if (errorCode === "auth/invalid-email") {
    return "Invalid email address. Please enter a valid email."
  }

  if (errorCode === "auth/user-disabled") {
    return "This account has been disabled. Please contact support."
  }

  if (errorCode === "auth/too-many-requests") {
    return "Too many failed attempts. Please try again later."
  }

  if (errorCode === "auth/operation-not-allowed") {
    return "This operation is not allowed. Please contact support."
  }

  if (errorCode === "auth/requires-recent-login") {
    return "Please sign in again to complete this action."
  }

  if (errorCode === "auth/network-request-failed") {
    return "Network error. Please check your connection and try again."
  }

  // Check error message for common patterns
  if (errorMessage.toLowerCase().includes("invalid-credential") || 
      errorMessage.toLowerCase().includes("wrong-password") ||
      errorMessage.toLowerCase().includes("user-not-found")) {
    return "Invalid email or password. Please check your credentials and try again."
  }

  if (errorMessage.toLowerCase().includes("email-already-in-use") || 
      errorMessage.toLowerCase().includes("email already in use")) {
    return "This email is already registered. Please sign in or use a different email."
  }

  if (errorMessage.toLowerCase().includes("weak-password") || 
      errorMessage.toLowerCase().includes("password is too weak")) {
    return "Password is too weak. Please use at least 6 characters."
  }

  if (errorMessage.toLowerCase().includes("invalid-email") || 
      errorMessage.toLowerCase().includes("invalid email")) {
    return "Invalid email address. Please enter a valid email."
  }

  if (errorMessage.toLowerCase().includes("network") || 
      errorMessage.toLowerCase().includes("connection")) {
    return "Network error. Please check your connection and try again."
  }

  // Backend-specific errors
  if (errorMessage.includes("User account not found") || 
      errorMessage.includes("not found in backend")) {
    return "Account not found. Please sign up first."
  }

  if (errorMessage.includes("User authentication lost") || 
      errorMessage.includes("authentication lost")) {
    return "Authentication error. Please try again."
  }

  if (errorMessage.includes("Failed to load user data")) {
    return "Unable to load your account information. Please try again."
  }

  // Generic fallback - remove technical error codes from message
  if (errorMessage) {
    // Remove Firebase error prefixes
    let cleanMessage = errorMessage
      .replace(/^Firebase:\s*Error\s*\([^)]+\)\.?\s*/i, "")
      .replace(/^\[.*?\]\s*/, "")
      .trim()

    // If we still have a technical error code, use generic message
    if (cleanMessage.includes("auth/") || cleanMessage.match(/^[a-z]+\/[a-z-]+/i)) {
      return "Something went wrong. Please try again."
    }

    return cleanMessage || "Something went wrong. Please try again."
  }

  // Ultimate fallback
  return "Something went wrong. Please try again."
}

