import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error message nikalna
async function parseError(e, fallback = 'Error updating room status ❌') {
  try {
    if (e instanceof Response || typeof e?.json === 'function') {
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
    if (typeof e === 'string') return e;

    return fallback;
  } catch {
    return fallback;
  }
}

// 🔹 Badge for Active / Inactive
const ActiveBadge = ({ value }) => {
  const label = value === 'Active' ? 'Active' : 'Inactive';
  const bg = label === 'Active' ? '#16a34a' : '#9ca3af'; // green / grey

  return (
    <span
      className="status-badge active-badge"
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: bg,
        color: '#fff',
        minWidth: '70px',
        textAlign: 'center',
      }}
    >
      {label}
    </span>
  );
};

// 🔹 Badge for Room Status (Available / Occupied / Cleaning / OutOfService / Blocked)
const StatusBadge = ({ status }) => {
  let bg = '#6b7280'; // default grey
  switch (status) {
    case 'Available':
      bg = '#16a34a'; // green
      break;
    case 'Occupied':
      bg = '#2563eb'; // blue
      break;
    case 'Cleaning':
      bg = '#f59e0b'; // amber
      break;
    case 'OutOfService':
      bg = '#dc2626'; // red
      break;
    case 'Blocked':
      bg = '#7c3aed'; // purple
      break;
    default:
      bg = '#6b7280';
      break;
  }

  // Thoda readable label
  const label = status === 'OutOfService' ? 'Out of Service' : status;

  return (
    <span
      className="status-badge room-status-badge"
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: bg,
        color: '#fff',
        minWidth: '90px',
        textAlign: 'center',
      }}
    >
      {label}
    </span>
  );
};

function ReceptionRoomsStatus() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null); // full row store

  // 🔁 Load rooms
  const fetchRows = () => {
    fetch('http://localhost:5186/api/rooms')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load rooms ❌'));
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const statusOptions = [
    'Available',
    'Occupied',
    'Cleaning',
    'OutOfService',
    'Blocked'
  ];

  const activeOptions = ['Active', 'Inactive'];

  // 🧱 Form fields (receptionist ke liye)
  const fields = [
    {
      name: 'roomNumber',
      label: 'Room Number',
      type: 'text',
      disabled: true   // sirf dekh sakti hai
    },
    {
      name: 'roomTypeName',
      label: 'Room Type',
      type: 'text',
      disabled: true   // sirf dekh sakti hai
    },
    {
      name: 'floorNo',
      label: 'Floor No',
      type: 'text',
      disabled: true   // sirf dekh sakti hai
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: statusOptions,
      required: true
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'select',
      options: activeOptions,
      required: true
    }
  ];

  // 🔧 Field change handler
  const handleFieldChange = (fieldName, value, setFormValues) => {
    // read-only fields anyway disabled hain
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    if (!selectedRoom) return 'Please select a room from the list first.';
    if (!d.status) return 'Status is required.';
    if (!d.isActive) return 'Active field is required.';
    return null;
  };

  // 🔄 Convert form values → JSON payload (PascalCase)
  // receptionist sirf status / isActive change kar sakti hai,
  // baaki values selectedRoom se aa rahi hain
  const toPayload = (formValues) => {
    if (!selectedRoom) return null;

    return {
      RoomId: selectedRoom.roomId,
      RoomNumber: selectedRoom.roomNumber,
      RoomTypeId: selectedRoom.roomTypeId,
      FloorNo: selectedRoom.floorNo,
      Status: formValues.status || selectedRoom.status,
      IsActive:
        (formValues.isActive || (selectedRoom.isActive ? 'Active' : 'Inactive')) === 'Inactive'
          ? false
          : true,
      Notes: selectedRoom.notes || null
    };
  };

  // 💾 Submit (update status only)
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    const payload = toPayload(data);
    if (!payload) {
      toast.error('No room selected ❌');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5186/api/rooms/${payload.RoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw res;

      toast.success('Room status updated ✅');

      setInitialValues({});
      setSelectedRoom(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, 'Error updating room status ❌');
      toast.error(message);
    }
  };

  // ✏️ Select room for update
  const handleEdit = (index) => {
    const r = rows[index];

    setSelectedRoom(r);

    setInitialValues({
      roomNumber: r.roomNumber,
      roomTypeName: r.roomTypeName || '',
      floorNo: r.floorNo || '',
      status: r.status,
      isActive: r.isActive ? 'Active' : 'Inactive'
    });
  };

  // 📊 Table columns (no delete)
  const columns = [
    'roomId',
    'roomNumber',
    'roomTypeName',
    'floorNo',
    'status',
    'isActive',
    'actions'
  ];

  const rowsForTable = rows.map((r, idx) => ({
    ...r,
    // status: <StatusBadge status={r.status} />,
    isActive: <ActiveBadge value={r.isActive ? 'Active' : 'Inactive'} />,
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>
          Update Status
        </button>
      </div>
    )
  }));

  return (
    <div>
      <h2>Reception – Room Status</h2>

      <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
        Select a room from the list, then update only its <b>Status</b> or <b>Active</b> flag.
      </p>

      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />

      <DataTable columns={columns} rows={rowsForTable} />
    </div>
  );
}

export default ReceptionRoomsStatus;
