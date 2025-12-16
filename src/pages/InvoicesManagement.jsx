import React, { useEffect, useState } from 'react';
import FormBuilder from '../components/FormBuilder';
import DataTable from '../components/DataTable';
import InvoiceModal from '../components/InvoiceModal'; // ✅ NEW
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

// 🔹 Badge for Payment Status (Paid / Unpaid / Partial)
const PaymentStatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  let bg = '#6b7280'; // default grey
  let label = status || 'Unknown';

  if (normalized === 'paid') {
    bg = '#16a34a'; // green
    label = 'Paid';
  } else if (normalized === 'unpaid') {
    bg = '#dc2626'; // red
    label = 'Unpaid';
  } else if (normalized === 'partial') {
    bg = '#f59e0b'; // amber
    label = 'Partial';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
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

function InvoicesManagement() {
  const [reservationOptions, setReservationOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ NEW: modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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
      extraCharges: '',
      discount: '0',     // 🔹 STRING "0" so FormBuilder 0 ko ignore nahi karega
      grandTotal: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid'
    });
  }, []);

  const paymentMethods = ['Cash', 'Card', 'Online', 'BankTransfer'];
  const paymentStatusOptions = ['Paid'];

  // 🧱 Form fields
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
      // 🔹 Discount as STRING % dropdown
      name: 'discount',
      label: 'Discount (%)',
      type: 'select',
      options: [
        { label: '0%', value: '0' },
        { label: '2%', value: '2' },
        { label: '5%', value: '5' },
        { label: '6%', value: '6' }
      ],
      required: true
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
    // console.log('FIELD CHANGE:', fieldName, value);

    // 🔹 Reservation change: load summary
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

      fetch(`http://localhost:5186/api/invoices/reservation-summary/${reservationId}`)
        .then(res => {
          if (!res.ok) throw res;
          return res.json();
        })
        .then(summary => {
          setFormValues(prev => {
            const extra = Number(prev.extraCharges || 0);
            const discPercent = Number(prev.discount || '0'); // string → number
            const roomAmount = Number(summary.roomAmount || 0);

            const discountAmount = (roomAmount * discPercent) / 100;
            let grand = roomAmount + extra - discountAmount;
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

    // 🔹 ExtraCharges / Discount change → GrandTotal recalc
    if (fieldName === 'extraCharges' || fieldName === 'discount') {
      setFormValues(prev => {
        let newValue = value;

        // discount agar object form mein aaye {label, value}
        if (fieldName === 'discount' && value && typeof value === 'object' && 'value' in value) {
          newValue = value.value;  // yahan '0', '2', '5', '6'
        }

        // NOTE: yahan STRING hi store kar rahe hain for discount
        const updated = {
          ...prev,
          // [fieldName]: fieldName === 'discount' ? String(newValue ?? '0') : Number(newValue ?? 0)
          [fieldName]: fieldName === 'discount'
  ? String(newValue ?? '0')
  : String(newValue ?? '')

        };

        const roomAmount = Number(updated.roomAmount || 0);
        const extra = Number(updated.extraCharges || 0);
        const discPercent = Number(updated.discount || '0'); // '0' bhi chalega

        const discountAmount = (roomAmount * discPercent) / 100;

        let grand = roomAmount + extra - discountAmount;
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
    const discPercent = Number(d.discount || '0');

    if (extra < 0) return 'Extra Charges cannot be negative.';
    if (discPercent < 0) return 'Discount percentage cannot be negative.';
    if (discPercent > 100) return 'Discount percentage cannot be more than 100%.';

    return null;
  };

  // 🔄 Payload → backend (convert % to real amount)
  const toPayload = (d) => {
    const roomAmount = Number(d.roomAmount || 0);
    const discountPercent = Number(d.discount || '0');
    const discountAmount = (roomAmount * discountPercent) / 100;

    return {
      reservationId: Number(d.reservationId),
      extraCharges: Number(d.extraCharges || 0),
      discount: discountAmount, // 🔹 send amount, backend expects decimal
      paymentMethod: d.paymentMethod || 'Cash',
      paymentStatus: d.paymentStatus || 'Unpaid'
    };
  };

  // 💾 Submit (Create Invoice)
  const handleSubmit = async (data) => {
    const err = validate(data);
    if (err) {
      toast.error(err);
      return;
    }

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
        discount: '0',
        grandTotal: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid'
      });

      fetchReservationOptions();
      fetchInvoices();
    } catch (e) {
      const message = await parseError(e, 'Error creating invoice ❌');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ NEW: modal open/close handlers
  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  // 📊 Table columns (with actions)
  const columns = [
    // 'invoiceId',
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
    'paymentStatus',
    // 'CreatedAt',
    'actions' // ✅ NEW
  ];

  const rowsForTable = rows.map((r) => {
    const formatted = {
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
    };

    // ✅ paymentStatus badge
    formatted.paymentStatus = (
      <PaymentStatusBadge status={r.paymentStatus} />
    );

    // ✅ per-row "View" button (for modal)
    formatted.actions = (
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => openInvoiceModal(r)} // original r with raw values
      >
        View
      </button>
    );

    return formatted;
  });

  return (
    <div>
      <h2>Invoice Management</h2>
      <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
        1) Select a <b>Checked-out reservation</b>, 2) Choose Discount %, adjust Extra Charges,
        3) Save invoice.
      </p>

      <FormBuilder
        fields={fields}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        onFieldChange={handleFieldChange}
        isSubmitting={isSubmitting}   // agar supported hai, warna hata dena
      />

      <DataTable columns={columns} rows={rowsForTable} />

      {/* 🔹 Invoice Preview Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        title={selectedInvoice ? `Invoice #${selectedInvoice.invoiceNumber}` : 'Invoice Preview'}
      >
        {selectedInvoice && (
          <div className="invoice-preview">
            <div style={{ marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>Stay Elite Hotel</h2>
              <small>Club Road, Karachi, Pakistan, +923332187645</small>
            </div>

            <hr />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <p><b>Guest:</b> {selectedInvoice.guestName}</p>
                <p><b>Room:</b> {selectedInvoice.roomNumber || '—'}</p>
                <p>
                  <b>Stay:</b>{' '}
                  {new Date(selectedInvoice.checkInDate).toLocaleDateString('en-GB')} →{' '}
                  {new Date(selectedInvoice.checkOutDate).toLocaleDateString('en-GB')}
                </p>
                <p><b>Nights:</b> {selectedInvoice.nights}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><b>Invoice #</b> {selectedInvoice.invoiceNumber}</p>
                <p>
                  <b>Date:</b>{' '}
                  {new Date(selectedInvoice.createdAt || selectedInvoice.checkOutDate)
                    .toLocaleDateString('en-GB')}
                </p>
                <p><b>Payment:</b> {selectedInvoice.paymentStatus}</p>
                <p><b>Method:</b> {selectedInvoice.paymentMethod}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '6px' }}>Description</th>
                  <th style={{ borderBottom: '1px solid #ccc', textAlign: 'right', padding: '6px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>
                    Room Charges ({selectedInvoice.nights} night(s) × {selectedInvoice.roomRate})
                  </td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'right' }}>
                    {selectedInvoice.roomAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>Extra Charges</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'right' }}>
                    {selectedInvoice.extraCharges.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px' }}>Discount</td>
                  <td style={{ borderBottom: '1px solid #eee', padding: '6px', textAlign: 'right' }}>
                    -{selectedInvoice.discount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', textAlign: 'right' }}><b>Total</b></td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>
                    <b>{selectedInvoice.grandTotal.toFixed(2)}</b>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style={{ marginTop: '20px', fontSize: '12px', textAlign: 'center', color: '#555' }}>
              Thank you for staying with us.
            </p>
          </div>
        )}
      </InvoiceModal>
    </div>
  );
}

export default InvoicesManagement;
