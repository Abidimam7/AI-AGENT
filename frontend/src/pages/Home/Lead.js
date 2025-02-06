import React, { useState } from "react";
import axios from "axios";
import { read, utils } from "xlsx";

// Material UI Components
import {
  Box,
  Grid,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";

// Material UI Icons
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BusinessIcon from "@mui/icons-material/Business";

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
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("company_name");
  
  const duplicateEmails = {};
    generatedLeads.forEach((lead) => {
      const email = lead.email;
      duplicateEmails[email] = (duplicateEmails[email] || 0) + 1;
    });


  // Handle file selection and parse with XLSX
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

  // Handle upload of fileData to the server
  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://127.0.0.1:8000/api/upload-leads/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      setUploadSuccess(true);
      setUploadError("");
      // Fetch leads after successful upload
      const response = await axios.get("http://127.0.0.1:8000/api/leads/", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      setGeneratedLeads(response.data);
    } catch (error) {
      setUploadError("Failed to upload leads. Please check the file format and try again.");
      console.error("Upload error:", error);
    }
  };

  // Toggle selection for a single lead (using lead.id)
  const toggleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  // Toggle select/deselect all leads
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(generatedLeads.map((lead) => lead.id));
    }
    setSelectAll(!selectAll);
  };

  // Delete selected leads
  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete the selected leads?")) return;
    const token = localStorage.getItem("token");
    try {
      await Promise.all(
        generatedLeads
          .filter((lead) => selectedLeads.includes(lead.id))
          .map((lead) =>
            axios.delete(`http://127.0.0.1:8000/api/leads/${lead.id}/`, {
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

  // Filter leads based on search term (excluding contact name)
  const filteredLeads = generatedLeads.filter((lead) =>
    [lead.company_name, lead.email, lead.phone, lead.address]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Sorting the filtered leads based on sortBy field
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1;
    if (a[sortBy] > b[sortBy]) return 1;
    return 0;
  });

  // Pagination: slice sorted leads array
  const paginatedLeads = sortedLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Grid container spacing={2}>
      {/* Main Content: Leads Management */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          {/* Header */}
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <CloudUploadIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Generated Leads</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                <TextField
                  size="small"
                  placeholder="Search by name, email, phone or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="company_name">Company Name</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="phone">Phone</MenuItem>
                    <MenuItem value="address">Address</MenuItem>
                  </Select>
                </FormControl>              
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Leads
                    <input
                      type="file"
                      hidden
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                    />
                  </Button>        
              </Box>
            </Grid>
          </Grid>

          {fileData.length > 0 && !uploadSuccess && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Preview Uploaded Data
              </Typography>
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<CloudUploadIcon />}
                onClick={handleUpload}
              >
                Confirm Upload
              </Button>
            </Box>
          )}
          {uploadSuccess && (
            <Box mt={2}>
              <Alert severity="success">Leads uploaded successfully!</Alert>
            </Box>
          )}

          {/* Alerts */}
          <Box mt={2}>
            {uploadError && (
              <Alert severity="error" icon={<ErrorOutlineIcon />}>
                {uploadError}
              </Alert>
            )}
          </Box>

          {/* Delete & Select All Actions */}
          <Box mt={3} mb={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              disabled={selectedLeads.length === 0}
            >
              Delete Selected
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={toggleSelectAll}
            >
              {selectAll ? "Deselect All" : "Select All"}
            </Button>
          </Box>

          {/* Leads Table with Pagination, Serial Number, and Selection Checkboxes */}
          {generatedLeads.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sr. No.</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLeads.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      sx={{
                        backgroundColor:
                          duplicateEmails[lead.email] > 1 ? "rgba(255,0,0,0.1)" : "inherit",
                      }}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{lead.company_name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.address}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelectLead(lead.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredLeads.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          ) : (
            <Box textAlign="center" py={5}>
              <Avatar
                sx={{
                  margin: "0 auto",
                  bgcolor: "grey.300",
                  width: 56,
                  height: 56,
                }}
              >
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" color="textSecondary" mt={2}>
                No leads available
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Upload a CSV/Excel file with company details to get started
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Lead;
