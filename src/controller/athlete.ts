import { BaseContext } from 'koa';
import { getManager, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Athlete } from '../entity/athlete';
import { Coach } from '../entity/coach';

export default class AthleteController {

    public static async getAthletes (ctx: BaseContext) {

        // get a athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load all athletes
        const athletes: Athlete[] = await athleteRepository.find();

        // lazy load each coach
        for (const athlete of athletes) {
            await athlete.coach;
        }

        // return loaded athletes
        ctx.body = athletes;
    }

    public static async getAthlete (ctx: BaseContext) {

        // get a athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id
        const athlete: Athlete = await athleteRepository.findOne(ctx.params.id);

        // lazy loading coach
        await athlete.coach;

        if (athlete) {
            // return loaded athlete
            ctx.body = athlete;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve doesn\'t exist in the db';
        }

    }

    public static async createAthlete (ctx: BaseContext) {

        // get a athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity athlete to be saved
        const athleteToBeSaved: Athlete = new Athlete();
        athleteToBeSaved.name = ctx.request.body.name;
        athleteToBeSaved.email = ctx.request.body.email;
        // if valid coach specified, relate it.
        if (Boolean(ctx.request.body.coach) && await coachRepository.findOne(ctx.request.body.coach.id)) {
            const coach = new Coach();
            coach.id = ctx.request.body.coach.id;
            athleteToBeSaved.coach = Promise.resolve(coach);
        }

        // validate athlete entity
        const errors: ValidationError[] = await validate(athleteToBeSaved); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else {
            // save the athlete contained in the POST body
            const athlete = await athleteRepository.save(athleteToBeSaved);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = athlete;
        }
    }

    public static async updateAthlete (ctx: BaseContext) {

        // get a athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // check if a athlete with the specified id exists
        if (await athleteRepository.findOne(ctx.params.id)) {
            // update the athlete by specified id
            // build up entity athlete to be updated
            const athleteToBeUpdated: Athlete = new Athlete();
            athleteToBeUpdated.id = +ctx.params.id;
            athleteToBeUpdated.name = ctx.request.body.name;
            athleteToBeUpdated.email = ctx.request.body.email;
            // if valid coach specified, relate it. Else, remove it.
            if (Boolean(ctx.request.body.coach) && await coachRepository.findOne(ctx.request.body.coach.id)) {
                const coach = new Coach();
                coach.id = ctx.request.body.coach.id;
                athleteToBeUpdated.coach = Promise.resolve(coach);
            } else {
                athleteToBeUpdated.coach = Promise.resolve(null);
            }

            // validate athlete entity
            const errors: ValidationError[] = await validate(athleteToBeUpdated); // errors is an array of validation errors

            if (errors.length > 0) {
                // return bad request status code and errors array
                ctx.status = 400;
                ctx.body = errors;
            } else {
                // save the athlete contained in the PUT body
                const athlete = await athleteRepository.save(athleteToBeUpdated);
                // return created status code and updated athlete
                ctx.status = 201;
                ctx.body = athlete;
            }

        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to update doesn\'t exist in the db';
        }

    }

    public static async deleteAthlete (ctx: BaseContext) {

        // get a athlete repository to perform operations with athlete
        const athleteRepository = getManager().getRepository(Athlete);

        // find the athlete by specified id
        const athleteToRemove: Athlete = await athleteRepository.findOne(ctx.params.id);
        if (athleteToRemove) {
            // the athlete is there so can be removed
            await athleteRepository.remove(athleteToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to delete doesn\'t exist in the db';
        }

    }

  }
