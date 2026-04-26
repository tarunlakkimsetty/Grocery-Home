import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import LanguageContext from '../context/LanguageContext';
import QuantityControl from '../components/QuantityControl';
import { getNextQuantity, getPreviousQuantity } from '../utils/quantityValidator';
import listOrderService from '../services/listOrderService';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { t, hasTranslation } from '../utils/i18n';
import { searchProducts } from '../utils/searchUtils';

const Container = styled.div`
  padding: 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  color: #2c3e50;
  font-size: 2rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PendingBadge = styled.span`
  background-color: #ff9800;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  flex: 1;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  background: transparent;
  border-radius: 12px;
  display: none; /* Hide table wrapper for card layout */
`;

const Table = styled.table`
  display: none; /* Hide table for card layout */
`;

/* Card-based layout components */
const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const OrderCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid #4CAF50;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.pending {
    border-left-color: #ff9800;
  }

  &.converted {
    border-left-color: #4CAF50;
  }
`;

const OrderDataRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  @media (max-width: 576px) {
    gap: 0.5rem;
    padding: 0.5rem;
  }
`;

const OrderActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem 1rem 1rem;
  flex-wrap: wrap;
  border-top: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    padding: 0.75rem 0.75rem;
    gap: 0.5rem;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem 0.5rem;
    gap: 0.4rem;

    button {
      width: 100%;
    }
  }
`;

const DataField = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-shrink: 0;

  &.name {
    flex: 1;
    min-width: 150px;
  }

  &.phone {
    min-width: 120px;
  }

  &.date {
    min-width: 130px;
  }

  @media (max-width: 768px) {
    &.name {
      min-width: 120px;
    }

    &.phone {
      min-width: 100px;
    }

    &.date {
      min-width: 110px;
    }
  }

  @media (max-width: 576px) {
    &.name,
    &.phone,
    &.date {
      min-width: auto;
    }
  }
`;

const FieldLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  margin-bottom: 0.25rem;

  @media (max-width: 576px) {
    display: none;
  }
`;

const FieldValue = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 576px) {
    font-size: 0.85rem;
  }
`;


const StatusBadge = styled.span`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;

  &.pending {
    background-color: #fff3cd;
    color: #856404;
  }

  &.converted {
    background-color: #d4edda;
    color: #155724;
  }
`;

const Thumbnail = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 576px) {
    gap: 0.4rem;
  }
`;

const ActionButton = styled.button`
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;
  flex: 1;
  min-width: 70px;

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
    min-width: 60px;
  }

  @media (max-width: 576px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: auto;
  }

  &.view {
    background-color: #2196F3;
    color: white;

    &:hover {
      background-color: #0b7dda;
    }
  }

  &.print {
    background-color: #4CAF50;
    color: white;

    &:hover {
      background-color: #45a049;
    }
  }

  &.convert {
    background-color: #ff9800;
    color: white;

    &:hover {
      background-color: #e68900;
    }
  }

  &.delete {
    background-color: #f44336;
    color: white;

    &:hover {
      background-color: #da190b;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
  }
`;

const ModalBase = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease;
  display: ${props => props.$isOpen ? 'flex' : 'flex'};
`;

// Modal wrapper that filters the isOpen prop
const Modal = ({ isOpen, onClick, children }) => (
  <ModalBase $isOpen={isOpen} onClick={onClick}>
    {children}
  </ModalBase>
);

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;

  &:hover {
    color: #2c3e50;
  }
`;

const ModalImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const ModalDetails = styled.div`
  margin-bottom: 1.5rem;

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #eee;

    .label {
      color: #7f8c8d;
      font-weight: 600;
    }

    .value {
      color: #2c3e50;
      font-weight: 600;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
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
    }
  }

  &.secondary {
    background-color: #2196F3;
    color: white;

    &:hover {
      background-color: #0b7dda;
    }
  }

  &.danger {
    background-color: #f44336;
    color: white;

    &:hover {
      background-color: #da190b;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #7f8c8d;
`;

// Convert Modal Styles
const ConvertModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 1200px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: grid;
  grid-template-columns: 1fr 1.5fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    max-height: 90vh;
  }
`;

const ConvertModalImageSection = styled.div`
  background: #f8f9fa;
  padding: 2rem;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }

  img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    margin-bottom: 1rem;
  }

  .image-info {
    text-align: center;
    font-size: 0.9rem;
    color: #6c757d;
    margin-top: 1rem;

    strong {
      display: block;
      color: #2c3e50;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
  }
`;

const ConvertModalFormSection = styled.div`
  padding: 2rem;
  overflow-y: auto;
`;

const SectionTitle = styled.h6`
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.4rem;
    display: block;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #4CAF50;
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const ProductsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 1rem;

  thead {
    background: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
  }

  th, td {
    padding: 0.6rem 0.8rem;
    text-align: left;
  }

  th {
    font-weight: 600;
    color: #2c3e50;
  }

  tbody tr {
    border-bottom: 1px solid #dee2e6;

    &:hover {
      background: #f8f9fa;
    }
  }

  input {
    max-width: 60px;
  }

  button {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    border: none;
    border-radius: 4px;
    background: #dc3545;
    color: white;
    cursor: pointer;

    &:hover {
      background: #c82333;
    }
  }
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 8px;
  margin-top: 1.5rem;
  border: 1px solid rgba(76, 175, 80, 0.3);

  .total-label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1rem;
  }

  .total-value {
    font-size: 1.3rem;
    font-weight: 800;
    color: #1b5e20;
  }
