import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import LanguageContext from '../context/LanguageContext';
import listOrderService from '../services/listOrderService';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;

  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0;
    padding: 1rem 0.75rem;
  }

  @media (max-width: 576px) {
    padding: 1rem 0.5rem;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }

  &:disabled {
    background-color: #f5f5f5;
    color: #999;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }

  &:disabled {
    background-color: #f5f5f5;
    color: #999;
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;

  &:hover {
    border-color: #4CAF50;
    background-color: #f0f8f5;
  }

  &.dragover {
    border-color: #4CAF50;
    background-color: #e8f5e9;
  }

  input[type='file'] {
    display: none;
  }
`;

const ImagePreview = styled.div`
  margin-top: 1.5rem;

  .preview-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .remove-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;

      &:hover {
        background: rgba(244, 67, 54, 1);
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &.primary {
    background-color: #4CAF50;
    color: white;

    &:hover {
      background-color: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      transform: none;
    }
  }

  &.secondary {
    background-color: #f5f5f5;
    color: #2c3e50;
    border: 1px solid #ddd;

    &:hover {
      background-color: #e8e8e8;
    }
  }
`;

const SuccessMessage = styled.div`
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoBox = styled.div`
  background-color: #e7f3ff;
  border-left: 4px solid #2196F3;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  color: #0c5aa0;
  font-size: 0.95rem;
`;

const TabContainer = styled.div`
  border-bottom: 2px solid #ddd;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #7f8c8d;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;

  &:hover {
    color: #2c3e50;
  }

  ${props => props.$active && `
    color: #4CAF50;
    border-bottom-color: #4CAF50;
  `}
`;

const HistoryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const HistoryCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.75rem;
  }

  .card-title {
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }

  .card-date {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin: 0.25rem 0;
  }

  .card-details {
    font-size: 0.9rem;
    color: #555;
    margin: 0.75rem 0;

    p {
      margin: 0.25rem 0;

      strong {
        color: #2c3e50;
      }
    }
  }

  .card-images {
    margin-top: 1rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;

    .image-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;

      img {
        width: 100%;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .image-count {
      font-size: 0.85rem;
      color: #7f8c8d;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;

    &.pending {
      background-color: #fff3cd;
      color: #856404;
    }

    &.converted {
      background-color: #d4edda;
      color: #155724;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
`;

const Modal = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.92) !important;
  display: ${props => (props.$isOpen ? 'flex' : 'none')} !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999999 !important;
  padding: 15px !important;
  overflow: hidden !important;
  pointer-events: ${props => (props.$isOpen ? 'auto' : 'none')} !important;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 850px;
  height: auto;
  max-height: 88vh;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999998;
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  flex-shrink: 0;
  z-index: 9999998;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  gap: 1.2rem;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f3f4f6;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
    &:hover {
      background: #9ca3af;
    }
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  z-index: 9999997;

  img {
    max-width: 100%;
    max-height: 50vh;
    display: block;
    border-radius: 10px;
    object-fit: contain;
    background: #f3f4f6;
  }
`;

const ThumbnailRow = styled.div`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  padding: 0.5rem 0;
  z-index: 9999997;
`;

const Thumbnail = styled.img`
  width: 65px;
  height: 65px;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid ${props => (props.$isActive ? '#2563eb' : '#e5e7eb')};
  transition: all 0.2s;
  flex-shrink: 0;
  z-index: 9999997;

  &:hover {
    border-color: #2563eb;
    transform: scale(1.08);
  }
`;

const CloseButton = styled.button`
  position: relative;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  z-index: 9999999;

  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const NavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  font-size: 2rem;
  width: 45px;
  height: 45px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 9999999;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.prev {
    left: 8px;
  }

  &.next {
    right: 8px;
  }
`;


class ListOrdersUploadPage extends React.Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      customerName: '',
      phone: '',
      place: '',
      notes: '',
      selectedFiles: [],
      previewUrls: [],
      loading: false,
      uploadSuccess: false,
      dragOver: false,
      activeTab: 'upload', // 'upload' or 'history'
      previousUploads: [],
      historyLoading: false,
      modalOpen: false,
      selectedUploadId: null,
      selectedImageIndex: 0
    };
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    // Don't fetch on mount - wait for user to enter info and click History tab
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleFileSelect = (files) => {
    const validFiles = [];
    const newPreviewUrls = [...this.state.previewUrls];
    const newSelectedFiles = [...this.state.selectedFiles];

    for (let file of files) {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
        newSelectedFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
      }
    }

    if (validFiles.length === 0 && files.length > 0) {
      toast.error('Please select valid image files');
      return;
    }

    this.setState({
      selectedFiles: newSelectedFiles,
      previewUrls: newPreviewUrls
    });

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} image(s) added`);
    }
  }

  removeImage = (index) => {
    const newSelectedFiles = this.state.selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = this.state.previewUrls.filter((_, i) => i !== index);

    this.setState({
      selectedFiles: newSelectedFiles,
      previewUrls: newPreviewUrls
    });

    toast.info('Image removed');
  }

  handleDragOver = (e) => {
    e.preventDefault();
    this.setState({ dragOver: true });
  }

  handleDragLeave = () => {
    this.setState({ dragOver: false });
  }

  handleDrop = (e) => {
    e.preventDefault();
    this.setState({ dragOver: false });

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFileSelect(Array.from(files));
    }
  }

  handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      this.handleFileSelect(Array.from(files));
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { customerName, phone, place, selectedFiles, notes } = this.state;

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!phone.trim() || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!place.trim()) {
      toast.error('Please enter place/city');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one grocery list image');
      return;
    }

    this.setState({ loading: true });

    try {
      const response = await listOrderService.uploadGroceryList(
        customerName,
        phone,
        place,
        selectedFiles,
        notes
      );

      if (response.success) {
        toast.success('Grocery list(s) uploaded successfully!');
        
        this.setState({
          customerName: '',
          phone: '',
          place: '',
          notes: '',
          selectedFiles: [],
          previewUrls: [],
          uploadSuccess: true
        });

        // Refresh history
        this.fetchPreviousUploads();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.setState({ uploadSuccess: false });
        }, 5000);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload grocery list');
    } finally {
      this.setState({ loading: false });
    }
  }

  handleReset = () => {
    this.setState({
      customerName: '',
      phone: '',
      place: '',
      notes: '',
      selectedFiles: [],
      previewUrls: [],
      uploadSuccess: false
    });
    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = '';
    }
  }

  fetchPreviousUploads = async () => {
    this.setState({ historyLoading: true });
    try {
      // 🔒 SECURE: API uses JWT token to identify user
      // No need to pass customerName/phone - backend handles it
      const response = await listOrderService.getCustomerUploads();
      if (response && response.data) {
        this.setState({ previousUploads: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch previous uploads:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Please login to view your uploads');
      } else {
        toast.error('Failed to fetch uploads');
      }
    } finally {
      this.setState({ historyLoading: false });
    }
  }

  openImageModal = (uploadId, imageIndex) => {
    document.body.style.overflow = 'hidden';
    this.setState({
      modalOpen: true,
      selectedUploadId: uploadId,
      selectedImageIndex: imageIndex
    });
  }

  closeImageModal = () => {
    document.body.style.overflow = 'auto';
    this.setState({
      modalOpen: false,
      selectedUploadId: null,
      selectedImageIndex: 0
    });
  }

  nextImage = () => {
    const upload = this.state.previousUploads.find(
      (u) => u.id === this.state.selectedUploadId
    );
    if (!upload) return;

    const imagePaths = upload.imagePaths || [upload.imagePath];
    const nextIndex = (this.state.selectedImageIndex + 1) % imagePaths.length;
    this.setState({ selectedImageIndex: nextIndex });
  }

  prevImage = () => {
    const upload = this.state.previousUploads.find(
      (u) => u.id === this.state.selectedUploadId
    );
    if (!upload) return;

    const imagePaths = upload.imagePaths || [upload.imagePath];
    const prevIndex = (this.state.selectedImageIndex - 1 + imagePaths.length) % imagePaths.length;
    this.setState({ selectedImageIndex: prevIndex });
  }

  render() {
    const langCtx = this.context;
    const {
      customerName,
      phone,
      place,
      notes,
      selectedFiles,
      previewUrls,
      loading,
      uploadSuccess,
      dragOver,
      activeTab,
      previousUploads,
      historyLoading
    } = this.state;

    return (
      <Container>
        <Card>
          <Title>🛒 Upload Grocery List</Title>
          <Subtitle>
            Upload one or more photos of your grocery list and we'll help you manage your order
          </Subtitle>

          <TabContainer>
            <TabButton
              $active={activeTab === 'upload'}
              onClick={() => this.setState({ activeTab: 'upload' })}
            >
              📤 Upload
            </TabButton>
            <TabButton
              $active={activeTab === 'history'}
              onClick={() => {
                this.setState({ activeTab: 'history' });
                this.fetchPreviousUploads();
              }}
            >
              📋 History
            </TabButton>
          </TabContainer>

          {activeTab === 'upload' ? (
            <>
              {uploadSuccess && (
                <SuccessMessage>
                  ✓ Your grocery list(s) have been submitted successfully! Our team will review them soon.
                </SuccessMessage>
              )}

              <InfoBox>
                📸 Upload clear photos of your grocery list. You can upload multiple images. Include items, quantities, and any special preferences.
              </InfoBox>

              <form onSubmit={this.handleSubmit}>
                <FormGroup>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={customerName}
                    onChange={this.handleInputChange}
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={this.handleInputChange}
                    placeholder="Enter your phone number"
                    disabled={loading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="place">Place / City *</Label>
                  <Input
                    type="text"
                    id="place"
                    name="place"
                    value={place}
                    onChange={this.handleInputChange}
                    placeholder="Enter your place or city"
                    disabled={loading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Grocery List Images * ({selectedFiles.length} selected)</Label>
                  <ImageUploadArea
                    className={dragOver ? 'dragover' : ''}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    onDrop={this.handleDrop}
                    onClick={() => this.fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📸</div>
                    <p style={{ margin: '0.5rem 0', fontWeight: '600', color: '#2c3e50' }}>
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} image(s) selected. Click to add more or drag and drop`
                        : 'Click to upload or drag and drop'}
                    </p>
                    <p style={{ margin: '0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      PNG, JPG, GIF or WebP (Max 10MB per image)
                    </p>
                    <input
                      ref={this.fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={this.handleFileInputChange}
                      disabled={loading}
                    />
                  </ImageUploadArea>

                  {previewUrls.length > 0 && (
                    <ImagePreview>
                      <div className="preview-gallery">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="preview-item">
                            <img src={url} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => this.removeImage(index)}
                              disabled={loading}
                              title="Remove this image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </ImagePreview>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <TextArea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={this.handleInputChange}
                    placeholder="Add any special requests or notes..."
                    disabled={loading}
                  />
                </FormGroup>

                <ButtonGroup>
                  <Button
                    type="submit"
                    className="primary"
                    disabled={loading || selectedFiles.length === 0}
                  >
                    {loading ? 'Uploading...' : `📤 Upload ${selectedFiles.length} Image(s)`}
                  </Button>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={this.handleReset}
                    disabled={loading}
                  >
                    Clear Form
                  </Button>
                </ButtonGroup>
              </form>
            </>
          ) : (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>📋 Your Upload History</h3>
              {historyLoading ? (
                <EmptyState>
                  <div style={{ color: '#4CAF50', fontSize: '2rem' }}>⏳</div>
                  <p>Loading your history...</p>
                </EmptyState>
              ) : previousUploads.length === 0 ? (
                <EmptyState>
                  <div className="icon">📭</div>
                  <p>No uploads yet. Start by uploading your first grocery list!</p>
                </EmptyState>
              ) : (
                <HistoryContainer>
                  {previousUploads.map((upload) => {
                    const imagePaths = upload.imagePaths || 
                                      (upload.imagePath ? [upload.imagePath] : []);
                    const uploadDate = new Date(upload.createdAt);

                    return (
                      <HistoryCard key={upload.id}>
                        <div className="card-header">
                          <div>
                            <p className="card-title">Upload #{upload.id}</p>
                            <p className="card-date">
                              {uploadDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`status-badge ${upload.status}`}>
                            {upload.status}
                          </span>
                        </div>

                        <div className="card-details">
                          <p><strong>Location:</strong> {upload.place || 'N/A'}</p>
                          <p><strong>Phone:</strong> {upload.phone}</p>
                          {upload.notes && (
                            <p><strong>Notes:</strong> {upload.notes.substring(0, 100)}...</p>
                          )}
                        </div>

                        <div className="card-images">
                          <p className="image-count">📸 {imagePaths.length} image(s)</p>
                          <div className="image-grid">
                            {imagePaths.slice(0, 3).map((imagePath, idx) => (
                              <img
                                key={idx}
                                src={
                                  imagePath.startsWith('http')
                                    ? imagePath
                                    : `http://localhost:5000${imagePath}`
                                }
                                alt={`Upload ${upload.id} Image ${idx + 1}`}
                                onClick={() => this.openImageModal(upload.id, idx)}
                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                title="Click to view full size"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                }}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E';
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </HistoryCard>
                    );
                  })}
                </HistoryContainer>
              )}
            </div>
          )}
        </Card>

        {/* Image Modal - Rendered as Portal at Document Root */}
        {ReactDOM.createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999999, pointerEvents: this.state.modalOpen ? 'auto' : 'none' }}>
            <Modal $isOpen={this.state.modalOpen} onClick={this.closeImageModal}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                {this.state.selectedUploadId && (() => {
                  const upload = this.state.previousUploads.find(
                    (u) => u.id === this.state.selectedUploadId
                  );
                  if (!upload) return null;

                  const imagePaths = upload.imagePaths || [upload.imagePath];
                  const currentImage = imagePaths[this.state.selectedImageIndex];

                  return (
                    <>
                      {/* Header */}
                      <ModalHeader>
                        <ModalTitle>📸 Image Preview</ModalTitle>
                        <CloseButton onClick={this.closeImageModal}>×</CloseButton>
                      </ModalHeader>

                      {/* Body */}
                      <ModalBody>
                        {/* Main Image */}
                        <ImageWrapper>
                          {imagePaths.length > 1 && (
                            <>
                              <NavigationButton
                                className="prev"
                                onClick={this.prevImage}
                                disabled={this.state.selectedImageIndex === 0}
                              >
                                ‹
                              </NavigationButton>
                              <NavigationButton
                                className="next"
                                onClick={this.nextImage}
                                disabled={this.state.selectedImageIndex === imagePaths.length - 1}
                              >
                                ›
                              </NavigationButton>
                            </>
                          )}
                          <img
                            src={
                              currentImage.startsWith('http')
                                ? currentImage
                                : `http://localhost:5000${currentImage}`
                            }
                            alt={`Image ${this.state.selectedImageIndex + 1}`}
                          />
                        </ImageWrapper>

                        {/* Image Counter */}
                        {imagePaths.length > 1 && (
                          <div style={{ fontSize: '0.95rem', color: '#666', fontWeight: '500' }}>
                            {this.state.selectedImageIndex + 1} of {imagePaths.length}
                          </div>
                        )}

                        {/* Thumbnails */}
                        {imagePaths.length > 1 && (
                          <ThumbnailRow>
                            {imagePaths.map((path, idx) => (
                              <Thumbnail
                                key={idx}
                                src={
                                  path.startsWith('http')
                                    ? path
                                    : `http://localhost:5000${path}`
                                }
                                alt={`Thumbnail ${idx + 1}`}
                                $isActive={idx === this.state.selectedImageIndex}
                                onClick={() => this.setState({ selectedImageIndex: idx })}
                              />
                            ))}
                          </ThumbnailRow>
                        )}
                      </ModalBody>
                    </>
                  );
                })()}
              </ModalContent>
            </Modal>
          </div>,
          document.body
        )}
      </Container>
    );
  }
}

export default ListOrdersUploadPage;
