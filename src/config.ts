import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

export interface Config {
    port: number;
    debugLogging: boolean;
    dbsslconn: boolean;
    jwtSecret: string;
    jwtExpiration: string;
    authSalt: number;
    databaseUrl: string;
    dbEntitiesPath: string[];
    dbMigrationsTableName: string;
    dbMigrationsPath: string[];
}

const isDevMode = process.env.NODE_ENV == "development";

const config: Config = {
    port: +(process.env.PORT || 3000),
    debugLogging: isDevMode,
    dbsslconn: !isDevMode,
    jwtSecret: process.env.JWT_SECRET || "your-secret-whatever",
    jwtExpiration: process.env.JWT_EXPIRATION || "30 days",
    authSalt: Number(process.env.AUTH_SALT) || 8,
    databaseUrl: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/apidb",
    dbEntitiesPath: [
        ...isDevMode ? ["src/entity/**/*.ts"] : ["dist/entity/**/*.js"],
    ],
    dbMigrationsTableName: process.env.DB_MIGRATIONS_TABLENAME || "migrations",
    dbMigrationsPath: [
        ...isDevMode ? ["src/migration/*.ts"] : ["dist/migration/*.js"],
    ]
};

export { config };
