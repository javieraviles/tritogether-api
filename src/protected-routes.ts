import { SwaggerRouter } from "koa-swagger-decorator";
import { coach, athlete, activity, notification } from "./controller";

const protectedRouter = new SwaggerRouter();

// COACH ROUTES
protectedRouter.get("/coaches", coach.getCoaches);
protectedRouter.get("/coaches/:id", coach.getCoach);
protectedRouter.get("/coaches/:id/athletes", coach.getCoachAthletes);
protectedRouter.put("/coaches/:id", coach.updateCoach);
protectedRouter.delete("/coaches/:id", coach.deleteCoach);

// ATHLETE ROUTES
protectedRouter.get("/athletes", athlete.getAthletes);
protectedRouter.get("/athletes/:id", athlete.getAthlete);
protectedRouter.put("/athletes/:id", athlete.updateAthlete);
protectedRouter.put("/athletes/:id/coach", athlete.updateAthleteCoach);
protectedRouter.delete("/athletes/:id", athlete.deleteAthlete);

// ACTIVITY ROUTES
protectedRouter.get("/athletes/:id/activities", activity.getAthleteActivities);
protectedRouter.get("/athletes/:athleteId/activities/:activityId", activity.getAthleteActivity);
protectedRouter.post("/athletes/:id/activities", activity.createActivity);
protectedRouter.put("/athletes/:athleteId/activities/:activityId", activity.updateActivity);
protectedRouter.delete("/athletes/:athleteId/activities/:activityId", activity.deleteActivity);

// NOTIFICATION ROUTES
protectedRouter.get("/athletes/:id/notifications", notification.getAthleteNotifications);
protectedRouter.get("/coaches/:id/notifications", notification.getCoachNotifications);
protectedRouter.post("/athletes/:id/notifications", notification.createNotification);
protectedRouter.put("/athletes/:athleteId/notifications/:notificationId", notification.updateNotification);

// Swagger endpoint
protectedRouter.swagger({
    title: "TriTogether API",
    description: "TriTogether API REST.",
    version: "0.0.2"
});

// mapDir will scan the input dir, and automatically call router.map to all Router Class
protectedRouter.mapDir(__dirname);

export { protectedRouter };