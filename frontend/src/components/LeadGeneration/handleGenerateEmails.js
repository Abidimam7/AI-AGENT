import axios from "axios";

const handleGenerateEmails = async (supplierId, preview = false) => {
  try {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
    const response = await axios.post(`${baseUrl}/generate-emails/`, {
      supplier_id: supplierId,
      preview: preview,  // If true, will return emails instead of sending
    });

    if (preview) {
      console.log("Preview Emails:", response.data.emails);
      return response.data.emails;  // Return preview emails for UI display
    } else {
      alert("Emails sent successfully!");
    }
  } catch (error) {
    console.error("Failed to generate AI emails", error);
    alert("Failed to generate AI emails.");
  }
};

export default handleGenerateEmails;
