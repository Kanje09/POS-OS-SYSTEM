export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    stock: number;
    image_url?: string;
    is_available: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateProductInput {
    name: string;
    description?: string;
    price: number;
    category: string;
    stock: number;
    image_url?: string;
}
