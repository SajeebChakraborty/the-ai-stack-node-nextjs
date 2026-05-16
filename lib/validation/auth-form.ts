const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignInFields(email: string, password: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Enter your email address.";
  }

  if (!emailPattern.test(trimmedEmail)) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Enter your password.";
  }

  return null;
}

export function validateSignUpFields(name: string, email: string, password: string): string | null {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    return "Enter your full name.";
  }

  if (trimmedName.length < 2) {
    return "Name must be at least 2 characters.";
  }

  if (!trimmedEmail) {
    return "Enter your email address.";
  }

  if (!emailPattern.test(trimmedEmail)) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Create a password.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

export function validateAdminSignInFields(email: string, password: string): string | null {
  if (!email.trim()) {
    return "Enter the admin email.";
  }

  if (!emailPattern.test(email.trim())) {
    return "Enter a valid admin email.";
  }

  if (!password) {
    return "Enter the admin password.";
  }

  return null;
}
