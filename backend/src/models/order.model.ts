export interface Order {
  id: number;
  user_id: number;           // Who placed the order
  total_amount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  payment_method: "cash" | "card" | "gcash" | "online";
  payment_status: "pending" | "paid" | "refunded";
  order_type: "dine-in" | "takeout" | "delivery" | "online";
  table_number?: number;     // For dine-in
  delivery_address?: string; // For delivery
  notes?: string; 
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderInput {
  user_id: number;
  total_amount: number;
  payment_method: "cash" | "card" | "gcash" | "online";
  order_type: "dine-in" | "takeout" | "delivery" | "online";
  table_number?: number;
  delivery_address?: string;
  notes?: string;
}