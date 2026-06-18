export function getErrorMessage(error: any): string {
  const defaultMsg = "I apologize, something went wrong. Please try again.";
  if (!error) return defaultMsg;

  const data = error.response?.data;
  if (!data) return error.message || defaultMsg;

  if (typeof data !== "string") {
    return data.error || data.message || defaultMsg;
  }

  const trimmed = data.trim();
  if (!trimmed) return defaultMsg;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed.error || parsed.message || trimmed;
  } catch (error) {
    return trimmed;
  }
}
