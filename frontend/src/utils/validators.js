/**
 * Validates the registration form fields.
 * Returns an object mapping field names to error messages.
 * An empty object means the form is valid.
 *
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} values
 * @returns {Record<string, string>}
 */
export const validateRegisterForm = (values) => {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

/**
 * Validates the login form fields.
 *
 * @param {{ email: string, password: string }} values
 * @returns {Record<string, string>}
 */
export const validateLoginForm = (values) => {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
};
