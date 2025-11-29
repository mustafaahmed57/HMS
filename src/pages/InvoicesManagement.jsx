import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';

// 🔹 Helper: backend error parse
async function parseError(e, fallback = 'Error saving invoice ❌') {
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

function InvoicesManagement() {
  const [reservationOptions, setReservationOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔁 Load reservation dropdown options (CheckedOut + no invoice)
  const fetchReservationOptions = () => {
    fetch('http://localhost:5186/api/invoices/reservation-options')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        const opts = data.map(x => ({
          label: x.displayText,   // "123 - Ali Khan"
          value: x.reservationId
        }));
        setReservationOptions(opts);
      })
      .catch(() => toast.error('Failed to load reservations for invoicing ❌'));
  };

  // 🔁 Load invoices for table
  const fetchInvoices = () => {
    fetch('http://localhost:5186/api/invoices')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setRows(data))
      .catch(() => toast.error('Failed to load invoices ❌'));
  };

  useEffect(() => {
    fetchReservationOptions();
    fetchInvoices();

    // initial empty form
    setInitialValues({
      reservationId: '',
      guestName: '',
      roomNumber: '',
      checkInDate: '',
      checkOutDate: '',
      nights: '',
      roomRate: '',
      roomAmount: '',
      extraCharges: 0,
      discount: 0,
      grandTotal: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid'
    });
  }, []);

  const paymentMethods = ['Cash', 'Card', 'Online', 'BankTransfer'];
  const paymentStatusOptions = ['Paid'];

  // 🧱 Form fields – exactly tumhari logic ke mutabiq
  const fields = [
    {
      name: 'reservationId',
      label: 'Reservation (Checked-out only)',
      type: 'select',
      options: reservationOptions,
      required: true
    },
    {
      name: 'guestName',
      label: 'Guest Name',
      type: 'text',
      disabled: true
    },
    {
      name: 'roomNumber',
      label: 'Room Number',
      type: 'text',
      disabled: true
    },
    {
      name: 'checkInDate',
      label: 'Check-In Date',
      type: 'date',
      disabled: true
    },
    {
      name: 'checkOutDate',
      label: 'Check-Out Date',
      type: 'date',
      disabled: true
    },
    {
      name: 'nights',
      label: 'Nights',
      type: 'number',
      disabled: true
    },
    {
      name: 'roomRate',
      label: 'Room Rate (per night)',
      type: 'number',
      disabled: true
    },
    {
      name: 'roomAmount',
      label: 'Room Amount',
      type: 'number',
      disabled: true
    },
    {
      name: 'extraCharges',
      label: 'Extra Charges',
      type: 'number',
      min: 0
    },
    {
      name: 'discount',
      label: 'Discount',
      type: 'number',
      min: 0
    },
    {
      name: 'grandTotal',
      label: 'Grand Total',
      type: 'number',
      disabled: true
    },
    {
      name: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      options: paymentMethods,
      required: true
    },
    {
      name: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: paymentStatusOptions,
      required: true
    }
  ];

  // 🔧 helper: date → yyyy-MM-dd
  const toYMD = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 🔧 Field change handler (reservation select + recalculation)
  const handleFieldChange = (fieldName, value, setFormValues) => {
    if (fieldName === 'reservationId') {
      let reservationId = value;

      // agar option object {label,value} aa raha ho
      if (value && typeof value === 'object' && 'value' in value) {
        reservationId = value.value;
      }

      if (!reservationId) {
        setFormValues(prev => ({
          ...prev,
          reservationId: '',
          guestName: '',
          roomNumber: '',
          checkInDate: '',
          checkOutDate: '',
          nights: '',
          roomRate: '',
          roomAmount: '',
          grandTotal: 0
        }));
        return;
      }

      // backend se summary fetch karo
      fetch(`http://localhost:5186/api/invoices/reservation-summary/${reservationId}`)
        .then(res => {
          if (!res.ok) throw res;
          return res.json();
        })
        .then(summary => {
          setFormValues(prev => {
            const extra = Number(prev.extraCharges || 0);
            const disc = Number(prev.discount || 0);

            const roomAmount = Number(summary.roomAmount || 0);
            let grand = roomAmount + extra - disc;
            if (grand < 0) grand = 0;

            return {
              ...prev,
              reservationId,
              guestName: summary.guestName,
              roomNumber: summary.roomNumber || '',
              checkInDate: toYMD(summary.checkInDate),
              checkOutDate: toYMD(summary.checkOutDate),
              nights: summary.nights,
              roomRate: summary.roomRate,
              roomAmount: summary.roomAmount,
              grandTotal: grand
            };
          });
        })
        .catch(async (e) => {
          const message = await parseError(e, 'Failed to load reservation summary ❌');
          toast.error(message);
        });

      return;
    }

    // ExtraCharges / Discount change → GrandTotal recalc
    if (fieldName === 'extraCharges' || fieldName === 'discount') {
      setFormValues(prev => {
        const updated = { ...prev, [fieldName]: value };

        const roomAmount = Number(updated.roomAmount || 0);
        const extra = Number(updated.extraCharges || 0);
        const disc = Number(updated.discount || 0);

        let grand = roomAmount + extra - disc;
        if (grand < 0) grand = 0;

        updated.grandTotal = grand;
        return updated;
      });
      return;
    }

    // baaki fields normal
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // ✅ Front-end validation
  const validate = (d) => {
    if (!d.reservationId) return 'Please select a reservation.';
    if (!d.paymentMethod) return 'Payment Method is required.';
    if (!d.paymentStatus) return 'Payment Status is required.';

    const extra = Number(d.extraCharges || 0);
    const disc = Number(d.discount || 0);

    if (extra < 0) return 'Extra Charges cannot be negative.';
    if (disc < 0) return 'Discount cannot be negative.';

    return null;
  };

  // 🔄 Payload → backend
  const toPayload = (d) => {
    return {
      reservationId: Number(d.reservationId),
      extraCharges: Number(d.extraCharges || 0),
      discount: Number(d.discount || 0),
      paymentMethod: d.paymentMethod || 'Cash',
      paymentStatus: d.paymentStatus || 'Unpaid'
    };
  };

  // 💾 Submit (Create Invoice)
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) { toast.error(err); return; }

    const payload = toPayload(data);

    try {
      setIsSubmitting(true);
      const res = await fetch('http://localhost:5186/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw res;

      toast.success('Invoice created ✅');

      // reset form
      setInitialValues({
        reservationId: '',
        guestName: '',
        roomNumber: '',
        checkInDate: '',
        checkOutDate: '',
        nights: '',
        roomRate: '',
        roomAmount: '',
        extraCharges: 0,
        discount: 0,
        grandTotal: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Unpaid'
      });

      // reload lists
      fetchReservationOptions(); // kyun ke is reservation ka invoice ban gaya
      fetchInvoices();
    } catch (e) {
      const message = await parseError(e, 'Error creating invoice ❌');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📊 Table columns (read-only list of invoices)
  const columns = [
    'invoiceId',
    'invoiceNumber',
    'reservationId',
    'guestName',
    'roomNumber',
    'checkInDate',
    'checkOutDate',
    'nights',
    'roomAmount',
    'extraCharges',
    'discount',
    'grandTotal',
    'paymentStatus'
  ];

  const rowsForTable = rows.map((r) => ({
    ...r,
    checkInDate: r.checkInDate
      ? new Date(r.checkInDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—',
    checkOutDate: r.checkOutDate
      ? new Date(r.checkOutDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—'
  }));

  return (
    <div>
      <h2>Invoice Management</h2>
      <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
        1) Select a <b>Checked-out reservation</b>, 2) Adjust Extra Charges / Discount, 3) Save invoice.
      </p>

      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
      />

      <button
        type="button"
        className="btn submit-btn"
        style={{ marginTop: '15px', marginBottom: '20px' }}
        onClick={() => handleSubmit(initialValues)}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Create Invoice'}
      </button>

      <h3>Invoices List</h3>
      <DataTable columns={columns} rows={rowsForTable} />
    </div>
  );
}

export default InvoicesManagement;
