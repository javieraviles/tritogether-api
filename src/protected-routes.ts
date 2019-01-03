import * as Router from 'koa-router';
import controller = require('./controller');

const protectedRouter = new Router();

// COACH ROUTES
protectedRouter.get('/coaches', controller.coach.getCoaches);
protectedRouter.get('/coaches/:id', controller.coach.getCoach);
protectedRouter.get('/coaches/:id/athletes', controller.coach.getCoachAthletes);
protectedRouter.put('/coaches/:id', controller.coach.updateCoach);
protectedRouter.delete('/coaches/:id', controller.coach.deleteCoach);

// ATHLETE ROUTES
protectedRouter.get('/athletes', controller.athlete.getAthletes);
protectedRouter.get('/athletes/:id', controller.athlete.getAthlete);
protectedRouter.put('/athletes/:id', controller.athlete.updateAthlete);
protectedRouter.put('/athletes/:id/coach', controller.athlete.updateAthleteCoach);
protectedRouter.delete('/athletes/:id', controller.athlete.deleteAthlete);

// ACTIVITY ROUTES
protectedRouter.get('/athletes/:id/activities', controller.activity.getAthleteActivities);
protectedRouter.get('/athletes/:id/activities/count', controller.activity.getCountAthleteActivities);
protectedRouter.get('/athletes/:athleteId/activities/:activityId', controller.activity.getAthleteActivity);
protectedRouter.post('/athletes/:id/activities', controller.activity.createActivity);
protectedRouter.put('/athletes/:athleteId/activities/:activityId', controller.activity.updateActivity);
protectedRouter.delete('/athletes/:athleteId/activities/:activityId', controller.activity.deleteActivity);

// NOTIFICATION ROUTES
protectedRouter.get('/athletes/:id/notifications', controller.notification.getAthleteNotifications);
protectedRouter.get('/coaches/:id/notifications', controller.notification.getCoachNotifications);
protectedRouter.post('/athletes/:id/notifications', controller.notification.createNotification);
protectedRouter.put('/athletes/:athleteId/notifications/:notificationId', controller.notification.updateNotification);

export { protectedRouter };