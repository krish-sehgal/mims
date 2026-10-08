import { apiRequest } from "./client";
import type { ProductUnit } from "./types";

export function listProductUnits(productId: number) {
    return apiRequest<{ units: ProductUnit[] }>(`/product/${productId}/units`);
}

export function addProductUnit(productId: number, unitId: number, conversionToBase: number) {
    return apiRequest<ProductUnit>(`/product/${productId}/units`, {
        method: "POST",
        body: { unit_id: unitId, conversion_to_base: conversionToBase }
    });
}

export function updateProductUnit(
    productId: number,
    unitId: number,
    input: { conversion_to_base?: number; active?: boolean }
) {
    return apiRequest<ProductUnit>(`/product/${productId}/units/${unitId}`, {
        method: "PATCH",
        body: input
    });
}

export function deleteProductUnit(productId: number, unitId: number) {
    return apiRequest<null>(`/product/${productId}/units/${unitId}`, { method: "DELETE" });
}
