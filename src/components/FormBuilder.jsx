import React, { useState, useEffect, useRef } from "react";

function FormBuilder({
  fields,
  onSubmit,
  initialValues = {},
  onFieldChange,
  checkDuplicate,
  resetOnSuccess = true,
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // ⭐ NEW
  const formRef = useRef(null);

  // ⭐ dynamic options state
  const [dynamicOptionsMap, setDynamicOptionsMap] = useState({});

  useEffect(() => {
    setFormData(initialValues || {});
  }, [initialValues]);

  // ⭐ dynamic select (employee)
  const handleSelectFocus = async (field) => {
    const name = field.name;
    const isEmployeeDropdown =
      name === "employeeID" || name === "employeeId" || name === "employee";

    if (!isEmployeeDropdown) return;

    try {
      const res = await fetch(
        "http://localhost:5186/api/employees/dropdown-active"
      );
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();

      setDynamicOptionsMap((prev) => ({
        ...prev,
        [name]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Error fetching employee dropdown:", err);
    }
  };

  const handleChange = (e) => {
    if (e.target.type === "file") {
      const { name, files } = e.target;
      const file = files && files[0] ? files[0] : null;

      setFormData((prev) => ({ ...prev, [name]: file }));
      if (onFieldChange) onFieldChange(name, file, setFormData);
      return;
    }

    const { name, type, checked, value } = e.target;
    let finalValue = value;

    if (type === "number") {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue < 0) {
        finalValue = "0";
      }
    }

    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "select-one") {
      const parsed = Number(value);
      finalValue = isNaN(parsed) ? value : parsed;
    }

    if (checkDuplicate && (name === "email" || name === "fullName")) {
      if (checkDuplicate(name, finalValue)) {
        setErrors((prev) => ({
          ...prev,
          [name]: `${name === "email" ? "Email" : "Full Name"} already exists`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (onFieldChange) onFieldChange(name, finalValue, setFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // 🔒 block multiple submit
    setIsSubmitting(true);

    let newErrors = {};
    const safeFields = Array.isArray(fields) ? fields : [];

    safeFields.forEach((field) => {
      const value = formData[field.name];

      if (
        checkDuplicate &&
        (field.name === "email" || field.name === "fullName")
      ) {
        if (checkDuplicate(field.name, value)) {
          newErrors[field.name] = `${field.label} already exists`;
        }
      }

      if (
        !value &&
        field.type !== "checkbox" &&
        field.type !== "hidden" &&
        !field.readOnly
      ) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    const success = await onSubmit(formData);

    if (resetOnSuccess === true && success === true) {
      if (formRef.current) {
        formRef.current.reset();
      }
      setFormData({});
      setErrors({});
    }

    setIsSubmitting(false); // 🔓 unlock
  };

  const handleResetClick = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setFormData(initialValues || {});
    setErrors({});
  };

  const safeFields = Array.isArray(fields) ? fields : [];

  return (
    <form className="form-builder" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-grid">
        {safeFields.map((field) => {
          const isSelect = field.type === "select";
          const isTextarea = field.type === "textarea";
          const isFile = field.type === "file";
          const isCheckbox = field.type === "checkbox";
          const baseOptions = Array.isArray(field.options) ? field.options : [];

          const dynamic = dynamicOptionsMap[field.name];
          const options = dynamic && dynamic.length > 0 ? dynamic : baseOptions;

          return (
            <div
              key={field.name}
              className={`form-group ${
                field.name === "description" ? "full-width" : ""
              }`}
            >
              <label htmlFor={field.name}>
                {field.label}
                {isCheckbox && (
                  <input
                    id={field.name}
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] || false}
                    onChange={handleChange}
                    style={{ marginLeft: "10px" }}
                    disabled={field.readOnly}
                  />
                )}
              </label>

              {isSelect ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                  onFocus={() => handleSelectFocus(field)}
                  required={field.required}
                  disabled={field.disabled}
                >
                  <option value="">Select</option>
                  {options.map((opt) =>
                    typeof opt === "object" ? (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ) : (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    )
                  )}
                </select>
              ) : isTextarea ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  rows="4"
                  required={field.required}
                  disabled={field.disabled}
                />
              ) : isFile ? (
                <input
                  id={field.name}
                  type="file"
                  name={field.name}
                  onChange={handleChange}
                  accept={field.accept}
                  required={field.required}
                  disabled={field.disabled}
                />
              ) : !isCheckbox ? (
                <input
                  id={field.name}
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                  autoComplete="off"
                  required={field.required}
                  readOnly={field.readOnly || field.disabled}
                  min={field.type === "number" ? "0" : undefined}
                  {...(field.type === "date" && {
                    min: field.min,
                    max: field.max,
                  })}
                />
              ) : null}

              {errors[field.name] && (
                <span
                  className="error-text"
                  style={{ color: "red", fontSize: "13px" }}
                >
                  {errors[field.name]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="form-buttons">
        <button
          type="submit"
          className="form-btn submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        <button
          type="button"
          className="form-btn reset"
          onClick={handleResetClick}
          disabled={isSubmitting}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

export default FormBuilder;
