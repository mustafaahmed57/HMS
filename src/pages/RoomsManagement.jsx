import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error message nikalna
async function parseError(e, fallback = 'Error saving room ❌') {
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

// 🔹 Floor & Room mapping (frontend only)
const floors = ['F1', 'F2', 'F3'];

const floorRoomMap = {
  F1: ['R101', 'R102', 'R103', 'R104', 'R105', 'R106', 'R107', 'R108', 'R109', 'R110'],
  F2: ['R201', 'R202', 'R203', 'R204', 'R205', 'R206', 'R207', 'R208', 'R209', 'R210'],
  F3: ['R301', 'R302', 'R303', 'R304', 'R305', 'R306', 'R307', 'R308', 'R309', 'R310'],
};

function RoomsManagement() {
  const [rows, setRows] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  // 🔹 for dependent dropdown
  const [roomOptions, setRoomOptions] = useState([]);
  const [, setSelectedFloor] = useState('');

  // 🔁 Load room types (for dropdown)
  const fetchRoomTypes = () => {
    fetch('http://localhost:5186/api/roomtypes')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        // sirf active room types dikhana ho to:
        const activeOnly = data.filter(rt => rt.isActive);
        setRoomTypes(activeOnly);
      })
      .catch(() => toast.error('Failed to load room types ❌'));
  };

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
    fetchRoomTypes();
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

  const roomTypeOptions = roomTypes.map(rt => ({
    label: rt.name,
    value: rt.roomTypeId
  }));

  // 🧱 Form fields
  const fields = [
    {
      name: 'floorNo',
      label: 'Floor',
      type: 'select',
      options: floors,          // ['F1','F2','F3']
      required: true
    },
    {
      name: 'roomNumber',
      label: 'Room Number',
      type: 'select',
      options: roomOptions,     // dynamic, floor ke hisaab se
      required: true
    },
    {
      name: 'roomTypeId',
      label: 'Room Type',
      type: 'select',
      options: roomTypeOptions,
      required: true
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
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      maxLength: 500
    }
  ];

  // 🔧 Field change handler
  const handleFieldChange = (fieldName, value, setFormValues) => {
    // 🟢 Floor change: room options bhi update karo
    if (fieldName === 'floorNo') {
      const floor = value;
      const roomsForFloor = floorRoomMap[floor] || [];

      setSelectedFloor(floor);
      setRoomOptions(roomsForFloor);

      setFormValues(prev => ({
        ...prev,
        floorNo: floor,
        roomNumber: ''   // floor change pe room reset
      }));
      return;
    }

    // 🟡 RoomType dropdown ka special handling
    if (fieldName === 'roomTypeId') {
      if (value && typeof value === 'object' && 'value' in value) {
        setFormValues(prev => ({ ...prev, roomTypeId: value.value }));
      } else {
        setFormValues(prev => ({ ...prev, roomTypeId: value }));
      }
      return;
    }

    // 🔵 baaqi fields normal
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    if (!d.floorNo) return 'Floor is required.';
    if (!d.roomNumber) return 'Room Number is required.';
    if (!d.roomTypeId) return 'Room Type is required.';
    if (!d.status) return 'Status is required.';
    if (!d.isActive) return 'Active field is required.';
    return null;
  };

  // 🔄 Convert form values → JSON payload (PascalCase)
  const toPayload = (d) => {
    return {
      RoomId: d.roomId || 0,
      RoomNumber: d.roomNumber || '',
      RoomTypeId: Number(d.roomTypeId),
      FloorNo: d.floorNo?.trim() || null,
      Status: d.status || 'Available',
      IsActive: d.isActive === 'Inactive' ? false : true,
      Notes: d.notes?.trim() || null
    };
  };

  // 💾 Submit
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    const payload = toPayload(data);

    try {
      let res;
      if (isEditing) {
        res = await fetch(`http://localhost:5186/api/rooms/${data.roomId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.info('Room updated ✅');
      } else {
        res = await fetch('http://localhost:5186/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.success('Room created ✅');
      }

      setInitialValues({});
      setEditId(null);
      setSelectedFloor('');
      setRoomOptions([]);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, 'Error saving room ❌');
      toast.error(message);
    }
  };

  // ✏️ Edit row
  const handleEdit = (index) => {
    const r = rows[index];

    const floor = r.floorNo || '';
    const roomsForFloor = floorRoomMap[floor] || [];

    setSelectedFloor(floor);
    setRoomOptions(roomsForFloor);

    setInitialValues({
      roomId: r.roomId,
      roomNumber: r.roomNumber,
      roomTypeId: r.roomTypeId,
      floorNo: floor,
      status: r.status,
      isActive: r.isActive ? 'Active' : 'Inactive',
      notes: r.notes || ''
    });
    setEditId(r.roomId);
  };

  // 🗑️ Delete row
  const handleDelete = async (index) => {
    const id = rows[index].roomId;
    try {
      const res = await fetch(`http://localhost:5186/api/rooms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Room deleted ❌');
      fetchRows();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // 📊 Table columns
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
    isActive: r.isActive ? 'Active' : 'Inactive',
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
      </div>
    )
  }));

  return (
    <div>
      <h2>Rooms Management</h2>
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

export default RoomsManagement;
