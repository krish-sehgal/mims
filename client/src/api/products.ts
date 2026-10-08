import { apiRequest } from "./client";
import type { Product, ProductList } from "./types";

export interface ProductInput {
    name: string;
    sku: string;
    barcode: string;
    base_unit_id: number;
    quantity?: number;
    min_quantity?: number;
    image_url?: string | null;
    category?: string | null;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function listProducts(params: ProductListParams = {}) {
    return apiRequest<ProductList>("/product", {
        query: { page: params.page, limit: params.limit, search: params.search }
    });
}

export function getProduct(id: number) {
    return apiRequest<Product>(`/product/${id}`);
}

export function createProduct(input: ProductInput) {
    return apiRequest<Product>("/product", { method: "POST", body: input });
}

export function updateProduct(id: number, input: Partial<ProductInput>) {
    return apiRequest<Product>(`/product/${id}`, { method: "PUT", body: input });
}
