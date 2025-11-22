import React, { useState, useEffect } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { toast } from 'react-toastify';

function Users() {
  const [userList, setUserList] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ added

  const fields = [
    { name: 'fullName', label: 'Full Name', type: 'text', disabled: isEditing },
    { name: 'email', label: 'Email', type: 'email' },
 {
    name: 'password',
    type: showPassword ? 'text' : 'password',
    label: (
      <span>
        Password{' '}
        <span
          onClick={() => setShowPassword(!showPassword)}
          style={{ cursor: 'pointer', marginLeft: '8px' }}
        >
          {showPassword ? '🙈' : '👁️'}
        </span>
      </span>
    )
  },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: ['Admin'],
    },
  ];

  // ✅ Fetch users from API
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUserList(data);
    } catch (error) {
      console.error(error);
      toast.error('Error loading users ❌');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ Submit (Create or Update)
  const handleSubmit = async (data) => {
    try {
      if (isEditing && data.userID) {
        await updateUser(data.userID, data); // ✅ fixed from userId to userID
        toast.success('User updated ✅');
      } else {
        await createUser(data);
        toast.success('User created ✅');
      }
      setFormValues({});
      setIsEditing(false);
      loadUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error creating/updating user ❌');
    }
  };

  // ✅ Delete from API
  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      toast.success('User deleted ✅');
      loadUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting user ❌');
    }
  };

  const handleEdit = (index) => {
    const selected = userList[index];
    setFormValues(selected);
    setIsEditing(true);
  };

  const columns = ['userCode', 'fullName', 'email', 'role', 'actions']; // ✅ fixed userId → userID

  const tableRows = userList.map((user, index) => ({
    ...user,
    actions: (
      <div className="action-buttons">
        <button className="btn edit-btn" onClick={() => handleEdit(index)}>Edit</button>
        <button className="btn delete-btn" onClick={() => handleDelete(user.userID)}>Delete</button> {/* ✅ fixed userId → userID */}
      </div>
    )
  }));

  return (
    <div>
      <h2>User Management</h2>
      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={formValues}
        checkDuplicate={(name, value) =>
          name === 'email' ? userList.some(u => u.email === value && u.userID !== formValues.userID) : false // ✅ fixed userId → userID
        }
      />
      <DataTable columns={columns} rows={tableRows} />
    </div>
  );
}

export default Users;
