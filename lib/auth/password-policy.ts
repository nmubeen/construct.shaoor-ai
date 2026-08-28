export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 12) {
    return "Password must be at least 12 characters long.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Password must contain uppercase and lowercase letters.";
  }
  if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain a number and a special character.";
  }
  if (password !== confirmation) {
    return "Password confirmation does not match.";
  }

  return null;
}
