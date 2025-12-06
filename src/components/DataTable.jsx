import React, { useState } from 'react';

function DataTable({ columns = [], rows = [], columnLabels = {}, resolveDisplayValue }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = rows.filter(row =>
    columns.some(col =>
      row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const handleExportCSV = () => {
    const csvContent = [
      columns.join(','),
      ...filteredRows.map(row => columns.map(col => `"${row[col]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
  const colors = {
  // Existing
  Pending: '#facc15',
  Approved: '#4ade80',
  Dispatched: '#38bdf8',
  Rejected: '#f87171',
  Active: '#16A34Aff',
  Inactive: '#9ca3af',
  Used: '#2563EBff',
  Cancelled: '#DC2626ff',

  // Attendance
  Present: '#22c55e',
  Absent: '#ef4444',
  Leave: '#6366f1',
  HalfDay: '#fb923c',

  // Hiring statuses
  New: '#0ea5e9',
  Shortlisted: '#10b981',
  Interviewed: '#a855f7',
  Selected: '#22c55e',

  // ===============================
  // ✅ RESERVATION STATUSES (NEW)
  // ===============================
  Confirmed: '#10b981',     // green-ish → confirmed
  CheckedIn: '#22c55e',     // green → guest in hotel
  CheckedOut: '#94a3b8',    // slate → stay completed
  NoShow: '#fb923c',        // amber → booked but didn't come

  // Pending & Cancelled already exist above

  // ===============================
  // ✅ ROOM STATUSES (NEW)
  // ===============================
  Available: '#16a34a',     // bright green → free
  Occupied: '#2563eb',      // blue → occupied
  Cleaning: '#f59e0b',      // amber → cleaning in progress
  OutOfService: '#dc2626',  // red → not usable
  Blocked: '#7c3aed',       // purple → blocked intentionally
};

    return (
      <span
        style={{
          backgroundColor: colors[status] || '#e5e7eb',
          color: '#fafafc',
          padding: '4px 8px',
          borderRadius: '8px',
          fontWeight: 'bold',
          display: 'inline-block',
          minWidth: '80px',
          textAlign: 'center'
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="data-table">
      <div className="search-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '6px', borderRadius: '4px' }}
        />
        <button onClick={handleExportCSV} className="export-btn">Export to CSV</button>
      </div>

      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{columnLabels[col] || col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                No data found
              </td>
            </tr>
          ) : (
            currentRows.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => {
                  const rawValue = row[col];
                  const displayValue = resolveDisplayValue
                    ? resolveDisplayValue(col, rawValue, row)
                    : rawValue;

                  return (
                    <td key={col}>
                      {col === 'addsOnRequired' ? (
                        rawValue ? 'Yes' : 'No'
                      ) : col === 'status' ? (
                        getStatusBadge(rawValue)
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      

      {/* Pagination */}
      <div className="pagination" style={{ marginTop: '10px', textAlign: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(i + 1)}
            style={{ margin: '0 5px', padding: '4px 10px' }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DataTable;
