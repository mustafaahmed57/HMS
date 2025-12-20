import React, { useEffect, useState } from "react";
import FormBuilder from "../components/FormBuilder";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";

// 🔹 Helper: backend error message
async function parseError(e, fallback = "Error updating booking status ❌") {
  try {
    if (e instanceof Response || typeof e?.json === "function") {
      const data = await e.json();
      if (data?.message) return data.message;
      return fallback;
    }
    if (e?.message) return e.message;
    return fallback;
  } catch {
    return fallback;
  }
}

// 🔹 Status Badge
const StatusBadge = ({ status }) => {
  let bg = "#6b7280";
  if (status === "Pending") bg = "#f59e0b";
  if (status === "Confirmed") bg = "#16a34a";
  if (status === "Cancelled") bg = "#dc2626";

  return (
    <span
      style={{
        padding: "2px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: bg,
        color: "#fff",
        minWidth: "90px",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      {status}
    </span>
  );
};

function BookingsStatusManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);

  // 🔁 Load bookings
  const fetchRows = () => {
    fetch("http://localhost:5186/api/bookings")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setRows(data))
      .catch(() => toast.error("Failed to load bookings ❌"));
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const statusOptions = ["Pending", "Confirmed", "Cancelled"];

  // 🧱 Form fields (ADMIN — status only)
  const fields = [
    {
      name: "bookingId",
      label: "Booking ID",
      type: "text",
      disabled: true,
    },
    {
      name: "customerName",
      label: "Customer",
      type: "text",
      disabled: true,
    },
    {
      name: "roomTypeName",
      label: "Room Type",
      type: "text",
      disabled: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: statusOptions,
      required: true,
    },
  ];

  const handleFieldChange = (name, value, setFormValues) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Validation
  const validate = (d) => {
    if (!selectedBooking) return "Select a booking first.";
    if (!d.status) return "Status is required.";
    return null;
  };

  // 🔄 Payload (STATUS ONLY)
  const toPayload = (formValues) => {
    if (!selectedBooking) return null;

    return {
      Status: formValues.status,
    };
  };

  // 💾 Submit
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) {
      toast.error(err);
      return;
    }

    const payload = toPayload(data);
    if (!payload) return;

    try {
      const res = await fetch(
        `http://localhost:5186/api/bookings/${selectedBooking.bookingId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw res;

      toast.success("Booking status updated ✅");
      setInitialValues({});
      setSelectedBooking(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e);
      toast.error(message);
    }
  };

  // ✏️ Select booking
  const handleEdit = (index) => {
    const b = rows[index];
    setSelectedBooking(b);

    setInitialValues({
      bookingId: b.bookingId,
      customerName: b.customerName,
      roomTypeName: b.roomTypeName,
      status: b.status,
    });
  };

  // 📊 Table
  const columns = [
    "bookingId",
    "customerName",
    "roomTypeName",
    "checkInDate",
    "checkOutDate",
    "status",
    "actions",
  ];

  const rowsForTable = rows.map((b, idx) => ({
    ...b,
    checkInDate: b.checkInDate
      ? new Date(b.checkInDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    checkOutDate: b.checkOutDate
      ? new Date(b.checkOutDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    status: <StatusBadge status={b.status} />,
    actions: (
      <button className="btn edit-btn" onClick={() => handleEdit(idx)}>
        Update Status
      </button>
    ),
  }));

  return (
    <div>
      <h2>Bookings – Online Requests</h2>

      <p style={{ fontStyle: "italic", marginBottom: "10px" }}>
        Online booking requests. Admin can <b>only change status</b> after
        manual reservation.
      </p>

      <FormBuilder
        fields={fields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onFieldChange={handleFieldChange}
      />

      <DataTable columns={columns} rows={rowsForTable} />
    </div>
  );
}

export default BookingsStatusManagement;
