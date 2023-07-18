export async function fetchZohoAccounts() {
  console.log('fetching zoho data');
  try {
    const response = await fetch(`/api/zoho`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

