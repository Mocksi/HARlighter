
// TODO move this to .env file
const API_URL = 'https://auth-2hfb.onrender.com'
export const apiCall = async (
    url: string,
    body: any
) => {
	try {
		const res = await fetch(`${API_URL}/v1/${url}` , {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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


export const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
