import React from 'react';
import productService from '../services/productService';
import LanguageContext from '../context/LanguageContext';
import { toast } from 'react-toastify';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { FormWrapper } from '../styledComponents/FormStyles';
import { PrimaryButton, SecondaryButton } from '../styledComponents/ButtonStyles';

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
            price: '',
            stock: '',
            unit: 'Pack',
            customUnit: '',
            emoji: CATEGORY_EMOJIS['grains'] || '📦',
            errors: {},
            loading: false,
            success: false,
        };
    }

    validate = () => {
        const errors = {};
        const { name, category, price, stock, unit, customUnit } = this.state;

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
        const priceNum = Number(price);
        if (price === '' || price === undefined || isNaN(priceNum)) {
            errors.price = 'Enter a valid price';
        } else if (priceNum < 1) {
            errors.price = 'Price must be greater than or equal to 1';
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
            const { name, category, price, stock, unit, customUnit, emoji } = this.state;
            
            // Determine final unit: if "Other" is selected, use customUnit; otherwise use selected unit
            const finalUnit = unit === 'Other' ? customUnit.trim() : unit;
            
            const productData = {
                name: name.trim(),
                category,
                price: Number(price),
                stock: Number(stock),
                unit: finalUnit || 'Pack',
                emoji: emoji || '📦',
            };
            console.log('Sending product data:', productData);
            const result = await productService.addProduct(productData);
            console.log('Product added:', result);
            toast.success('Product added successfully! 🎉');
            this.setState({
                name: '',
                category: 'grains',
                price: '',
                stock: '',
                unit: 'Pack',
                customUnit: '',
                emoji: CATEGORY_EMOJIS['grains'] || '📦',
                errors: {},
                success: true,
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
        const { name, category, price, stock, unit, customUnit, emoji, errors, loading, success } = this.state;

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
                                                <label className="form-label fw-semibold">{langCtx.getText('price')} (₹)</label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                    value={price}
                                                    onChange={this.handleChange('price')}
                                                    min="1"
                                                    step="0.01"
                                                    placeholder={langCtx.getText('enterPrice')}
                                                />
                                                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
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
                                                        price: '',
                                                        stock: '',
                                                        unit: 'Pack',
                                                        customUnit: '',
                                                        emoji: CATEGORY_EMOJIS['grains'] || '📦',
                                                        errors: {},
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
