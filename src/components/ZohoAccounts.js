import React, { useState } from 'react';
import { fetchZohoAccounts } from '../api/zoho';

function ZohoAccounts() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchZohoData = async () => {
    try {
      setIsLoading(true);
      const response = await fetchZohoAccounts();
      setData(response.data);
      setIsLoading(false);
    } catch (error) {
        console.error('Error while fetching accounts:', error);
    }
  };

  if(!data.length) {
    return (
      <>
      <button type='submit' onClick={fetchZohoData}>Fetch Zoho Data</button>
      </>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    
    <div>
      <div>
      <button onClick={fetchZohoData}>Update Data</button>
      <div>
        {data.map((account) => (
          <div key={account.id}>
            <h2>{account.Account_Name}</h2>
            <p>{account.Description}</p>
            <p>Phone: {account.Phone || 'N/A'}</p>
            <p>Website: {account.Website || 'N/A'}</p>
            <p>Annual Revenue: {account.Annual_Revenue || 'N/A'}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

export default ZohoAccounts;