import React from 'react';
import PriceRangeFilter from './PriceRangeFilter';

const DiscountRangeFilter = (props) => (
  <PriceRangeFilter
    {...props}
    filterLabel="Discount Filter"
    filterIcon="🔥"
    valuePrefix=""
    valueSuffix="%"
    minLabel="Minimum Discount"
    maxLabel="Maximum Discount"
    step="1"
    countLabel="found with this discount range"
    emptyMessage="No discounted products available"
    panelId="discount-filter-panel"
  />
);

export default DiscountRangeFilter;