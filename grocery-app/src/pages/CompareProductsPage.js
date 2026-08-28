import React from 'react';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import productService from '../services/productService';
import AuthContext from '../context/AuthContext';
import { getComparedProductIds, toggleComparedProduct } from '../utils/customerProfileStorage';
import { PageHeader } from '../styledComponents/LayoutStyles';
import { EmptyState } from '../styledComponents/FormStyles';

const { getComparisonRecommendation } = require('../utils/comparisonRecommendation');

class CompareProductsPage extends React.Component {
  static contextType = AuthContext;

  state = {
    products: [],
    loading: true,
    error: null,
    sortByBestValue: true,
  };

  componentDidMount() {
    this.fetchProducts();
  }

  fetchProducts = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await productService.getProducts();
      const products = Array.isArray(response) ? response : (response?.data || response?.products || []);
      const ids = getComparedProductIds(this.context?.user?.id);
      const selected = (Array.isArray(products) ? products : []).filter((product) => ids.includes(Number(product.id)));
      this.setState({ products: selected, loading: false });
    } catch {
      this.setState({ error: 'Unable to load comparison list.', loading: false });
    }
  };

  removeProduct = (productId) => {
    toggleComparedProduct(this.context?.user?.id, productId);
    this.setState((prev) => ({ products: prev.products.filter((product) => Number(product.id) !== Number(productId)) }));
  };

  getSortedProducts = (products) => {
    const recommendation = getComparisonRecommendation(products);
    return recommendation.products.length ? recommendation.products : products;
  };

  renderRecommendedSummary = (winner, closeMatch) => {
    if (!winner) return null;

    const label = closeMatch ? 'Best Value — Close Match' : '🏆 BEST VALUE';

    return (
      <div className="card mb-4 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255, 241, 214, 0.9), rgba(255,255,255,1))', borderLeft: '4px solid #f4b942' }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '1.05rem' }}>{label}</div>
              <div className="mt-1">
                <strong>{winner.name}</strong>
                <span className="text-muted ms-2">{winner.unit ? `(${winner.unit})` : ''}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="small text-muted">Best Value Score</div>
              <div className="fw-bold" style={{ fontSize: '1.7rem', color: '#2e7d32' }}>{Math.round(winner.score)}/100</div>
            </div>
          </div>

          <div className="mt-3 row g-2 small">
            <div className="col-6 col-md-3"><strong>Price:</strong> {winner.scoreBreakdown?.price || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Discount:</strong> {winner.scoreBreakdown?.discount || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Rating:</strong> {winner.scoreBreakdown?.rating || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Reviews:</strong> {winner.scoreBreakdown?.reviews || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Stock:</strong> {winner.scoreBreakdown?.stock || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Offer:</strong> {winner.scoreBreakdown?.offer || 'N/A'}</div>
            <div className="col-6 col-md-3"><strong>Unit:</strong> {winner.scoreBreakdown?.unit || 'N/A'}</div>
          </div>

          <div className="mt-3">
            <div className="fw-semibold mb-2">Why this is recommended</div>
            <div className="d-flex flex-wrap gap-2">
              {winner.reasons.map((reason) => (
                <span key={reason} className="badge rounded-pill text-bg-light border" style={{ fontWeight: 600, color: '#1f5f3a' }}>
                  {reason}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 border rounded-3 px-3 py-2 text-muted" style={{ background: 'rgba(255,255,255,0.45)', borderColor: 'rgba(13, 110, 253, 0.12)', fontSize: '0.83rem', lineHeight: 1.6 }}>
            <div className="d-flex align-items-start gap-2">
              <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1.4 }}>💡</span>
              <div>
                <strong style={{ color: '#495057' }}>Comparison Guide:</strong> This score is based on price, discounts, ratings, reviews, stock, and available offers. It is only a general comparison to help you decide. The best product ultimately depends on your personal needs, preferences, quantity requirements, and budget.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { products, loading, error, sortByBestValue } = this.state;

    if (loading) return <Spinner fullPage text="Loading comparison list..." />;

    const recommendation = getComparisonRecommendation(products);
    const orderedProducts = sortByBestValue ? this.getSortedProducts(products) : [...products];
    const winner = recommendation.winner || orderedProducts[0] || null;
    const closeMatch = recommendation.closeMatch;

    return (
      <div>
        <PageHeader>
          <h1>🔄 Product Comparison</h1>
          <p>Compare shortlisted items and identify the strongest overall value.</p>
        </PageHeader>

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && products.length === 0 && (
          <EmptyState>
            <h3>No products selected for comparison</h3>
            <p>Tap Compare on any product card to add it here.</p>
          </EmptyState>
        )}

        {products.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="text-muted">Compare products using the latest live price, ratings, stock, and offer data.</div>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => this.setState((prev) => ({ sortByBestValue: !prev.sortByBestValue }))}
                type="button"
              >
                {sortByBestValue ? 'Default order' : 'Sort by Best Value'}
              </button>
            </div>

            {this.renderRecommendedSummary(winner, closeMatch)}

            <div className="row g-3 mt-2">
              {orderedProducts.map((product) => {
                const recommendationEntry = recommendation.products.find((entry) => Number(entry.id) === Number(product.id));
                const score = Number(product?.score ?? recommendationEntry?.score ?? 0);
                const reasons = product?.reasons || recommendationEntry?.reasons || [];
                const breakdown = product?.scoreBreakdown || recommendationEntry?.scoreBreakdown || {};
                const badge = product?.recommendationLabel || (score > 0 ? (recommendation.closeMatch ? 'Best Value — Close Match' : '🏆 BEST VALUE') : '');
                const isWinner = Number(product?.id) === Number(winner?.id);

                return (
                  <div key={product.id} className="col-12 col-md-6 col-xl-4">
                    <div className="position-relative mb-2">
                      {isWinner && (
                        <div className="position-absolute top-0 start-0 translate-middle-y ms-3 px-2 py-1 rounded-pill text-white fw-bold shadow-sm" style={{ background: '#2e7d32', zIndex: 2, fontSize: '0.72rem' }}>
                          {badge || '🏆 BEST VALUE'}
                        </div>
                      )}
                      <ProductCard product={product} />
                    </div>

                    <div className="card border-0 shadow-sm" style={{ background: '#f9fafb' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div className="fw-bold small text-muted">Best Value Score</div>
                          <span className="fw-bold" style={{ color: '#2e7d32', fontSize: '1.1rem' }}>{Math.round(score)}/100</span>
                        </div>

                        <div className="mt-2 small text-muted">{product.average_rating ? `${Number(product.average_rating).toFixed(1)} / 5 rating` : 'No ratings yet'}</div>
                        <div className="small text-muted">{product.rating_count ? `${product.rating_count} reviews` : 'No reviews yet'}</div>
                        <div className="small text-muted mt-1">{product.stock > 0 ? 'Currently in stock' : 'Out of stock'}</div>

                        <div className="mt-3 small">
                          <div className="fw-semibold mb-2">Score breakdown</div>
                          <div className="d-flex justify-content-between"><span>Price</span><span>{breakdown.price || 'N/A'}</span></div>
                          <div className="d-flex justify-content-between"><span>Discount</span><span>{breakdown.discount || 'N/A'}</span></div>
                          <div className="d-flex justify-content-between"><span>Rating</span><span>{breakdown.rating || 'N/A'}</span></div>
                          <div className="d-flex justify-content-between"><span>Reviews</span><span>{breakdown.reviews || 'N/A'}</span></div>
                          <div className="d-flex justify-content-between"><span>Stock</span><span>{breakdown.stock || 'N/A'}</span></div>
                          <div className="d-flex justify-content-between"><span>Free Offer</span><span>{breakdown.offer || 'N/A'}</span></div>
                        </div>

                        <div className="mt-3">
                          <div className="fw-semibold small mb-2">Why this is recommended</div>
                          <ul className="ps-3 mb-0 small text-dark" style={{ lineHeight: 1.7 }}>
                            {reasons.length > 0 ? reasons.map((reason) => <li key={reason}>{reason}</li>) : <li>Available data suggests a competitive option.</li>}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => this.removeProduct(product.id)}>
                        Remove from comparison
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }
}

export default CompareProductsPage;
