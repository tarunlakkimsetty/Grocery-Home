import React from 'react';
import AuthContext from '../context/AuthContext';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { PrimaryButton, SecondaryButton, DangerButton } from '../styledComponents/ButtonStyles';
import { toast } from 'react-toastify';
import { getSavedAddresses, saveSavedAddresses, getRestockSubscriptions, saveRestockSubscriptions, getCustomerProfile, saveCustomerProfile } from '../utils/customerProfileStorage';

class CustomerProfilePage extends React.Component {
  static contextType = AuthContext;

  state = {
    fullName: '',
    phone: '',
    place: '',
    supplyAddress: '',
    addresses: [],
    restockAlerts: false,
    saving: false,
  };

  componentDidMount() {
    this.syncFromAuth();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.fullName === this.state.fullName && prevState.place === this.state.place && prevState.phone === this.state.phone && prevState.addresses !== this.state.addresses && this.state.fullName) {
      return;
    }
  }

  syncFromAuth = () => {
    const { user } = this.context || {};
    const storedProfile = getCustomerProfile(user?.id) || {};
    const addresses = getSavedAddresses(user?.id);
    const restockAlerts = Array.isArray(getRestockSubscriptions(user?.id)) && getRestockSubscriptions(user?.id).length > 0;

    this.setState({
      fullName: storedProfile.fullName || user?.name || user?.fullName || '',
      phone: storedProfile.phone || user?.phone || '',
      place: storedProfile.place || user?.place || '',
      addresses,
      restockAlerts,
    });
  };

  handleChange = (field, value) => this.setState({ [field]: value });

  handleAddressSave = () => {
    const { user } = this.context || {};
    const trimmed = String(this.state.supplyAddress || '').trim();
    if (!trimmed) {
      toast.warning('Please enter a delivery address first.');
      return;
    }

    const next = [...this.state.addresses, { id: Date.now(), value: trimmed, default: this.state.addresses.length === 0 }];
    const saved = saveSavedAddresses(user?.id, next);
    this.setState({ addresses: saved, supplyAddress: '' });
    toast.success('Address saved to your profile.');
  };

  handleRemoveAddress = (id) => {
    const { user } = this.context || {};
    const next = this.state.addresses.filter((address) => address.id !== id);
    const saved = saveSavedAddresses(user?.id, next);
    this.setState({ addresses: saved });
  };

  handleSaveProfile = () => {
    const { user } = this.context || {};
    const cleanName = String(this.state.fullName || '').trim();
    const cleanPlace = String(this.state.place || '').trim();

    if (!cleanName || !cleanPlace) {
      toast.warning('Full name and place are required.');
      return;
    }

    this.setState({ saving: true });
    const profile = { fullName: cleanName, phone: this.state.phone || user?.phone || '', place: cleanPlace };
    saveCustomerProfile(user?.id, profile);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const nextUser = { ...storedUser, fullName: cleanName, name: cleanName, place: cleanPlace, phone: profile.phone };
    localStorage.setItem('user', JSON.stringify(nextUser));

    const userState = this.context;
    userState.user = nextUser;
    this.setState({ saving: false });
    toast.success('Profile updated successfully.');
  };

  toggleRestockAlerts = () => {
    const { user } = this.context || {};
    const next = this.state.restockAlerts ? [] : ['low_stock_daily'];
    saveRestockSubscriptions(user?.id, next);
    this.setState({ restockAlerts: next.length > 0 });
    toast.info(this.state.restockAlerts ? 'Restock alerts turned off.' : 'Restock alerts turned on.');
  };

  render() {
    const { user } = this.context || {};
    const { fullName, phone, place, supplyAddress, addresses, restockAlerts, saving } = this.state;

    return (
      <div>
        <PageHeader>
          <h1>👤 Customer Profile</h1>
          <p>Manage your personal details, saved addresses, and stock alerts.</p>
        </PageHeader>

        <div className="card shadow-sm border-0 mt-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name</label>
                <input className="form-control" value={fullName} onChange={(e) => this.handleChange('fullName', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone</label>
                <input className="form-control" value={phone} disabled />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold">Place</label>
                <input className="form-control" value={place} onChange={(e) => this.handleChange('place', e.target.value)} />
              </div>
            </div>

            <div className="mt-3 d-flex gap-2 flex-wrap">
              <PrimaryButton onClick={this.handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </PrimaryButton>
              <SecondaryButton onClick={this.syncFromAuth}>Reset</SecondaryButton>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">📍 Saved Addresses</h5>
            <div className="row g-2 align-items-end">
              <div className="col-md-10">
                <label className="form-label fw-semibold">Delivery Address</label>
                <input className="form-control" value={supplyAddress} onChange={(e) => this.handleChange('supplyAddress', e.target.value)} placeholder="Enter a delivery address" />
              </div>
              <div className="col-md-2">
                <PrimaryButton onClick={this.handleAddressSave}>Add</PrimaryButton>
              </div>
            </div>

            <div className="mt-3 d-flex flex-column gap-2">
              {addresses.length === 0 && <div className="text-muted">No saved addresses yet.</div>}
              {addresses.map((address) => (
                <div key={address.id} className="d-flex justify-content-between align-items-center border rounded p-2">
                  <span>{address.value}</span>
                  <DangerButton onClick={() => this.handleRemoveAddress(address.id)}>Remove</DangerButton>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0">🔔 Restock Notifications</h5>
              <small className="text-muted">Receive alerts when products you pick return to stock.</small>
            </div>
            <button className={`btn ${restockAlerts ? 'btn-success' : 'btn-outline-secondary'}`} onClick={this.toggleRestockAlerts}>
              {restockAlerts ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body">
            <h5 className="fw-bold mb-2">Account</h5>
            <div className="small text-muted">Signed in as: {user?.fullName || user?.name || 'Customer'}</div>
            <div className="small text-muted">Phone: {user?.phone || phone || 'Not available'}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default CustomerProfilePage;
