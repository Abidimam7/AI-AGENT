// import React from "react";
// import {
//   Box,
//   TextField,
//   Table,
//   TableHead,
//   TableBody,
//   TableRow,
//   TableCell,
//   TableContainer,
//   Paper,
//   TablePagination,
//   Checkbox,
//   Tooltip,
//   Button,
// } from "@mui/material";
// import { ArrowUpward, ArrowDownward, Warning, Email } from "@mui/icons-material";
// import { styled, useTheme } from "@mui/material/styles";

// const StyledTableRow = styled(TableRow)(({ theme }) => ({
//   "&:nth-of-type(odd)": {
//     backgroundColor: theme.palette.action.hover,
//   },
//   "&:last-child td, &:last-child th": {
//     border: 0,
//   },
// }));

// const LeadTable = ({
//   paginatedLeads,
//   filteredLeads,
//   duplicateEmails,
//   renderSortIcon,
//   handleSort,
//   handleGeneratePreview,
//   toggleSelectLead,
//   selectedLeads,
//   page,
//   rowsPerPage,
//   handleChangePage,
//   handleChangeRowsPerPage,
//   searchTerm,
//   setSearchTerm,
// }) => {
//   const theme = useTheme();

//   return (
//     <>
//       <Box sx={{ p: 3 }}>
//         <Box
//           sx={{
//             mb: 3,
//             position: "sticky",
//             top: 64,
//             zIndex: 9,
//             backgroundColor: "background.paper",
//             py: 2,
//           }}
//         >
//           <TextField
//             fullWidth
//             variant="outlined"
//             size="small"
//             placeholder="Search leads..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             InputProps={{ sx: { borderRadius: 2 } }}
//           />
//         </Box>
//         <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//           <Table stickyHeader>
//             <TableHead>
//               <TableRow>
//                 <TableCell sx={{ fontWeight: 600 }}>SR No.</TableCell>
//                 <TableCell
//                   onClick={() => handleSort("company_name")}
//                   sx={{ fontWeight: 600, cursor: "pointer" }}
//                 >
//                   Company {renderSortIcon("company_name")}
//                 </TableCell>
//                 <TableCell
//                   onClick={() => handleSort("email")}
//                   sx={{ fontWeight: 600, cursor: "pointer" }}
//                 >
//                   Email {renderSortIcon("email")}
//                 </TableCell>
//                 <TableCell
//                   onClick={() => handleSort("phone")}
//                   sx={{ fontWeight: 600, cursor: "pointer" }}
//                 >
//                   Phone {renderSortIcon("phone")}
//                 </TableCell>
//                 <TableCell
//                   onClick={() => handleSort("address")}
//                   sx={{ fontWeight: 600, cursor: "pointer" }}
//                 >
//                   Address {renderSortIcon("address")}
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600 }}>Emails Sent</TableCell>
//                 <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
//                 <TableCell align="center" sx={{ fontWeight: 600 }}>
//                   Select
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {paginatedLeads.map((lead, index) => (
//                 <StyledTableRow key={lead.id}>
//                   <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
//                   <TableCell sx={{ fontWeight: 500 }}>{lead.company_name}</TableCell>
//                   <TableCell>
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                       {lead.email}
//                       {duplicateEmails[lead.email] > 1 && (
//                         <Tooltip title="Duplicate email">
//                           <Warning color="warning" fontSize="small" />
//                         </Tooltip>
//                       )}
//                     </Box>
//                   </TableCell>
//                   <TableCell>{lead.phone}</TableCell>
//                   <TableCell>{lead.address}</TableCell>
//                   <TableCell>{lead.email_count || 0}</TableCell>
//                   <TableCell>
//                     <Button
//                       variant="outlined"
//                       startIcon={<Email />}
//                       onClick={() => handleGeneratePreview(lead.id)}
//                     >
//                       Generate Email
//                     </Button>
//                   </TableCell>
//                   <TableCell align="center">
//                     <Checkbox
//                       checked={selectedLeads.includes(lead.id)}
//                       onChange={() => toggleSelectLead(lead.id)}
//                       color="primary"
//                     />
//                   </TableCell>
//                 </StyledTableRow>
//               ))}
//             </TableBody>
//           </Table>
//           <TablePagination
//             rowsPerPageOptions={[5, 10, 25]}
//             component="div"
//             count={filteredLeads.length}
//             rowsPerPage={rowsPerPage}
//             page={page}
//             onPageChange={handleChangePage}
//             onRowsPerPageChange={handleChangeRowsPerPage}
//             sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
//           />
//         </TableContainer>
//       </Box>
//     </>
//   );
// };

// export default LeadTable;
