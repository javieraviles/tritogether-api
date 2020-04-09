import { BaseContext } from "koa";
import * as bcryptjs from "bcryptjs";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { config } from "../config";
import { Coach, coachSchema } from "../entity/coach";
import { Athlete } from "../entity/athlete";

@responsesAll({ 200: { description: "success", }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Coach"])
export default class CoachController {

    @request("get", "/coaches")
    @summary("Find all coaches")
    public static async getCoaches(ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load all coaches
        const coaches: Coach[] = await coachRepository.find();

        // return loaded coaches
        ctx.status = 200;
        ctx.body = coaches;
    }

    @request("get", "/coaches/{id}")
    @summary("Find coach by id")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async getCoach(ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // load coach by id
        const coach: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (coach) {
            // return loaded coach
            ctx.status = 200;
            ctx.body = coach;
        } else {
            // return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The coach you are trying to retrieve doesn't exist in the db";
        }

    }

    @request("get", "/coaches/{id}/athletes")
    @summary("Find athletes for a specific coach")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async getCoachAthletes(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // does specified coach exist?
        const coachId = +ctx.params.id || 0;
        const coach = await coachRepository.findOne(coachId);

        if (!coach) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.message = "The coach you are trying to retrieve athletes from doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === "coach")) {
            // check if the token of the user performing the request is not the coach whose athletes are trying to be retrieved from
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "A coach collection of athletes can only be retrieved by the coach itself";
        } else {
            // if coach exists and is the coach assigned to them, load his athlete collection
            const athletes: Athlete[] = await athleteRepository.find({
                where: { coach: coachId },
                order: {
                    name: ctx.query.order === "ASC" ? "ASC" : "DESC"
                }
            });
            // return loaded collection of athletes
            ctx.status = 200;
            ctx.body = athletes;
        }

    }

    @request("post", "/coaches")
    @summary("Create a coach")
    @body(coachSchema)
    public static async createCoach(ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity coach to be saved
        const coachToBeSaved: Coach = new Coach();
        coachToBeSaved.name = ctx.request.body.name;
        coachToBeSaved.email = ctx.request.body.email;
        // cannot assume password is present at this point
        if (ctx.request.body.password){
            coachToBeSaved.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);
        }

        // validate coach entity
        const errors: ValidationError[] = await validate(coachToBeSaved, { validationError: { target: false } }); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (ctx.request.body.password.length < 8) {
            // return bad request status code if password is shorter than 8 characters
            ctx.status = 400;
            ctx.message = "The specified password must be at least 8 characters long";
        } else if (await coachRepository.findOne({ email: coachToBeSaved.email })) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else {
            // save the coach contained in the POST body
            const coach: Coach = await coachRepository.save(coachToBeSaved);
            // return created status code and created coach
            ctx.status = 201;
            ctx.body = coach;
        }
    }

    @request("put", "/coaches/{id}")
    @summary("Update a coach")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    @body(coachSchema)
    public static async updateCoach(ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // update the coach by specified id
        // build up entity coach to be updated
        const coachToBeUpdated: Coach = new Coach();
        coachToBeUpdated.id = +ctx.params.id || 0;
        coachToBeUpdated.name = ctx.request.body.name;
        coachToBeUpdated.email = ctx.request.body.email;
        coachToBeUpdated.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);

        // get coach from db with password
        const coach = await coachRepository.createQueryBuilder("coach")
            .addSelect("coach.password")
            .where("coach.id = :id", { id: coachToBeUpdated.id })
            .getOne();

        // validate coach entity
        const errors: ValidationError[] = await validate(coachToBeUpdated); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ((+ctx.state.user.id !== coachToBeUpdated.id) || (ctx.state.user.rol !== "coach")) {
            // check token is from a coach and its id and coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "A coach can only be updated by its own user";
        } else if (!await coachRepository.findOne(coachToBeUpdated.id)) {
            // check if a coach with the specified id exists
            // return NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The coach you are trying to update doesn't exist in the db";
        } else if (await coachRepository.findOne({ id: Not(Equal(coachToBeUpdated.id)), email: coachToBeUpdated.email })) {
            // return BAD REQUEST status code and email already exist error
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else if (!await bcryptjs.compare(ctx.request.body.password, coach.password)) {
            // password must remain the same
            ctx.status = 400;
            ctx.message = "Incorrect password";
        } else {
            // save the coach contained in the PUT body
            const coach: Coach = await coachRepository.save(coachToBeUpdated);
            // return created status code and updated coach
            ctx.status = 201;
            ctx.body = coach;
        }

    }

    @request("delete", "/coaches/{id}")
    @summary("Delete coach by id")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async deleteCoach(ctx: BaseContext) {

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // TODO: check token mail and coach mail are the same

        // find the coach by specified id
        const coachToRemove: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (!coachToRemove) {
            // return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The coach you are trying to delete doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coachToRemove.id) || (ctx.state.user.rol !== "coach")) {
            // check token is from a coach and its id and coach id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "A coach can only be deleted by its own user";
        } else {
            // the coach is there so can be removed
            await coachRepository.remove(coachToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

}
