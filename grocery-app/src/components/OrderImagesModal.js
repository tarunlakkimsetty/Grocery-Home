import React, { useEffect, useMemo, useRef, useState } from 'react';
import orderImageService from '../services/orderImageService';
import { ModalOverlay, ModalContent, Badge, EmptyState } from '../styledComponents/FormStyles';
import { toast } from 'react-toastify';
import { resolveBackendUrl } from '../utils/backendUrl';

const resolveImageUrl = (value) => resolveBackendUrl(value);

const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const uniqById = (items) => {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
        if (item && item.id != null) {
            map.set(item.id, item);
        }
    });
    return Array.from(map.values());
};

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const uniqFiles = (items) => {
    const map = new Map();
    (Array.isArray(items) ? items : []).forEach((file) => {
        if (file) {
            map.set(fileKey(file), file);
        }
    });
    return Array.from(map.values());
};

const sortImagesByNewest = (items) => [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.uploadedAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.uploadedAt || 0).getTime();
    return rightTime - leftTime;
});

const OrderImagesModal = ({
    open,
    onClose,
    entityType,
    entityId,
    title,
    allowUpload = false,
    orderType,
}) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewState, setPreviewState] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedPreviews, setSelectedPreviews] = useState([]);
    const [brokenImageIds, setBrokenImageIds] = useState(() => new Set());
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const loadedKeyRef = useRef('');

    const entityKey = useMemo(() => {
        if (!entityType || !entityId) return '';
        return `${String(entityType)}:${String(entityId)}`;
    }, [entityType, entityId]);

    useEffect(() => {
        if (!open || !entityType || !entityId) {
            setImages([]);
            setLoading(false);
            setUploading(false);
            setError('');
            setPreviewState(null);
            setSelectedFiles([]);
            setSelectedPreviews([]);
            setBrokenImageIds(new Set());
            loadedKeyRef.current = '';
            return undefined;
        }

        if (loadedKeyRef.current === entityKey) {
            return undefined;
        }

        let cancelled = false;

        const loadImages = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await orderImageService.getOrderImages({ entityType, entityId });
                const list = sortImagesByNewest(Array.isArray(response?.data) ? response.data : []);
                if (!cancelled) {
                    setImages(list);
                    loadedKeyRef.current = entityKey;
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load images');
                    setImages([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadImages();

        return () => {
            cancelled = true;
        };
    }, [open, entityType, entityId, entityKey]);

    useEffect(() => {
        if (selectedFiles.length === 0) {
            setSelectedPreviews([]);
            return undefined;
        }

        const nextPreviews = selectedFiles.map((file) => ({
            id: `local-${fileKey(file)}`,
            imageUrl: URL.createObjectURL(file),
            originalName: file.name,
            isLocal: true,
        }));

        setSelectedPreviews(nextPreviews);

        return () => {
            nextPreviews.forEach((item) => URL.revokeObjectURL(item.imageUrl));
        };
    }, [selectedFiles]);

    useEffect(() => {
        if (!previewState) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setPreviewState(null);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [previewState]);

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []).filter((file) => file && file.type.startsWith('image/'));
        if (files.length === 0) {
            event.target.value = '';
            return;
        }

        setSelectedFiles((current) => uniqFiles([...current, ...files]));
        event.target.value = '';
    };

    const handleUpload = async () => {
        if (!allowUpload) return;
        if (!selectedFiles.length) {
            toast.info('Select at least one image first');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const response = await orderImageService.uploadOrderImages({
                entityType,
                entityId,
                orderType,
                files: selectedFiles,
            });

            const uploaded = Array.isArray(response?.data) ? response.data : [];
            if (uploaded.length > 0) {
                setImages((current) => sortImagesByNewest(uniqById([...uploaded, ...current])));
            }
            await (async () => {
                const refreshed = await orderImageService.getOrderImages({ entityType, entityId });
                const list = sortImagesByNewest(Array.isArray(refreshed?.data) ? refreshed.data : []);
                setImages(list);
            })();
            setSelectedFiles([]);
            setSelectedPreviews([]);
            toast.success(response?.message || 'Images uploaded successfully');
        } catch (err) {
            const message = err?.message || 'Failed to upload images';
            setError(message);
            toast.error(message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (imageId) => {
        if (!allowUpload) return;
        const shouldDelete = window.confirm('Delete this image?');
        if (!shouldDelete) return;

        try {
            await orderImageService.deleteOrderImage(imageId);
            setImages((current) => current.filter((image) => image.id !== imageId));
            toast.success('Image deleted');
        } catch (err) {
            toast.error(err?.message || 'Failed to delete image');
        }
    };

    const imageCount = images.length;
    const markBrokenImage = (imageId) => {
        setBrokenImageIds((current) => {
            const next = new Set(current);
            if (imageId != null) next.add(imageId);
            return next;
        });
    };

    const openLightbox = (items, index = 0) => {
        const safeItems = Array.isArray(items) ? items : [];
        if (safeItems.length === 0) return;
        setPreviewState({ items: safeItems, index });
    };

    const closeLightbox = () => setPreviewState(null);

    const showPrevious = () => {
        if (!previewState?.items?.length) return;
        setPreviewState((current) => {
            if (!current?.items?.length) return current;
            const nextIndex = (current.index - 1 + current.items.length) % current.items.length;
            return { ...current, index: nextIndex };
        });
    };

    const showNext = () => {
        if (!previewState?.items?.length) return;
        setPreviewState((current) => {
            if (!current?.items?.length) return current;
            const nextIndex = (current.index + 1) % current.items.length;
            return { ...current, index: nextIndex };
        });
    };

    if (!open) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent style={{ maxWidth: '1100px', width: '100%' }} onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        🖼️ {title || 'Order Images'}
                        <Badge className="badge-info">{imageCount} {imageCount === 1 ? 'image' : 'images'}</Badge>
                    </h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="modal-body" style={{ background: '#f8fafb' }}>
                    {loading && (
                        <div className="d-flex justify-content-center align-items-center py-4">
                            <div className="spinner-border text-success" role="status" aria-label="Loading images" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="alert alert-warning mb-3">{error}</div>
                    )}

                    {!loading && !error && images.length === 0 && (
                        <EmptyState style={{ padding: '1.5rem 1rem' }}>
                            <div className="empty-icon">🖼️</div>
                            <h3>No images uploaded yet</h3>
                            <p>Images added by admin will appear here.</p>
                        </EmptyState>
                    )}

                    {!loading && images.length > 0 && (
                        <div style={{ marginBottom: allowUpload ? '1.25rem' : 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#24303f', marginBottom: '0.75rem' }}>
                                Uploaded Images
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                                gap: '0.9rem',
                            }}>
                                {images.map((image) => {
                                    const imageUrl = resolveImageUrl(image.publicUrl || image.imageUrl || image.imagePath || image.url || '');
                                    const isBroken = brokenImageIds.has(image.id);
                                    return (
                                        <div key={image.id} style={{ position: 'relative' }}>
                                            <button
                                                type="button"
                                                onClick={() => openLightbox(images, images.findIndex((item) => item.id === image.id))}
                                                style={{
                                                    width: '100%',
                                                    border: '1px solid #e9ecef',
                                                    borderRadius: '14px',
                                                    overflow: 'hidden',
                                                    background: 'white',
                                                    padding: 0,
                                                    textAlign: 'left',
                                                    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                                                }}
                                            >
                                                <div style={{ aspectRatio: '1 / 1', background: '#edf2f7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {isBroken ? (
                                                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                                                            <div style={{ fontSize: '2rem', lineHeight: 1 }}>🖼️</div>
                                                            <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>Image unavailable</div>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={imageUrl}
                                                            alt={image.originalName || `Order image ${image.id}`}
                                                            loading="lazy"
                                                            onError={() => markBrokenImage(image.id)}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                        />
                                                    )}
                                                </div>
                                                <div style={{ padding: '0.8rem 0.85rem 0.9rem' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#24303f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {image.originalName || `Image #${image.id}`}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                        Uploaded {formatDate(image.createdAt || image.uploadedAt)}
                                                    </div>
                                                    {image.uploadedByName && (
                                                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.2rem' }}>
                                                            By {image.uploadedByName}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>

                                            {allowUpload && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(image.id)}
                                                    className="btn btn-sm btn-danger"
                                                    style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', boxShadow: '0 8px 18px rgba(0,0,0,0.18)' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!loading && selectedPreviews.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#24303f', marginBottom: '0.75rem' }}>
                                Selected Images
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                                gap: '0.9rem',
                            }}>
                                {selectedPreviews.map((item, index) => (
                                    <div key={item.id} style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={() => openLightbox(selectedPreviews, index)}
                                            style={{
                                                width: '100%',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '14px',
                                                overflow: 'hidden',
                                                background: 'white',
                                                padding: 0,
                                                textAlign: 'left',
                                                boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                                            }}
                                        >
                                            <div style={{ aspectRatio: '1 / 1', background: '#edf2f7', overflow: 'hidden' }}>
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.originalName}
                                                    loading="lazy"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                            </div>
                                            <div style={{ padding: '0.8rem 0.85rem 0.9rem' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#24303f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.originalName}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                    Ready to upload
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {allowUpload && (
                        <div style={{
                            background: 'white',
                            border: '1px solid #e9ecef',
                            borderRadius: '14px',
                            padding: '1rem',
                            boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
                        }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '0.75rem', marginBottom: '0.9rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#24303f' }}>Upload Images</div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Use gallery or mobile camera. Multiple images are supported.</div>
                                </div>
                                <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => galleryInputRef.current?.click()}>
                                        Choose from gallery
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => cameraInputRef.current?.click()}>
                                        Capture from camera
                                    </button>
                                </div>
                            </div>

                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFilesSelected}
                                style={{ display: 'none' }}
                            />
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                onChange={handleFilesSelected}
                                style={{ display: 'none' }}
                            />

                            {selectedPreviews.length > 0 && (
                                <div style={{ marginTop: '0.9rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                                        Selected previews
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
                                        {selectedPreviews.map((item, index) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => openLightbox(selectedPreviews, index)}
                                                style={{
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    background: '#fff',
                                                    padding: 0,
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <div style={{ aspectRatio: '1 / 1', background: '#edf2f7', overflow: 'hidden' }}>
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.originalName}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                </div>
                                                <div style={{ padding: '0.45rem 0.5rem 0.55rem', fontSize: '0.7rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.originalName}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-end" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-primary btn-sm" onClick={handleUpload} disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload Images'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>

                {previewState?.items?.length > 0 && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={closeLightbox}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1200,
                            background: 'rgba(15, 23, 42, 0.88)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                        }}
                    >
                        <div onClick={(event) => event.stopPropagation()} style={{ maxWidth: 'min(94vw, 1100px)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', gap: '1rem' }}>
                                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {previewState.items[previewState.index]?.originalName || `Image #${previewState.items[previewState.index]?.id}`}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {previewState.items.length > 1 && (
                                        <>
                                            <button type="button" className="btn btn-light btn-sm" onClick={showPrevious}>Previous</button>
                                            <button type="button" className="btn btn-light btn-sm" onClick={showNext}>Next</button>
                                        </>
                                    )}
                                    <button type="button" className="btn btn-light btn-sm" onClick={closeLightbox}>
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.35)', maxHeight: '84vh' }}>
                                <img
                                    src={resolveImageUrl(previewState.items[previewState.index]?.publicUrl || previewState.items[previewState.index]?.imageUrl || previewState.items[previewState.index]?.imagePath || previewState.items[previewState.index]?.url || '')}
                                    alt={previewState.items[previewState.index]?.originalName || `Image ${previewState.items[previewState.index]?.id}`}
                                    style={{ display: 'block', width: '100%', maxHeight: '84vh', objectFit: 'contain', background: '#111827' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default OrderImagesModal;