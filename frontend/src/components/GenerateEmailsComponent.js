import React, { useState } from "react";
import axios from "axios";

const GenerateEmailsComponent = ({ supplierId }) => {
  const [previewEmails, setPreviewEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Function to generate email preview
  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/generate-emails/", {
        supplier_id: 1,
        preview: true, // Only preview emails
      });

      setPreviewEmails(response.data.emails || []);
    } catch (error) {
      console.error("Failed to generate AI emails", error);
      alert("Error generating email preview.");
    }
    setLoading(false);
  };

  // Function to send emails
  const handleSendEmails = async () => {
    setSending(true);
    try {
      await axios.post("http://127.0.0.1:8000/generate-emails/", {
        supplier_id: 1,
        preview: false, // Actually send emails
      });

      alert("Emails sent successfully!");
      setPreviewEmails([]); // Clear preview after sending
    } catch (error) {
      console.error("Failed to send AI-generated emails", error);
      alert("Error sending emails.");
    }
    setSending(false);
  };

  return (
    <div className="mt-4 p-3 border rounded">
      <h4>Email Preview & Sending</h4>

      {/* Preview Button */}
      <button className="btn btn-primary me-2" onClick={handlePreview} disabled={loading}>
        {loading ? "Generating Preview..." : "Preview Emails"}
      </button>

      {/* Email Preview Section */}
      {previewEmails.length > 0 && (
        <div className="mt-3">
          <h5>Generated Emails:</h5>
          {previewEmails.map((email, index) => (
            <div key={index} className="p-3 border rounded mb-2">
              <p><strong>To:</strong> {email.email}</p>
              <p><strong>Subject:</strong> {email.subject}</p>
              <p><strong>Body:</strong> {email.body}</p>
            </div>
          ))}

          {/* Send Emails Button */}
          <button className="btn btn-success" onClick={handleSendEmails} disabled={sending}>
            {sending ? "Sending Emails..." : "Send Emails"}
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateEmailsComponent;
