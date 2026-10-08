export interface ApiEnvelope<T> {
    statusCode: number;
    message: string;
    data: T;
    success: boolean;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SafeUser {
    id: number;
    email: string;
    created_at: string;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    image_url: string | null;
    quantity: string;
    min_quantity: string;
    base_unit_id: number;
    category: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProductList {
    products: Product[];
    pagination: Pagination;
}

export interface Unit {
    id: number;
    name: string;
    active: number;
    created_at: string;
    updated_at: string;
}

export interface ProductUnit {
    id: number;
    product_id: number;
    unit_id: number;
    unit_name: string;
    conversion_to_base: string;
    is_base: number;
    active: number;
}

export type TransactionFlow = "IN" | "OUT";

export interface Transaction {
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    barcode: string;
    unit_id: number;
    unit_name: string;
    flow: TransactionFlow;
    quantity: string;
    conversion_to_base: string;
    base_quantity: string;
    transaction_date: string;
    remarks: string | null;
    created_at: string;
}

export interface TransactionList {
    transactions: Transaction[];
    pagination: Pagination;
}

export interface RecordedTransaction {
    transactionId: number;
    productId: number;
    unitId: number;
    flow: TransactionFlow;
    quantity: number;
    conversion_to_base: number;
    base_quantity: number;
    new_quantity: number;
}
