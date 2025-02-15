// src/components/Sidebar/CompanySidebar.js
import React, { useState, useEffect } from 'react';
import {
  FiChevronRight,
  FiChevronLeft,
  FiBriefcase,
  FiPackage,
  FiMessageSquare,
} from 'react-icons/fi';
import axios from 'axios';
import {
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Drawer,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const drawerWidthExpanded = 300; // Width when expanded
const drawerWidthCollapsed = 80; // Width when collapsed

const CompanySidebar = ({
  onCompanySelect,
  initialSelected,
  leads,
  onGenerateLeads,
  onNewChat,
}) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(initialSelected);
  const [showSavedLeads, setShowSavedLeads] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Controls collapse/expand (desktop)
  const [mobileOpen, setMobileOpen] = useState(false); // For mobile drawer toggle

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchCompanies = async () => {
      const token = localStorage.getItem("token");
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/suppliers/`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
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
    // On mobile, close the drawer after selection
    if (isMobile) setMobileOpen(false);
  };

  const handleGenerateNewLeads = () => {
    if (selectedCompany && onGenerateLeads) {
      onGenerateLeads(selectedCompany);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sidebar content (used in both mobile Drawer and desktop permanent sidebar)
  const sidebarContent = (
    <Box
      sx={{
        width: isExpanded ? drawerWidthExpanded : drawerWidthCollapsed,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header with toggle button */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {isExpanded ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiBriefcase style={{ marginRight: 8 }} />
              <Typography variant="h6">Your Companies</Typography>
            </Box>
            <IconButton onClick={toggleSidebar}>
              <FiChevronLeft />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={toggleSidebar}>
            <FiBriefcase />
          </IconButton>
        )}
      </Box>

      {/* New Chat Button */}
      <Paper
        elevation={3}
        sx={{
          m: 2,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor: 'primary.light',
          justifyContent: isExpanded ? 'flex-start' : 'center',
        }}
        onClick={onNewChat}
      >
        <FiMessageSquare style={{ marginRight: isExpanded ? 8 : 0 }} />
        {isExpanded && <Typography variant="body1">New Chat</Typography>}
      </Paper>

      {/* Companies List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {loading ? (
          <Typography variant="body2" sx={{ p: 2 }}>
            Loading companies...
          </Typography>
        ) : error ? (
          <Typography variant="body2" color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : companies.length > 0 ? (
          <List>
            {companies.map((company) => (
              <ListItem
                key={company.id}
                button
                onClick={() => handleClick(company)}
                sx={{
                  cursor: 'pointer',
                  bgcolor:
                    selectedCompany?.id === company.id
                      ? 'action.selected'
                      : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                  px: isExpanded ? 2 : 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FiChevronRight
                    style={{ marginRight: isExpanded ? 8 : 0 }}
                  />
                  {isExpanded && (
                    <ListItemText
                      primary={company.company_name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiPackage style={{ marginRight: 4 }} />
                          <Typography variant="body2">
                            {company.product_name}
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ p: 2 }}>
            No companies registered
          </Typography>
        )}
      </Box>

      {/* Generate New Leads Button */}
      {selectedCompany && isExpanded && (
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleGenerateNewLeads}
          >
            Generate New Leads
          </Button>
        </Box>
      )}

      {/* Saved Leads Section */}
      {leads && leads.length > 0 && isExpanded && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Saved Leads</Typography>
          <Button
            variant="outlined"
            onClick={() => setShowSavedLeads(!showSavedLeads)}
            sx={{ mt: 1 }}
          >
            {showSavedLeads ? 'Hide Saved Leads' : 'View Saved Leads'}
          </Button>
          {showSavedLeads &&
            leads.map((lead, index) => (
              <Paper
                key={index}
                sx={{ border: '1px solid #ccc', p: 2, mt: 2 }}
                elevation={1}
              >
                <Typography variant="body2">
                  <strong>Sr. No.:</strong> {index + 1}
                </Typography>
                <Typography variant="body2">
                  <strong>Company:</strong> {lead.company_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {lead.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {lead.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {lead.address}
                </Typography>
              </Paper>
            ))}
        </Box>
      )}
    </Box>
  );

  // On mobile, use a temporary Drawer; on desktop, show permanent sidebar
  return isMobile ? (
    <>
      <IconButton
        onClick={toggleMobileDrawer}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1400,
          bgcolor: 'background.paper',
          boxShadow: 2,
        }}
      >
        <FiBriefcase />
      </IconButton>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleMobileDrawer}
        ModalProps={{ keepMounted: true }}
      >
        {sidebarContent}
      </Drawer>
    </>
  ) : (
    <Box
      sx={{
        width: isExpanded ? drawerWidthExpanded : drawerWidthCollapsed,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        bgcolor: 'background.paper',
        overflowY: 'auto',
      }}
    >
      {sidebarContent}
    </Box>
  );
};

export default CompanySidebar;
