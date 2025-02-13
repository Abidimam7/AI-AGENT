import './SupplierForm.css';
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronUp, FiInfo } from "react-icons/fi";

const SupplierForm = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_website: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    product_name: "",
    product_description: "",
    key_features: "",
    primary_use_cases: "",
    technical_requirements: "",
    has_api: "No",
    api_link: "",
    pricing_model: "",
    sales_cycle_length: "",
    commission_structure: "",
    discounts: "",
    ideal_customer_profile: "",
    pain_points: "",
    marketing_materials: "",
    success_stories: "",
    onboarding_requirements: "",
    competitors: "",
    unique_selling_points: "",
    branding_guidelines: "",
    additional_info: "",
    cost_info: "",
    business_duration: "",
    funding_details: "",
    company_description: "",
    product_demo: "",
    email_address: "",
  });

  const [activeSection, setActiveSection] = useState(null);
  const sections = [
    { id: 1, title: "Company Information" },
    { id: 2, title: "Contact Information" },
    { id: 3, title: "Product Details" },
    { id: 4, title: "Technical Specifications" },
    { id: 5, title: "Business Model" },
    { id: 6, title: "Additional Information" },
  ];

  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    // Use the dynamic API base URL from the environment variable
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const suppliersUrl = `${baseUrl}/suppliers/`;

    try {
      await axios.post(suppliersUrl, formData, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      localStorage.setItem("companyDetails", JSON.stringify(formData));
      sessionStorage.setItem("companyDetails", JSON.stringify(formData));

      alert("Company details submitted successfully!");
      // Redirect to the home page after submission
      navigate("/home");
    } catch (error) {
      console.error('Error details:', error.response ? error.response.data : error.message);
      alert("Error submitting details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  return (
    <div className="container-lg py-5">
      <button className="home-btn" onClick={handleHomeClick}>
        Home
      </button>
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-primary mb-3">Supplier Registration</h1>
        <p className="lead text-muted">Please fill in the form below to register your company</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3 shadow-lg p-4 p-md-5">
        {sections.map((section) => (
          <div key={section.id} className="mb-5">
            <div 
              className="d-flex justify-content-between align-items-center cursor-pointer py-3 border-bottom"
              onClick={() => toggleSection(section.id)}
            >
              <h3 className="h5 mb-0 text-dark">
                <span className="badge bg-primary me-3">{section.id}</span>
                {section.title}
              </h3>
              {activeSection === section.id ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            <div className={`section-content ${activeSection === section.id ? 'show' : 'hide'}`}>
              {/* Company Information */}
              {section.id === 1 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-6 col-12">
                    <label className="form-label">Company Name<span className="text-danger">*</span></label>
                    <input type="text" name="company_name" className="form-control form-control-lg" required 
                      value={formData.company_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Company Website<span className="text-danger">*</span></label>
                    <input type="url" name="company_website" className="form-control form-control-lg" required 
                      value={formData.company_website} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {section.id === 2 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-4 col-12">
                    <label className="form-label">Contact Name<span className="text-danger">*</span></label>
                    <input type="text" name="contact_name" className="form-control form-control-lg" required 
                      value={formData.contact_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Contact Email<span className="text-danger">*</span></label>
                    <input type="email" name="contact_email" className="form-control form-control-lg" required 
                      value={formData.contact_email} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Contact Phone<span className="text-danger">*</span></label>
                    <input type="tel" name="contact_phone" className="form-control form-control-lg" required 
                      value={formData.contact_phone} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* Product Details */}
              {section.id === 3 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-6 col-12">
                    <label className="form-label">Product Name<span className="text-danger">*</span></label>
                    <input type="text" name="product_name" className="form-control form-control-lg" required 
                      value={formData.product_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Product Description<span className="text-danger">*</span></label>
                    <textarea name="product_description" className="form-control form-control-lg" rows="3" required 
                      value={formData.product_description} onChange={handleChange}></textarea>
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              {section.id === 4 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-6 col-12">
                    <label className="form-label">Key Features (3 minimum)<span className="text-danger">*</span></label>
                    <textarea name="key_features" className="form-control form-control-lg" rows="2" required 
                      value={formData.key_features} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Primary Use Cases<span className="text-danger">*</span></label>
                    <textarea name="primary_use_cases" className="form-control form-control-lg" rows="2" required 
                      value={formData.primary_use_cases} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Technical Requirements</label>
                    <textarea name="technical_requirements" className="form-control form-control-lg" rows="2" 
                      value={formData.technical_requirements} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">API Availability<span className="text-danger">*</span></label>
                    <select name="has_api" className="form-select form-select-lg" required 
                      value={formData.has_api} onChange={handleChange}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {formData.has_api === "Yes" && (
                    <div className="col-md-6 col-12">
                      <label className="form-label">API Documentation Link</label>
                      <input type="url" name="api_link" className="form-control form-control-lg" 
                        value={formData.api_link} onChange={handleChange} />
                    </div>
                  )}
                </div>
              )}

              {/* Business Model */}
              {section.id === 5 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-4 col-12">
                    <label className="form-label">Pricing Model<span className="text-danger">*</span></label>
                    <input type="text" name="pricing_model" className="form-control form-control-lg" required 
                      value={formData.pricing_model} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Sales Cycle Length<span className="text-danger">*</span></label>
                    <input type="text" name="sales_cycle_length" className="form-control form-control-lg" required 
                      value={formData.sales_cycle_length} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Commission Structure<span className="text-danger">*</span></label>
                    <input type="text" name="commission_structure" className="form-control form-control-lg" required 
                      value={formData.commission_structure} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Discounts Offered</label>
                    <input type="text" name="discounts" className="form-control form-control-lg" 
                      value={formData.discounts} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Ideal Customer Profile</label>
                    <textarea name="ideal_customer_profile" className="form-control form-control-lg" rows="2" 
                      value={formData.ideal_customer_profile} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Key Pain Points Addressed</label>
                    <textarea name="pain_points" className="form-control form-control-lg" rows="2" 
                      value={formData.pain_points} onChange={handleChange}></textarea>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {section.id === 6 && (
                <div className="row g-4 mt-3">
                  <div className="col-md-6 col-12">
                    <label className="form-label">Marketing Materials Available</label>
                    <textarea name="marketing_materials" className="form-control form-control-lg" rows="2" 
                      value={formData.marketing_materials} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Success Stories/Case Studies</label>
                    <textarea name="success_stories" className="form-control form-control-lg" rows="2" 
                      value={formData.success_stories} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Onboarding Requirements</label>
                    <input type="text" name="onboarding_requirements" className="form-control form-control-lg" 
                      value={formData.onboarding_requirements} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Main Competitors</label>
                    <input type="text" name="competitors" className="form-control form-control-lg" 
                      value={formData.competitors} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Unique Selling Points</label>
                    <textarea name="unique_selling_points" className="form-control form-control-lg" rows="2" 
                      value={formData.unique_selling_points} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Branding Guidelines</label>
                    <textarea name="branding_guidelines" className="form-control form-control-lg" rows="3" 
                      value={formData.branding_guidelines} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Additional Information</label>
                    <textarea name="additional_info" className="form-control form-control-lg" rows="3" 
                      value={formData.additional_info} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Cost Structure Information</label>
                    <textarea name="cost_info" className="form-control form-control-lg" rows="3" 
                      value={formData.cost_info} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Business Duration</label>
                    <input type="text" name="business_duration" className="form-control form-control-lg" 
                      value={formData.business_duration} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Funding Details</label>
                    <input type="text" name="funding_details" className="form-control form-control-lg" 
                      value={formData.funding_details} onChange={handleChange} />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Company Description</label>
                    <textarea name="company_description" className="form-control form-control-lg" rows="2" 
                      value={formData.company_description} onChange={handleChange}></textarea>
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Product Demo URL</label>
                    <input type="url" name="product_demo" className="form-control form-control-lg" 
                      value={formData.product_demo} onChange={handleChange} />
                  </div>
                  <div className="col-md-6 col-12">
                    <label className="form-label">Notification Email<span className="text-danger">*</span></label>
                    <input type="email" name="email_address" className="form-control form-control-lg" required 
                      value={formData.email_address} onChange={handleChange} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="mt-5 text-center">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg px-5 py-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                <span role="status">Submitting...</span>
              </>
            ) : (
              'Submit Application'
            )}
          </button>
          <p className="text-muted mt-3">
            <FiInfo className="me-2" />
            All fields marked with <span className="text-danger">*</span> are required
          </p>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
