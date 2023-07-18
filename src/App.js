import './App.css';
import TrialBalance from './components/TrialBalance';
import ZohoAccounts from './components/ZohoAccounts';
import HubspotContacts from './components/HubspotContacts';
import Xero from './components/Xero';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <span>Henon Assignment</span>
      </header>
      <section>
        <TrialBalance />
        <ZohoAccounts />
        <HubspotContacts />
        <Xero />
      </section>
    </div>
  );
}

export default App;
