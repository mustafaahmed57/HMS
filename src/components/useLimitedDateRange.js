// src/hooks/useLimitedDateRange.js
export function useLimitedDateRange({
  allowPastDays = 0,
  allowFutureDays = 0,
} = {}) {
  // 🔹 LOCAL date (NO UTC)
  const getLocalDateStr = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateStr(today);

  const minDateObj = new Date(today);
  minDateObj.setDate(minDateObj.getDate() - allowPastDays);
  const minDateStr = getLocalDateStr(minDateObj);

  const maxDateObj = new Date(today);
  maxDateObj.setDate(maxDateObj.getDate() + allowFutureDays);
  const maxDateStr = getLocalDateStr(maxDateObj);

  // 🔹 SAFE diff in days
  const diffInDays = (dateStr, baseStr = todayStr) => {
    const d1 = new Date(dateStr + "T00:00:00");
    const d2 = new Date(baseStr + "T00:00:00");
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  };

  const validateDate = (dateStr) => {
    if (!dateStr) return "Date is required";

    const diff = diffInDays(dateStr);

    if (diff < -allowPastDays) {
      return "Past dates are not allowed";
    }

    if (diff > allowFutureDays) {
      return "Date is too far in the future";
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
