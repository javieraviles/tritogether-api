import { BaseContext } from 'koa';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { Coach } from '../entity/coach';
import { Athlete } from '../entity/athlete';

export default class CoachController {

    public static async getCoaches (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load all coaches
        const coaches: Coach[] = await coachRepository.find();

        // return loaded coaches
        ctx.status = 200;
        ctx.body = coaches;
    }

    public static async getCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load coach by id
        const coach: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (coach) {
            // return loaded coach
            ctx.status = 200;
            ctx.body = coach;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to retrieve doesn\'t exist in the db';
        }

    }

    public static async getCoachAthletes (ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athletes for a specific coach
        const coach = new Coach();
        coach.id = +ctx.params.id || 0;
        const athletes: Athlete[] = await athleteRepository.find({ coach: coach });

        if (athletes && coach.id > 0) {
            // return loaded collection of athletes
            ctx.status = 200;
            ctx.body = athletes;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to retrieve athletes from doesn\'t exist in the db';
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
        } else if ( await coachRepository.findOne({ email: coachToBeSaved.email}) ) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the coach contained in the POST body
            const coach: Coach = await coachRepository.save(coachToBeSaved);
            // return created status code and updated coach
            ctx.status = 201;
            ctx.body = coach;
        }
    }

    public static async updateCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // update the coach by specified id
        // build up entity coach to be updated
        const coachToBeUpdated: Coach = new Coach();
        coachToBeUpdated.id = +ctx.params.id || 0;
        coachToBeUpdated.name = ctx.request.body.name;
        coachToBeUpdated.email = ctx.request.body.email;

        // validate coach entity
        const errors: ValidationError[] = await validate(coachToBeUpdated); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ( (+ctx.state.user.id !== coachToBeUpdated.id) || (ctx.state.user.rol !== 'coach') ) {
            // check token is from a coach and its id and coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A coach can only be updated by its own user';
        } else if ( !await coachRepository.findOne(coachToBeUpdated.id) ) {
            // check if a coach with the specified id exists
            // return BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to update doesn\'t exist in the db';
        } else if ( await coachRepository.findOne({ id: Not(Equal(coachToBeUpdated.id)) , email: coachToBeUpdated.email}) ) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the coach contained in the PUT body
            const coach: Coach = await coachRepository.save(coachToBeUpdated);
            // return created status code and updated coach
            ctx.status = 201;
            ctx.body = coach;
        }

    }

    public static async deleteCoach (ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // TODO: check token mail and coach mail are the same

        // find the coach by specified id
        const coachToRemove: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (!coachToRemove) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The coach you are trying to delete doesn\'t exist in the db';
        } else if ( (+ctx.state.user.id !== coachToRemove.id) || (ctx.state.user.rol !== 'coach')  ) {
            // check token is from a coach and its id and coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A coach can only be deleted by its own user';
        } else {
            // the coach is there so can be removed
            await coachRepository.remove(coachToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

  }
