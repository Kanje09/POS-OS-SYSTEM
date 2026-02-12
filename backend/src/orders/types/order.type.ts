export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "gcash";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface CreateOrderItemInput {
  product_id?: number;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  customer_id?: number
  payment_method?: PaymentMethod;
  items: CreateOrderItemInput[];
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number | null;
  name: string;
  quantity: number;
  price: number;
  total_price: number;
  created_at: string;
}

export interface OrderRow {
  id: number;
  customer_id: number | null;
  pickup_code: string;
  order_number: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    total_price: number;
  }>;
}
