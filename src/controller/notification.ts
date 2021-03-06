import { BaseContext } from "koa";
import { getManager, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { Athlete, Coach, NotificationStatus, Notification, notificationSchema, Rol } from "../entity";

@responsesAll({ 200: { description: "success", }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Notification"])
export default class NotificationController {

    @request("get", "/athletes/{id}/notifications")
    @summary("Find notifications for a specific athlete")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    public static async getAthleteNotifications(ctx: BaseContext) {

        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        const athlete: Athlete = await athleteRepository.findOne(+ctx.params.id || 0);

        if (!athlete) {
            ctx.status = 404;
            ctx.message = "The athlete you are trying to retrieve notifications from doesn't exist in the db";
        } else if ((+ctx.state.user.id !== athlete.id) || (ctx.state.user.rol !== Rol.ATHLETE)
        ) {
            // check if the token of the user performing the request is not the athlete itself
            ctx.status = 403;
            ctx.message = "Notifications can only be retrieved by the owner athlete";
        } else {
            const notifications: Notification[] = await notificationRepository.find({
                relations: ["athlete", "coach"],
                where: { athlete: +ctx.params.id || 0, status: NotificationStatus.PENDING }
            });
            ctx.status = 200;
            ctx.body = notifications;
        }
    }

    @request("get", "/coaches/{id}/notifications")
    @summary("Find notifications for a specific coach")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async getCoachNotifications(ctx: BaseContext) {

        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        const coach: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (!coach) {
            ctx.status = 404;
            ctx.message = "The coach you are trying to retrieve notifications from doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coach.id) || (ctx.state.user.rol !== Rol.COACH)
        ) {
            // check if the token of the user performing the request is not the coach itself
            ctx.status = 403;
            ctx.message = "Notifications can only be retrieved by the owner coach";
        } else {
            const notifications: Notification[] = await notificationRepository.find({
                relations: ["athlete", "coach"],
                where: { coach: +ctx.params.id || 0, status: NotificationStatus.PENDING }
            });
            ctx.status = 200;
            ctx.body = notifications;
        }
    }

    @request("post", "/athletes/{id}/notifications")
    @summary("Create a notification")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    @body(notificationSchema)
    public static async createNotification(ctx: BaseContext) {

        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // new notifications will always have status PENDING
        // only athletes are able to create notifications
        const notificationToBeSaved: Notification = new Notification();
        notificationToBeSaved.status = NotificationStatus.PENDING;

        // if valid athlete specified, relate it.
        let athlete: Athlete = null;
        let athleteId = 0;
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0)) {
            notificationToBeSaved.athlete = athlete;
            athleteId = athlete.id;
        }

        // if valid coach specified, relate it.
        let coach: Coach = null;
        if (ctx.request.body.coach && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            notificationToBeSaved.coach = coach;
        }
        const errors: ValidationError[] = await validate(notificationToBeSaved, { validationError: { target: false } });

        if (!athlete || !coach) {
            ctx.status = 400;
            ctx.message = "The athlete/coach you are trying to create notifications for doesn't exist in the db";
        } else if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if (+ctx.state.user.id !== athleteId || (ctx.state.user.rol !== Rol.ATHLETE)) {
            // check token is from an athlete and its id and athlete's id are the same
            ctx.status = 403;
            ctx.message = "A notification can only be created by the specified athlete";
        } else {
            const notification: Notification = await notificationRepository.save(notificationToBeSaved);
            ctx.status = 201;
            ctx.body = notification;
        }
    }

    @request("put", "/athletes/{athleteId}/notifications/{notificationId}")
    @summary("Update a notification")
    @path({
        athleteId: { type: "number", required: true, description: "id of athlete" },
        notificationId: { type: "number", required: true, description: "id of notification" },
    })
    @body(notificationSchema)
    public static async updateNotification(ctx: BaseContext) {

        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        const notification: Notification = await notificationRepository.findOne(+ctx.params.notificationId || 0, { relations: ["athlete", "coach"] });

        // validate if status is contained in ENUM
        const notificationToBeUpdated: Notification = new Notification();
        notificationToBeUpdated.id = +ctx.params.notificationId || 0;
        notificationToBeUpdated.status = ctx.request.body.status in NotificationStatus ? ctx.request.body.status : "";
        notificationToBeUpdated.athlete = notification ? notification.athlete : null;
        notificationToBeUpdated.coach = notification ? notification.coach : null;

        const errors: ValidationError[] = await validate(notificationToBeUpdated, { validationError: { target: false } });

        if (!notification) {
            ctx.status = 404;
            ctx.message = "The notification you are trying to update doesn't exist in the db";
        } else if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if (((+ctx.params.athleteId || 0) != notification.athlete.id)
            || ((+ctx.request.body.coach.id || 0) != notification.coach.id)) {
            // check if the athlete and coach didn't change for the notification
            ctx.status = 400;
            ctx.message = "The specified athlete/coach is not the same as the original athlete/coach in the notification";
        } else if (((+ctx.state.user.id !== notification.athlete.id) && (ctx.state.user.rol === Rol.ATHLETE))
            || ((+ctx.state.user.id !== notification.coach.id) && (ctx.state.user.rol === Rol.COACH))) {
            // check token is from the implied coach or the athlete owner of the notification
            ctx.status = 403;
            ctx.message = "A notification can only be updated by the owner athlete or the coach implied";
        } else {
            const notification: Notification = await notificationRepository.save(notificationToBeUpdated);
            ctx.status = 201;
            ctx.body = notification;
        }

    }

}
