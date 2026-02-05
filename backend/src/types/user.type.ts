//User model (for cashiers, admins, customers)
export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: "Admin" | "Cashier" | "Customer";
    created_at: Date;
    updated_at: Date;
}

//For creating a new user (password optional during creation)
export interface CreateUserInput {
    username: string;
    email: string;
    password: string;
    role: "Admin" | "Cashier" | "Customer";
}

export interface LoginInput {
    email: string;
    password: string;
}
