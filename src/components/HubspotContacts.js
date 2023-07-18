import React, { useState, useEffect } from 'react';
import axios from 'axios';


function HubspotContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/hubapi/crm/v3/objects/contacts',
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
      
      setContacts(response.data.results);

    } catch (error) {
      console.error('Error fetching data from HubSpot API', error);
    } finally {
      setLoading(false);
    }
  };

  if (!contacts || Object.keys(contacts).length === 0) {
    return (
      <>
      <button type='submit' onClick={fetchData}>Fetch Hubspot Contacts</button>
      </>
    )
   }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Contacts</h1>
      {contacts.map((contact) => (
        <div key={contact.id}>
          <h2>{contact.properties.firstname} {contact.properties.lastname}</h2>
          <p>Email: {contact.properties.email}</p>
        </div>
      ))}
    </div>
  );
}

export default HubspotContacts;