`;

const ConvertModalActions = styled.div`
  display: flex;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  margin-top: 1.5rem;

  button {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;

    &.save {
      background: #4CAF50;
      color: white;

      &:hover:not(:disabled) {
        background: #45a049;
      }
    }

    &.cancel {
      background: #e9ecef;
      color: #495057;

      &:hover:not(:disabled) {
        background: #dee2e6;
      }
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const QtyControl = styled.div`
  /* Deprecated: Use QuantityControl component instead */
  display: none;
`;

const RemoveItemButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.6rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  height: 28px;
  min-width: 28px;

  &:hover {
    background: #c82333;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 576px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    height: auto;
    min-width: auto;
  }
`;

/* Card-based layout for Selected Items */
const ItemsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const ItemCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ItemPrice = styled.span`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

const ItemContentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    gap: 0.5rem;
  }
`;

const QuantitySection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 0.75rem;
    color: #999;
    font-weight: 600;
    text-transform: uppercase;
  }
`;

const ItemTotal = styled.div`
  font-weight: 700;
  color: #2c3e50;
  font-size: 1rem;
  text-align: right;

  @media (max-width: 576px) {
    font-size: 0.9rem;
  }
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
`;

const GrandTotalSticky = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid rgba(76, 175, 80, 0.3);
  font-weight: 600;

  .total-label {
    color: #2c3e50;
    font-size: 1rem;
  }

  .total-value {
    font-size: 1.3rem;
    font-weight: 800;
    color: #2e7d32;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;

    .total-label {
      font-size: 0.9rem;
    }

    .total-value {
      font-size: 1.1rem;
      width: 100%;
      text-align: right;
    }
  }
`;

class AdminListOrdersPage extends React.Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = {
      listOrders: [],
      filteredListOrders: [],
      loading: true,
      selectedListOrder: null,
      modalOpen: false,
      filterStatus: 'all',
      filterSearch: '',
      pendingCount: 0,
      // Convert Modal States
      convertModalOpen: false,
      convertListOrder: null,
      products: [],
      productsLoading: false,
      convertItems: [],
      convertProductSearch: '',
      convertCategoryFilter: '',
      convertAddProductId: '',
      convertAddQty: '1',
      convertAddQtyError: '',
      convertCustomerName: '',
      convertPhone: '',
      convertPlace: '',
      convertAddress: '',
      convertOrderDate: new Date().toISOString().split('T')[0],
      convertActionLoading: false
    };
  }

  componentDidMount() {
    this.fetchListOrders();
    this.fetchPendingCount();
    this.fetchProducts();
  }

  fetchProducts = async () => {
    this.setState({ productsLoading: true });
    try {
      const response = await productService.getProducts();
      
      // Handle different response formats
      let productsList = [];
      if (Array.isArray(response)) {
        productsList = response;
      } else if (response && Array.isArray(response.data)) {
        productsList = response.data;
      } else if (response && response.products) {
        productsList = response.products;
      } else if (response && typeof response === 'object') {
        productsList = Object.values(response).filter(item => typeof item === 'object');
      }

      // Filter out invalid entries
      productsList = productsList.filter(p => p && p.id && p.name);
      
      this.setState({ products: productsList });
      
      // Debug log
      console.log('Products loaded:', productsList.length);
      if (productsList.length > 0) {
        const categories = [...new Set(productsList.map(p => p.category).filter(Boolean))];
        console.log('Categories found:', categories);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      this.setState({ productsLoading: false });
    }
  }

  fetchListOrders = async () => {
    this.setState({ loading: true });
    try {
      const response = await listOrderService.getAllListOrders({});
      
      if (response.success) {
        this.setState({
          listOrders: response.data,
          filteredListOrders: response.data
        });
      }
    } catch (error) {
      toast.error('Failed to fetch list orders');
      console.error(error);
    } finally {
      this.setState({ loading: false });
    }
  }

  fetchPendingCount = async () => {
    try {
      const response = await listOrderService.getPendingCount();
      
      if (response.success) {
        this.setState({ pendingCount: response.data.pendingCount });
      }
    } catch (error) {
      console.error(error);
    }
  }

  applyFilters = () => {
    const { listOrders, filterStatus, filterSearch } = this.state;
    let filtered = [...listOrders];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    if (filterSearch) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        order.phone.includes(filterSearch)
      );
    }

    this.setState({ filteredListOrders: filtered });
  }

  handleFilterStatusChange = (e) => {
    this.setState({ filterStatus: e.target.value }, this.applyFilters);
  }

  handleFilterSearchChange = (e) => {
    this.setState({ filterSearch: e.target.value }, this.applyFilters);
  }

  handleViewImage = (listOrder) => {
    this.setState({
      selectedListOrder: listOrder,
      modalOpen: true
    });
  }

  handleCloseModal = () => {
    this.setState({
      modalOpen: false,
      selectedListOrder: null
    });
  }

  handlePrint = async (listOrder) => {
    const printDate = new Date(listOrder.createdAt).toLocaleDateString();
    const printTime = new Date(listOrder.createdAt).toLocaleTimeString();
    
    // Get all image paths (supporting both single and multiple)
    const imagePaths = listOrder.imagePaths || 
                       (listOrder.imagePath ? [listOrder.imagePath] : []);

    let imagesBase64 = [];
    
    try {
      // Convert all images to base64
      for (const imagePath of imagePaths) {
        const fullImageUrl = imagePath.startsWith('http') 
          ? imagePath 
          : `http://localhost:5000${imagePath}`;

        try {
          const response = await fetch(fullImageUrl);
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          imagesBase64.push(base64);
        } catch (imgError) {
          console.log('Could not load image:', imagePath, imgError);
        }
      }
    } catch (error) {
      console.log('Could not load images for print:', error);
    }

    const printWindow = window.open('', '', 'width=900,height=700');

    // Shop details - using same structure as bills
    const shopName = 'Om Sri Satya Sai Rama Kirana And General Merchants';
    const shopAddress = 'Kirana Street, Talapaka, Razole Mandalam, Dr. B.R. Ambedkar Konaseema District';
    const shopPhone = '9441754505';

    // Generate image HTML for all images
    const imagesHTML = imagesBase64.map((imgBase64, idx) => `
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${imgBase64}" alt="Grocery List ${idx + 1}" style="max-width: 100%; max-height: 350px; border: 1px solid #ddd;" />
        ${imagesBase64.length > 1 ? `<div style="font-size: 11px; color: #666; margin-top: 5px;">Image ${idx + 1} of ${imagesBase64.length}</div>` : ''}
      </div>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Grocery List - ${listOrder.customerName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              background-color: #fff;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .shop-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .shop-header h1 {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              margin-bottom: 3px;
            }
            .shop-header p {
              font-size: 11px;
              color: #666;
              margin: 2px 0;
              line-height: 1.4;
            }
            .details-row {
              display: flex;
              gap: 30px;
              margin-bottom: 15px;
            }
            .details-box {
              flex: 1;
              border: 1px solid #ccc;
              padding: 10px;
              font-size: 12px;
            }
            .details-box-title {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              margin-bottom: 8px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .detail-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 11px;
            }
            .detail-label {
              font-weight: 600;
              width: 120px;
            }
            .detail-value {
              flex: 1;
              text-align: left;
              padding-left: 10px;
              word-break: break-word;
            }
            .image-section {
              border: 1px solid #ccc;
              padding: 15px;
              text-align: center;
              margin: 15px 0;
              background-color: #fafafa;
            }
            .image-section img {
              max-width: 100%;
              max-height: 350px;
              border: 1px solid #ddd;
            }
            .footer-msg {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
              font-size: 12px;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Shop Header -->
            <div class="shop-header">
              <h1>${shopName}</h1>
              <p>${shopAddress}</p>
              <p>Phone Number: ${shopPhone}</p>
            </div>

            <!-- Order Details & Customer Details Row -->
            <div class="details-row">
              <div class="details-box">
                <div class="details-box-title">ORDER DETAILS</div>
                <div class="detail-line">
                  <span class="detail-label">Order ID:</span>
                  <span class="detail-value">#${listOrder.id}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Order Date:</span>
                  <span class="detail-value">${printDate}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Order Time:</span>
                  <span class="detail-value">${printTime}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" style="padding: 2px 6px; background-color: ${listOrder.status === 'pending' ? '#fff3cd' : '#d4edda'}; border-radius: 3px; font-weight: bold;">
                    ${listOrder.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div class="details-box">
                <div class="details-box-title">CUSTOMER DETAILS</div>
                <div class="detail-line">
                  <span class="detail-label">Customer Name:</span>
                  <span class="detail-value">${listOrder.customerName}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Phone Number:</span>
                  <span class="detail-value">${listOrder.phone}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Place / City:</span>
                  <span class="detail-value">[To be filled]</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Address:</span>
                  <span class="detail-value">[To be filled]</span>
                </div>
              </div>
            </div>

            <!-- Grocery List Image(s) in place of Products Table -->
            <div class="image-section">
              ${imagesBase64.length > 0 ? imagesHTML : '<p style="color: #999;">Images not available</p>'}
            </div>

            <!-- Footer -->
            <div class="footer-msg">
              Thank You for Your Purchase!
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  }

  handleConvertToOfflineOrder = (listOrder) => {
    this.setState({
      convertModalOpen: true,
      convertListOrder: listOrder,
      convertCustomerName: listOrder.customerName || '',
      convertPhone: listOrder.phone || '',
      convertItems: [],
      convertAddProductId: '',
      convertAddQty: '1'
    });
    this.handleCloseModal();
  }

  closeConvertModal = () => {
    this.setState({
      convertModalOpen: false,
      convertListOrder: null,
      convertItems: [],
      convertCustomerName: '',
      convertPhone: '',
      convertPlace: '',
      convertAddress: '',
      convertOrderDate: new Date().toISOString().split('T')[0],
      convertAddProductId: '',
      convertAddQty: '1',
      convertAddQtyError: '',
      convertProductSearch: '',
      convertCategoryFilter: ''
    });
  }

  // Product selection and quantity management for convert
  toggleConvertProductSelect = (productId) => {
    const { convertItems } = this.state;
    const exists = convertItems.find(item => item.productId === productId);
    
    if (exists) {
      this.setState({
        convertItems: convertItems.filter(item => item.productId !== productId)
      });
    } else {
      const product = this.state.products.find(p => p.id === productId);
      if (product) {
        const price = Number(product.price) || 0;
        this.setState({
          convertItems: [...convertItems, {
            productId: product.id,
            name: product.name,
            price: price,
            quantity: 1,
            total: price
          }]
        });
      }
    }
  }

  onConvertAddQtyChange = (e) => {
    let value = e.target.value;
    let error = '';
    
    // Get stock of selected product
    const product = this.state.convertAddProductId 
      ? this.state.products.find(p => p.id === this.state.convertAddProductId)
      : null;
    const stock = Number(product?.stock || 0);
    
    // CRITICAL: Calculate available = stock - already added
    const { convertItems } = this.state;
    const alreadyAdded = convertItems.find(item => item.productId === this.state.convertAddProductId)?.quantity || 0;
    const available = Math.max(0, stock - alreadyAdded);
    
    // Debug logging
    console.log({ stock, alreadyAdded, available, productId: this.state.convertAddProductId });
    
    // Block non-numeric input
    if (value && !/^\d+$/.test(value)) {
      error = 'Only numbers allowed';
      value = '';
    }
    
    // Convert to number and validate
    const numValue = parseInt(value) || 0;
    
    // Check for zero
    if (value && numValue === 0) {
      error = 'Quantity must be greater than 0';
      value = '';
    }
    
    // CRITICAL: Check AVAILABLE limit (not stock)
    if (value && numValue > available) {
      error = `Only ${available} available`;
      value = String(available);
    }
    
    // Auto-correct empty to 1
    if (value === '') {
      value = '1';
    }
    
    this.setState({
      convertAddQty: value,
      convertAddQtyError: error
    });
  }

  handleUnSelectProduct = () => {
    this.setState({
      convertAddProductId: '',
      convertProductSearch: '',
      convertAddQty: '1',
      convertAddQtyError: ''
    });
    // Focus back to search input
    const searchInput = document.querySelector('input[placeholder="Search product name..."]');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  handleConvertQtyIncrease = () => {
    const product = this.state.products.find(p => p.id === this.state.convertAddProductId);
    if (!product) return;
    
    const unit = product.unit || 'piece';
    const stock = Number(product.stock || 0);
    const currentQty = parseInt(this.state.convertAddQty) || 1;
    const nextQty = getNextQuantity(currentQty, { unit, stock });
    
    this.setState({ convertAddQty: String(nextQty) });
  }

  handleConvertQtyDecrease = () => {
    const product = this.state.products.find(p => p.id === this.state.convertAddProductId);
    if (!product) return;
    
    const unit = product.unit || 'piece';
    const currentQty = parseInt(this.state.convertAddQty) || 1;
    const prevQty = getPreviousQuantity(currentQty, { unit });
    
    this.setState({ convertAddQty: String(prevQty) });
  }

  addConvertItem = () => {
    const { convertAddProductId, convertAddQty, products, convertItems } = this.state;
    
    if (!convertAddProductId) {
      toast.warning('Please select a product');
      return;
    }
    
    let qty = parseInt(convertAddQty) || 0;
    
    // Enforce minimum quantity
    if (qty <= 0) {
      this.setState({ convertAddQty: '1', convertAddQtyError: 'Quantity must be greater than 0' });
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    const product = products.find(p => p.id === convertAddProductId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    
    // CRITICAL: Use SINGLE SOURCE OF TRUTH - calculate available = stock - alreadyAdded
    const stock = Number(product.stock || 0);
    const alreadyAdded = convertItems.find(item => item.productId === convertAddProductId)?.quantity || 0;
    const available = Math.max(0, stock - alreadyAdded);
    
    // Debug logging
    console.log({ stock, alreadyAdded, available, attemptedQty: qty, productId: convertAddProductId });
    
    if (qty > available) {
      const errorMsg = `Only ${available} available`;
      this.setState({ 
        convertAddQty: String(available), 
        convertAddQtyError: errorMsg 
      });
      toast.error(errorMsg);
      return;
    }
    
    const exists = convertItems.find(item => item.productId === convertAddProductId);
    if (exists) {
      toast.info('Product already added. Use quantity controls to modify.');
      return;
    }
    
    this.setState({
      convertItems: [...convertItems, {
        productId: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: qty,
        total: (Number(product.price) || 0) * qty,
        unit: product.unit,
        stock: product.stock  // Store raw stock for reference, but use calculated available for limits
      }],
      convertAddProductId: '',
      convertAddQty: '1',
      convertProductSearch: ''
    });
  }

  updateConvertItemQuantity = (productId, delta) => {
    const { convertItems, products } = this.state;
    const product = products.find(p => p.id === productId);
    const stock = Number(product?.stock || 0);
    
    const updatedItems = convertItems.map(item => {
      if (item.productId !== productId) return item;
      
      const currentQty = item.quantity;
      const nextQty = Math.max(0, currentQty + delta);
      
      if (delta > 0 && stock > 0 && nextQty > stock) {
        toast.error('Quantity exceeds stock limit');
        return item;
      }
      
      return {
        ...item,
        quantity: nextQty,
        total: (Number(item.price) || 0) * nextQty
      };
    });
    
    this.setState({ convertItems: updatedItems });
  }

  handleConvertItemQuantityInput = (productId, qty) => {
    const { convertItems } = this.state;

    // Update items (QuantityControl handles validation)
    const updatedItems = convertItems.map(item => {
      if (item.productId !== productId) return item;

      return {
        ...item,
        quantity: qty,
        total: (Number(item.price) || 0) * qty
      };
    });

    this.setState({ convertItems: updatedItems });
  }

  removeConvertItem = (productId) => {
    this.setState({
      convertItems: this.state.convertItems.filter(item => item.productId !== productId)
    });
  }

  getConvertGrandTotal = () => {
    return this.state.convertItems.reduce((sum, item) => {
      const total = Number(item.total) || 0;
      return sum + total;
    }, 0);
  }

  onConvertFieldChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  }

  handleSubmitConvertOrder = async () => {
    const {
      convertItems,
      convertCustomerName,
      convertPhone,
      convertPlace,
      convertAddress,
      convertOrderDate,
      convertListOrder,
      convertActionLoading
    } = this.state;

    if (convertActionLoading) return;

    if (!convertCustomerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!convertPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (convertItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const totalAmount = this.getConvertGrandTotal();
    const orderDateIso = convertOrderDate ? new Date(convertOrderDate).toISOString() : new Date().toISOString();

    this.setState({ convertActionLoading: true });
    try {
      // Create offline order
      const orderResponse = await orderService.createOfflineOrder({
        customerName: convertCustomerName.trim(),
        phone: convertPhone.trim(),
        place: convertPlace.trim(),
        address: convertAddress.trim(),
        items: convertItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        status: 'Pending',
        orderType: 'Offline',
        orderDate: orderDateIso
      });

      // Update list order status to converted
      if (convertListOrder) {
        await listOrderService.updateListOrderStatus(
          convertListOrder.id,
          'converted',
          orderResponse?.data?.order?.id || orderResponse?.id
        );
      }

      toast.success('Order created successfully!');
      this.closeConvertModal();
      this.fetchListOrders();
      this.fetchPendingCount();
    } catch (err) {
      const rawMsg = err?.response?.data?.errorKey || err?.response?.data?.message || err?.message;
      const normalized = rawMsg ? String(rawMsg).trim() : '';
      
      if (normalized && hasTranslation(normalized)) {
        toast.error(t(normalized));
      } else if (normalized) {
        toast.error(normalized);
      } else {
        toast.error('Failed to create offline order');
      }
    } finally {
      this.setState({ convertActionLoading: false });
    }
  }

  handleDeleteListOrder = async (listOrder) => {
    if (window.confirm(`Delete grocery list from ${listOrder.customerName}?`)) {
      try {
        await listOrderService.deleteListOrder(listOrder.id);
        toast.success('Grocery list deleted');
        this.fetchListOrders();
        this.fetchPendingCount();
      } catch (error) {
        toast.error('Failed to delete grocery list');
        console.error(error);
      }
    }
  }

  formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  render() {
    const {
      filteredListOrders,
      loading,
      modalOpen,
      selectedListOrder,
      filterStatus,
      filterSearch,
      pendingCount
    } = this.state;

    return (
      <Container>
        <Header>
          <Title>
            📋 List Orders
            {pendingCount > 0 && <PendingBadge>{pendingCount} Pending</PendingBadge>}
          </Title>
        </Header>

        <FilterBar>
          <FilterInput
            type="text"
            placeholder="Search by customer name or phone..."
            value={filterSearch}
            onChange={this.handleFilterSearchChange}
          />
          <FilterSelect value={filterStatus} onChange={this.handleFilterStatusChange}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="converted">Converted</option>
          </FilterSelect>
        </FilterBar>

        {loading ? (
          <LoadingSpinner>Loading grocery lists...</LoadingSpinner>
        ) : filteredListOrders.length === 0 ? (
          <EmptyState>
            <div className="icon">📭</div>
            <p>No grocery lists found</p>
          </EmptyState>
        ) : (
          <CardsContainer>
            {filteredListOrders.map(order => (
              <OrderCard key={order.id} className={order.status}>
                {/* Data Row: Image | Name | Phone | Status | Date */}
                <OrderDataRow>
                  <Thumbnail
                    src={order.imagePath}
                    alt={order.customerName}
                    onClick={() => this.handleViewImage(order)}
                    style={{ cursor: 'pointer' }}
                  />

                  <DataField className="name">
                    <FieldLabel>Customer</FieldLabel>
                    <FieldValue title={order.customerName}>{order.customerName}</FieldValue>
                  </DataField>

                  <DataField className="phone">
                    <FieldLabel>Phone</FieldLabel>
                    <FieldValue title={order.phone}>{order.phone}</FieldValue>
                  </DataField>

                  <DataField>
                    <FieldLabel>Status</FieldLabel>
                    <StatusBadge className={order.status}>
                      {order.status}
                    </StatusBadge>
                  </DataField>

                  <DataField className="date">
                    <FieldLabel>Date</FieldLabel>
                    <FieldValue>{this.formatDate(order.createdAt)}</FieldValue>
                  </DataField>
                </OrderDataRow>

                {/* Actions Row: View | Print | Convert | Delete */}
                <OrderActionsRow>
                  <ActionButtons>
                    <ActionButton
                      className="view"
                      onClick={() => this.handleViewImage(order)}
                      title="View full image"
                    >
                      👁️ View
                    </ActionButton>
                    <ActionButton
                      className="print"
                      onClick={() => this.handlePrint(order)}
                      title="Print order"
                    >
                      🖨️ Print
                    </ActionButton>
                    {order.status === 'pending' && (
                      <ActionButton
                        className="convert"
                        onClick={() => this.handleConvertToOfflineOrder(order)}
                        title="Convert to offline order"
                      >
                        ➜ Convert
                      </ActionButton>
                    )}
                    <ActionButton
                      className="delete"
                      onClick={() => this.handleDeleteListOrder(order)}
                      title="Delete order"
                    >
                      🗑️ Delete
                    </ActionButton>
                  </ActionButtons>
                </OrderActionsRow>
              </OrderCard>
            ))}
          </CardsContainer>
        )}

        {/* Image Preview Modal */}
        <Modal isOpen={modalOpen} onClick={this.handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Grocery List Preview</ModalTitle>
              <CloseButton onClick={this.handleCloseModal}>✕</CloseButton>
            </ModalHeader>

            {selectedListOrder && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  {(() => {
                    const imagePaths = selectedListOrder.imagePaths || 
                                      (selectedListOrder.imagePath ? [selectedListOrder.imagePath] : []);
                    
                    return imagePaths.map((imagePath, idx) => (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        <ModalImage
                          src={
                            imagePath.startsWith('http')
                              ? imagePath
                              : `http://localhost:5000${imagePath}`
                          }
                          alt={`${selectedListOrder.customerName} - Image ${idx + 1}`}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {imagePaths.length > 1 && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                            Image {idx + 1} of {imagePaths.length}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                <ModalDetails>
                  <div className="detail-row">
                    <span className="label">Customer Name:</span>
                    <span className="value">{selectedListOrder.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedListOrder.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="value">
                      <StatusBadge className={selectedListOrder.status}>
                        {selectedListOrder.status}
                      </StatusBadge>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date Submitted:</span>
                    <span className="value">{this.formatDate(selectedListOrder.createdAt)}</span>
                  </div>
                  {(selectedListOrder.imagePaths?.length || 1) > 1 && (
                    <div className="detail-row">
                      <span className="label">Images:</span>
                      <span className="value">📸 {selectedListOrder.imagePaths?.length || 1} files</span>
                    </div>
                  )}
                  {selectedListOrder.notes && (
                    <div className="detail-row">
                      <span className="label">Notes:</span>
                      <span className="value">{selectedListOrder.notes}</span>
                    </div>
                  )}
                </ModalDetails>

                <ModalActions>
                  <Button
                    className="secondary"
                    onClick={() => this.handlePrint(selectedListOrder)}
                  >
                    🖨️ Print
                  </Button>
                  {selectedListOrder.status === 'pending' && (
                    <Button
                      className="primary"
                      onClick={() => this.handleConvertToOfflineOrder(selectedListOrder)}
                    >
                      ➜ Convert to Order
                    </Button>
                  )}
                  <Button
                    className="danger"
                    onClick={() => this.handleDeleteListOrder(selectedListOrder)}
                  >
                    🗑️ Delete
                  </Button>
                </ModalActions>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Convert to Offline Order Modal */}
        <Modal isOpen={this.state.convertModalOpen} onClick={this.closeConvertModal}>
          <ConvertModalContent onClick={(e) => e.stopPropagation()}>
            {/* Image Section - Left */}
            <ConvertModalImageSection>
              {this.state.convertListOrder && (
                <>
                  {(() => {
                    const imagePaths = this.state.convertListOrder.imagePaths || 
                                      (this.state.convertListOrder.imagePath ? [this.state.convertListOrder.imagePath] : []);
                    
                    return (
                      <div style={{ width: '100%' }}>
                        {imagePaths.map((imagePath, idx) => (
                          <div key={idx} style={{ marginBottom: idx < imagePaths.length - 1 ? '1rem' : '0' }}>
                            <img
                              src={
                                imagePath.startsWith('http')
                                  ? imagePath
                                  : `http://localhost:5000${imagePath}`
                              }
                              alt={`Grocery List ${idx + 1}`}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            {imagePaths.length > 1 && (
                              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                                Image {idx + 1} of {imagePaths.length}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="image-info">
                    <strong>Grocery List</strong>
                    <div>ID: #{this.state.convertListOrder.id}</div>
                    {(this.state.convertListOrder.imagePaths?.length || 1) > 1 && (
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        📸 {this.state.convertListOrder.imagePaths?.length || 1} images
                      </div>
                    )}
                  </div>
                </>
              )}
            </ConvertModalImageSection>

            {/* Form Section - Right */}
            <ConvertModalFormSection>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>➕ Create Offline Order</h3>
                <button
                  onClick={this.closeConvertModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#7f8c8d'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Customer Details Section */}
              <SectionTitle style={{ marginTop: 0, marginBottom: '0.6rem' }}>Customer Information</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                <FormGroup>
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={this.state.convertCustomerName}
                    onChange={this.onConvertFieldChange('convertCustomerName')}
                    placeholder="Enter customer name"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Phone *</label>
                  <input
                    type="text"
                    value={this.state.convertPhone}
                    onChange={this.onConvertFieldChange('convertPhone')}
                    placeholder="Enter phone number"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Place / City</label>
                  <input
                    type="text"
                    value={this.state.convertPlace}
                    onChange={this.onConvertFieldChange('convertPlace')}
                    placeholder="Enter place/city"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Order Date</label>
                  <input
                    type="date"
                    value={this.state.convertOrderDate}
                    onChange={this.onConvertFieldChange('convertOrderDate')}
                  />
                </FormGroup>
              </div>

              <FormGroup>
                <label>Address</label>
                <textarea
                  value={this.state.convertAddress}
                  onChange={this.onConvertFieldChange('convertAddress')}
                  placeholder="Enter address"
                />
              </FormGroup>

              {/* Add Items Section */}
              <SectionTitle style={{ marginTop: '1rem', marginBottom: '0.6rem' }}>Add Products</SectionTitle>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.3rem', display: 'block' }}>
                  Category Filter
                </label>
                <select
                  value={this.state.convertCategoryFilter}
                  onChange={(e) => this.setState({ convertCategoryFilter: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    height: '32px'
                  }}
                >
                  <option value="">All Products</option>
                  {(() => {
                    const uniqueCategories = [...new Set(
                      this.state.products
                        .map(p => p.category)
                        .filter(Boolean)
                    )].sort();
                    
                    return uniqueCategories.length > 0 ? uniqueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    )) : null;
                  })()}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.3rem', display: 'block' }}>
                    Search & Select Product
                  </label>
                  <input
                    type="text"
                    placeholder="Search product name..."
                    value={this.state.convertProductSearch}
                    onChange={(e) => this.setState({ convertProductSearch: e.target.value })}
                    disabled={this.state.productsLoading}
                    style={{ width: '100%', fontSize: '0.85rem', height: '32px', padding: '0.4rem 0.6rem' }}
                  />
                  {this.state.convertAddProductId && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', padding: '0.5rem', background: '#e7f5ff', borderRadius: '4px', gap: '0.5rem' }}>
                      <small style={{ color: '#2E7D32', fontWeight: 600, margin: 0 }}>
                        ✓ {this.state.products.find(p => p.id === this.state.convertAddProductId)?.name} selected
                      </small>
                      <button
                        onClick={this.handleUnSelectProduct}
                        type="button"
                        title="Remove selection"
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          padding: 0,
                          flexShrink: 0,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#bb2d3b'}
                        onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ minWidth: '100px', flex: 0.5 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.3rem', display: 'block' }}>
                    Quantity
                  </label>
                  {(() => {
                    const product = this.state.convertAddProductId ? this.state.products.find(p => p.id === this.state.convertAddProductId) : null;
                    const stock = Number(product?.stock || 0);
                    const alreadyAdded = this.state.convertItems.find(item => item.productId === this.state.convertAddProductId)?.quantity || 0;
                    const available = Math.max(0, stock - alreadyAdded);
                    return (
                      <QuantityControl
                        value={parseInt(this.state.convertAddQty) || 1}
                        onIncrease={this.handleConvertQtyIncrease}
                        onDecrease={this.handleConvertQtyDecrease}
                        onChange={(value) => {
                          this.setState({ convertAddQty: String(value) });
                        }}
                        unit={product?.unit || 'piece'}
                        stock={available}
                        disabled={!this.state.convertAddProductId}
                        title="Adjust quantity"
                        showStockWarning={true}
                      />
                    );
                  })()}
                  {this.state.convertAddQtyError && (
                    <small style={{ color: '#d32f2f', fontSize: '0.7rem', display: 'block', marginTop: '0.2rem' }}>{this.state.convertAddQtyError}</small>
                  )}
                </div>
                <button
                  onClick={this.addConvertItem}
                  disabled={!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0}
                  style={{
                    height: '32px',
                    padding: '0 0.6rem',
                    background: (!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0) ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: (!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0) ? 'not-allowed' : 'pointer',
                    opacity: (!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0) ? 0.6 : 1,
                    transition: 'all 0.2s',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0) return;
                    e.target.style.background = '#45a049';
                  }}
                  onMouseLeave={(e) => {
                    if (!this.state.convertAddProductId || parseInt(this.state.convertAddQty) <= 0) return;
                    e.target.style.background = '#4CAF50';
                  }}
                  title={!this.state.convertAddProductId ? 'Select a product' : parseInt(this.state.convertAddQty) <= 0 ? 'Quantity must be greater than 0' : 'Add to cart'}
                >
                  Add
                </button>
              </div>

              {/* Products Dropdown */}
              {(this.state.convertProductSearch || !this.state.convertAddProductId) && this.state.products.length > 0 && (
                <div
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    marginBottom: '0.8rem',
                    background: '#fff'
                  }}
                >
                  {Array.isArray(this.state.products) && this.state.products.length > 0 ? (
                    (() => {
                      let categoryFiltered = this.state.products;
                      
                      // Apply category filter
                      if (this.state.convertCategoryFilter) {
                        categoryFiltered = categoryFiltered.filter(
                          p => p.category === this.state.convertCategoryFilter
                        );
                      }
                      
                      // Apply search using searchProducts utility
                      const filtered = this.state.convertProductSearch
                        ? searchProducts(categoryFiltered, this.state.convertProductSearch)
                        : categoryFiltered;
                      
                      return filtered.length > 0 ? filtered.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => this.setState({ 
                            convertAddProductId: p.id,
                            convertProductSearch: ''
                          })}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e9ecef',
                            background: this.state.convertAddProductId === p.id ? '#e7f5ff' : 'white',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = this.state.convertAddProductId === p.id ? '#e7f5ff' : 'white')}
                        >
                          <strong>{p.name}</strong>
                          {p.teluguName && (
                            <div style={{ fontSize: '0.7rem', color: '#8B5A3C', marginTop: '0.2rem' }}>
                              {p.teluguName}
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                            {p.category && <span>{p.category.charAt(0).toUpperCase() + p.category.slice(1)} • </span>}
                            ₹{p.price}
                          </div>
                        </div>
                      )) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                          No products found
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                      {this.state.productsLoading ? 'Loading...' : 'No products found'}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Items Table Layout */}
              {this.state.convertItems.length > 0 && (
                <>
                  <SectionTitle style={{ marginTop: '1rem' }}>Selected Items</SectionTitle>
                  <div
                    style={{
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      maxHeight: '320px',
                      overflowY: 'auto',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <table className="table table-hover table-sm mb-0" style={{ marginBottom: 0 }}>
                      <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ fontSize: '0.8rem' }}>
                          <th style={{ padding: '0.35rem', textAlign: 'left' }}>Product</th>
                          <th className="text-center" style={{ width: '80px', padding: '0.35rem' }}>Price</th>
                          <th className="text-center" style={{ width: '100px', padding: '0.35rem' }}>Qty</th>
                          <th className="text-end" style={{ width: '90px', padding: '0.35rem' }}>Total</th>
                          <th className="text-center" style={{ width: '70px', padding: '0.35rem' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.convertItems.map(item => (
                          <tr key={item.productId} style={{ fontSize: '0.85rem' }}>
                            <td style={{ padding: '0.35rem', fontWeight: 600 }}>{item.name}</td>
                            <td className="text-center" style={{ padding: '0.35rem' }}>₹{(Number(item.price) || 0).toFixed(2)}</td>
                            <td className="text-center" style={{ padding: '0.35rem' }}>
                              {(() => {
                                const stock = Number(item.stock || 0);
                                const available = stock;
                                return (
                                  <QuantityControl
                                    value={item.quantity}
                                    onIncrease={() => {
                                      const unit = item.unit || 'piece';
                                      const next = getNextQuantity(item.quantity, { unit, stock: available });
                                      this.updateConvertItemQuantity(item.productId, next - item.quantity);
                                    }}
                                    onDecrease={() => {
                                      const unit = item.unit || 'piece';
                                      const prev = getPreviousQuantity(item.quantity, { unit });
                                      this.updateConvertItemQuantity(item.productId, prev - item.quantity);
                                    }}
                                    onChange={(newValue) => this.handleConvertItemQuantityInput(item.productId, newValue)}
                                    unit={item.unit || 'piece'}
                                    stock={available}
                                    title="Adjust quantity"
                                    showStockWarning={true}
                                  />
                                );
                              })()}
                            </td>
                            <td className="text-end fw-bold" style={{ color: '#2E7D32', padding: '0.35rem' }}>₹{(Number(item.total) || 0).toFixed(2)}</td>
                            <td className="text-center" style={{ padding: '0.35rem' }}>
                              <button
                                onClick={() => this.removeConvertItem(item.productId)}
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Remove item"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <GrandTotalSticky style={{ marginTop: '0.8rem' }}>
                    <div className="total-label">Grand Total:</div>
                    <div className="total-value">₹{(Number(this.getConvertGrandTotal()) || 0).toFixed(2)}</div>
                  </GrandTotalSticky>
                </>
              )}

              <ConvertModalActions>
                <button
                  className="save"
                  onClick={this.handleSubmitConvertOrder}
                  disabled={this.state.convertActionLoading}
                >
                  {this.state.convertActionLoading ? '⏳ Saving...' : '✓ Save Order'}
                </button>
                <button
                  className="cancel"
                  onClick={this.closeConvertModal}
                  disabled={this.state.convertActionLoading}
                >
                  Cancel
                </button>
              </ConvertModalActions>
            </ConvertModalFormSection>
          </ConvertModalContent>
        </Modal>
      </Container>
    );
  }
}

export default AdminListOrdersPage;
