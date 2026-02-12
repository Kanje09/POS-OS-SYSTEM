import dotenv from 'dotenv';

dotenv.config();

export const config = {
    //Server configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'production',

    DB_HOST: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || 'LzdDvqNELPxaknLmsydfriCOyOkCntMz',
    DB_NAME: process.env.DB_NAME || 'myposdb',
    DB_PORT: parseInt(process.env.DB_PORT || '28153'),
    ssl: false,

    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

    CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5000'],
};