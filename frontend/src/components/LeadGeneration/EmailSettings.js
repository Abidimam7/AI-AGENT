import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

const EmailSettings = ({ open, handleClose }) => {
  const [emailSettings, setEmailSettings] = useState({
    email_host: "",
    email_port: 587,
    email_use_tls: true,
    email_host_user: "",
    email_host_password: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Use dynamic API base URL from environment variables
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: "Unauthorized: No token found",
        severity: "error",
      });
      return;
    }

    axios
      .get(`${baseUrl}/email-settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setEmailSettings(response.data);
      })
      .catch((error) => {
        setSnackbar({
          open: true,
          message: "Error fetching email settings",
          severity: "error",
        });
        console.error("Error fetching email settings:", error.response || error);
      });
  }, [baseUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings((prevSettings) => ({
      ...prevSettings,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbar({
        open: true,
        message: "Unauthorized: No token found",
        severity: "error",
      });
      return;
    }

    try {
      await axios.post(`${baseUrl}/email-settings/`, emailSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({
        open: true,
        message: "Settings updated successfully!",
        severity: "success",
      });
      handleClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update settings",
        severity: "error",
      });
      console.error("Error updating email settings:", error.response || error);
    }
  };

  return (
    <>
      {/* Email Settings Dialog Box */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Update Email Settings</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Host"
            name="email_host"
            value={emailSettings.email_host}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Email Port"
            name="email_port"
            value={emailSettings.email_port}
            onChange={handleChange}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="email_use_tls"
                checked={emailSettings.email_use_tls}
                onChange={handleChange}
              />
            }
            label="Use TLS"
          />
          <TextField
            fullWidth
            label="Email"
            name="email_host_user"
            value={emailSettings.email_host_user}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            name="email_host_password"
            value={emailSettings.email_host_password}
            onChange={handleChange}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmailSettings;
