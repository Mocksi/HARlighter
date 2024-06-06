const API_URL = 'http://localhost:8090/api'
export const apiCall = async (
  url: string,
  body: any
) => {
  try {
    const res = await fetch(`${API_URL}/v1/${url}` , {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accepts-Version": "v1"
        },
        body: JSON.stringify(body),
      }
    );
    const response = await res.json();
    if (res.ok) {
      return response
    }
    throw new Error(response.error_description || response.error)
  } catch (err) {
    throw err
  }
};
