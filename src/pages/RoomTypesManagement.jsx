import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error message
async function parseError(e, fallback = 'Error saving room type ❌') {
  try {
    if (e instanceof Response || typeof e?.json === 'function') {
      const data = await e.json();
      if (data?.message) return data.message;
      if (data?.error) return data.error;
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (Array.isArray(data.errors[firstKey])) {
          return data.errors[firstKey][0];
        }
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// 🔹 Badge
const ActiveBadge = ({ value }) => {
  const label = value === 'Active' ? 'Active' : 'Inactive';
  const bg = label === 'Active' ? '#16a34a' : '#9ca3af';

  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        backgroundColor: bg,
        color: '#fff',
      }}
    >
      {label}
    </span>
  );
};

function RoomTypesManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);

  const isEditing = !!editId;

  // 🔁 Load data
  const fetchRows = () => {
    fetch('http://localhost:5186/api/roomtypes')
      .then(res => res.json())
      .then(setRows)
      .catch(() => toast.error('Failed to load room types ❌'));
  };

  useEffect(fetchRows, []);

  // ⬆ Upload ONE image
  const uploadImage = async (roomTypeId, imageFile) => {
    if (!imageFile) return;

    const fd = new FormData();
    fd.append('file', imageFile);

    const res = await fetch(
      `http://localhost:5186/api/roomtypes/${roomTypeId}/upload-image`,
      { method: 'POST', body: fd }
    );

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Image upload failed');
    }
  };

  const roomtypes = [
    "Standard Room (STD)",
    "Deluxe Room (DLX)",
    "Super Deluxe Room (SDLX)",
    "Executive Room (EXE)",
    "Suite (STE)",
    "Family Room (FAM)",
  ];

  const roomTypeCodes = ["STD", "DLX", "SDLX", "EXE", "STE", "FAM"];

  const roomTypeCodeMap = {
    "Standard Room (STD)": "STD",
    "Deluxe Room (DLX)": "DLX",
    "Super Deluxe Room (SDLX)": "SDLX",
    "Executive Room (EXE)": "EXE",
    "Suite (STE)": "STE",
    "Family Room (FAM)": "FAM",
  };

  // 🧱 Form fields (IMAGE FORM KE ANDAR)
  const fields = [
    {
      name: 'code',
      label: 'Code',
      type: 'select',
      options: roomTypeCodes,
      disabled: true,
    },
    {
      name: 'name',
      label: 'Room Type Name',
      type: 'select',
      options: roomtypes,
      required: true,
    },
    {
      name: 'basePricePerNight',
      label: 'Base Price / Night',
      type: 'number',
      required: true,
    },
    {
      name: 'maxOccupancy',
      label: 'Max Occupancy',
      type: 'number',
      required: true,
    },
    {
      name: 'image',
      label: 'Room Image',
      type: 'file',
      accept: 'image/*',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
    {
      name: 'isActive',
      label: 'Status',
      type: 'select',
      options: ['Active', 'Inactive'],
      required: true,
    },
  ];

  // 🔧 Auto code fill
  const handleFieldChange = (name, value, setFormValues) => {
    if (name === 'name') {
      setFormValues(prev => ({
        ...prev,
        name: value,
        code: roomTypeCodeMap[value] || '',
      }));
      return;
    }
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const validate = (d) => {
    if (!d.name) return 'Room type name is required';
    if (!d.basePricePerNight || Number(d.basePricePerNight) <= 0)
      return 'Base price must be greater than 0';
    if (!d.maxOccupancy || Number(d.maxOccupancy) <= 0)
      return 'Max occupancy must be greater than 0';
    if (!d.isActive) return 'Status is required';
    return null;
  };

  const toPayload = (d) => ({
    RoomTypeId: d.roomTypeId || 0,
    Name: d.name,
    Code: d.code || null,
    BasePricePerNight: Number(d.basePricePerNight),
    MaxOccupancy: Number(d.maxOccupancy),
    Description: d.description || null,
    IsActive: d.isActive !== 'Inactive',
  });

  // 💾 Submit
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    try {
      let roomTypeId;

      if (isEditing) {
        const res = await fetch(
          `http://localhost:5186/api/roomtypes/${data.roomTypeId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toPayload(data)),
          }
        );
        if (!res.ok) throw res;

        roomTypeId = data.roomTypeId;
        toast.info('Room type updated ✅');
      } else {
        const res = await fetch(
          `http://localhost:5186/api/roomtypes`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toPayload(data)),
          }
        );
        if (!res.ok) throw res;

        const created = await res.json();
        roomTypeId = created.roomTypeId;
        toast.success('Room type created ✅');
      }

      // 🔹 upload single image (optional)
      await uploadImage(roomTypeId, data.image);

      setInitialValues({});
      setEditId(null);
      fetchRows();

    } catch (e) {
      toast.error(await parseError(e));
    }
  };

  // ✏️ Edit
  const handleEdit = (idx) => {
    const r = rows[idx];
    setInitialValues({
      roomTypeId: r.roomTypeId,
      name: r.name,
      code: r.code || '',
      basePricePerNight: r.basePricePerNight,
      maxOccupancy: r.maxOccupancy,
      description: r.description || '',
      isActive: r.isActive ? 'Active' : 'Inactive',
    });
    setEditId(r.roomTypeId);
  };

  const handleDelete = async (idx) => {
    await fetch(`http://localhost:5186/api/roomtypes/${rows[idx].roomTypeId}`, {
      method: 'DELETE',
    });
    fetchRows();
  };

  const columns = [
    'roomTypeId',
    'name',
    'code',
    'basePricePerNight',
    'maxOccupancy',
    'isActive',
    'actions',
  ];

  const rowsForTable = rows.map((r, i) => ({
    ...r,
    isActive: <ActiveBadge value={r.isActive ? 'Active' : 'Inactive'} />,
    actions: (
  <div className="action-buttons">
    <button
      className="btn edit-btn"
      onClick={() => handleEdit(i)}
    >
      Edit
    </button>

    <button
      className="btn delete-btn"
      onClick={() => handleDelete(i)}
    >
      Delete
    </button>
  </div>
)

  }));

  return (
    <div>
      <h2>Room Types Management</h2>

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

export default RoomTypesManagement;
  