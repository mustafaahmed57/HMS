import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error message nikalna
async function parseError(e, fallback = 'Error saving room type ❌') {
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

function RoomTypesManagement() {
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [editId, setEditId] = useState(null);
  const isEditing = !!editId;

  // 🔁 Load room types
  const fetchRows = () => {
    fetch('http://localhost:5186/api/roomtypes')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load room types ❌'));
  };

  useEffect(() => {
    fetchRows();
  }, []);

const roomtypes = [
  "Standard Room (STD)",
  "Deluxe Room (DLX)",
  "Super Deluxe Room (SDLX)",
  "Executive Room (EXE)",
  "Suite (STE)",
  "Family Room (FAM)",
];

const roomTypeCodes = [
  "STD",
  "DLX",
  "SDLX",
  "EXE",
  "STE",
  "FAM",
];

// 👇 name se code nikalne ke liye map
const roomTypeCodeMap = {
  "Standard Room (STD)": "STD",
  "Deluxe Room (DLX)": "DLX",
  "Super Deluxe Room (SDLX)": "SDLX",
  "Executive Room (EXE)": "EXE",
  "Suite (STE)": "STE",
  "Family Room (FAM)": "FAM",
};


  // 🧱 Form fields
  const activeOptions = ['Active', 'Inactive'];

  const fields = [
    {
      name: 'code',
      label: 'Code (optional)',
      type: 'select',
      options: roomTypeCodes,
      maxLength: 50,
      disabled: true   
    },
    {
      name: 'name',
      label: 'Room Type Name',
      type: 'select',
      options: roomtypes,
      required: true,
      maxLength: 100
    },
    {
      name: 'basePricePerNight',
      label: 'Base Price / Night',
      type: 'number',
      required: true,
      min: 0
    },
    {
      name: 'maxOccupancy',
      label: 'Max Occupancy',
      type: 'number',
      required: true,
      min: 1
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      maxLength: 500
    },
    {
      name: 'isActive',
      label: 'Status',
      type: 'select',
      options: activeOptions,
      required: true
    }
  ];

  // 🔧 Field change handler
const handleFieldChange = (fieldName, value, setFormValues) => {
  // 🟢 Jab Room Type Name change ho
  if (fieldName === 'name') {
    const selectedName = value;
    const autoCode = roomTypeCodeMap[selectedName] || '';

    setFormValues(prev => ({
      ...prev,
      name: selectedName,
      code: autoCode || prev.code,  // code auto-fill
    }));
    return;
  }

  // Baaki fields normal
  setFormValues(prev => ({ ...prev, [fieldName]: value }));
};


  // ✅ Front-end validation
  const validate = (d) => {
    if (!d.name?.trim()) return 'Room type name is required.';
    if (d.basePricePerNight == null || d.basePricePerNight === '')
      return 'Base price per night is required.';
    if (Number(d.basePricePerNight) <= 0)
      return 'Base price must be greater than 0.';
    if (d.maxOccupancy == null || d.maxOccupancy === '')
      return 'Max occupancy is required.';
    if (Number(d.maxOccupancy) <= 0)
      return 'Max occupancy must be greater than 0.';
    if (!d.isActive) return 'Status is required.';
    return null;
  };

  // 🔄 Convert form values → plain JSON (PascalCase for backend model)
  const toPayload = (d) => {
    return {
      RoomTypeId: d.roomTypeId || 0,
      Name: d.name || '',
      Code: d.code || null,
      BasePricePerNight: Number(d.basePricePerNight || 0),
      MaxOccupancy: Number(d.maxOccupancy || 0),
      Description: d.description?.trim() || null,
      IsActive: d.isActive === 'Inactive' ? false : true
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
        res = await fetch(`http://localhost:5186/api/roomtypes/${data.roomTypeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.info('Room type updated ✅');
      } else {
        res = await fetch('http://localhost:5186/api/roomtypes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw res;
        toast.success('Room type created ✅');
      }

      setInitialValues({});
      setEditId(null);
      fetchRows();
    } catch (e) {
      const message = await parseError(e, 'Error saving room type ❌');
      toast.error(message);
    }
  };

  // ✏️ Edit row
  const handleEdit = (index) => {
    const r = rows[index];

    setInitialValues({
      roomTypeId: r.roomTypeId,
      name: r.name,
      code: r.code || '',
      basePricePerNight: r.basePricePerNight,
      maxOccupancy: r.maxOccupancy,
      description: r.description || '',
      isActive: r.isActive ? 'Active' : 'Inactive'
    });
    setEditId(r.roomTypeId);
  };

  // 🗑️ Delete row
  const handleDelete = async (index) => {
    const id = rows[index].roomTypeId;
    try {
      const res = await fetch(`http://localhost:5186/api/roomtypes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.error('Room type deleted ❌');
      fetchRows();
    } catch {
      toast.error('Failed to delete ❌');
    }
  };

  // 📊 Table columns
  const columns = [
    'roomTypeId',
    'name',
    'code',
    'basePricePerNight',
    'maxOccupancy',
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
