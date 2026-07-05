import React from 'react';
import AdminOfflineOrdersPage from './AdminOfflineOrdersPage';
import listOrderService from '../services/listOrderService';
import orderService from '../services/orderService';

/**
 * AdminListOrdersConvertedPage
 * Shows converted list orders from list_orders (status='converted')
 * Reuses AdminOfflineOrdersPage UI with custom data fetcher
 */
class AdminListOrdersConvertedPage extends React.Component {
    constructor(props) {
        super(props);
        // We'll pass the custom fetcher through to AdminOfflineOrdersPage
        this.dataFetcher = this.dataFetcher.bind(this);
    }

    normalizeConvertedListOrder = (listOrder, linkedOrder = null) => {
        const normalizedItems = (Array.isArray(linkedOrder?.items) ? linkedOrder.items : []).map((item) => {
            const price = Number(item?.price || 0) || 0;
            const quantity = Number(item?.quantity || 0) || 0;
            const total = Number(item?.total || (price * quantity) || 0) || 0;

            return {
                ...item,
                productName: item?.productName || item?.name || '',
                name: item?.name || item?.productName || '',
                price,
                quantity,
                total,
            };
        });

        const totalAmount = Number(linkedOrder?.totalAmount || 0) || 0;
        const advanceAmount = Number(linkedOrder?.advanceAmount || 0) || 0;
        const remainingBalance = Number(linkedOrder?.remainingBalance ?? (totalAmount - advanceAmount) ?? 0) || 0;
        const paymentStatus = linkedOrder?.paymentStatus || 'Unpaid';
        const orderDate = linkedOrder?.orderDate || listOrder?.updatedAt || listOrder?.createdAt || null;

        const linkedStatus = String(linkedOrder?.status || '').trim().toLowerCase();
        const isActiveConverted = !['completed', 'rejected'].includes(linkedStatus);

        return {
            id: listOrder.id,
            orderId: listOrder.id,
            serialNumber: listOrder.id,
            listOrderId: listOrder.id,
            linkedOrderId: linkedOrder?.id || listOrder.offlineOrderId || null,
            customerName: listOrder.customerName,
            phone: listOrder.phone,
            place: listOrder.place || linkedOrder?.place || '',
            address: linkedOrder?.address || '',
            orderDate,
            totalAmount,
            advanceAmount,
            remainingBalance,
            paymentStatus,
            status: linkedOrder?.status || 'Pending',
            orderType: linkedOrder?.orderType || 'Offline',
            type: linkedOrder?.type || 'list_converted',
            origin: linkedOrder?.origin || 'list_orders',
            offlineOrderId: listOrder.offlineOrderId || linkedOrder?.id || null,
            isConverted: true,
            isVerified: Boolean(linkedOrder?.isVerified),
            isPaid: Boolean(linkedOrder?.isPaid),
            isDelivered: Boolean(linkedOrder?.isDelivered),
            isArchived: Boolean(linkedOrder?.isArchived),
            items: normalizedItems,
            imagePath: listOrder.imagePath || '',
            imagePaths: Array.isArray(listOrder.imagePaths) ? listOrder.imagePaths : [],
            imageFileName: listOrder.imageFileName,
            notes: listOrder.notes,
            isActiveConverted,
        };
    };

    fetchLinkedOrders = async (offlineOrderIds) => {
        const linkedOrders = {};
        await Promise.all(
            offlineOrderIds.map(async (orderId) => {
                try {
                    const response = await orderService.getOrderById(orderId);
                    const order = response?.order || response?.data?.order || response?.data || response || null;
                    if (order) linkedOrders[orderId] = order;
                } catch {
                    linkedOrders[orderId] = null;
                }
            })
        );
        return linkedOrders;
    };

    // Custom fetcher for converted list orders
    dataFetcher = async (searchQuery) => {
        try {
            const filters = { status: 'converted' };
            if (searchQuery && String(searchQuery).trim()) {
                filters.customerName = String(searchQuery).trim();
            }

            const response = await listOrderService.getAllListOrders(filters);
            const listOrders = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.orders)
                ? response.orders
                : [];

            const offlineOrderIds = Array.from(
                new Set(
                    listOrders
                        .map((listOrder) => Number(listOrder.offlineOrderId || 0))
                        .filter((id) => id > 0)
                )
            );

            const linkedOrdersMap = await this.fetchLinkedOrders(offlineOrderIds);

            return listOrders
                .map((listOrder) => {
                const linkedOrder = listOrder.offlineOrderId ? linkedOrdersMap[Number(listOrder.offlineOrderId)] : null;
                return this.normalizeConvertedListOrder(listOrder, linkedOrder);
                })
                .filter((order) => Boolean(order?.id) && order.isActiveConverted !== false);
        } catch (error) {
            console.error('Failed to fetch converted list orders:', error);
            return [];
        }
    }

    render() {
        // Reuse AdminOfflineOrdersPage but override fetchOfflineOrders method
        const fetchConvertedOrders = this.dataFetcher;
        const PageComponent = class extends AdminOfflineOrdersPage {
            getPageTitle = () => '📋 Converted List Orders';

            getPageCountLabel = () => 'converted order(s)';

            getPageSubtitle = () => 'Active converted list orders waiting for payment and completion';

            getPageEmptyTitle = () => 'No Converted List Orders';

            getPageEmptyMessage = () => 'Converted list orders will appear here while they are being processed.';

            getPageLoadingText = () => 'Loading converted list orders...';

            getPageCreateButtonVisible = () => false;

            getPageEmptyIcon = () => '📋';

            getOrderDetailsTitle = () => '📋 Converted List Order';

            getOrderTypeBadgeLabel = (order) => {
                const status = String(order?.status || '').trim().toLowerCase();
                const type = String(order?.type || '').trim().toLowerCase();
                return (status === 'converted' || type === 'list_converted') ? 'LIST' : 'ORDER';
            };

            fetchOfflineOrders = async () => {
                this.setState({ loading: true, isLoading: true });
                try {
                    const orders = await fetchConvertedOrders(this.state.searchQuery);
                    const nextAdvanceInputs = {};
                    const nextReturnInputs = {};
                    orders.forEach((o) => {
                        if (o?.id) {
                            nextAdvanceInputs[o.id] = '';
                            nextReturnInputs[o.id] = '';
                        }
                    });

                    this.setState({
                        offlineOrders: orders,
                        advanceInputs: nextAdvanceInputs,
                        returnInputs: nextReturnInputs,
                        errorKey: null,
                        loading: false,
                        isLoading: false,
                        // DO NOT reset checkedItems - preserve selections for open modal (especially after Mark Paid/Delivered)
                        // When modal closes and reopens, openModal will restore from DB isSelected flags
                    });
                } catch (err) {
                    this.setState({ errorKey: 'failedToLoadOrders', loading: false, isLoading: false });
                }
            };

            componentDidMount() {
                // Call custom fetcher instead of default
                this.fetchOfflineOrders();
                this.fetchProducts?.();
            }
        };

        return <PageComponent />;
    }
}

export default AdminListOrdersConvertedPage;
