import Router from "@koa/router";
import { auth, coach, athlete } from "./controller";

const unprotectedRouter = new Router();

// AUTH ROUTES
unprotectedRouter.post("/signin", auth.signIn);
unprotectedRouter.post("/reset-password", auth.resetPassword);
unprotectedRouter.put("/change-password", auth.changePassword);

// COACH ROUTES
unprotectedRouter.post("/coaches", coach.createCoach);

// ATHLETE ROUTES
unprotectedRouter.post("/athletes", athlete.createAthlete);

export { unprotectedRouter };