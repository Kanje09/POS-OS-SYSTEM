export interface Customer {
    id: number;
    customer_id: number;
    created_at: Date;
}

export interface CreateCustomer {
    customer_id: number;
}