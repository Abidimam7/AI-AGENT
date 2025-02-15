import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from "@mui/material";

const EmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dashboard, setDashboard] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    delivered: 0,
    read: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const url = `${baseUrl}/email-logs/`;

    try {
      // Prepare query parameters if any filters are applied
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus && filterStatus !== "all") params.status = filterStatus;

      const response = await axios.get(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        params: params,
      });
      const data = response.data;
      setLogs(data);

      // Compute dashboard summary
      const total = data.length;
      const sent = data.filter((log) => log.status === "sent").length;
      const failed = data.filter((log) => log.status === "failed").length;
      const delivered = data.filter((log) => log.delivered).length;
      const read = data.filter((log) => log.read).length;
      setDashboard({ total, sent, failed, delivered, read });
    } catch (err) {
      console.error("Error fetching email logs:", err);
      setError("Error fetching email logs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDate, filterStatus]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginate the logs
  const paginatedLogs = logs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Email Logs
      </Typography>

      {/* Dashboard Summary */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 3 }}>
        <Typography variant="subtitle1">
          Total Emails: {dashboard.total}
        </Typography>
        <Typography variant="subtitle1">
          Sent: {dashboard.sent}
        </Typography>
        <Typography variant="subtitle1">
          Failed: {dashboard.failed}
        </Typography>
        <Typography variant="subtitle1">
          Delivered: {dashboard.delivered}
        </Typography>
        <Typography variant="subtitle1">
          Read: {dashboard.read}
        </Typography>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <TextField
          label="Filter by Date (YYYY-MM-DD)"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: "200px" } }}
        />
        <FormControl sx={{ minWidth: { xs: "100%", sm: "150px" } }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={fetchLogs}>
          Filter
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper>
          <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sr. No.</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Lead</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Delivered</TableCell>
                  <TableCell>Read</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log, index) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{log.supplier}</TableCell>
                    <TableCell>{log.lead}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>
                      {new Date(log.sent_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.delivered ? "Yes" : "No"}</TableCell>
                    <TableCell>{log.read ? "Yes" : "No"}</TableCell>
                    <TableCell>{log.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={logs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default EmailLogs;
