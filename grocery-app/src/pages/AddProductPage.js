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

class AddProductPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            category: 'grains',
            price: '',
            stock: '',
            unit: 'pack',
            emoji: '📦',
            errors: {},
            loading: false,
            success: false,
        };
    }

    validate = () => {
        const errors = {};
        const { name, category, price, stock } = this.state;

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

        this.setState({ errors });
        return Object.keys(errors).length === 0;
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        if (!this.validate()) return;

        this.setState({ loading: true });
        try {
            const { name, category, price, stock, unit, emoji } = this.state;
            const productData = {
                name: name.trim(),
                category,
                price: Number(price),
                stock: Number(stock),
                unit: unit || 'pack',
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
                unit: 'pack',
                emoji: '📦',
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

    render() {
        const { name, category, price, stock, unit, emoji, errors, loading, success } = this.state;

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
                                                    onChange={this.handleChange('category')}
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
                                                    onChange={this.handleChange('emoji')}
                                                    style={{ fontSize: '1.5rem' }}
                                                />
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
                                                    className="form-select"
                                                    value={unit}
                                                    onChange={this.handleChange('unit')}
                                                >
                                                    <option value="pack">Pack</option>
                                                    <option value="kg">Kg</option>
                                                    <option value="litre">Litre</option>
                                                    <option value="bottle">Bottle</option>
                                                    <option value="piece">Piece</option>
                                                    <option value="jar">Jar</option>
                                                    <option value="tube">Tube</option>
                                                    <option value="can">Can</option>
                                                    <option value="packet">Packet</option>
                                                    <option value="cup">Cup</option>
                                                </select>
                                            </div>
                                        </div>

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
                                                        price: '',
                                                        stock: '',
                                                        unit: 'pack',
                                                        emoji: '📦',
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
