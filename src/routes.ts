import * as Router from 'koa-router';
import controller = require('./controller');

const router = new Router();

// COACH ROUTES
router.get('/coaches', controller.coach.getCoaches);
router.get('/coach/:id', controller.coach.getCoach);
router.get('/coach/:id/athletes', controller.coach.getCoachWithAthletes);
router.post('/coach', controller.coach.createCoach);
router.put('/coach/:id', controller.coach.updateCoach);
router.delete('/coach/:id', controller.coach.deleteCoach);

// ATHLETE ROUTES
router.get('/athletes', controller.athlete.getAthletes);
router.get('/athlete/:id', controller.athlete.getAthlete);
router.post('/athlete', controller.athlete.createAthlete);
router.put('/athlete/:id', controller.athlete.updateAthlete);
router.delete('/athlete/:id', controller.athlete.deleteAthlete);

export { router };