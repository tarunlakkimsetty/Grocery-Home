import React from 'react';
import { toast } from 'react-toastify';
import announcementService from '../services/announcementService';
import Spinner from '../components/Spinner';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState, ModalOverlay, ModalContent } from '../styledComponents/FormStyles';
import { PrimaryButton, SecondaryButton, DangerButton } from '../styledComponents/ButtonStyles';

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getDateInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const initialForm = {
    title: '',
    message: '',
    image: '',
    startDate: '',
    expiryDate: '',
    status: 'Active',
    actionText: '',
    actionLink: '',
};

class AdminAnnouncementsPage extends React.Component {
    state = {
        announcements: [],
        loading: true,
        saving: false,
        deletingId: null,
        showForm: false,
        editingId: null,
        form: { ...initialForm },
        errors: {},
    };

    componentDidMount() {
        this.loadAnnouncements();
    }

    loadAnnouncements = async () => {
        this.setState({ loading: true });
        try {
            const response = await announcementService.getAnnouncements();
            const announcements = Array.isArray(response?.data) ? response.data : [];
            this.setState({ announcements, loading: false });
        } catch (error) {
            console.error('Failed to load announcements:', error);
            toast.error(error?.message || 'Unable to load announcements.');
            this.setState({ loading: false });
        }
    };

    openAddForm = () => {
        this.setState({
            showForm: true,
            editingId: null,
            form: { ...initialForm },
            errors: {},
        });
    };

    openEditForm = (announcement) => {
        this.setState({
            showForm: true,
            editingId: announcement.id,
            form: {
                title: announcement.title || '',
                message: announcement.message || '',
                image: announcement.image || '',
                startDate: getDateInputValue(announcement.startDate),
                expiryDate: getDateInputValue(announcement.expiryDate),
                status: announcement.status === 'Inactive' ? 'Inactive' : 'Active',
                actionText: announcement.actionText || '',
                actionLink: announcement.actionLink || '',
            },
            errors: {},
        });
    };

    closeForm = () => {
        this.setState({ showForm: false, editingId: null, form: { ...initialForm }, errors: {} });
    };

    handleFieldChange = (field, value) => {
        this.setState((prevState) => ({
            form: { ...prevState.form, [field]: value },
            errors: { ...prevState.errors, [field]: undefined },
        }));
    };

    validateForm = () => {
        const { title, message, startDate, expiryDate } = this.state.form;
        const errors = {};
        if (!title || !title.trim()) errors.title = 'Title is required';
        if (!message || !message.trim()) errors.message = 'Message is required';
        if (!startDate) errors.startDate = 'Start date is required';
        if (!expiryDate) errors.expiryDate = 'Expiry date is required';

        if (startDate && expiryDate) {
            const start = new Date(startDate);
            const expiry = new Date(expiryDate);
            if (expiry < start) {
                errors.expiryDate = 'Expiry date cannot be before start date';
            }
        }

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };

    submitAnnouncement = async (event) => {
        event.preventDefault();
        if (!this.validateForm()) return;

        const { form, editingId } = this.state;
        const payload = {
            title: form.title.trim(),
            message: form.message.trim(),
            image: form.image ? form.image.trim() : null,
            startDate: form.startDate,
            expiryDate: form.expiryDate,
            status: form.status,
            actionText: form.actionText ? form.actionText.trim() : null,
            actionLink: form.actionLink ? form.actionLink.trim() : null,
        };

        try {
            this.setState({ saving: true });
            if (editingId) {
                await announcementService.updateAnnouncement(editingId, payload);
                toast.success('Announcement updated successfully');
            } else {
                await announcementService.createAnnouncement(payload);
                toast.success('Announcement created successfully');
            }
            this.closeForm();
            this.loadAnnouncements();
        } catch (error) {
            const responseErrors = Array.isArray(error?.response?.data?.errors) ? error.response.data.errors : [];
            const nextErrors = {};
            responseErrors.forEach((entry) => {
                nextErrors[entry.field] = entry.message;
            });
            this.setState({ errors: { ...this.state.errors, ...nextErrors } });
            toast.error(error?.message || 'Unable to save announcement.');
        } finally {
            this.setState({ saving: false });
        }
    };

