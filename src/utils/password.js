export function isValidPassword(password) {
  if (!password || password.length < 6) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  return true;
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 6 characters and include uppercase and lowercase letters.";
