import React, { useEffect, useState } from "react";
import FormBuilder from "../components/FormBuilder";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";
import { useLimitedDateRange } from "../components/useLimitedDateRange";

// 🔹 Helper: backend error message nikalna
async function parseError(e, fallback = "Error saving reservation ❌") {
  try {
    if (e instanceof Response || typeof e?.json === "function") {
      const data = await e.json();
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && Array.isArray(data.errors[firstKey])) {
          return data.errors[firstKey][0];
        }
      }
      return fallback;
    }

    if (e?.message) return e.message;
    if (typeof e === "string") return e;

    return fallback;
  } catch {
    return fallback;
  }
}

function ReservationsManagement() {
  const { minDateStr, maxDateStr } = useLimitedDateRange({
    allowPastDays: 0,
    allowFutureDays: 15,
  });
  const [rows, setRows] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;
  // const [selectedRoomTypePrice, setSelectedRoomTypePrice] = useState('');
  const [selectedMaxOccupancy, setSelectedMaxOccupancy] = useState(null);

  // ⭐ NEW: manual check-in modal state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInReservation, setCheckInReservation] = useState(null);
  const [checkInAvailableRooms, setCheckInAvailableRooms] = useState([]);
  const [checkInSelectedRoomId, setCheckInSelectedRoomId] = useState("");

  // 🔁 Load room types (for dropdown)
  const fetchRoomTypes = () => {
    fetch("http://localhost:5186/api/roomtypes")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const activeOnly = data.filter((rt) => rt.isActive);
        setRoomTypes(activeOnly);
      })
      .catch(() => toast.error("Failed to load room types ❌"));
  };

  // 🔁 Load rooms (for room selection in check-in)
  const fetchRooms = () => {
    fetch("http://localhost:5186/api/rooms")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setRooms(data))
      .catch(() => toast.error("Failed to load rooms ❌"));
  };

  // 🔁 Load reservations
  const fetchRows = () => {
    fetch("http://localhost:5186/api/reservations")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setRows(data))
      .catch(() => toast.error("Failed to load reservations ❌"));
  };

  useEffect(() => {
    fetchRoomTypes();
    fetchRooms();
    fetchRows();
  }, []);

  // 🔹 Dropdown options
  const roomTypeOptions = roomTypes.map((rt) => ({
    label: rt.name,
    value: rt.roomTypeId,
  }));

  const statusOptions = [
    "Pending",
    "Confirmed",
    // 'CheckedIn',
    // 'CheckedOut',
    "Cancelled",
    "NoShow",
  ];

  const editingStatus = isEditing ? initialValues.status || "" : "";

  // 🧱 Form fields
  const fields = [
    // 🧍 Guest info
    {
      name: "guestName",
      label: "Guest Name",
      type: "text",
      required: true,
      maxLength: 150,
    },
    {
      name: "guestContact",
      label: "Contact",
      type: "text",
      required: true,
      maxLength: 20,
    },
    {
      name: "guestEmail",
      label: "Email",
      type: "email",
      maxLength: 150,
    },

    // 🛏 Room & dates
    {
      name: "roomTypeId",
      label: "Room Type",
      type: "select",
      options: roomTypeOptions,
      required: true,
      // agar already CheckedIn/CheckedOut hai to lock kar den
      disabled: editingStatus === "CheckedIn" || editingStatus === "CheckedOut",
    },
    {
      name: "basePricePerNight",
      label: "Price per Night",
      type: "number",
      disabled: true,
    },

    {
      name: "checkInDate",
      label: "Check-In Date",
      type: "date",
      min: minDateStr,
      max: maxDateStr,
      required: true,
      disabled: editingStatus === "CheckedIn" || editingStatus === "CheckedOut",
    },
    {
      name: "checkOutDate",
      label: "Check-Out Date",
      type: "date",
      required: true,
      min: minDateStr,
      max: maxDateStr,
      disabled: editingStatus === "CheckedIn" || editingStatus === "CheckedOut",
    },
    {
      name: "adults",
      label: "Adults",
      type: "number",
      required: true,
      min: 1,
      max: selectedMaxOccupancy || undefined,
    },
    {
      name: "children",
      label: "Children",
      type: "number",
      min: 0,
      max: selectedMaxOccupancy || undefined,
    },
    // 🔁 Status & remarks
    {
      name: "status",
      label: "Status",
      type: "select",
      options: statusOptions,
      required: true,
      // status ko bhi lock kar sakte ho for CheckedOut agar chaho
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textarea",
      maxLength: 500,
    },
  ];

  // 🔧 Field change handler
  const handleFieldChange = (fieldName, value, setFormValues) => {
    // RoomTypeId select (object / value)
    if (fieldName === "roomTypeId") {
      const selectedId =
        value && typeof value === "object" && "value" in value
          ? value.value
          : value;

      const rt = roomTypes.find((r) => r.roomTypeId === Number(selectedId));

      setFormValues((prev) => ({
        ...prev,
        roomTypeId: selectedId,
        basePricePerNight: rt ? rt.basePricePerNight : "",
      }));

      setSelectedMaxOccupancy(rt ? rt.maxOccupancy : null);
      return;
    }

    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    if (!d.guestName?.trim()) return "Guest Name is required.";
    if (!d.guestContact?.trim()) return "Contact is required.";
    if (!d.roomTypeId) return "Room Type is required.";
    if (!d.checkInDate) return "Check-In Date is required.";
    if (!d.checkOutDate) return "Check-Out Date is required.";
    if (!d.status) return "Status is required.";

    const inDate = new Date(d.checkInDate);
    const outDate = new Date(d.checkOutDate);
    if (outDate < inDate) return "Check-Out cannot be before Check-In.";

    if (Number(d.adults) < 1) return "At least 1 adult is required.";

    if (Number(d.children) < 0) return "Children cannot be negative.";

    // 🔴 occupancy check
    if (selectedMaxOccupancy != null) {
      const total = Number(d.adults || 0) + Number(d.children || 0);
      if (total > selectedMaxOccupancy) {
        return `Total guests cannot exceed max occupancy (${selectedMaxOccupancy}).`;
      }
    }

    return null;
  };

  // 🔄 Convert form values → JSON payload (PascalCase)
  const toPayload = (d) => {
    return {
      ReservationId: d.reservationId || 0,
      GuestName: d.guestName?.trim() || "",
      GuestContact: d.guestContact?.trim() || "",
      GuestEmail: d.guestEmail?.trim() || null,
      RoomTypeId: Number(d.roomTypeId),
      RoomId: null, // assign on check-in
      CheckInDate: d.checkInDate,
      CheckOutDate: d.checkOutDate,
      Adults: Number(d.adults || 1),
      Children: Number(d.children || 0),
      Status: d.status || "Confirmed",
      Remarks: d.remarks?.trim() || null,
    };
  };

  // 💾 Submit (Create / Update)
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) {
      toast.error(err);
      return;
    }

    const payload = toPayload(data);

    try {
      let res;
      if (isEditing) {
        res = await fetch(
          `http://localhost:5186/api/reservations/${data.reservationId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw res;
        toast.info("Reservation updated ✅");
      } else {
        res = await fetch("http://localhost:5186/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw res;
        toast.success("Reservation created ✅");
      }

      setInitialValues({});
      setEditId(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, "Error saving reservation ❌");
      toast.error(message);
    }
  };

  // ✏️ Edit row
  const handleEdit = (index) => {
    const r = rows[index];

    const toYMD = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    setInitialValues({
      reservationId: r.reservationId,
      guestName: r.guestName,
      guestContact: r.guestContact,
      guestEmail: r.guestEmail || "",
      roomTypeId: r.roomTypeId,
      checkInDate: toYMD(r.checkInDate),
      checkOutDate: toYMD(r.checkOutDate),
      basePricePerNight:
        roomTypes.find((rt) => rt.roomTypeId === r.roomTypeId)
          ?.basePricePerNight || "",

      adults: r.adults,
      children: r.children,
      status: r.status,
      remarks: r.remarks || "",
    });
    setEditId(r.reservationId);
  };

  // 🗑️ Delete row
  const handleDelete = async (index) => {
    const r = rows[index];

    try {
      const res = await fetch(
        `http://localhost:5186/api/reservations/${r.reservationId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw res;
      toast.error("Reservation deleted ❌");
      fetchRows();
    } catch (e) {
      const message = await parseError(e, "Failed to delete reservation ❌");
      toast.error(message);
    }
  };

  // ⭐ NEW: Open check-in modal (manual room selection)
  const openCheckInModal = (index) => {
    const r = rows[index];

    if (r.status === "CheckedIn") {
      toast.info("This reservation is already checked in.");
      return;
    }
    if (r.status === "CheckedOut") {
      toast.error("Checked-out reservation cannot be checked in again.");
      return;
    }
    if (r.status === "Cancelled" || r.status === "NoShow") {
      toast.error(`Cannot check-in a ${r.status} reservation.`);
      return;
    }

    // available rooms for this roomType
    const availableRooms = rooms.filter(
      (ro) =>
        ro.roomTypeId === r.roomTypeId &&
        ro.isActive &&
        String(ro.status).toLowerCase() === "available"
    );

    if (!availableRooms || availableRooms.length === 0) {
      toast.error("No available room found for this room type ❌");
      return;
    }

    setCheckInReservation(r);
    setCheckInAvailableRooms(availableRooms);
    setCheckInSelectedRoomId("");
    setCheckInModalOpen(true);
  };

  const closeCheckInModal = () => {
    setCheckInModalOpen(false);
    setCheckInReservation(null);
    setCheckInAvailableRooms([]);
    setCheckInSelectedRoomId("");
  };

  // ⭐ NEW: Confirm check-in with selected room
  const confirmCheckIn = async () => {
    if (!checkInReservation) {
      toast.error("No reservation selected.");
      return;
    }
    if (!checkInSelectedRoomId) {
      toast.error("Please select a room for check-in.");
      return;
    }

    const body = {
      roomId: Number(checkInSelectedRoomId),
      remarks: "Checked in via Reservations screen (manual room selection)",
    };

    try {
      const res = await fetch(
        `http://localhost:5186/api/reservations/${checkInReservation.reservationId}/checkin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw res;

      toast.success("Guest checked in ✅");
      closeCheckInModal();
      fetchRows();
      fetchRooms(); // refresh room statuses
    } catch (e) {
      const message = await parseError(e, "Error during check-in ❌");
      toast.error(message);
    }
  };

  // ✅ Check-Out
  const handleCheckOut = async (index) => {
    const r = rows[index];

    if (r.status !== "CheckedIn") {
      toast.error(
        `Only 'CheckedIn' reservations can be checked out. Current status: ${r.status}`
      );
      return;
    }

    if (
      !window.confirm(`Check-out guest from reservation #${r.reservationId}?`)
    ) {
      return;
    }

    const body = {
      remarks: "Checked out via Reservations screen",
      makeRoomAvailable: false, // false => Cleaning; true => Available
    };

    try {
      const res = await fetch(
        `http://localhost:5186/api/reservations/${r.reservationId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw res;

      toast.success("Guest checked out ✅");
      fetchRows();
      fetchRooms(); // refresh room statuses
    } catch (e) {
      const message = await parseError(e, "Error during check-out ❌");
      toast.error(message);
    }
  };

  // 📊 Table columns
  const columns = [
    "reservationId",
    "guestName",
    "guestContact",
    "roomTypeName",
    "roomNumber",
    "checkInDate",
    "checkOutDate",
    "status",
    "actions",
  ];

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    checkInDate: r.checkInDate
      ? new Date(r.checkInDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    checkOutDate: r.checkOutDate
      ? new Date(r.checkOutDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>
          Edit
        </button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>
          Delete
        </button>
        <button className="btn" onClick={() => openCheckInModal(idx)}>
          Check-In
        </button>
        <button className="btn" onClick={() => handleCheckOut(idx)}>
          Check-Out
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <h2>Reservations Management</h2>
      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />
      <DataTable columns={columns} rows={rowsForTable} />

      {/* ⭐ NEW: Check-In Modal for manual room selection */}
      {checkInModalOpen && (
        <div className="modal-overlay" onClick={closeCheckInModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Check-In – Reservation #{checkInReservation?.reservationId} (
                {checkInReservation?.guestName})
              </h3>
              <button className="modal-close" onClick={closeCheckInModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                Room Type: <strong>{checkInReservation?.roomTypeName}</strong>
              </p>
              <p>Select room to assign:</p>

              <select
                value={checkInSelectedRoomId}
                onChange={(e) => setCheckInSelectedRoomId(e.target.value)}
              >
                <option value="">Select Room</option>
                {checkInAvailableRooms.map((room) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.roomNumber}{" "}
                    {/* yahan aur info bhi dikha sakte ho e.g. floor */}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: "16px" }}>
                <button className="btn" onClick={confirmCheckIn}>
                  Confirm Check-In
                </button>
                <button
                  className="btn"
                  onClick={closeCheckInModal}
                  style={{ marginLeft: "8px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsManagement;
