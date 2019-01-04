import { BaseContext } from 'koa';
import { getManager, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Notification } from '../entity/notification';
import { Athlete } from '../entity/athlete';
import { Coach } from '../entity/coach';
import { NotificationStatus } from '../entity/notificationStatus';

export default class NotificationController {

    public static async getAthleteNotifications(ctx: BaseContext) {

        // get a notification repository to perform operations with notification
        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id,can't assume the athlete will exist
        const athlete: Athlete = await athleteRepository.findOne(+ctx.params.id || 0);

        if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve notifications from doesn\'t exist in the db';
        } else if ((+ctx.state.user.id !== athlete.id) || (ctx.state.user.rol !== 'athlete')
        ) {
            // check if the token of the user performing the request is not the athlete itself
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'Notifications can only be retrieved by the owner athlete';
        } else {
            // load notifications for the specified athlete
            const notifications: Notification[] = await notificationRepository.find({
                relations: ['athlete', 'coach'],
                where: { athlete: +ctx.params.id || 0, status: NotificationStatus.PENDING }
            });
            // return loaded collection of notifications
            ctx.status = 200;
            ctx.body = notifications;
        }
    }

    public static async getCoachNotifications(ctx: BaseContext) {

        // get a notification repository to perform operations with notification
        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load coach by id,can't assume the coach will exist
        const coach: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (!coach) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to retrieve notifications from doesn\'t exist in the db';
        } else if ((+ctx.state.user.id !== coach.id) || (ctx.state.user.rol !== 'coach')
        ) {
            // check if the token of the user performing the request is not the coach itself
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'Notifications can only be retrieved by the owner coach';
        } else {
            // load notifications for the specified coach
            const notifications: Notification[] = await notificationRepository.find({
                relations: ['athlete', 'coach'],
                where: { coach: +ctx.params.id || 0, status: NotificationStatus.PENDING }
            });
            // return loaded collection of notifications
            ctx.status = 200;
            ctx.body = notifications;
        }
    }

    public static async createNotification(ctx: BaseContext) {

        // get a notification repository to perform operations with notification
        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity notification to be saved
        // new notifications will always have status PENDING
        // only athletes are able to create notifications
        const notificationToBeSaved: Notification = new Notification();
        notificationToBeSaved.status = NotificationStatus.PENDING;

        // if valid athlete specified, relate it.
        let athlete: Athlete = new Athlete();
        let athleteId: number = 0;
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0)) {
            notificationToBeSaved.athlete = athlete;
            athleteId = athlete.id;
        }

        // if valid coach specified, relate it.
        let coach: Coach = new Coach();
        if (ctx.request.body.coach && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            notificationToBeSaved.coach = coach;
        }
        // validate notification entity
        const errors: ValidationError[] = await validate(notificationToBeSaved); // errors is an array of validation errors

        if (!athlete || !coach) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete/coach you are trying to create notifications for doesn\'t exist in the db';
        } else if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (+ctx.state.user.id !== athleteId || (ctx.state.user.rol !== 'athlete')) {
            // check token is from an athlete and its id and athlete's id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A notification can only be created by the specified athlete';
        } else {
            // save the notification contained in the POST body
            const notification: Notification = await notificationRepository.save(notificationToBeSaved);
            // return created status code and created notification
            ctx.status = 201;
            ctx.body = notification;
        }
    }

    public static async updateNotification(ctx: BaseContext) {

        // get a notification repository to perform operations with notification
        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        // retrieve original notification
        const notification: Notification = await notificationRepository.findOne(+ctx.params.notificationId || 0, { relations: ['athlete', 'coach'] });

        // update the notification by specified id
        // build up entity notification to be updated
        // validate if status is contained in ENUM
        const notificationToBeUpdated: Notification = new Notification();
        notificationToBeUpdated.id = +ctx.params.notificationId || 0;
        notificationToBeUpdated.status = ctx.request.body.status in NotificationStatus ? ctx.request.body.status : '';
        notificationToBeUpdated.athlete = notification ? notification.athlete : null;
        notificationToBeUpdated.coach = notification ? notification.coach : null;

        // validate notification entity
        const errors: ValidationError[] = await validate(notificationToBeUpdated); // errors is an array of validation errors

        if (!notification) {
            // check if a notification with the specified notificationId exists
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The notification you are trying to update doesn\'t exist in the db';
        } else if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (((+ctx.params.athleteId || 0) != notification.athlete.id)
            || ((+ctx.request.body.coach.id || 0) != notification.coach.id)) {
            // check if the athlete and coach didn't change for the notification
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The specified athlete/coach is not the same as the original athlete/coach in the notification';
        } else if (((+ctx.state.user.id !== notification.athlete.id) && (ctx.state.user.rol === 'athlete'))
            || ((+ctx.state.user.id !== notification.coach.id) && (ctx.state.user.rol === 'coach'))) {
            // check token is from the implied coach or the athlete owner of the notification
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A notification can only be updated by the owner athlete or the coach implied';
        } else {
            // update the notification contained in the PUT body
            const notification: Notification = await notificationRepository.save(notificationToBeUpdated);
            // return created status code and updated notification
            ctx.status = 201;
            ctx.body = notification;
        }

    }

}
