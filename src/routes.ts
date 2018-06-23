import * as Router from 'koa-router';
import controller = require('./controller');

const router = new Router();

// COACH ROUTES
router.get('/coaches', controller.coach.getCoaches);
router.get('/coaches/:id', controller.coach.getCoach);
router.get('/coaches/:id/athletes', controller.coach.getCoachAthletes);
router.post('/coaches', controller.coach.createCoach);
router.put('/coaches/:id', controller.coach.updateCoach);
router.delete('/coaches/:id', controller.coach.deleteCoach);

// ATHLETE ROUTES
router.get('/athletes', controller.athlete.getAthletes);
router.get('/athletes/:id', controller.athlete.getAthlete);
router.post('/athletes', controller.athlete.createAthlete);
router.put('/athletes/:id', controller.athlete.updateAthlete);
router.delete('/athletes/:id', controller.athlete.deleteAthlete);

// ACTIVITY ROUTES
router.get('/athletes/:id/activities', controller.activity.getAthleteActivities);
router.get('/athletes/:athleteId/activities/:activityId', controller.activity.getAthleteActivity);
router.post('athletes/:id/activities', controller.activity.createActivity);

export { router };