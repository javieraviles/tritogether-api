import { BaseContext } from 'koa';
import { getManager, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Activity } from '../entity/activity';
import { Discipline } from '../entity/discipline';
import { Athlete } from '../entity/athlete';

export default class ActivityController {

    public static async getAthleteActivities(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        // can't assume either that the athlete will exist
        let coachId: number = null;
        let athlete: Athlete = new Athlete();
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ['coach'] })) {
            coachId = athlete.coach ? athlete.coach.id : null;
        }

        if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve activities from doesn\'t exist in the db';
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
            || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A collection of activities can only be retrieved by the owner athlete or its current coach';
        } else {
            // load activities for the specified athlete
            const activities: Activity[] = await activityRepository.find({
                relations: ['discipline'],
                where: { athlete: +ctx.params.id || 0 },
                order: {
                    date: ctx.query.order === 'ASC' ? 'ASC' : 'DESC'
                },
                skip: +ctx.query.skip || 0,
                take: +ctx.query.take || 10
            });
            // return loaded collection of activities
            ctx.status = 200;
            ctx.body = activities;
        }
    }

    public static async getCountAthleteActivities(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        // can't assume either that the athlete will exist
        let coachId: number = null;
        let athlete: Athlete = new Athlete();
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ['coach'] })) {
            coachId = athlete.coach ? athlete.coach.id : null;
        }

        if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve count of activities from doesn\'t exist in the db';
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
            || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'Count of activities can only be retrieved by the owner athlete or its current coach';
        } else {
            // Counts activities for the specified athlete
            const count: Number = await activityRepository.count({
                where: { athlete: +ctx.params.id || 0 }
            });
            // return count of activities for specified athlete
            ctx.status = 200;
            ctx.body = count;
        }
    }

    public static async getAthleteActivity(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load activity for the specified activityId
        const activity: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ['athlete', 'discipline'] });

        // load activity athlete with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        // can't assume either that the athlete will exist
        let coachId: number = null;
        let athlete: Athlete = new Athlete();
        if (athlete = await athleteRepository.findOne(+ctx.params.athleteId || 0, { relations: ['coach'] })) {
            coachId = athlete.coach ? athlete.coach.id : null;
        }

        if (!activity) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The activity you are trying to retrieve doesn\'t exist in the db';
        } else if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve the activity from doesn\'t exist in the db';
        } else if (athlete.id !== activity.athlete.id) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The specified athlete is not the owner of the activity';
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
            || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete
            // or the current athlete's coach related to the activity
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be retrieved by the owner athlete or its current coach';
        } else {
            // return loaded activity
            ctx.status = 200;
            ctx.body = activity;
        }
    }

    public static async createActivity(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a discipline repository to perform operations with discipline
        const disciplineRepository: Repository<Discipline> = getManager().getRepository(Discipline);

        // build up entity activity to be saved
        const activityToBeSaved: Activity = new Activity();
        activityToBeSaved.description = ctx.request.body.description;
        activityToBeSaved.date = new Date(ctx.request.body.date);

        // if valid athlete specified, relate it.
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        let athlete: Athlete = new Athlete();
        let coachId: number = null;
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ['coach'] })) {
            activityToBeSaved.athlete = athlete;
            coachId = activityToBeSaved.athlete.coach ? activityToBeSaved.athlete.coach.id : null;
        }

        // if valid discipline specified, relate it.
        let discipline: Discipline = new Discipline();
        if (ctx.request.body.discipline && (discipline = await disciplineRepository.findOne(+ctx.request.body.discipline.id || 0))) {
            activityToBeSaved.discipline = discipline;
        }

        // validate activity entity
        const errors: ValidationError[] = await validate(activityToBeSaved); // errors is an array of validation errors

        if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to create activities for doesn\'t exist in the db';
        } else if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (+ctx.state.user.id !== (coachId) || (ctx.state.user.rol !== 'coach')) {
            // check token is from a coach and its id and athlete's coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be created by the coach of the specified athlete';
        } else {
            // save the activity contained in the POST body
            const activity: Activity = await activityRepository.save(activityToBeSaved);
            // return created status code and created activity
            ctx.status = 201;
            ctx.body = activity;
        }
    }

    public static async updateActivity(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get a discipline repository to perform operations with discipline
        const disciplineRepository: Repository<Discipline> = getManager().getRepository(Discipline);

        // retrieve original activity
        const activity: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ['athlete', 'athlete.coach'] });

        // update the activity by specified id
        // build up entity activity to be updated
        const activityToBeUpdated: Activity = new Activity();
        activityToBeUpdated.id = +ctx.params.activityId || 0;
        activityToBeUpdated.description = ctx.request.body.description;
        activityToBeUpdated.date = new Date(ctx.request.body.date);
        activityToBeUpdated.athlete = activity ? activity.athlete : null;

        // if valid discipline specified, relate it.
        let discipline: Discipline = new Discipline();
        if (ctx.request.body.discipline && (discipline = await disciplineRepository.findOne(+ctx.request.body.discipline.id || 0))) {
            activityToBeUpdated.discipline = discipline;
        }

        // validate activity entity
        const errors: ValidationError[] = await validate(activityToBeUpdated); // errors is an array of validation errors

        if (!activity) {
            // check if an activity with the specified activityId exists
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The activity you are trying to update doesn\'t exist in the db';
        } else if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ((+ctx.params.athleteId || 0) != activity.athlete.id) {
            // check if the athlete didn't change for the activity
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The specified athlete and the owner athlete of the activity are not the same';
        } else if ((!activity.athlete.coach) || +ctx.state.user.id !== (activity.athlete.coach.id) || (ctx.state.user.rol !== 'coach')) {
            // check token is from a coach and its id and athlete's coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be updated by the coach of the owner athlete';
        } else {
            // update the activity contained in the PUT body
            const activity: Activity = await activityRepository.save(activityToBeUpdated);
            // return created status code and updated activity
            ctx.status = 201;
            ctx.body = activity;
        }

    }

    public static async deleteActivity(ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // find the activity by specified activityId
        const activityToRemove: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ['athlete', 'athlete.coach'] });
        if (!activityToRemove) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The activity you are trying to delete doesn\'t exist in the db';
        } else if ((+ctx.params.athleteId || 0) != activityToRemove.athlete.id) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are specifying and the owner of the activity are not the same';
        } else if ((!activityToRemove.athlete.coach) || (+ctx.state.user.id !== activityToRemove.athlete.coach.id) || (ctx.state.user.rol !== 'coach')) {
            // check token is from a coach and its id and coach athlete id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be deleted by the coach of the owner athlete';
        } else {
            // the athlete is there so can be removed
            await activityRepository.remove(activityToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

}
