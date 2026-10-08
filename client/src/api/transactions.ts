import { apiRequest } from "./client";
import type { RecordedTransaction, Transaction, TransactionFlow, TransactionList } from "./types";

export interface TransactionListParams {
    product_id?: number;
    flow?: TransactionFlow;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export interface RecordTransactionInput {
    product_id: number;
    flow: TransactionFlow;
    quantity: number;
    unit_id?: number;
    transaction_date?: string;
    remarks?: string;
}

export function listTransactions(params: TransactionListParams = {}) {
    return apiRequest<TransactionList>("/transaction", { query: { ...params } });
}

export function getTransaction(id: number) {
    return apiRequest<Transaction>(`/transaction/${id}`);
}

export function recordTransaction(input: RecordTransactionInput) {
    return apiRequest<RecordedTransaction>("/transaction", { method: "POST", body: input });
}
