import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FiChevronDown, FiChevronUp, FiEdit, FiInfo, FiBriefcase, 
  FiUser, FiDollarSign, FiBox, FiTrash2, FiLoader, FiUpload 
} from "react-icons/fi";

const Home = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [generatedLeads, setGeneratedLeads] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/suppliers/");
        setSuppliers(response.data);
      } catch (error) {
        setError("Failed to fetch suppliers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    const fetchLeads = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/leads/'); // Ensure this API exists
        setGeneratedLeads(response.data);
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };
    fetchSuppliers();
    fetchLeads();
  }, []);
  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("http://127.0.0.1:8000/api/upload-leads/", formData);
      alert("Leads uploaded successfully");
    } catch (error) {
      alert("Failed to upload leads");
    }
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
  

  const toggleDetails = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="d-flex align-items-center mb-3">
      <Icon className="text-primary me-2" size={20} />
      <h5 className="mb-0 text-dark">{title}</h5>
    </div>
  );

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

  return (
    <div className="container-lg py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold gradient-text mb-3">Lead Generation Platform</h1>
        <p className="lead text-muted">Your strategic partner in business growth</p>
      </div>

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
                  <button 
                    className={`btn btn-outline-primary d-flex align-items-center ${expandedId === supplier.id ? 'active' : ''}`}
                    onClick={() => toggleDetails(supplier.id)}
                  >
                    {expandedId === supplier.id ? 
                      <FiChevronUp className="me-2" /> : 
                      <FiChevronDown className="me-2" />}
                    {expandedId === supplier.id ? 'Collapse' : 'Expand'}
                  </button>
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
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-2 h-100">
                      <SectionHeader icon={FiUser} title="Contact Information" />
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
      {/* New Section: Display Generated Leads */}
      <section className="generated-leads-section mt-5">
        <h2 className="mb-4 text-center">Generated Leads</h2>
        {generatedLeads.length > 0 ? (
          <div className="row">
            {generatedLeads.map((lead, index) => (
              <div key={index} className="col-md-6">
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h5><FiBriefcase className="me-2 text-success" /> {lead.company_name}</h5>
                    <p className="mb-1"><strong>Address:</strong> {lead.address}</p>
                    <p className="mb-1"><strong>Email:</strong> {lead.email}</p>
                    <p className="mb-0"><strong>Phone:</strong> {lead.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-center">No leads generated yet.</p>
        )}
      </section>
      <div className="mt-4">
            <h4>Upload Leads</h4>
            <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn btn-primary mt-2" onClick={handleUpload}>
              <FiUpload className="me-2" /> Upload
            </button>
          </div>

      <div className="text-center mt-5">
        <div className="d-flex gap-3 justify-content-center">
          <Link 
            to="/supplier-form" 
            className="btn btn-lg btn-outline-primary d-inline-flex align-items-center"
          >
            <FiEdit className="me-2" />
            Add New Supplier
          </Link>
          <Link 
            to="/chat" 
            className="btn btn-lg btn-primary d-inline-flex align-items-center"
          >
            Launch Chatbot
            <FiChevronUp className="ms-2 rotate-90" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;