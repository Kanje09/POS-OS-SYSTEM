export interface orderitem {
    id: number;
    order_id: number;
    product_id: number;

    name: string;
    quantity: number;
    price: number;
    total_price: number;
    created_at: Date;
}

