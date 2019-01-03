import { BaseContext } from 'koa';
import * as bcryptjs from 'bcryptjs';
import { getManager, Repository, Not, Equal } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { config } from '../config';
import { Athlete } from '../entity/athlete';
import { Coach } from '../entity/coach';

export default class AthleteController {

    public static async getAthletes(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load all athletes with their coaches included
        const athletes: Athlete[] = await athleteRepository.find({
            order: {
                name: ctx.query.order === 'ASC' ? 'ASC' : 'DESC'
            },
            skip: +ctx.query.skip || 0,
            take: +ctx.query.take || 10
        });

        // return loaded athletes
        ctx.status = 200;
        ctx.body = athletes;
    }

    public static async getAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        const athlete: Athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ['coach'] });

        if (!athlete) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to retrieve doesn\'t exist in the db';
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === 'athlete'))
            || ((!athlete.coach) && (ctx.state.user.rol === 'coach'))
            || (athlete.coach && (+ctx.state.user.id !== athlete.coach.id) && (ctx.state.user.rol === 'coach'))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'Athlete information can only be retrieved by the owner athlete or its current coach';
        } else {
            // return loaded athlete
            ctx.status = 200;
            ctx.body = athlete;
        }

    }

    public static async createAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity athlete to be saved
        const athleteToBeSaved: Athlete = new Athlete();
        athleteToBeSaved.name = ctx.request.body.name;
        athleteToBeSaved.email = ctx.request.body.email;
        athleteToBeSaved.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);

        // if valid coach specified, relate it.
        let coach: Coach = new Coach();
        if (Boolean(ctx.request.body.coach) && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            athleteToBeSaved.coach = coach;
        }

        // validate athlete entity
        const errors: ValidationError[] = await validate(athleteToBeSaved); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (await athleteRepository.findOne({ email: athleteToBeSaved.email })) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the athlete contained in the POST body
            const athlete: Athlete = await athleteRepository.save(athleteToBeSaved);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = athlete;
        }
    }

    public static async updateAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // update the athlete by specified id
        // build up entity athlete to be updated
        const athleteToBeUpdated: Athlete = new Athlete();
        athleteToBeUpdated.id = +ctx.params.id || 0;
        athleteToBeUpdated.name = ctx.request.body.name;
        athleteToBeUpdated.email = ctx.request.body.email;
        athleteToBeUpdated.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);

        // if valid coach specified, relate it. Else, remove it.
        let coach: Coach = new Coach();
        if (Boolean(ctx.request.body.coach) && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            athleteToBeUpdated.coach = coach;
        } else {
            athleteToBeUpdated.coach = null;
        }

        // get athlete from db with password
        const athlete = await athleteRepository.createQueryBuilder('athlete')
            .addSelect('athlete.password')
            .where('athlete.id = :id', { id: athleteToBeUpdated.id })
            .getOne();

        // validate athlete entity
        const errors: ValidationError[] = await validate(athleteToBeUpdated); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ((+ctx.state.user.id !== athleteToBeUpdated.id) || (ctx.state.user.rol !== 'athlete')) {
            // check token is from an athlete and its id and athlete id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An athlete can only be updated by its own user';
        } else if (!athlete) {
            // check if an athlete with the specified id exists
            // if not, return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to update doesn\'t exist in the db';
        } else if (await athleteRepository.findOne({ id: Not(Equal(athleteToBeUpdated.id)), email: athleteToBeUpdated.email })) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else if (!await bcryptjs.compare(ctx.request.body.password, athlete.password)) {
            // password must remain the same
            ctx.status = 400;
            ctx.body = 'Incorrect password';
        } else {
            // save the athlete contained in the PUT body
            const athlete: Athlete = await athleteRepository.save(athleteToBeUpdated);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = athlete;
        }

    }

    public static async deleteAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // find the athlete by specified id
        const athleteToRemove: Athlete = await athleteRepository.findOne(+ctx.params.id || 0);
        if (!athleteToRemove) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body = 'The athlete you are trying to delete doesn\'t exist in the db';
        } else if ((+ctx.state.user.id !== athleteToRemove.id) || (ctx.state.user.rol !== 'athlete')) {
            // check token is from an athlete and its id and athlete id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'An athlete can only be deleted by its own user';
        } else {
            // the athlete is there so can be removed
            await athleteRepository.remove(athleteToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

}
