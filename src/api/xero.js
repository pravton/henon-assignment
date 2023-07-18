export async function fetchXeroAccounts() {
  try {
    const response = await fetch(`/api/xero_accounts`, {
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
  }
}
