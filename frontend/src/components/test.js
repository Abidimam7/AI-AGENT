// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { read, utils } from "xlsx";
// import { Paper, Alert,Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar, Typography, Divider } from "@mui/material";
// import { ArrowUpward, ArrowDownward, Warning } from "@mui/icons-material";
// import { styled, useTheme } from "@mui/material/styles";
// import LeadHeader from "../../pages/Home/LeadHeader";
// import LeadTable from "../../pages/Home/LeadsTable";


// const Lead = ({
//   generatedLeads,
//   setGeneratedLeads,
// }) => {
//   const theme = useTheme();
//   // State variables (supplier, leads, email logs, preview, etc.)
//   const [selectedLeads, setSelectedLeads] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectAll, setSelectAll] = useState(false);
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [sortBy, setSortBy] = useState("company_name");
//   const [sortOrder, setSortOrder] = useState("asc");
//   const [supplierList, setSupplierList] = useState([]);
//   const [supplierId, setSupplierId] = useState(null);
//   const [emailLogs, setEmailLogs] = useState([]);
//   const [previewEmails, setPreviewEmails] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState("");
//   const [openConfirm, setOpenConfirm] = useState(false);
//   const [openLeadsDialog, setOpenLeadsDialog] = useState(false);
//   const [selectedLeadIds, setSelectedLeadIds] = useState([]);

