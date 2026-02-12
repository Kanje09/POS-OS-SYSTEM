//User model (for cashiers, admins, customers)
export interface Users {
    id: number;
    staff_id: string;
    password: string;
    name: string;
    role: "Admin" | "Cashier";
    created_at: Date;
    updated_at: Date;
}

export interface LoginInput {
    staff_id: string;
    password: string;
}
