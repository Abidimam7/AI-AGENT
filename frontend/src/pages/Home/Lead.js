import React, { useState, useEffect } from "react";
import axios from "axios";
import { read, utils } from "xlsx";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Avatar,
  Alert,
  Checkbox,
  Tooltip,
  IconButton,
  styled,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Chip, 
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  CheckCircle,
  ErrorOutline,
  Business,
  Download,
  Warning,
  ArrowUpward,
  ArrowDownward,
  Email,
} from "@mui/icons-material";


const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: 0,
  zIndex: 10,
}));

const SortableHeader = styled(TableCell)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  userSelect: 'none',
}));

const HeaderActions = ({
  handleFileChange,
  handleDeleteSelected,
  toggleSelectAll,
  handleExportCSV,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Upload Leads">
        <IconButton component="label" color="primary">
          <CloudUpload />
          <input
            type="file"
            hidden
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
          />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Selected">
        <IconButton onClick={handleDeleteSelected} color="error">
          <Delete />
        </IconButton>
      </Tooltip>
      <Tooltip title="Select/Deselect All">
        <IconButton onClick={toggleSelectAll} color="primary">
          <CheckCircle />
        </IconButton>
      </Tooltip>
      <Tooltip title="Export CSV">
        <IconButton onClick={handleExportCSV} color="primary">
          <Download />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const Lead = ({
  file,
  setFile,
  fileData,
  setFileData,
  uploadError,
  setUploadError,
  uploadSuccess,
  setUploadSuccess,
  generatedLeads,
  setGeneratedLeads,
}) => {
  const theme = useTheme();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("company_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [supplierList, setSupplierList] = useState([]);
  const [supplierId, setSupplierId] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [previewEmails, setPreviewEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openLeadsDialog, setOpenLeadsDialog] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [activeLead, setActiveLead] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/suppliers/`, {
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
    
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/email-logs/?supplier_id=${supplierId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      setEmailLogs(response.data);
    })
    .catch(console.error);
  }, [supplierId]);

  const getEmailCountForLead = (leadId) => {
    return emailLogs.filter(log => log.lead.id === leadId).length;
  };

  const handleGeneratePreview = (leadId) => {
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }
    setSelectedLeadIds([leadId]);
    setOpenConfirm(true);
  };

  const generatePreview = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const selectedLead = generatedLeads.find(lead => lead.id === selectedLeadIds[0]);
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-emails/`, {
        supplier_id: supplierId,
        preview: true,
        send_to: [selectedLead.email],
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
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

  const handleSendEmails = async () => {
    setSending(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-emails/`, {
        supplier_id: supplierId,
        preview: false,
        send_to: previewEmails.map(email => email.email),
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      alert("Email sent successfully!");
      setPreviewEmails([]);
      setOpenLeadsDialog(false);
    } catch (err) {
      console.error("Failed to send email", err);
      setError("Error sending email.");
    }
    setSending(false);
  };

  const duplicateEmails = generatedLeads.reduce((acc, lead) => {
    acc[lead.email] = (acc[lead.email] || 0) + 1;
    return acc;
  }, {});

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setUploadError("Invalid file format. Please upload an Excel or CSV file.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      const requiredHeaders = ["company_name", "email", "phone", "address"];
      const headers = jsonData[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setUploadError(`Missing required columns: ${missingHeaders.join(", ")}`);
        return;
      }

      setFileData(jsonData.slice(1));
      setUploadError("");
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await axios.post(`${baseUrl}/upload-leads/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setUploadSuccess(true);
      setUploadError("");
      const response = await axios.get(`${baseUrl}/leads/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setGeneratedLeads(response.data);
    } catch (error) {
      setUploadError("Failed to upload leads. Please check the file format and try again.");
      console.error("Upload error:", error);
    }
  };

  const toggleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(generatedLeads.map((lead) => lead.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete the selected leads?")) return;
    const token = localStorage.getItem("token");
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      await Promise.all(
        generatedLeads
          .filter((lead) => selectedLeads.includes(lead.id))
          .map((lead) =>
            axios.delete(`${baseUrl}/leads/${lead.id}/`, {
              headers: { Authorization: token ? `Bearer ${token}` : "" },
            })
          )
      );
      setGeneratedLeads(generatedLeads.filter((lead) => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
    } catch (error) {
      setUploadError("Failed to delete selected leads. Please try again.");
    }
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
  };

  const filteredLeads = generatedLeads.filter((lead) =>
    [lead.company_name, lead.email, lead.phone, lead.address]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const compare = a[sortBy]?.localeCompare(b[sortBy], undefined, { sensitivity: 'base' });
    return sortOrder === 'asc' ? compare : -compare;
  });

  const paginatedLeads = sortedLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    if (!generatedLeads || generatedLeads.length === 0) return;
    const ws = utils.json_to_sheet(generatedLeads);
    const csvData = utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
   const payload = {
      supplier_id: activeLead ? activeLead.id : null,
      leads: leads.map(lead => ({
        ...lead,
        is_generated: true,  // Mark these as AI-generated
      })),
    };

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <HeaderContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Generated Leads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString()}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Supplier</InputLabel>
            <Select
              value={supplierId || ""}
              onChange={(e) => setSupplierId(e.target.value)}
              label="Supplier"
            >
              {supplierList.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <HeaderActions
          handleFileChange={handleFileChange}
          handleDeleteSelected={handleDeleteSelected}
          toggleSelectAll={toggleSelectAll}
          handleExportCSV={handleExportCSV}
        />
      </HeaderContainer>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, position: 'sticky', top: 64, zIndex: 9, backgroundColor: 'background.paper', py: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
        </Box>

        {fileData.length > 0 && !uploadSuccess && (
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<CloudUpload />}
              onClick={handleUpload}
              sx={{ py: 1.5 }}
            >
              Confirm Upload ({fileData.length} Leads)
            </Button>
          </Box>
        )}

        {uploadError && (
          <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorOutline />}>
            {uploadError}
          </Alert>
        )}

        {uploadSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Leads uploaded successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {generatedLeads.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>SR No.</TableCell>
                  <SortableHeader
                    onClick={() => handleSort('company_name')}
                    sx={{ fontWeight: 600 }}
                  >
                    Company {renderSortIcon('company_name')}
                  </SortableHeader>
                  <SortableHeader
                    onClick={() => handleSort('email')}
                    sx={{ fontWeight: 600 }}
                  >
                    Email {renderSortIcon('email')}
                  </SortableHeader>
                  <SortableHeader
                    onClick={() => handleSort('phone')}
                    sx={{ fontWeight: 600 }}
                  >
                    Phone {renderSortIcon('phone')}
                  </SortableHeader>
                  <SortableHeader
                    onClick={() => handleSort('address')}
                    sx={{ fontWeight: 600 }}
                  >
                    Address {renderSortIcon('address')}
                  </SortableHeader>
                  <TableCell sx={{ fontWeight: 600 }}>Emails Sent</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Select
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLeads.map((lead, index) => (
                  <StyledTableRow key={lead.id}>
                    <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {lead.company_name}
                      {lead.is_generated && (
                        <Chip label="AI Generated" color="primary" size="small" />
                      )}
                    </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {lead.email}
                        {duplicateEmails[lead.email] > 1 && (
                          <Tooltip title="Duplicate email">
                            <Warning color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.address}</TableCell>
                    <TableCell>{getEmailCountForLead(lead.id)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        startIcon={<Email />}
                        onClick={() => handleGeneratePreview(lead.id)}
                      >
                        Generate Email
                      </Button>
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleSelectLead(lead.id)}
                        color="primary"
                      />
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLeads.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
            />
          </TableContainer>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            p: 8,
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 4
          }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'background.default',
                color: 'text.secondary',
                mx: 'auto'
              }}
            >
              <Business sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              No Leads Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Upload a CSV or Excel file to get started
            </Typography>
          </Box>
        )}
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={openLeadsDialog}
        onClose={() => setOpenLeadsDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Email Preview</DialogTitle>
        <DialogContent dividers>
          {previewEmails.map((email, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                To: {email.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Subject:</strong> {email.subject}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" whiteSpace="pre-wrap">
                {email.body}
              </Typography>
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
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Email Generation</DialogTitle>
        <DialogContent>
          <Typography>
            Generate email preview for selected lead?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmYes} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Generating...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Lead;