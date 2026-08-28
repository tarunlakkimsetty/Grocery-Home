import React from 'react';
import { toast } from 'react-toastify';
import orderAvailabilityService from '../services/orderAvailabilityService';
import Spinner from '../components/Spinner';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { PrimaryButton, SecondaryButton } from '../styledComponents/ButtonStyles';

class AdminOrderAvailabilityPage extends React.Component {
  state = {
    loading: true,
    saving: false,
    onlineOrdersEnabled: true,
    listOrdersEnabled: true,
  };

  componentDidMount() {
    this.loadSettings();
  }

  loadSettings = async () => {
    this.setState({ loading: true });
    try {
      const response = await orderAvailabilityService.getSettings();
      const settings = response?.data || {};
      this.setState({
        onlineOrdersEnabled: settings.onlineOrdersEnabled !== undefined ? Boolean(settings.onlineOrdersEnabled) : true,
        listOrdersEnabled: settings.listOrdersEnabled !== undefined ? Boolean(settings.listOrdersEnabled) : true,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load order availability settings:', error);
      toast.error(error?.message || 'Unable to load order availability settings.');
      this.setState({ loading: false });
    }
  };

  handleToggle = (key) => {
    this.setState((prevState) => ({
      [key]: !prevState[key],
    }));
  };

  saveSettings = async () => {
    this.setState({ saving: true });
    try {
      const payload = {
        onlineOrdersEnabled: this.state.onlineOrdersEnabled,
        listOrdersEnabled: this.state.listOrdersEnabled,
      };
      await orderAvailabilityService.updateSettings(payload);
      toast.success('Order availability updated successfully');
    } catch (error) {
      toast.error(error?.message || 'Unable to update order availability settings.');
    } finally {
      this.setState({ saving: false });
    }
  };

  render() {
    const { loading, saving, onlineOrdersEnabled, listOrdersEnabled } = this.state;

    return (
      <div>
        <PageHeader>
          <h1>⚙️ Order Availability</h1>
          <p>Control whether customers can place online orders and upload grocery list orders.</p>
        </PageHeader>

        {loading ? (
          <Spinner fullPage text="Loading settings..." />
        ) : (
          <div className="card shadow-sm border-0" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex flex-column gap-4">
                <div className="d-flex justify-content-between align-items-center border rounded p-3">
                  <div>
                    <h5 className="mb-1">Online Orders</h5>
                    <small className="text-muted">Allow customers to place online grocery orders.</small>
                  </div>
                  <div className="form-check form-switch ms-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={onlineOrdersEnabled}
                      onChange={() => this.handleToggle('onlineOrdersEnabled')}
                      style={{ width: '3rem', height: '1.6rem' }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center border rounded p-3">
                  <div>
                    <h5 className="mb-1">List Orders</h5>
                    <small className="text-muted">Allow customers to upload grocery list images for order conversion.</small>
                  </div>
                  <div className="form-check form-switch ms-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={listOrdersEnabled}
                      onChange={() => this.handleToggle('listOrdersEnabled')}
                      style={{ width: '3rem', height: '1.6rem' }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-2">
                  <SecondaryButton type="button" onClick={this.loadSettings} disabled={saving}>
                    Refresh
                  </SecondaryButton>
                  <PrimaryButton type="button" onClick={this.saveSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AdminOrderAvailabilityPage;
