export interface OrderItem {
  id: number;
  order_id: number;          // Which order this belongs to
  product_id: number;        // Which product
  quantity: number;
  price: number;             // Price at time of order
  total: number;             // quantity × price
  created_at: Date;
}

export interface CreateOrderItemInput {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}