    toggleStatus = async (announcement) => {
        const nextStatus = announcement.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await announcementService.toggleAnnouncementStatus(announcement.id, nextStatus);
            toast.success(`Announcement ${nextStatus === 'Active' ? 'activated' : 'deactivated'}`);
            this.loadAnnouncements();
        } catch (error) {
            toast.error(error?.message || 'Unable to update announcement status.');
        }
    };

    deleteAnnouncement = async (announcementId) => {
        const confirmed = window.confirm('Are you sure you want to delete this announcement?');
        if (!confirmed) return;

        try {
            this.setState({ deletingId: announcementId });
            await announcementService.deleteAnnouncement(announcementId);
            toast.success('Announcement deleted successfully');
            this.loadAnnouncements();
        } catch (error) {
            toast.error(error?.message || 'Unable to delete announcement.');
        } finally {
            this.setState({ deletingId: null });
        }
    };

    render() {
        const { announcements, loading, showForm, form, errors, editingId, saving, deletingId } = this.state;

        return (
            <div>
                <PageHeader>
                    <h1>📢 Announcement Management</h1>
                    <p>Control the banner shown to customers.</p>
                </PageHeader>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div />
                    <PrimaryButton type="button" onClick={this.openAddForm}>+ Add Announcement</PrimaryButton>
                </div>

                {loading ? (
                    <Spinner fullPage text="Loading announcements..." />
                ) : announcements.length === 0 ? (
                    <EmptyState>
                        <div className="empty-icon">📢</div>
                        <h3>No announcements yet.</h3>
                        <p>Create your first announcement for customers.</p>
                        <PrimaryButton type="button" onClick={this.openAddForm}>+ Create Your First Announcement</PrimaryButton>
                    </EmptyState>
                ) : (
                    <div className="row g-3">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="col-12 col-lg-6">
                                <div className="card h-100 border-0 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                                    <div className="card-body d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                            <div>
                                                <div className="fw-bold" style={{ fontSize: '1.05rem' }}>{announcement.title}</div>
                                                <div className="text-muted small">{announcement.status === 'Active' ? 'Active' : 'Inactive'}</div>
                                            </div>
                                            <span className={`badge ${announcement.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                                {announcement.status}
                                            </span>
                                        </div>

                                        <div style={{ whiteSpace: 'pre-wrap' }}>{announcement.message}</div>

                                        {announcement.image && (
                                            <img
                                                src={announcement.image}
                                                alt={announcement.title}
                                                style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }}
                                            />
                                        )}

                                        <div className="small text-muted">
                                            <div><strong>Start Date:</strong> {formatDate(announcement.startDate)}</div>
                                            <div><strong>Expiry Date:</strong> {formatDate(announcement.expiryDate)}</div>
                                            <div><strong>Created Date:</strong> {formatDate(announcement.createdAt)}</div>
                                            {announcement.actionText && <div><strong>Button:</strong> {announcement.actionText}</div>}
                                            {announcement.actionLink && <div><strong>Link:</strong> {announcement.actionLink}</div>}
                                        </div>

                                        <div className="mt-auto d-flex flex-wrap gap-2">
                                            <SecondaryButton type="button" onClick={() => this.openEditForm(announcement)}>✏️ Edit</SecondaryButton>
                                            <PrimaryButton type="button" onClick={() => this.toggleStatus(announcement)}>
                                                {announcement.status === 'Active' ? '🔴 Deactivate' : '🟢 Activate'}
                                            </PrimaryButton>
                                            <DangerButton type="button" disabled={deletingId === announcement.id} onClick={() => this.deleteAnnouncement(announcement.id)}>
                                                {deletingId === announcement.id ? 'Deleting...' : '🗑️ Delete'}
                                            </DangerButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showForm && (
                    <ModalOverlay onClick={this.closeForm}>
                        <ModalContent onClick={(event) => event.stopPropagation()} style={{ maxWidth: '700px' }}>
                            <div className="modal-header border-0 px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                                <h3 className="mb-0">{editingId ? 'Edit Announcement' : 'Add Announcement'}</h3>
                                <button type="button" className="btn-close" onClick={this.closeForm} aria-label="Close" />
                            </div>

                            <div className="modal-body p-4">
                                <form onSubmit={this.submitAnnouncement}>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Title</label>
                                            <input
                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                value={form.title}
                                                onChange={(event) => this.handleFieldChange('title', event.target.value)}
                                            />
                                            {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Message</label>
                                            <textarea
                                                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                                                rows="4"
                                                value={form.message}
                                                onChange={(event) => this.handleFieldChange('message', event.target.value)}
                                            />
                                            {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Optional Image/Banner URL</label>
                                            <input
                                                className="form-control"
                                                value={form.image}
                                                onChange={(event) => this.handleFieldChange('image', event.target.value)}
                                                placeholder="https://example.com/banner.jpg"
                                            />
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Start Date</label>
                                            <input
                                                type="datetime-local"
                                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                                value={form.startDate}
                                                onChange={(event) => this.handleFieldChange('startDate', event.target.value)}
                                            />
                                            {errors.startDate && <div className="invalid-feedback d-block">{errors.startDate}</div>}
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Expiry Date</label>
                                            <input
                                                type="datetime-local"
                                                className={`form-control ${errors.expiryDate ? 'is-invalid' : ''}`}
                                                value={form.expiryDate}
                                                onChange={(event) => this.handleFieldChange('expiryDate', event.target.value)}
                                            />
                                            {errors.expiryDate && <div className="invalid-feedback d-block">{errors.expiryDate}</div>}
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Status</label>
                                            <select
                                                className="form-select"
                                                value={form.status}
                                                onChange={(event) => this.handleFieldChange('status', event.target.value)}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Optional Action Button Text</label>
                                            <input
                                                className="form-control"
                                                value={form.actionText}
                                                onChange={(event) => this.handleFieldChange('actionText', event.target.value)}
                                                placeholder="View Offers"
                                            />
                                        </div>

                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Optional Action Link</label>
                                            <input
                                                className="form-control"
                                                value={form.actionLink}
                                                onChange={(event) => this.handleFieldChange('actionLink', event.target.value)}
                                                placeholder="/offers"
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <SecondaryButton type="button" onClick={this.closeForm}>Cancel</SecondaryButton>
                                        <PrimaryButton type="submit" disabled={saving}>
                                            {saving ? 'Saving...' : (editingId ? 'Save Announcement' : 'Save Announcement')}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </div>
        );
    }
}

export default AdminAnnouncementsPage;
