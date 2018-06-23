import { BaseContext } from 'koa';
import { getManager, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Activity } from '../entity/activity';
import { Discipline } from '../entity/discipline';
import { Athlete } from '../entity/athlete';

export default class ActivityController {

    public static async getAthleteActivities (ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        let coachId: number = null;
        const athlete: Athlete = await athleteRepository.findOne(ctx.params.id, { relations: ['coach'] });
        coachId = athlete.coach ? athlete.coach.id : null;

        if ( !athlete ) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve activities from doesn\'t exist in the db';
        } else if ( ((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
                    || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A collection of activities can only be displayed by the owner athlete or its current coach';
        } else {
            // load activities for the specified athlete
            const activities: Activity[] = await activityRepository.find({
                relations: ['discipline'],
                where: { athlete: ctx.params.id },
                order: {
                    date: ctx.query.order
                },
                skip: ctx.query.skip,
                take: ctx.query.take
            });
            // return loaded collection of activities
            ctx.status = 200;
            ctx.body = activities;
        }
    }

    public static async getAthleteActivity (ctx: BaseContext) {

        // get an activity repository to perform operations with activity
        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load activity for the specified activityId
        const activity: Activity = await activityRepository.findOne(ctx.params.activityId, { relations: ['athlete', 'discipline'] });

        // load activity athlete with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        let coachId: number = null;
        const athlete: Athlete = await athleteRepository.findOne(ctx.params.activityId, { relations: ['coach'] });
        coachId = athlete.coach ? athlete.coach.id : null;

        if ( !activity ) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The activity you are trying to retrieve doesn\'t exist in the db';
        } else if ( !athlete ) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve the activity from doesn\'t exist in the db';
        } else if (athlete.id !== activity.athlete.id) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The specified athlete is not the owner of the activity';
        } else if ( ((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
                    || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete
            // or the current athlete's coach related to the activity
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be displayed by the owner athlete or its current coach';
        } else {
            // return loaded activity
            ctx.status = 200;
            ctx.body = activity;
        }
    }

    public static async createActivity (ctx: BaseContext) {

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
        if (Boolean(ctx.request.body.athlete) && (athlete = await athleteRepository.findOne(ctx.params.id, { relations: ['coach'] })) ) {
            activityToBeSaved.athlete = athlete;
            coachId = activityToBeSaved.athlete.coach ? activityToBeSaved.athlete.coach.id : null;
        }

        // if valid discipline specified, relate it.
        let discipline: Discipline = new Discipline();
        if (Boolean(ctx.request.body.discipline) && (discipline = await disciplineRepository.findOne(ctx.request.body.discipline.id)) ) {
            activityToBeSaved.discipline = discipline;
        }

        // validate activity entity
        const errors: ValidationError[] = await validate(activityToBeSaved); // errors is an array of validation errors

         if ( !athlete ) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve activities from doesn\'t exist in the db';
         } else if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ( +ctx.state.user.id !== ( coachId ) || (ctx.state.user.rol !== 'coach') ) {
            // check token is from a coach and its id and athlete's coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An activity can only be created by the coach of the specified athlete';
        } else {
            // save the activity contained in the POST body
            const activity: Activity = await activityRepository.save(activityToBeSaved);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = activity;
        }
    }

}
