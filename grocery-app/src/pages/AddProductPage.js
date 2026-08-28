import React from 'react';
import productService from '../services/productService';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { FormWrapper } from '../styledComponents/FormStyles';
import { PrimaryButton, SecondaryButton } from '../styledComponents/ButtonStyles';
import { calculatePricing } from '../utils/pricing';

const CATEGORIES = [
    { value: 'grains', label: 'Grains, Rice & Pulses' },
    { value: 'milk', label: 'Milk & Dairy' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'spices', label: 'Spices' },
    { value: 'oils', label: 'Oils' },
    { value: 'condiments', label: 'Condiments' },
    { value: 'cleaning', label: 'Cleaning Supplies' },
    { value: 'personal', label: 'Personal Care & Hygiene' },
];

const CATEGORY_EMOJIS = {
    'grains': '🌾',
    'milk': '🥛',
    'snacks': '🍿',
    'spices': '🌶️',
    'oils': '🛢️',
    'condiments': '🍯',
    'cleaning': '🧼',
    'personal': '🧴',
};

const UNIT_OPTIONS = [
    'Kg',
    'Gram (g)',
    'Litre',
    'Bottle',
    'Piece',
    'Pack',
    'Tin',
    'Bag (Basta)',
    'Jar',
    'Tube',
    'Can',
    'Cup',
    'Other',
];

class AddProductPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            category: 'grains',
            originalPrice: '',
            discountedPrice: '',
            stock: '',
            unit: 'Pack',
            customUnit: '',
            emoji: CATEGORY_EMOJIS['grains'] || '📦',
            errors: {},
            loading: false,
            success: false,
            freeItemName: '',
            freeItemQuantity: '',
            freeItemUnit: '',
            freeItemDescription: '',
            freeItemActive: false,
        };
    }

    validate = () => {
        const errors = {};
        const { name, category, originalPrice, discountedPrice, stock, unit, customUnit } = this.state;

        // Name validation: 2-100 characters
        if (!name || !name.trim()) {
            errors.name = 'Product name is required';
        } else if (name.trim().length < 2) {
            errors.name = 'Product name must be at least 2 characters';
        } else if (name.trim().length > 100) {
            errors.name = 'Product name cannot exceed 100 characters';
        }

        // Category validation
        if (!category || !category.trim()) {
            errors.category = 'Category is required';
        }

        // Price validation: must be >= 1
        const originalNum = Number(originalPrice);
        const discountedNum = Number(discountedPrice);
        if (originalPrice === '' || !Number.isFinite(originalNum) || originalNum <= 0) {
            errors.originalPrice = 'Original price must be greater than 0';
        }
        if (discountedPrice === '' || !Number.isFinite(discountedNum) || discountedNum <= 0) {
            errors.discountedPrice = 'Discounted price must be greater than 0';
        } else if (Number.isFinite(originalNum) && discountedNum > originalNum) {
            errors.discountedPrice = 'Discounted price cannot exceed original price';
        }

        // Stock validation: must be >= 0
        const stockNum = Number(stock);
        if (stock === '' || stock === undefined || isNaN(stockNum)) {
            errors.stock = 'Enter a valid stock quantity';
        } else if (stockNum < 0) {
            errors.stock = 'Stock cannot be less than 0';
        } else if (!Number.isInteger(stockNum)) {
            errors.stock = 'Enter a valid stock quantity';
        }

        // Custom unit validation (if "Other" is selected)
        if (unit === 'Other') {
            if (!customUnit || !customUnit.trim()) {
                errors.customUnit = 'Please enter a custom unit';
            } else if (customUnit.trim().length > 20) {
                errors.customUnit = 'Custom unit cannot exceed 20 characters';
            }
        }

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        if (!this.validate()) return;

        this.setState({ loading: true });
        try {
            const { name, category, originalPrice, discountedPrice, stock, unit, customUnit, emoji, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive } = this.state;
            
            // Determine final unit: if "Other" is selected, use customUnit; otherwise use selected unit
            const finalUnit = unit === 'Other' ? customUnit.trim() : unit;
            
            const productData = {
                name: name.trim(),
                category,
                originalPrice: Number(originalPrice),
                discountedPrice: Number(discountedPrice),
                stock: Number(stock),
                unit: finalUnit || 'Pack',
                emoji: emoji || '📦',
                freeItemName: freeItemName.trim() || null,
                freeItemQuantity: freeItemQuantity === '' ? null : Number(freeItemQuantity),
                freeItemUnit: freeItemUnit.trim() || null,
                freeItemDescription: freeItemDescription.trim() || null,
                freeItemActive: Boolean(freeItemActive && freeItemName.trim()),
            };
            await productService.addProduct(productData);
            toast.success('Product added successfully! 🎉');
            this.setState({
                name: '',
                category: 'grains',
                originalPrice: '',
                discountedPrice: '',
                stock: '',
                unit: 'Pack',
                customUnit: '',
                emoji: CATEGORY_EMOJIS['grains'] || '📦',
                errors: {},
                success: true,
                freeItemName: '', freeItemQuantity: '', freeItemUnit: '', freeItemDescription: '', freeItemActive: false,
            });
            setTimeout(() => this.setState({ success: false }), 3000);
        } catch (err) {
            console.error('Add product error:', err);
            toast.error(err.message || 'Failed to add product');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleChange = (field) => (e) => {
        this.setState({ [field]: e.target.value });
    };

    handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        const selectedEmoji = CATEGORY_EMOJIS[selectedCategory] || '📦';
        this.setState({
            category: selectedCategory,
            emoji: selectedEmoji,
        });
    };

    render() {
        const { name, category, originalPrice, discountedPrice, stock, unit, customUnit, emoji, errors, loading, success, freeItemName, freeItemQuantity, freeItemUnit, freeItemDescription, freeItemActive } = this.state;
        const preview = calculatePricing({ originalPrice, discountedPrice });

        return (
            <LanguageContext.Consumer>
                {(langCtx) => (
                    <div>
                        <PageHeader>
                            <h1>➕ {langCtx.getText('addNewProduct')}</h1>
                            <p>{langCtx.getText('productAddedMessage')}</p>
                        </PageHeader>

                        <div className="row">
                            <div className="col-12 col-lg-8 col-xl-6">
                                <FormWrapper>
                                    <div className="form-title">📦 {langCtx.getText('selectProductCategory')}</div>

                                    {success && (
                                        <div className="alert alert-success py-2" style={{ fontSize: '0.875rem' }}>
                                            ✅ {langCtx.getText('productAdded')}
                                        </div>
                                    )}

                                    <form onSubmit={this.handleSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">{langCtx.getText('productName')}</label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={name}
                                                onChange={this.handleChange('name')}
                                                placeholder={langCtx.getText('enterProductName')}
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-8">
                                                <label className="form-label fw-semibold">{langCtx.getText('selectProductCategory')}</label>
                                                <select
                                                    className="form-select"
                                                    value={category}
                                                    onChange={this.handleCategoryChange}
                                                >
                                                    {CATEGORIES.map((cat) => (
                                                        <option key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-4">
                                                <label className="form-label fw-semibold">Emoji</label>
                                                <input
                                                    type="text"
                                                    className="form-control text-center"
                                                    value={emoji}
                                                    readOnly
                                                    style={{ fontSize: '1.5rem', cursor: 'default', backgroundColor: '#f8f9fa' }}
                                                />
                                                <small className="form-text text-muted d-block mt-1">
                                                    Auto-filled based on category
                                                </small>
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-4">
                                                <label className="form-label fw-semibold">Original Price (₹)</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.originalPrice ? 'is-invalid' : ''}`}
                                                    value={originalPrice}
                                                    onChange={this.handleChange('originalPrice')}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Enter original price"
                                                />
                                                {errors.originalPrice && <div className="invalid-feedback">{errors.originalPrice}</div>}
                                            </div>
                                            <div className="col-4">
                                                <label className="form-label fw-semibold">Discounted Price (₹)</label>
                                                <input type="number" className={`form-control ${errors.discountedPrice ? 'is-invalid' : ''}`} value={discountedPrice} onChange={this.handleChange('discountedPrice')} min="0" step="0.01" placeholder="Enter offer price" />
                                                {errors.discountedPrice && <div className="invalid-feedback">{errors.discountedPrice}</div>}
                                                {preview.discountAmount > 0 && <small className="text-success fw-semibold">Save ₹{preview.discountAmount.toFixed(2)} ({preview.discountPercentage}% OFF)</small>}
                                            </div>
                                            <div className="col-4">
                                                <label className="form-label fw-semibold">{langCtx.getText('stock')}</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                                                    value={stock}
                                                    onChange={this.handleChange('stock')}
                                                    min="0"
                                                    placeholder={langCtx.getText('enterStockQuantity')}
                                                />
                                                {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                                            </div>
                                            <div className="col-4">
                                                <label className="form-label fw-semibold">Unit</label>
                                                <select
                                                    className={`form-select ${errors.customUnit ? 'is-invalid' : ''}`}
                                                    value={unit}
                                                    onChange={this.handleChange('unit')}
                                                >
                                                    {UNIT_OPTIONS.map((unitOpt) => (
                                                        <option key={unitOpt} value={unitOpt}>
                                                            {unitOpt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border rounded p-3 mb-3">
                                            <div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={freeItemActive} onChange={(e) => this.setState({ freeItemActive: e.target.checked })} id="freeItemActive" /><label className="form-check-label fw-semibold" htmlFor="freeItemActive">🎁 Free Item / Offer</label></div>
                                            {freeItemActive && <div className="row g-2"><div className="col-6"><input className="form-control" value={freeItemName} onChange={this.handleChange('freeItemName')} placeholder="Free item name" /></div><div className="col-3"><input className="form-control" type="number" min="0.001" step="0.001" value={freeItemQuantity} onChange={this.handleChange('freeItemQuantity')} placeholder="Qty" /></div><div className="col-3"><input className="form-control" value={freeItemUnit} onChange={this.handleChange('freeItemUnit')} placeholder="Unit" /></div><div className="col-12"><input className="form-control" value={freeItemDescription} onChange={this.handleChange('freeItemDescription')} placeholder="Description (optional)" /></div></div>}
                                        </div>

                                        {/* Custom Unit Input - Show only if "Other" is selected */}
                                        {unit === 'Other' && (
                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Custom Unit</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.customUnit ? 'is-invalid' : ''}`}
                                                    value={customUnit}
                                                    onChange={this.handleChange('customUnit')}
                                                    placeholder="Enter custom unit (e.g., box, bundle, carton)"
                                                    maxLength="20"
                                                />
                                                {errors.customUnit && <div className="invalid-feedback">{errors.customUnit}</div>}
                                                <small className="form-text text-muted d-block mt-1">
                                                    Max 20 characters. Examples: box, bundle, carton, roll, etc.
                                                </small>
                                            </div>
                                        )}

                                        <div className="d-flex gap-2">
                                            <PrimaryButton type="submit" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        {langCtx.getText('addingProduct')}
                                                    </>
                                                ) : (
                                                    `➕ ${langCtx.getText('addProduct')}`
                                                )}
                                            </PrimaryButton>
                                            <SecondaryButton
                                                type="button"
                                                onClick={() =>
                                                    this.setState({
                                                        name: '',
                                                        category: 'grains',
                                                        originalPrice: '', discountedPrice: '',
                                                        stock: '',
                                                        unit: 'Pack',
                                                        customUnit: '',
                                                        emoji: CATEGORY_EMOJIS['grains'] || '📦',
                                                        errors: {},
                                                        freeItemName: '', freeItemQuantity: '', freeItemUnit: '', freeItemDescription: '', freeItemActive: false,
                                                    })
                                                }
                                            >
                                                {langCtx.getText('reset')}
                                            </SecondaryButton>
                                        </div>
                                    </form>
                                </FormWrapper>
                            </div>
                        </div>
                    </div>
                )}
            </LanguageContext.Consumer>
        );
    }
}

export default AddProductPage;
