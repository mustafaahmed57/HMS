// src/hooks/useLimitedDateRange.js
export function useLimitedDateRange({
  allowPastDays = 0,
  allowFutureDays = 0,
} = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const minDateObj = new Date(today);
  minDateObj.setDate(minDateObj.getDate() - allowPastDays);
  const minDateStr = minDateObj.toISOString().split("T")[0];

  const maxDateObj = new Date(today);
  maxDateObj.setDate(maxDateObj.getDate() + allowFutureDays);
  const maxDateStr = maxDateObj.toISOString().split("T")[0];

  // 🔹 helper: doh dates ka diff (selected - base) in days
  const diffInDays = (dateStr, baseStr = todayStr) => {
    const d1 = new Date(dateStr);
    const d2 = new Date(baseStr);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const ms = d1 - d2;
    return ms / (1000 * 60 * 60 * 24);
  };

  // 🔹 validation function: error message ya null
  const validateDate = (dateStr) => {
    if (!dateStr) return null; // empty allowed? upar se control kar lo
    const diff = diffInDays(dateStr);

    if (diff < -allowPastDays || diff > allowFutureDays) {
      return `Date must be within last ${allowPastDays} and next ${allowFutureDays} day(s).`;
    }
    return null;
  };

  return {
    todayStr,
    minDateStr,
    maxDateStr,
    validateDate,
  };
}
