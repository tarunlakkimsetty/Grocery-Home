import React, { useState } from 'react';
import styled from 'styled-components';
import { processBillImage } from '../utils/ocrBillScanner';
import { toast } from 'react-toastify';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 8px;
    padding: 2rem;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    @media (max-width: 768px) {
        padding: 1rem;
        max-width: 95vw;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;

    h4 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #212529;
    }

    button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;

        &:hover {
            color: #212529;
        }
    }
`;

const UploadArea = styled.div`
    border: 2px dashed #0d6efd;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f8f9fa;

    &:hover {
        background: #e7f1ff;
        border-color: #0a58ca;
    }

    &.dragging {
        background: #cfe2ff;
        border-color: #0a58ca;
    }

    p {
        margin: 0.5rem 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .upload-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
`;

const ImagePreview = styled.div`
    margin-bottom: 1.5rem;
    text-align: center;

    img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
`;

const DetectedItemsContainer = styled.div`
    margin-bottom: 1.5rem;
`;

const DetectedItemCard = styled.div`
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    .item-details {
        flex: 1;

        .item-name {
            font-weight: 600;
            color: #212529;
            margin-bottom: 0.25rem;
        }

        .item-meta {
            font-size: 0.85rem;
            color: #6c757d;
            display: flex;
            gap: 1rem;

            span {
                display: flex;
                align-items: center;
                gap: 0.3rem;
            }
        }
    }

    .item-actions {
        display: flex;
        gap: 0.5rem;
    }

    button {
        background: none;
        border: 1px solid #dee2e6;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s ease;

        &:hover {
            background: #e9ecef;
            border-color: #adb5bd;
        }

        &.btn-remove {
            color: #dc3545;

            &:hover {
                background: #f8d7da;
                border-color: #f5c6cb;
            }
        }
    }
`;

const LoadingSpinner = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1rem 0;

    .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #0d6efd;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;

    button {
        padding: 0.5rem 1.5rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;
        font-size: 0.9rem;

        &.btn-cancel {
            background: white;
            color: #6c757d;

            &:hover {
                background: #e9ecef;
            }
        }

        &.btn-confirm {
            background: #0d6efd;
            color: white;
            border-color: #0d6efd;

            &:hover {
                background: #0a58ca;
                border-color: #0a58ca;
            }

            &:disabled {
                background: #ccc;
                border-color: #ccc;
                cursor: not-allowed;
            }
        }
    }
`;

const CustomerDetailsSection = styled.div`
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 1.5rem;

    h6 {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #495057;
        margin-bottom: 1rem;
    }

    .detail-field {
        margin-bottom: 0.75rem;

        label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #6c757d;
            display: block;
            margin-bottom: 0.3rem;
        }

        input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 0.9rem;

            &:focus {
                outline: none;
                border-color: #0d6efd;
                box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
            }
        }

        .empty-value {
            color: #6c757d;
            font-style: italic;
        }
    }
`;

const BillScannerModal = ({ isOpen, onClose, products, onConfirm, langCtx }) => {
    // eslint-disable-next-line no-unused-vars
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [detectedData, setDetectedData] = useState(null);
    const [editedData, setEditedData] = useState(null);

    if (!isOpen) return null;

    const handleImageSelect = async (file) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);

        // Auto-process the image
        await processImage(file);
    };

    const handleDragDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleImageSelect(file);
    };

    const processImage = async (file) => {
        setLoading(true);
        try {
            const result = await processBillImage(file); // No products parameter - creates custom products
            if (result.success) {
                // Check if anything was detected
                const hasCustomerDetails = result.customerDetails.phone || result.customerDetails.name || result.customerDetails.place;
                const hasProducts = result.detectedProducts && result.detectedProducts.length > 0;
                
                if (!hasCustomerDetails && !hasProducts) {
                    // Nothing detected, but OCR succeeded
                    toast.warning('⚠️ OCR succeeded but could not identify products or customer details. Please enter manually.');
                } else {
                    // Something was detected
                    const detectedCount = result.detectedProducts.length;
                    toast.success(`✓ Bill scanned! Detected ${detectedCount} product(s).`);
                }
                
                setDetectedData(result);
                setEditedData({
                    customerDetails: { ...result.customerDetails },
                    detectedProducts: result.detectedProducts.map(p => ({ ...p })),
                });
                setScanned(true);
            } else {
                toast.error(result.error || 'Unable to extract text from image. Try:\n• Better lighting\n• Straight angle\n• Clear handwriting');
            }
        } catch (error) {
            toast.error('Error processing image: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProduct = (index) => {
        setEditedData({
            ...editedData,
            detectedProducts: editedData.detectedProducts.filter((_, i) => i !== index),
        });
    };

    const handleEditCustomerDetail = (field, value) => {
        setEditedData({
            ...editedData,
            customerDetails: {
                ...editedData.customerDetails,
                [field]: value,
            },
        });
    };

    const handleEditProductQty = (index, quantity) => {
        const updated = [...editedData.detectedProducts];
        const qty = parseFloat(quantity) || 0;
        if (qty > 0) {
            updated[index].quantity = qty;
            updated[index].total = qty * updated[index].price;
        }
        setEditedData({ ...editedData, detectedProducts: updated });
    };

    const handleConfirm = () => {
        onConfirm(editedData);
        handleClose();
    };

    const handleClose = () => {
        setImageFile(null);
        setImagePreview(null);
        setLoading(false);
        setScanned(false);
        setDetectedData(null);
        setEditedData(null);
        onClose();
    };

    return (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <ModalContent>
                <ModalHeader>
                    <h4>📸 Scan Bill / Upload Image</h4>
                    <button onClick={handleClose}>×</button>
                </ModalHeader>

                {!scanned ? (
                    <div>
                        <UploadArea
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('dragging');
                            }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('dragging')}
                            onDrop={handleDragDrop}
                            onClick={() => document.getElementById('bill-upload-input').click()}
                        >
                            <div className="upload-icon">📷</div>
                            <p><strong>Drag & drop bill image here</strong></p>
                            <p>or click to select file</p>
                            <input
                                id="bill-upload-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                            />
                        </UploadArea>

                        <div style={{ 
                            background: '#e7f5ff', 
                            border: '1px solid #74c0fc', 
                            borderRadius: '6px', 
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                            color: '#0b5394'
                        }}>
                            <strong>📌 Tips for better OCR results:</strong>
                            <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
                                <li>Use good lighting (avoid shadows)</li>
                                <li>Hold camera at a straight angle</li>
                                <li>Ensure text is clear and readable</li>
                                <li>Works with English and Telugu text</li>
                            </ul>
                        </div>

                        {imagePreview && (
                            <div>
                                <ImagePreview>
                                    <img src={imagePreview} alt="Bill preview" />
                                </ImagePreview>
                                {loading && (
                                    <LoadingSpinner>
                                        <div className="spinner"></div>
                                        <span>Processing image with OCR...<br/><small>(This may take 10-30 seconds)</small></span>
                                    </LoadingSpinner>
                                )}
                            </div>
                        )}
                    </div>
                ) : editedData ? (
                    <div>
                        <CustomerDetailsSection>
                            <h6>👤 Customer Details (Detected)</h6>
                            <div className="detail-field">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={editedData.customerDetails.name || ''}
                                    onChange={(e) => handleEditCustomerDetail('name', e.target.value)}
                                    placeholder="Not detected - enter manually"
                                />
                            </div>
                            <div className="detail-field">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={editedData.customerDetails.phone || ''}
                                    onChange={(e) => handleEditCustomerDetail('phone', e.target.value)}
                                    placeholder="Not detected - enter manually"
                                />
                            </div>
                            <div className="detail-field">
                                <label>Place</label>
                                <input
                                    type="text"
                                    value={editedData.customerDetails.place || ''}
                                    onChange={(e) => handleEditCustomerDetail('place', e.target.value)}
                                    placeholder="Not detected - enter manually"
                                />
                            </div>
                        </CustomerDetailsSection>

                        <DetectedItemsContainer>
                            <h6 style={{ marginBottom: '1rem', fontWeight: '700', fontSize: '0.95rem' }}>
                                🛒 Detected Products ({editedData.detectedProducts.length})
                            </h6>
                            {editedData.detectedProducts.length > 0 ? (
                                editedData.detectedProducts.map((item, index) => (
                                    <DetectedItemCard key={index}>
                                        <div className="item-details">
                                            <div className="item-name">{item.name}</div>
                                            <div className="item-meta">
                                                <span>💰 ₹{item.price || 0}</span>
                                                {item.unit && <span>📏 {item.quantity}{item.unit}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="0.1"
                                                value={item.quantity}
                                                onChange={(e) => handleEditProductQty(index, e.target.value)}
                                                style={{
                                                    width: '70px',
                                                    padding: '0.4rem',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600' }}>
                                                ₹{item.total?.toFixed(2) || 0}
                                            </span>
                                            <button
                                                className="btn-remove"
                                                onClick={() => handleRemoveProduct(index)}
                                            >
                                                🗑️ Remove
                                            </button>
                                        </div>
                                    </DetectedItemCard>
                                ))
                            ) : (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                                    No products detected. Please enter manually or try another image.
                                </div>
                            )}
                        </DetectedItemsContainer>

                        <ActionButtons>
                            <button className="btn-cancel" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleConfirm}
                                disabled={!editedData.customerDetails.phone && editedData.detectedProducts.length === 0}
                            >
                                ✓ Use Detected Data
                            </button>
                        </ActionButtons>
                    </div>
                ) : null}
            </ModalContent>
        </ModalOverlay>
    );
};

export default BillScannerModal;
