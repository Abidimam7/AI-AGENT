import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Company from "./Company";
import Lead from "./Lead";
import GenerateEmailsComponent from "../../components/LeadGeneration/GenerateEmailsComponent";
import EmailSettings from "../../components/LeadGeneration/EmailSettings";
import EmailLogs from "../../components/LeadGeneration/EmailLogs";
import { fetchData } from "../../utils/api";  // ✅ API Helper Function



// MUI Components
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery,
} from "@mui/material";

// MUI Icons
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import ChatIcon from "@mui/icons-material/Chat";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 240;

const Home = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [generatedLeads, setGeneratedLeads] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  // activeTab can be: "company", "lead", or "emails"
  const [activeTab, setActiveTab] = useState("company");

  // Profile Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const openProfileMenu = Boolean(anchorEl);

  // Mobile Drawer State
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";

  // Use theme & media query for responsiveness
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));


useEffect(() => {
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [suppliers, aiLeads, uploadedLeads] = await Promise.all([
        fetchData("/suppliers/", "GET", null, headers),
        fetchData("/leads/", "GET", null, headers),
        fetchData("/uploaded-leads/", "GET", null, headers),
      ]);

      setSuppliers(suppliers);
      setGeneratedLeads([...aiLeads, ...uploadedLeads]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchAllData();
}, []);


  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Handlers for Profile Menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Mobile Drawer Toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Define a custom light theme
  const customTheme = createTheme({
    palette: {
      mode: "light",
      primary: { main: "#1976d2" },
      secondary: { main: "#dc004e" },
      background: { default: "#f5f5f5" },
      text: { primary: "#000" },
    },
  });
  

  // Drawer Content (Sidebar)
  const drawer = (
    <Box onClick={isMobile ? handleDrawerToggle : undefined} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Lead Platform
      </Typography>
      <Divider />
      <List>
        <h4>LeadGeneration AI</h4>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "company"}
            onClick={() => setActiveTab("company")}
          >
            <ListItemText primary="Company Suppliers" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "lead"}
            onClick={() => setActiveTab("lead")}
          >
            <ListItemText primary="Generated Leads" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "emails"}
            onClick={() => setActiveTab("emails")}
          >
            <ListItemText primary="Generate Emails" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "emailLogs"}
            onClick={() => setActiveTab("emailLogs")}
          >
            <ListItemText primary="Email Logs" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={activeTab === "emailSettings"}
            onClick={() => setActiveTab("emailSettings")}
          >
            <ListItemText primary="Email Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: "#fff",
            color: "#000",
            boxShadow: 1,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            {/* Left: Menu Icon for Mobile and Title */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant="h6" noWrap component="div">
                  Lead Management Platform
                </Typography>
                <Typography variant="body2" noWrap>
                  Manage suppliers and leads
                </Typography>
              </Box>
            </Box>

            {/* Center: Navigation Buttons */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                component={Link}
                to="/supplier-form"
                color="inherit"
                startIcon={<EditIcon />}
              >
                Add Supplier
              </Button>
              <Button
                component={Link}
                to="/chat"
                color="inherit"
                startIcon={<ChatIcon />}
              >
                LeadGeneration AI
              </Button>
            </Box>

            {/* Right: Profile Avatar */}
            <Box>
              <IconButton size="large" edge="end" color="inherit" onClick={handleProfileMenuOpen}>
                <Avatar sx={{ bgcolor: customTheme.palette.primary.main }}>
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={openProfileMenu}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle1">{userName}</Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Responsive Drawer */}
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          {/* Temporary Drawer for Mobile */}
          {isMobile && (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: "block", sm: "none" },
                "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
          )}
          {/* Permanent Drawer for Desktop */}
          {!isMobile && (
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: "none", sm: "block" },
                "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
              }}
              open
            >
              {drawer}
            </Drawer>
          )}
        </Box>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          {activeTab === "company" && (
            <Company
              suppliers={suppliers}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              navigate={navigate}
              setSuppliers={setSuppliers}
            />
          )}
          {activeTab === "lead" && (
            <Lead
              file={file}
              setFile={setFile}
              fileData={fileData}
              setFileData={setFileData}
              uploadError={uploadError}
              setUploadError={setUploadError}
              uploadSuccess={uploadSuccess}
              setUploadSuccess={setUploadSuccess}
              generatedLeads={generatedLeads}
              setGeneratedLeads={setGeneratedLeads}
            />
          )}
          {activeTab === "emails" && (
            <GenerateEmailsComponent supplierId={1} autoPreview={true} />
          )}
          {activeTab === "emailLogs" && <EmailLogs />}
          {activeTab === "emailSettings" && (
          <EmailSettings 
            open={true} 
            handleClose={() => setActiveTab("company")}  // Reset tab on close
          />
        )}  
          {loading && <Typography>Loading...</Typography>}
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
