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
} from "@mui/material";

const GenerateEmailsComponent = ({ autoPreview = false }) => {
  // Dynamic API base URL from environment variables
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  // State for suppliers and leads
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState(null);
  const [leadList, setLeadList] = useState([]);
  const [selectedLeadIndices, setSelectedLeadIndices] = useState([]);

  // State for preview emails, loading, sending and error messages
  const [previewEmails, setPreviewEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Dialog controls
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openLeadsDialog, setOpenLeadsDialog] = useState(false);

  // For preview expansion and editing (if needed)
  const [expandedPreviews, setExpandedPreviews] = useState({});
  const [editingEmails, setEditingEmails] = useState({});

  // Fetch suppliers for the logged-in user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found.");
      return;
    }
    axios
      .get(`${baseUrl}/suppliers/`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      .then((response) => {
        setSupplierList(response.data);
        if (response.data.length > 0) {
          // Set the first supplier as default
          setSupplierId(response.data[0].id);
        }
      })
      .catch((err) => console.error("Error fetching suppliers:", err));
  }, [baseUrl]);

  // Fetch leads for the selected supplier whenever supplierId changes
  useEffect(() => {
    if (!supplierId) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${baseUrl}/leads/?supplier_id=${supplierId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      .then((response) => {
        setLeadList(response.data);
        // By default, select all leads
        setSelectedLeadIndices(response.data.map((_, idx) => idx));
      })
      .catch((err) => console.error("Error fetching leads:", err));
  }, [supplierId, baseUrl]);

  // Handle supplier dropdown change
  const handleSupplierChange = (e) => {
    setSupplierId(e.target.value);
  };

  // Toggle selection for an individual lead
  const toggleLeadSelection = (index) => {
    setSelectedLeadIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Toggle "Select All" for leads
  const toggleSelectAllLeads = () => {
    if (selectedLeadIndices.length === leadList.length) {
      setSelectedLeadIndices([]);
    } else {
      setSelectedLeadIndices(leadList.map((_, idx) => idx));
    }
  };

  // Check if supplier and leads are selected; if yes, open confirmation dialog
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

  // On confirmation, generate the email preview only for selected leads
  const generatePreview = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      // Prepare an array of email addresses from the selected leads
      const selectedEmails = selectedLeadIndices.map(
        (i) => leadList[i].email
      );
      const response = await axios.post(
        `${baseUrl}/generate-emails/`,
        {
          supplier_id: supplierId,
          preview: true,
          send_to: selectedEmails,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      const emails = response.data.emails || [];
      setPreviewEmails(emails);
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

  // Toggle preview expansion
  const togglePreview = (index) => {
    setExpandedPreviews((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Toggle edit mode for an email preview
  const handleEditToggle = (index) => {
    setEditingEmails((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Update preview email subject or body during edit
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
      // Safely extract only the emails for the selected leads from previewEmails:
      const emailsToSend = selectedLeadIndices
        .map((i) => previewEmails[i])
        .filter((item) => item !== undefined)
        .map((item) => item.email);

      if (emailsToSend.length === 0) {
        setError("No valid lead emails found.");
        setSending(false);
        return;
      }

      await axios.post(
        `${baseUrl}/generate-emails/`,
        {
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

  // Auto-trigger preview if autoPreview prop is true
  useEffect(() => {
    if (autoPreview) handlePreviewClick();
  }, [autoPreview]);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Supplier Selection */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Select Supplier:
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="supplier-select-label">Supplier</InputLabel>
          <Select
            labelId="supplier-select-label"
            value={supplierId || ""}
            label="Supplier"
            onChange={handleSupplierChange}
          >
            {supplierList.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Lead Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Select Leads:</Typography>
        {leadList.length > 0 ? (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedLeadIndices.length === leadList.length}
                  onChange={toggleSelectAllLeads}
                />
              }
              label="Select All"
            />
            <List>
              {leadList.map((lead, index) => (
                <ListItem key={index} divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedLeadIndices.includes(index)}
                        onChange={() => toggleLeadSelection(index)}
                      />
                    }
                    label={`${lead.company_name} (${lead.email})`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>No leads available for this supplier.</Typography>
        )}
      </Box>

      {/* Generate Email Preview Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button
          variant="contained"
          onClick={handlePreviewClick}
          disabled={loading || sending || leadList.length === 0}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Generating Preview...
            </>
          ) : (
            "Generate Emails"
          )}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Confirmation Dialog for generating preview */}
      <Dialog open={openConfirm} onClose={handleConfirmNo}>
        <DialogTitle>Confirm Email Generation</DialogTitle>
        <DialogContent>
          <Typography>
            Generate email previews for the selected supplier and leads?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmNo}>Cancel</Button>
          <Button onClick={handleConfirmYes} variant="contained">
            Yes, Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for preview emails and sending emails */}
      <Dialog
        open={openLeadsDialog}
        onClose={() => setOpenLeadsDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Leads to Send Emails</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewEmails.length > 0 ? (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedLeadIndices.length === previewEmails.length}
                    onChange={toggleSelectAllLeads}
                  />
                }
                label="Select All"
              />
              <List>
                {previewEmails.map((email, index) => (
                  <ListItem key={index} divider>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedLeadIndices.includes(index)}
                          onChange={() => toggleLeadSelection(index)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            <strong>To:</strong> {email.email}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Subject:</strong> {email.subject}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => togglePreview(index)}
                          >
                            {expandedPreviews[index] ? "Hide Preview" : "Show Preview"}
                          </Button>
                          {expandedPreviews[index] && (
                            <Box sx={{ p: 1, border: "1px solid #ddd", borderRadius: 1, mt: 1 }}>
                              {editingEmails[index] ? (
                                <>
                                  <TextField
                                    fullWidth
                                    label="Subject"
                                    variant="outlined"
                                    value={email.subject}
                                    onChange={(e) =>
                                      handleEmailChange(index, "subject", e.target.value)
                                    }
                                    sx={{ mb: 1 }}
                                  />
                                  <TextField
                                    fullWidth
                                    multiline
                                    label="Body"
                                    variant="outlined"
                                    value={email.body}
                                    onChange={(e) =>
                                      handleEmailChange(index, "body", e.target.value)
                                    }
                                    sx={{ mb: 1 }}
                                  />
                                  <Button size="small" onClick={() => handleEditToggle(index)}>
                                    Save
                                  </Button>
                                  <Button size="small" onClick={() => handleEditToggle(index)}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Typography variant="body2">{email.body}</Typography>
                                  <Button size="small" onClick={() => handleEditToggle(index)}>
                                    Edit
                                  </Button>
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <Typography>No email preview available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeadsDialog(false)}>Cancel</Button>
          <Button onClick={handleSendEmails} variant="contained" disabled={sending}>
            {sending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Sending Emails...
              </>
            ) : (
              "Send Emails"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateEmailsComponent;
