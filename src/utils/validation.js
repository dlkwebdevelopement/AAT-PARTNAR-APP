export const validateRequired = (value, setError, fieldName = "Field") => {
  if (!value || value.toString().trim() === "") {
    setError(`${fieldName} is required`);
    return false;
  }
  setError("");
  return true;
};

export const validatePositiveNumber = (value, setError, fieldName, min = 0) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min) {
    setError(`${fieldName} must be a number >= ${min}`);
    return false;
  }
  setError("");
  return true;
};
