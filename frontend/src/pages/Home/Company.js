import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit,
  FiTrash2,
  FiBriefcase,
  FiUser,
  FiBox,
  FiDollarSign,
  FiInfo,
  FiCheck,
  FiX,
} from "react-icons/fi";

// Reusable section header with an optional edit icon
const SectionHeader = ({ icon: Icon, title, onEdit, isEditing }) => (
  <div className="d-flex justify-content-between align-items-center mb-3">
    <div className="d-flex align-items-center">
      <Icon className="text-primary me-2" size={20} />
      <h5 className="mb-0 text-dark">{title}</h5>
    </div>
    {onEdit && !isEditing && (
      <button className="btn btn-link text-primary p-0" onClick={onEdit}>
        <FiEdit size={18} />
      </button>
    )}
  </div>
);

// Toggle button to expand or collapse the supplier details
const ToggleButton = ({ expanded, onClick }) => (
  <button
    className={`btn ${expanded ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center`}
    onClick={onClick}
  >
    {expanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
  </button>
);

const Company = ({ suppliers, expandedId, setExpandedId, setSuppliers }) => {
  const navigate = useNavigate();
  // Use the dynamic API base URL from environment variables
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  // These two state objects track which sections (by supplier id) are in edit mode,
  // and hold the temporary data for that section.
  const [editMode, setEditMode] = useState({});
  const [editData, setEditData] = useState({});

  // Delete a supplier (with confirmation)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axios.delete(`${baseUrl}/suppliers/${id}/`);
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
    } catch (error) {
      alert("Failed to delete supplier. Please try again.");
    }
  };

  // Initialize inline editing for a specific section of the supplier
  const handleEditClick = (supplier, section) => {
    setEditMode((prev) => ({
      ...prev,
      [supplier.id]: {
        ...prev[supplier.id],
        [section]: true,
      },
    }));

    setEditData((prev) => ({
      ...prev,
      [supplier.id]: {
        ...prev[supplier.id],
        [section]:
          section === "contact"
            ? {
                contact_name: supplier.contact_name,
                contact_email: supplier.contact_email,
                contact_phone: supplier.contact_phone,
              }
            : section === "product"
            ? {
                product_description: supplier.product_description,
                key_features: supplier.key_features,
              }
            : section === "business"
            ? {
                pricing_model: supplier.pricing_model,
                sales_cycle_length: supplier.sales_cycle_length,
                commission_structure: supplier.commission_structure,
              }
            : {},
      },
    }));
  };

  // Handle changes to inputs in an editing section
  const handleInputChange = (supplierId, section, field, value) => {
    setEditData((prev) => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [section]: {
          ...prev[supplierId][section],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveSection = async (supplierId, section) => {
    const updatedFields = editData[supplierId][section];
    try {
      const token = localStorage.getItem("token");
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : {};

      const response = await axios.put(
        `${baseUrl}/suppliers/${supplierId}/`,
        updatedFields,
        { headers }
      );

      setSuppliers(
        suppliers.map((supplier) =>
          supplier.id === supplierId ? { ...supplier, ...response.data } : supplier
        )
      );

      setEditMode((prev) => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          [section]: false,
        },
      }));
    } catch (error) {
      alert("Failed to update. Please try again.");
      console.error("Update error:", error.response ? error.response.data : error.message);
    }
  };

  // Cancel editing a specific section
  const handleCancelEdit = (supplierId, section) => {
    setEditMode((prev) => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [section]: false,
      },
    }));
  };

  return (
    <div className="card border-0 shadow-lg rounded-3">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">
          <FiBriefcase className="me-2 text-primary" />
          Company Suppliers
        </h5>
      </div>
      <div className="card-body p-4">
        {suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="card border-0 shadow-lg rounded-3 mb-4">
              <div className="card-header bg-white py-4 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-1">
                      <FiBriefcase className="me-2 text-primary" />
                      {supplier.company_name}
                    </h3>
                    <p className="text-muted mb-0">{supplier.product_name}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <ToggleButton
                      expanded={expandedId === supplier.id}
                      onClick={() =>
                        setExpandedId(expandedId === supplier.id ? null : supplier.id)
                      }
                    />
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === supplier.id && (
                <div className="card-body p-4">
                  <div className="row g-4">
                    {/* Contact Information Section */}
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-2">
                        <SectionHeader
                          icon={FiUser}
                          title="Contact Information"
                          onEdit={() => handleEditClick(supplier, "contact")}
                          isEditing={editMode[supplier.id] && editMode[supplier.id].contact}
                        />
                        {editMode[supplier.id] && editMode[supplier.id].contact ? (
                          <>
                            <div className="mb-2">
                              <label className="form-label">
                                <strong>Name:</strong>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={editData[supplier.id]?.contact?.contact_name || ""}
                                onChange={(e) =>
                                  handleInputChange(supplier.id, "contact", "contact_name", e.target.value)
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">
                                <strong>Email:</strong>
                              </label>
                              <input
                                type="email"
                                className="form-control"
                                value={editData[supplier.id]?.contact?.contact_email || ""}
                                onChange={(e) =>
                                  handleInputChange(supplier.id, "contact", "contact_email", e.target.value)
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">
                                <strong>Phone:</strong>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={editData[supplier.id]?.contact?.contact_phone || ""}
                                onChange={(e) =>
                                  handleInputChange(supplier.id, "contact", "contact_phone", e.target.value)
                                }
                              />
                            </div>
                            <div className="d-flex justify-content-end">
                              <button
                                className="btn btn-success me-2"
                                onClick={() => handleSaveSection(supplier.id, "contact")}
                              >
                                <FiCheck className="me-1" /> Save
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleCancelEdit(supplier.id, "contact")}
                              >
                                <FiX className="me-1" /> Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <ul className="list-unstyled">
                            <li className="mb-2">
                              <strong>Name:</strong> {supplier.contact_name}
                            </li>
                            <li className="mb-2">
                              <strong>Email:</strong> {supplier.contact_email}
                            </li>
                            <li>
                              <strong>Phone:</strong> {supplier.contact_phone}
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-2">
                        <SectionHeader
                          icon={FiBox}
                          title="Product Details"
                          onEdit={() => handleEditClick(supplier, "product")}
                          isEditing={editMode[supplier.id] && editMode[supplier.id].product}
                        />
                        {editMode[supplier.id] && editMode[supplier.id].product ? (
                          <>
                            <div className="mb-2">
                              <label className="form-label">
                                <strong>Description:</strong>
                              </label>
                              <textarea
                                className="form-control"
                                value={editData[supplier.id]?.product?.product_description || ""}
                                onChange={(e) =>
                                  handleInputChange(supplier.id, "product", "product_description", e.target.value)
                                }
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label">
                                <strong>Key Features:</strong>
                              </label>
                              <textarea
                                className="form-control"
                                value={editData[supplier.id]?.product?.key_features || ""}
                                onChange={(e) =>
                                  handleInputChange(supplier.id, "product", "key_features", e.target.value)
                                }
                              />
                            </div>
                            <div className="d-flex justify-content-end">
                              <button
                                className="btn btn-success me-2"
                                onClick={() => handleSaveSection(supplier.id, "product")}
                              >
                                <FiCheck className="me-1" /> Save
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleCancelEdit(supplier.id, "product")}
                              >
                                <FiX className="me-1" /> Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mb-2">
                              <strong>Description:</strong>
                            </p>
                            <p className="text-muted">{supplier.product_description}</p>
                            <p className="mb-0">
                              <strong>Key Features:</strong> {supplier.key_features}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Business Details Section */}
                    <div className="col-md-12">
                      <div className="p-3 bg-light rounded-2">
                        <SectionHeader
                          icon={FiDollarSign}
                          title="Business Details"
                          onEdit={() => handleEditClick(supplier, "business")}
                          isEditing={editMode[supplier.id] && editMode[supplier.id].business}
                        />
                        {editMode[supplier.id] && editMode[supplier.id].business ? (
                          <>
                            <div className="row">
                              <div className="col-md-4 mb-2">
                                <label className="form-label">
                                  <strong>Pricing Model:</strong>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editData[supplier.id]?.business?.pricing_model || ""}
                                  onChange={(e) =>
                                    handleInputChange(supplier.id, "business", "pricing_model", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-4 mb-2">
                                <label className="form-label">
                                  <strong>Sales Cycle:</strong>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editData[supplier.id]?.business?.sales_cycle_length || ""}
                                  onChange={(e) =>
                                    handleInputChange(supplier.id, "business", "sales_cycle_length", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-4 mb-2">
                                <label className="form-label">
                                  <strong>Commission:</strong>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editData[supplier.id]?.business?.commission_structure || ""}
                                  onChange={(e) =>
                                    handleInputChange(supplier.id, "business", "commission_structure", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="d-flex justify-content-end">
                              <button
                                className="btn btn-success me-2"
                                onClick={() => handleSaveSection(supplier.id, "business")}
                              >
                                <FiCheck className="me-1" /> Save
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleCancelEdit(supplier.id, "business")}
                              >
                                <FiX className="me-1" /> Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="row">
                            <div className="col-md-4">
                              <p className="mb-1">
                                <strong>Pricing Model:</strong>
                              </p>
                              <p className="text-muted">{supplier.pricing_model}</p>
                            </div>
                            <div className="col-md-4">
                              <p className="mb-1">
                                <strong>Sales Cycle:</strong>
                              </p>
                              <p className="text-muted">{supplier.sales_cycle_length}</p>
                            </div>
                            <div className="col-md-4">
                              <p className="mb-1">
                                <strong>Commission:</strong>
                              </p>
                              <p className="text-muted">{supplier.commission_structure}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Note: The global edit option below has been removed per your request. */}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card border-0 shadow rounded-3 text-center py-5">
            <div className="card-body">
              <FiInfo className="display-4 text-muted mb-3" />
              <h4 className="mb-3">No Suppliers Found</h4>
              <p className="text-muted mb-4">
                Get started by registering a new supplier
              </p>
              <Link to="/supplier-form" className="btn btn-primary px-5">
                Register New Supplier
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Company;
