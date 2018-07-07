import * as Router from 'koa-router';
import controller = require('./controller');

const unprotectedRouter = new Router();

// AUTH ROUTES
unprotectedRouter.post('/signin', controller.auth.signIn);

// COACH ROUTES
unprotectedRouter.post('/coaches', controller.coach.createCoach);

// ATHLETE ROUTES
unprotectedRouter.post('/athletes', controller.athlete.createAthlete);

export { unprotectedRouter };