//   // Fetch supplier list
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     axios.get(`${process.env.REACT_APP_API_BASE_URL}/suppliers/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//     .then((response) => {
//       setSupplierList(response.data);
//       if (response.data.length > 0) {
//         setSupplierId(response.data[0].id);
//       }
//     })
//     .catch(console.error);
//   }, []);

//   // Fetch email logs when supplierId changes
//   useEffect(() => {
//     if (!supplierId) return;
//     const token = localStorage.getItem("token");
//     axios.get(`${process.env.REACT_APP_API_BASE_URL}/email-logs/?supplier_id=${supplierId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//     .then((response) => {
//       setEmailLogs(response.data);
//     })
//     .catch(console.error);
//   }, [supplierId]);

//   // Helper to count emails for a lead
//   const getEmailCountForLead = (leadId) => {
//     return emailLogs.filter((log) => log.lead.id === leadId).length;
//   };

//   // Handle preview generation for a single lead
//   const handleGeneratePreview = (leadId) => {
//     if (!supplierId) {
//       setError("Please select a supplier.");
//       return;
//     }
//     setSelectedLeadIds([leadId]);
//     setOpenConfirm(true);
//   };

//   // Generate preview (simplified; you can integrate your API call here)
//   const generatePreviewHandler = async () => {
//     setLoading(true);
//     setError("");
//     const token = localStorage.getItem("token");
//     try {
//       const selectedLead = generatedLeads.find(lead => lead.id === selectedLeadIds[0]);
//       const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-emails/`, {
//         supplier_id: supplierId,
//         preview: true,
//         send_to: [selectedLead.email],
//       }, {
//         headers: { Authorization: token ? `Bearer ${token}` : "" }
//       });
//       setPreviewEmails(response.data.emails || []);
//       setOpenLeadsDialog(true);
//     } catch (err) {
//       console.error("Failed to generate email preview", err);
//       setError("Error generating email preview.");
//     }
//     setLoading(false);
//   };

//   const handleConfirmYes = () => {
//     setOpenConfirm(false);
//     generatePreviewHandler();
//   };
//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     // Add your file handling logic here
//   };
  

//   // Handle sending emails (similar logic)
//   const handleSendEmails = async () => {
//     setSending(true);
//     setError("");
//     const token = localStorage.getItem("token");
//     try {
//       await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-emails/`, {
//         supplier_id: supplierId,
//         preview: false,
//         send_to: previewEmails.map(email => email.email),
//       }, {
//         headers: { Authorization: token ? `Bearer ${token}` : "" }
//       });
//       alert("Email sent successfully!");
//       setPreviewEmails([]);
//       setOpenLeadsDialog(false);
//     } catch (err) {
//       console.error("Failed to send email", err);
//       setError("Error sending email.");
//     }
//     setSending(false);
//   };

//   const toggleSelectLead = (leadId) => {
//     if (selectedLeads.includes(leadId)) {
//       setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
//     } else {
//       setSelectedLeads([...selectedLeads, leadId]);
//     }
//   };

//   const toggleSelectAll = () => {
//     if (selectAll) {
//       setSelectedLeads([]);
//     } else {
//       setSelectedLeads(generatedLeads.map((lead) => lead.id));
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleDeleteSelected = async () => {
//     if (!window.confirm("Are you sure you want to delete the selected leads?")) return;
//     const token = localStorage.getItem("token");
//     try {
//       const baseUrl = process.env.REACT_APP_API_BASE_URL;
//       await Promise.all(
//         generatedLeads
//           .filter((lead) => selectedLeads.includes(lead.id))
//           .map((lead) =>
//             axios.delete(`${baseUrl}/leads/${lead.id}/`, {
//               headers: { Authorization: token ? `Bearer ${token}` : "" },
//             })
//           )
//       );
//       setGeneratedLeads(generatedLeads.filter((lead) => !selectedLeads.includes(lead.id)));
//       setSelectedLeads([]);
//     } catch (error) {
//       setError("Failed to delete selected leads. Please try again.");
//     }
//   };

//   const handleSort = (field) => {
//     const isAsc = sortBy === field && sortOrder === "asc";
//     setSortOrder(isAsc ? "desc" : "asc");
//     setSortBy(field);
//   };

//   const renderSortIcon = (field) => {
//     if (sortBy !== field) return null;
//     return sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
//   };

//   // Filtering & sorting leads
//   const filteredLeads = generatedLeads.filter((lead) =>
//     [lead.company_name, lead.email, lead.phone, lead.address]
//       .join(" ")
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase())
//   );

//   const sortedLeads = [...filteredLeads].sort((a, b) => {
//     const compare = a[sortBy]?.localeCompare(b[sortBy], undefined, { sensitivity: "base" });
//     return sortOrder === "asc" ? compare : -compare;
//   });

//   const paginatedLeads = sortedLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const handleExportCSV = () => {
//     if (!generatedLeads || generatedLeads.length === 0) return;
//     const ws = utils.json_to_sheet(generatedLeads);
//     const csvData = utils.sheet_to_csv(ws);
//     const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.setAttribute("download", "leads.csv");
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // Calculate duplicate emails (for tooltip warning)
//   const duplicateEmails = generatedLeads.reduce((acc, lead) => {
//     acc[lead.email] = (acc[lead.email] || 0) + 1;
//     return acc;
//   }, {});

//   return (
//     <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden" }}>
//       <LeadHeader
//         supplierList={supplierList}
//         supplierId={supplierId}
//         setSupplierId={setSupplierId}
//         handleFileChange={handleFileChange}
//         handleDeleteSelected={handleDeleteSelected}
//         toggleSelectAll={toggleSelectAll}
//         handleExportCSV={handleExportCSV}
//       />
//       <LeadTable
//         paginatedLeads={paginatedLeads}
//         filteredLeads={filteredLeads}
//         duplicateEmails={duplicateEmails}
//         renderSortIcon={renderSortIcon}
//         handleSort={handleSort}
//         handleGeneratePreview={handleGeneratePreview}
//         toggleSelectLead={toggleSelectLead}
//         selectedLeads={selectedLeads}
//         page={page}
//         rowsPerPage={rowsPerPage}
//         handleChangePage={handleChangePage}
//         handleChangeRowsPerPage={handleChangeRowsPerPage}
//         searchTerm={searchTerm}
//         setSearchTerm={setSearchTerm}
//       />

//       {/* Preview Dialog */}
//       <Dialog open={openLeadsDialog} onClose={() => setOpenLeadsDialog(false)} fullWidth maxWidth="md">
//         <DialogTitle>Email Preview</DialogTitle>
//         <DialogContent dividers>
//           {previewEmails.map((email, index) => (
//             <Box key={index} sx={{ mb: 2 }}>
//               <Typography variant="subtitle1" gutterBottom>
//                 To: {email.email}
//               </Typography>
//               <Typography variant="body2" gutterBottom>
//                 <strong>Subject:</strong> {email.subject}
//               </Typography>
//               <Divider sx={{ my: 1 }} />
//               <Typography variant="body2" whiteSpace="pre-wrap">
//                 {email.body}
//               </Typography>
//             </Box>
//           ))}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenLeadsDialog(false)}>Cancel</Button>
//           <Button onClick={handleSendEmails} variant="contained" color="primary" disabled={sending}>
//             {sending ? (
//               <>
//                 <CircularProgress size={24} sx={{ mr: 1 }} />
//                 Sending...
//               </>
//             ) : (
//               "Send Email"
//             )}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Confirmation Dialog */}
//       <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
//         <DialogTitle>Confirm Email Generation</DialogTitle>
//         <DialogContent>
//           <Typography>Generate email preview for selected lead?</Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
//           <Button onClick={handleConfirmYes} variant="contained" color="primary" disabled={loading}>
//             {loading ? (
//               <>
//                 <CircularProgress size={24} sx={{ mr: 1 }} />
//                 Generating...
//               </>
//             ) : (
//               "Confirm"
//             )}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Paper>
//   );
// };

// export default Lead;
