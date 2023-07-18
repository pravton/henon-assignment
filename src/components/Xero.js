import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchXeroAccounts } from '../api/xero';


function AccountListComponent() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchXeroAccounts();
      setAccounts(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if(!accounts || Object.keys(accounts).length === 0){
    return (
      <>
      <button type='submit' onClick={fetchData}>Fetch Xero Accounts</button>
      </>
    )
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }


  return (
    <div>
      <h2>Accounts</h2>
      <ul>
        {accounts.Accounts.map((account) => (
          <li key={account.AccountID}>
            {account.Code}: {account.Name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AccountListComponent;

