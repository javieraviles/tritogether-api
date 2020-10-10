import Koa from "koa";
import jwt from "koa-jwt";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import winston from "winston";
import { createConnection } from "typeorm";
import "reflect-metadata";

import { logger } from "./logger";
import { config } from "./config";
import { unprotectedRouter } from "./unprotected-routes";
import { protectedRouter } from "./protected-routes";

createConnection({
    type: "postgres",
    url: config.databaseUrl,
    synchronize: true,
    logging: false,
    entities: config.dbEntitiesPath,
    extra: {
        ssl: config.dbsslconn, // if not development, will use SSL
    }
}).then(async () => {

    const app = new Koa();

    app.use(helmet());
    app.use(cors());
    app.use(logger(winston));
    app.use(bodyParser());
    // these routes are NOT protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".
    app.use(unprotectedRouter.routes()).use(unprotectedRouter.allowedMethods());
    // JWT middleware -> below this line routes are only reached if JWT token is valid
    app.use(jwt({ secret: config.jwtSecret }).unless({ path: [/^\/swagger-/] }));
    app.use(protectedRouter.routes()).use(protectedRouter.allowedMethods());

    app.listen(config.port);

    console.log(`Server running on port ${config.port}`);

}).catch((error: string) => console.log("TypeORM connection error: ", error));