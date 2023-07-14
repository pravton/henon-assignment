import React, { useEffect, useState } from 'react';
import { fetchTrialBalance } from '../api/qb';
import { formatData } from '../utils/helpers.js';

function TrialBalance() {
  const [formattedData, setformattedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchTrialBalance();
        const formattedData = formatData(data);
        setformattedData(formattedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchData();
  }, []);


  if (isLoading) {
    return <div>Loading...</div>;
  }

return (
  <div>
    <h1>{formattedData.name}</h1>
    <p>ID: {formattedData.id}</p>
    <p>Date: {formattedData.date}</p>
    <p>Start Date: {formattedData.start_date}</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Debit</th>
          <th>Credit</th>
          {/* <th>Value</th> */}
        </tr>
      </thead>
      <tbody>
        {formattedData.rows.map((row, index) => (
          <tr key={index}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.debit}</td>
            <td>{row.credit}</td>
            {/* <td>{row.value}</td> */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);




}

export default TrialBalance;
