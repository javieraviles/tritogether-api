import { BaseContext } from 'koa';
import { getManager, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Coach } from '../entity/coach';

export default class CoachController {

    public static async getCoaches (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load all coaches
        const coaches: Coach[] = await coachRepository.find();

        // lazy load each list of athletes
        for (const coach of coaches) {
            await coach.athletes;
        }

        // return loaded coaches
        ctx.body = coaches;
    }

    public static async getCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load coach by id
        const coach: Coach = await coachRepository.findOne(ctx.params.id);

        // lazy load list of athletes
        await coach.athletes;

        if (coach) {
            // return loaded coach
            ctx.body = coach;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to retrieve doesn\'t exist in the db';
        }

    }

    public static async createCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity coach to be saved
        const coachToBeSaved: Coach = new Coach();
        coachToBeSaved.name = ctx.request.body.name;
        coachToBeSaved.email = ctx.request.body.email;

        // validate coach entity
        const errors: ValidationError[] = await validate(coachToBeSaved); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else {
            // save the coach contained in the POST body
            const coach = await coachRepository.save(coachToBeSaved);
            // return created status code and updated coach
            ctx.status = 201;
            ctx.body = coach;
        }
    }

    public static async updateCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // check if a coach with the specified id exists
        if (await coachRepository.findOne(ctx.params.id)) {
            // update the coach by specified id
            // build up entity coach to be updated
            const coachToBeUpdated: Coach = new Coach();
            coachToBeUpdated.id = +ctx.params.id;
            coachToBeUpdated.name = ctx.request.body.name;
            coachToBeUpdated.email = ctx.request.body.email;

            // validate coach entity
            const errors: ValidationError[] = await validate(coachToBeUpdated); // errors is an array of validation errors

            if (errors.length > 0) {
                // return bad request status code and errors array
                ctx.status = 400;
                ctx.body = errors;
            } else {
                // save the coach contained in the PUT body
                const coach = await coachRepository.save(coachToBeUpdated);
                // return created status code and updated coach
                ctx.status = 201;
                ctx.body = coach;
            }

        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to update doesn\'t exist in the db';
        }

    }

    public static async deleteCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository = getManager().getRepository(Coach);

        // find the coach by specified id
        const coachToRemove: Coach = await coachRepository.findOne(ctx.params.id);
        if (coachToRemove) {
            // the coach is there so can be removed
            await coachRepository.remove(coachToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to delete doesn\'t exist in the db';
        }

    }

  }
