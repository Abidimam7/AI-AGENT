import axios from "axios";
import { useState } from "react";

const handleGenerateEmails = async (supplierId, preview = false) => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/api/generate-emails/", {
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
