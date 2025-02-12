export const fetchData = async (endpoint, method = "GET", body = null, extraHeaders = {}) => {
    const token = localStorage.getItem("token");
  
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  
    try {
      const response = await fetch(`https://ai-agent-zyo6.onrender.com/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch data");
      }
  
      return await response.json();
    } catch (error) {
      console.error(`Error in fetchData(${endpoint}):`, error.message);
      return null;
    }
  };
  