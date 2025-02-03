import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { read, utils } from "xlsx";
import GenerateEmailsComponent from "./GenerateEmailsComponent";
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit,
  FiInfo,
  FiBriefcase,
  FiUser,
  FiDollarSign,
  FiBox,
  FiTrash2,
  FiLoader,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiUploadCloud,FiMessageSquare, FiZap
} from "react-icons/fi";

/* ============================================= */
/*            Helper Components                  */
/* ============================================= */

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="d-flex align-items-center mb-3">
    <Icon className="text-primary me-2" size={20} />
    <h5 className="mb-0 text-dark">{title}</h5>
  </div>
);

const ToggleButton = ({ expanded, onClick }) => (
  <button 
    className={`btn btn-outline-primary d-flex align-items-center ${expanded ? 'active' : ''}`}
    onClick={onClick}
  >
    {expanded ? <FiChevronUp className="me-2" /> : <FiChevronDown className="me-2" />}
    {expanded ? 'Collapse' : 'Expand'}
  </button>
);

/* ============================================= */
/*            Main Home Component                */
/* ============================================= */

const Home = () => {
  // ------------------------------
  // State Management
  // ------------------------------
  const [suppliers, setSuppliers] = useState([]);
  const [generatedLeads, setGeneratedLeads] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // ------------------------------
  // Data Fetching
  // ------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, aiLeadsRes, uploadedLeadsRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/suppliers/"),
          axios.get("http://127.0.0.1:8000/api/leads/"),
          axios.get("http://127.0.0.1:8000/api/uploaded-leads/"),
        ]);

        setSuppliers(suppliersRes.data);
        setGeneratedLeads([...aiLeadsRes.data, ...uploadedLeadsRes.data]);
      } catch (error) {
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ------------------------------
  // Event Handlers
  // ------------------------------
  const handleEmailGeneration = (supplierId) => {
    setSelectedSupplierId(supplierId);
    setExpandedId(supplierId); // Ensure supplier section is expanded
  };
  const handleEdit = () => navigate("/supplier-form");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/suppliers/${id}/`);
      setSuppliers(suppliers.filter(supplier => supplier.id !== id));
    } catch (error) {
      setError("Failed to delete supplier. Please try again.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setUploadError("Invalid file format. Please upload Excel or CSV file.");
      return;
    }

    setFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      
      const requiredHeaders = ['company_name', 'email', 'phone', 'address'];
      const headers = jsonData[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setUploadError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      setFileData(jsonData.slice(1));
      setUploadError("");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post("http://127.0.0.1:8000/api/upload-leads/", formData);
      setUploadSuccess(true);
      setUploadError("");
      setTimeout(() => setUploadSuccess(false), 3000);
      
      const response = await axios.get('http://127.0.0.1:8000/api/leads/');
      setGeneratedLeads(response.data);
    } catch (error) {
      setUploadError("Failed to upload leads. Please check the file format and try again.");
    }
  };

  // ------------------------------
  // Render States
  // ------------------------------
  if (loading) {
    return (
      <div className="container-lg py-5 text-center">
        <FiLoader className="spinner" size={32} />
        <p className="mt-3">Loading supplier data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-lg py-5 text-center">
        <FiInfo className="text-danger mb-3" size={32} />
        <h4 className="text-danger">{error}</h4>
        <button 
          className="btn btn-outline-primary mt-3"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // ------------------------------
  // Main Render
  // ------------------------------
  return (
    <div className="container-lg py-5">
      {/* Header Section with Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h1 className="display-5 fw-bold text-primary mb-2">
            Lead Management Platform
          </h1>
          <p className="lead text-muted">
            Manage suppliers and generated leads efficiently
          </p>
        </div>
        <div className="d-flex gap-3">
          <Link to="/supplier-form" className="btn btn-primary d-flex align-items-center">
            <FiEdit className="me-2" size={20} />
            Add Supplier
          </Link>
          <Link to="/chat" className="btn btn-outline-primary d-flex align-items-center">
            <FiMessageSquare className="me-2" size={20} />
            Launch Chatbot
          </Link>
          <Link to="/lead-generation" className="btn btn-success d-flex align-items-center">
            <FiZap className="me-2" size={20} />
            LeadGeneration AI
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* Suppliers Column */}
        <div className="col-md-6">
          <div className="card border-0 shadow-lg rounded-3 h-100">
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
                            onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}
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
                        {/* Supplier Details Content */}
                        <div className="row g-4">
                          <div className="col-md-6">
                            <div className="p-3 bg-light rounded-2 h-100">
                              <SectionHeader icon={FiUser} title="Contact Information" />
                              <ul className="list-unstyled">
                                <li className="mb-2"><strong>Name:</strong> {supplier.contact_name}</li>
                                <li className="mb-2"><strong>Email:</strong> {supplier.contact_email}</li>
                                <li><strong>Phone:</strong> {supplier.contact_phone}</li>
                              </ul>
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div className="p-3 bg-light rounded-2 h-100">
                              <SectionHeader icon={FiBox} title="Product Details" />
                              <p className="mb-2"><strong>Description:</strong></p>
                              <p className="text-muted">{supplier.product_description}</p>
                              <p className="mb-0"><strong>Key Features:</strong> {supplier.key_features}</p>
                            </div>
                          </div>

                          <div className="col-md-12">
                            <div className="p-3 bg-light rounded-2">
                              <SectionHeader icon={FiDollarSign} title="Business Details" />
                              <div className="row">
                                <div className="col-md-4">
                                  <p className="mb-1"><strong>Pricing Model:</strong></p>
                                  <p className="text-muted">{supplier.pricing_model}</p>
                                </div>
                                <div className="col-md-4">
                                  <p className="mb-1"><strong>Sales Cycle:</strong></p>
                                  <p className="text-muted">{supplier.sales_cycle_length}</p>
                                </div>
                                <div className="col-md-4">
                                  <p className="mb-1"><strong>Commission:</strong></p>
                                  <p className="text-muted">{supplier.commission_structure}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 text-end">
                          <button 
                            className="btn btn-outline-warning d-inline-flex align-items-center"
                            onClick={handleEdit}
                          >
                            <FiEdit className="me-2" />
                            Edit Details
                          </button>                         
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="card border-0 shadow rounded-3 text-center py-5">
                  <div className="card-body">
                    <FiInfo className="display-4 text-muted mb-3" />
                    <h4 className="mb-3">No Suppliers Found</h4>
                    <p className="text-muted mb-4">Get started by registering a new supplier</p>
                    <Link to="/supplier-form" className="btn btn-primary px-5">
                      Register New Supplier
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>        
        {/* Generated Leads Column */}
        <div className="col-md-6">
          <div className="card border-0 shadow-lg rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FiUploadCloud className="me-2 text-success" />
                Generated Leads
              </h5>
              <div className="d-flex align-items-center">
                <label className="btn btn-sm btn-outline-success mb-0 me-2">
                  <FiUpload className="me-2" />
                  Upload Leads
                  <input 
                    type="file" 
                    className="d-none" 
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                  />
                </label>
              </div>
            </div>
            <div className="mt-4">
            <GenerateEmailsComponent supplierId={suppliers.id} />
            </div>

            <div className="px-4 pt-3">
              {uploadError && (
                <div className="alert alert-danger d-flex align-items-center py-2">
                  <FiXCircle className="me-2 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="alert alert-success d-flex align-items-center py-2">
                  <FiCheckCircle className="me-2 flex-shrink-0" />
                  Leads uploaded successfully!
                </div>
              )}
            </div>

            <div className="card-body p-4">
              {fileData.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-muted mb-3">Preview Uploaded Data</h6>
                  <button 
                    className="btn btn-success w-100 d-inline-flex justify-content-center align-items-center"
                    onClick={handleUpload}
                  >
                    <FiUploadCloud className="me-2" />
                    Confirm Upload
                  </button>
                </div>
              )}

              {generatedLeads.length > 0 ? (
                <div className="leads-list">
                  {generatedLeads.map((lead, index) => (
                    <div key={index} className="card mb-3 border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="bg-success text-white rounded-circle p-2 me-3">
                            <FiBriefcase size={18} />
                          </div>
                          <div>
                            <h6 className="mb-1">{lead.company_name}</h6>
                            <div className="text-muted small">
                              <span className="me-3">
                                <FiUser className="me-1" /> {lead.contact_name}
                              </span>
                              <span className="me-3">
                                <FiFileText className="me-1" /> {lead.email}
                              </span>
                              <span>
                                <FiDollarSign className="me-1" /> {lead.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        {lead.address && (
                          <div className="mt-2 small text-muted">
                            <FiInfo className="me-2" /> {lead.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiFileText className="display-4 text-muted mb-3" />
                  <h5 className="text-muted">No leads available</h5>
                  <p className="text-muted small mt-2">
                    Upload a CSV/Excel file with company details to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;