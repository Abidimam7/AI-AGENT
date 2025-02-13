import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiBriefcase, FiPackage, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';
import { Button } from '@mui/material';

const CompanySidebar = ({ onCompanySelect, initialSelected, leads, onGenerateLeads, onNewChat }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(initialSelected);
  const [showSavedLeads, setShowSavedLeads] = useState(false); // Toggle for saved leads

  useEffect(() => {
    const fetchCompanies = async () => {
      const token = localStorage.getItem("token");
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/suppliers/`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        setCompanies(response.data);
      } catch (err) {
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleClick = (company) => {
    setSelectedCompany(company);
    onCompanySelect(company);
    // Hide saved leads when a new company is selected
    setShowSavedLeads(false);
  };

  const handleGenerateNewLeads = () => {
    if (selectedCompany && onGenerateLeads) {
      onGenerateLeads(selectedCompany);
    }
  };

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">
        <FiBriefcase /> Your Companies
      </h3>
      {/* New Chat Button */}
      <div className="company-item new-chat-button" onClick={onNewChat}>
        <FiMessageSquare className="company-icon" />
        <div className="company-info">
          <div className="company-name">New Chat</div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading companies...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : companies.length > 0 ? (
        companies.map(company => (
          <div
            key={company.id}
            className={`company-item ${selectedCompany?.id === company.id ? 'active' : ''}`}
            onClick={() => handleClick(company)}
          >
            <FiChevronRight className="company-icon" />
            <div className="company-info">
              <div className="company-name">{company.company_name}</div>
              <div className="company-product">
                <FiPackage /> {company.product_name}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">No companies registered</div>
      )}

      {/* Generate New Leads Button */}
      {selectedCompany && (
        <div className="generate-leads-section" style={{ marginTop: '20px' }}>
          <Button variant="contained" color="primary" onClick={handleGenerateNewLeads}>
            Generate New Leads
          </Button>
        </div>
      )}

      {/* Section: Toggle to display saved leads */}
      {leads && leads.length > 0 && (
        <div className="generated-leads-section" style={{ marginTop: '30px' }}>
          <h3>Saved Leads</h3>
          <Button variant="outlined" onClick={() => setShowSavedLeads(!showSavedLeads)}>
            {showSavedLeads ? "Hide Saved Leads" : "View Saved Leads"}
          </Button>
          {showSavedLeads &&
            leads.map((lead, index) => (
              <div key={index} className="lead-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                <p><strong>Sr. No.:</strong> {index + 1}</p>
                <p><strong>Company:</strong> {lead.company_name}</p>
                <p><strong>Email:</strong> {lead.email}</p>
                <p><strong>Phone:</strong> {lead.phone}</p>
                <p><strong>Address:</strong> {lead.address}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default CompanySidebar;
