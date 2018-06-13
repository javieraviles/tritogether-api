import * as Router from 'koa-router';
import controller = require('./controller');

const router = new Router();

// GENERAL ROUTES
router.get('/', controller.general.helloWorld);
router.get('/jwt', controller.general.getJwtPayload);

// COACH ROUTES
router.get('/coaches', controller.coach.getCoaches);
router.get('/coach/:id', controller.coach.getCoach);
router.post('/coach', controller.coach.createCoach);
router.put('/coach/:id', controller.coach.updateCoach);
router.delete('/coach/:id', controller.coach.deleteCoach);

export { router };