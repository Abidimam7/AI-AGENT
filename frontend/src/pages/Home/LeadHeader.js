// import React from "react";
// import {
//   Box,
//   Typography,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Tooltip,
//   IconButton,
// } from "@mui/material";
// import {
//   CloudUpload,
//   Delete,
//   CheckCircle,
//   Download,
// } from "@mui/icons-material";
// import { styled } from "@mui/material/styles";

// const HeaderContainer = styled(Box)(({ theme }) => ({
//   display: "flex",
//   flexDirection: "column",
//   gap: theme.spacing(2),
//   padding: theme.spacing(2),
//   borderBottom: `1px solid ${theme.palette.divider}`,
//   backgroundColor: theme.palette.background.paper,
// }));

// const HeaderActions = ({
//   handleFileChange,
//   handleDeleteSelected,
//   toggleSelectAll,
//   handleExportCSV,
// }) => {
//   return (
//     <Box sx={{ display: "flex", gap: 1 }}>
//       <Tooltip title="Upload Leads">
//         <IconButton component="label" color="primary">
//           <CloudUpload />
//           <input
//             type="file"
//             hidden
//             accept=".xlsx, .xls, .csv"
//             onChange={handleFileChange}
//           />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Delete Selected">
//         <IconButton onClick={handleDeleteSelected} color="error">
//           <Delete />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Select/Deselect All">
//         <IconButton onClick={toggleSelectAll} color="primary">
//           <CheckCircle />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Export CSV">
//         <IconButton onClick={handleExportCSV} color="primary">
//           <Download />
//         </IconButton>
//       </Tooltip>
//     </Box>
//   );
// };

// const LeadHeader = ({
//   supplierList,
//   supplierId,
//   setSupplierId,
//   handleFileChange,
//   handleDeleteSelected,
//   toggleSelectAll,
//   handleExportCSV,
// }) => {
//   return (
//     <HeaderContainer>
//       <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
//         <Typography variant="h6" sx={{ fontWeight: 600 }}>
//           Generated Leads
//         </Typography>
//         <Typography variant="body2" color="text.secondary">
//           {new Date().toLocaleDateString()}
//         </Typography>
//         <FormControl size="small" sx={{ minWidth: 200 }}>
//           <InputLabel>Supplier</InputLabel>
//           <Select
//             value={supplierId || ""}
//             onChange={(e) => setSupplierId(e.target.value)}
//             label="Supplier"
//           >
//             {supplierList.map((supplier) => (
//               <MenuItem key={supplier.id} value={supplier.id}>
//                 {supplier.company_name}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </Box>
//       <HeaderActions
//         handleFileChange={handleFileChange}
//         handleDeleteSelected={handleDeleteSelected}
//         toggleSelectAll={toggleSelectAll}
//         handleExportCSV={handleExportCSV}
//       />
//     </HeaderContainer>
//   );
// };

// export default LeadHeader;
