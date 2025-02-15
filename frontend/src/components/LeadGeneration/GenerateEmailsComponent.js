import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
  Card,
  CardContent,
  Chip,
  Badge,
  Divider,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#4caf50",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const GenerateEmailsComponent = ({ autoPreview = false }) => {
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState(null);
  const [leadList, setLeadList] = useState([]);
  const [selectedLeadIndices, setSelectedLeadIndices] = useState([]);
  const [previewEmails, setPreviewEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openLeadsDialog, setOpenLeadsDialog] = useState(false);
  const [expandedPreviews, setExpandedPreviews] = useState({});
  const [editingEmails, setEditingEmails] = useState({});
  const [emailLogs, setEmailLogs] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    delivered: "all",
    read: "all",
  });

  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalLeads: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get(`${baseUrl}/suppliers/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setSupplierList(response.data);
        if (response.data.length > 0) {
          setSupplierId(response.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    const token = localStorage.getItem("token");
    
    axios.get(`${baseUrl}/leads/?supplier_id=${supplierId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setLeadList(response.data);
        setSelectedLeadIndices(response.data.map((_, idx) => idx));
        calculateStats(emailLogs, response.data);
      })
      .catch(console.error);

    axios.get(`${baseUrl}/email-logs/?supplier_id=${supplierId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setEmailLogs(response.data);
        calculateStats(response.data, leadList);
      })
      .catch(console.error);
  }, [supplierId]);

  const calculateStats = (logs, leads) => {
    setStats({
      totalSent: logs.length,
      totalDelivered: logs.filter(log => log.delivered).length,
      totalRead: logs.filter(log => log.read).length,
      totalLeads: leads.length,
    });
  };

  const getEmailCountForLead = (leadId) => {
    return emailLogs.filter(log => log.lead.id === leadId).length;
  };

  const filteredLeads = leadList.filter(lead => {
    const leadLogs = emailLogs.filter(log => log.lead.id === lead.id);
    return (
      (filters.status === "all" || leadLogs.some(log => log.status === filters.status)) &&
      (filters.delivered === "all" || leadLogs.some(log => log.delivered === (filters.delivered === "yes"))) &&
      (filters.read === "all" || leadLogs.some(log => log.read === (filters.read === "yes")))
    );
  });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (e) => {
    setSupplierId(e.target.value);
  };

  const toggleLeadSelection = (index) => {
    setSelectedLeadIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeadIndices.length === leadList.length) {
      setSelectedLeadIndices([]);
    } else {
      setSelectedLeadIndices(leadList.map((_, idx) => idx));
    }
  };

  const handlePreviewClick = () => {
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }
    if (selectedLeadIndices.length === 0) {
      setError("Please select at least one lead.");
      return;
    }
    setError("");
    setOpenConfirm(true);
  };

  const generatePreview = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const selectedEmails = selectedLeadIndices.map(
        (i) => leadList[i].email
      );
      const response = await axios.post(`${baseUrl}/generate-emails/`, {
          supplier_id: supplierId,
          preview: true,
          send_to: selectedEmails,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setPreviewEmails(response.data.emails || []);
      setOpenLeadsDialog(true);
    } catch (err) {
      console.error("Failed to generate email preview", err);
      setError("Error generating email preview.");
    }
    setLoading(false);
  };

  const handleConfirmYes = () => {
    setOpenConfirm(false);
    generatePreview();
  };

  const handleConfirmNo = () => setOpenConfirm(false);

  const togglePreview = (index) => {
    setExpandedPreviews((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleEditToggle = (index) => {
    setEditingEmails((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleEmailChange = (index, field, value) => {
    setPreviewEmails((prev) =>
      prev.map((email, idx) =>
        idx === index ? { ...email, [field]: value } : email
      )
    );
  };

  const handleSendEmails = async () => {
    if (selectedLeadIndices.length === 0) {
      setError("Please select at least one lead.");
      return;
    }
    setSending(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const emailsToSend = selectedLeadIndices
        .map((i) => previewEmails[i])
        .filter((item) => item !== undefined)
        .map((item) => item.email);
      
      await axios.post(`${baseUrl}/generate-emails/`, {
          supplier_id: supplierId,
          preview: false,
          send_to: emailsToSend,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      alert("Emails sent successfully!");
      setPreviewEmails([]);
      setSelectedLeadIndices([]);
      setOpenLeadsDialog(false);
    } catch (err) {
      console.error("Failed to send emails", err);
      setError("Error sending emails.");
    }
    setSending(false);
  };

  useEffect(() => {
    if (autoPreview) handlePreviewClick();
  }, [autoPreview]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Object.entries(stats).map(([key, value], index) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card sx={{ 
                borderRadius: 2,
                bgcolor: index === 0 ? "#e3f2fd" : 
                         index === 1 ? "#f0f4c3" :
                         index === 2 ? "#c8e6c9" : "#ffecb3"
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
                    {key.replace('total', '')}
                  </Typography>
                  <Typography variant="h4">{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters Section */}
        <Card sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Delivered</InputLabel>
                <Select
                  value={filters.delivered}
                  onChange={(e) => handleFilterChange("delivered", e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Read</InputLabel>
                <Select
                  value={filters.read}
                  onChange={(e) => handleFilterChange("read", e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        {/* Supplier Selection */}
        <Card sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Supplier</InputLabel>
                <Select
                  value={supplierId || ""}
                  onChange={handleSupplierChange}
                >
                  {supplierList.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="text.secondary">
                Selected Supplier: {supplierList.find(s => s.id === supplierId)?.company_name || "None"}
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Leads List */}
        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filteredLeads.length > 0 && 
                    filteredLeads.every(lead => selectedLeadIds.includes(lead.id))}
                  indeterminate={
                    filteredLeads.some(lead => selectedLeadIds.includes(lead.id)) &&
                    !filteredLeads.every(lead => selectedLeadIds.includes(lead.id))
                  }
                  onChange={toggleSelectAllLeads}
                />
              }
              label="Select All"
            />
          </Box>  
          <List>
            {filteredLeads.map((lead, index) => (
              <ListItem key={lead.id} divider>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedLeadIndices.includes(index)}
                        onChange={() => toggleLeadSelection(index)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1">
                          {lead.company_name}
                          <Chip
                            label={`${getEmailCountForLead(lead.id)} emails sent`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.email}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {emailLogs.some(log => log.lead.id === lead.id && log.delivered) && (
                      <Chip label="Delivered" color="success" size="small" />
                    )}
                    {emailLogs.some(log => log.lead.id === lead.id && log.read) && (
                      <Chip label="Read" color="info" size="small" />
                    )}
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>

        {/* Generate Email Preview Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handlePreviewClick}
            disabled={loading || sending || leadList.length === 0}
            sx={{ px: 6, py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Generating Preview...
              </>
            ) : (
              'Generate Email Preview'
            )}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Confirmation Dialog */}
        <Dialog open={openConfirm} onClose={handleConfirmNo}>
          <DialogTitle>Confirm Email Generation</DialogTitle>
          <DialogContent>
            <Typography>
              Generate email previews for {selectedLeadIndices.length} selected leads?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfirmNo}>Cancel</Button>
            <Button onClick={handleConfirmYes} variant="contained" color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview & Send Dialog */}
        <Dialog
          open={openLeadsDialog}
          onClose={() => setOpenLeadsDialog(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Email Previews</DialogTitle>
          <DialogContent dividers>
            {previewEmails.map((email, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    checked={selectedLeadIndices.includes(index)}
                    onChange={() => toggleLeadSelection(index)}
                  />
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {email.email}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => togglePreview(index)}
                    sx={{ mr: 1 }}
                  >
                    {expandedPreviews[index] ? 'Hide' : 'Show'}
                  </Button>
                </Box>
                {expandedPreviews[index] && (
                  <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    {editingEmails[index] ? (
                      <>
                        <TextField
                          fullWidth
                          label="Subject"
                          value={email.subject}
                          onChange={(e) => handleEmailChange(index, 'subject', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          label="Body"
                          value={email.body}
                          onChange={(e) => handleEmailChange(index, 'body', e.target.value)}
                        />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleEditToggle(index)}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleEditToggle(index)}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" gutterBottom>
                          <strong>Subject:</strong> {email.subject}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" whiteSpace="pre-wrap">
                          {email.body}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => handleEditToggle(index)}
                          sx={{ mt: 1 }}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLeadsDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSendEmails}
              variant="contained"
              color="primary"
              disabled={sending}
            >
              {sending ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  Sending...
                </>
              ) : (
                'Send Selected Emails'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default GenerateEmailsComponent;