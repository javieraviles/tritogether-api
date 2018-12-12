import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export interface IConfig {
    port: number;
    debugLogging: boolean;
    dbsslconn: boolean;
    jwtSecret: string;
    jwtExpiration: string;
    authSalt: number;
    databaseUrl: string;
}

const config: IConfig = {
    port: +process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == 'development',
    dbsslconn: process.env.NODE_ENV != 'development',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-whatever',
    jwtExpiration: process.env.JWT_EXPIRATION || '30 days',
    authSalt: Number(process.env.AUTH_SALT) || 8,
    databaseUrl: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/apidb'
};

export { config };