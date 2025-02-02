import React, { useState, useEffect } from 'react';
import { FiChevronRight, FiBriefcase, FiPackage, FiMessageSquare } from 'react-icons/fi';
import axios from 'axios';

const CompanySidebar = ({ onCompanySelect, initialSelected, leads, onGenerateLeads, onNewChat  }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(initialSelected);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/suppliers/');
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
 
      {/* Section: Generate New Leads Button */}
      <h3 className="sidebar-title">
        <FiBriefcase /> Leads
      </h3>
      {selectedCompany && (
        <div className="generate-leads-section" style={{ marginTop: '20px' }}>
          <button onClick={handleGenerateNewLeads}>
            Generate New Leads
          </button>
        </div>
      )}

      {/* Section: Display Generated Leads */}
      {leads && leads.length > 0 && (
        <div className="generated-leads-section" style={{ marginTop: '30px' }}>
          <h3>Generated Leads</h3>
          {leads.map((lead, index) => (
            <div key={index} className="lead-item" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>Company:</strong> {lead.company_name}</p>
              <p><strong>Address:</strong> {lead.address}</p>
              <p><strong>Email:</strong> {lead.email}</p>
              <p><strong>Phone:</strong> {lead.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySidebar;
