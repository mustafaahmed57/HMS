import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaShoppingCart,
  FaCashRegister,
  FaUserTie,
  FaWarehouse,
  FaIndustry,
  FaUsers,
  FaHome,
  FaSignOutAlt,
  FaBed,
} from "react-icons/fa";
import { toast } from "react-toastify";
import LogoutModal from "../components/LogoutModal"; // ✅ create this file below

// ✅ Role-wise allowed modules
const roleAccess = {
  ADMIN: ["Dashboard", "HR", "ROOMS", "Users"],
  HR: ["HR"],
  SALES: ["ROOMS"],
  RECEPTIONIST: ["ROOMS"],
  EMPLOYEE: ["EMPLOYEE"],
};

const sidebarModules = [
  {
    name: "Dashboard",
    icon: <FaHome />,
    children: [{ name: "Dashboard", path: "/dashboard" }],
  },
  /* ✅ HR MODULE (new) */
  {
    name: "HR",
    icon: <FaUserTie />,
    children: [
      { name: "Job Posting", path: "/job-posting" },
      { name: "Hiring", path: "/hiring" },
      { name: "Employee", path: "/employees" },
      { name: "Attendance", path: "/attendance" },
      { name: "Task", path: "/tasks" },
      { name: "Payroll", path: "/payroll" },
      { name: "Summary", path: "/hr-summary" },
    ],
  },
  {
    name: "ROOMS",
    icon: <FaBed />,
    children: [
      { name: "Rooms Type", path: "/room-type" },
      { name: "Rooms Management", path: "/room-management" },
      { name: "Receptions", path: "/Reception-Rooms-Status" },
      { name: "Reservation", path: "/reservations-management" },
      { name: "Invoices", path: "/invoices-management" },
      { name: "Booking", path: "/booking-management" },
    ],
  },
  {
    name: "EMPLOYEE",
    icon: <FaBed />,
    children: [{ name: "Employee Task", path: "/employee-task" }],
  },
  // {
  //   name: 'Sales',
  //   icon: <FaCashRegister />,
  //   children: [
  //     { name: 'Customers Management', path: '/customers' }, // ✅ NEW LINE
  //     { name: 'Sales Inquiry', path: '/sales-inquiry' },
  //     { name: 'Sales Order', path: '/sales-order' },
  //     { name: 'Delivery Note', path: '/delivery-note' },
  //     { name: 'Invoice', path: '/customer-invoice' },
  //   ],
  // },
  // {
  //   name: 'Inventory',
  //   icon: <FaWarehouse />,
  //   children: [
  //     { name: 'Product Management', path: '/product-management' },
  //     { name: 'Stock In', path: '/stock-in' },
  //     { name: 'Stock Out', path: '/stock-out' },
  //     { name: 'Inventory Report', path: '/inventory-report' },
  //   ],
  // },
  //   {
  //   name: 'Vendor',
  //   icon: <FaUsers />, // or FaTruck or FaAddressBook if you want a different icon
  //   children: [
  //     { name: 'Suppliers', path: '/suppliers' }
  //   ],
  // },

  // {
  //   name: 'Manufacturing',
  //   icon: <FaIndustry />,
  //   children: [
  //     { name: 'Bom', path: '/bom' },
  //     { name: 'Production Plan', path: '/production-plan' },
  //     { name: 'Production Order', path: '/production-order' },
  //     { name: 'Production Completion', path: '/production-completion' }
  //     // { name: 'Manufacturing Order', path: '/manufacturing-Order' },

  //   ],
  // },
  {
    name: "Users",
    icon: <FaUsers />,
    children: [
      { name: "User Management", path: "/users" },
      { name: "Link Employee", path: "/admin-link-employee" },
    ],
  },
];

function Sidebar({ userRole }) {
  const [openModule, setOpenModule] = useState("Dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const toggleModule = (name) => {
    setOpenModule((prev) => (prev === name ? "" : name));
  };

  const allowedModules = sidebarModules.filter((module) =>
    roleAccess[userRole]?.includes(module.name)
  );

  const confirmLogout = () => {
    localStorage.removeItem("loggedInUser");
    toast.success("Logout successful 👋");
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Stay Elite HMS</h2>

      <div className="modules">
        {allowedModules.map((module) => (
          <div key={module.name} className="module-section">
            <div
              className="module-header"
              onClick={() => toggleModule(module.name)}
            >
              <span className="icon-text">
                {module.icon}
                <span>{module.name}</span>
              </span>
              <span className="chevron">
                {openModule === module.name ? (
                  <FaChevronUp />
                ) : (
                  <FaChevronDown />
                )}
              </span>
            </div>

            {openModule === module.name && module.children.length > 0 && (
              <ul className="module-children">
                {module.children.map((child) => (
                  <li key={child.path}>
                    <NavLink
                      to={child.path}
                      className={({ isActive }) =>
                        isActive ? "child-link active" : "child-link"
                      }
                    >
                      {child.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="logout-wrapper">
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          <FaSignOutAlt style={{ marginRight: "8px" }} /> Logout
        </button>
      </div>

      {/* ✅ Custom logout modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

// {openModule === module.name && module.children.length > 0 && (
//   <ul className="module-children">
//     {(() => {
//       let transactionLabelShown = false;
//       return module.children.map((child) => {
//         const showTag =
//           child.tag === 'Transaction' ? !transactionLabelShown : true;

//         if (child.tag === 'Transaction') transactionLabelShown = true;

//         return (
//           <li
//             key={child.path}
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'flex-start',
//               marginBottom: '8px',
//             }}
//           >
//             {/* Show tag only if showTag is true */}
//             {child.tag && showTag && (
//               <span
//                 style={{
//                   fontSize: '10px',
//                   fontWeight: '600',
//                   padding: '2px 6px',
//                   borderRadius: '4px',
//                   marginBottom: '3px',
//                   backgroundColor:
//                     child.tag === 'Master Data'
//                       ? '#4cafef'
//                       : child.tag === 'Transaction'
//                       ? '#f57c00'
//                       : '#777',
//                   color: 'white',
//                 }}
//               >
//                 {child.tag}
//               </span>
//             )}

//             <NavLink
//               to={child.path}
//               className={({ isActive }) =>
//                 isActive ? 'child-link active' : 'child-link'
//               }
//             >
//               {child.name}
//             </NavLink>
//           </li>
//         );
//       });
//     })()}
//   </ul>
// )}

export default Sidebar;
