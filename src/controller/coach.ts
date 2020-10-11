import { BaseContext } from "koa";
import * as bcryptjs from "bcryptjs";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { config } from "../config";
import { Coach, coachSchema, Athlete, Rol } from "../entity";

@responsesAll({ 200: { description: "success", }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Coach"])
export default class CoachController {

    @request("get", "/coaches")
    @summary("Find all coaches")
    public static async getCoaches(ctx: BaseContext) {
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);
        const coaches: Coach[] = await coachRepository.find();
        ctx.status = 200;
        ctx.body = coaches;
    }

    @request("get", "/coaches/{id}")
    @summary("Find coach by id")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async getCoach(ctx: BaseContext) {

        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);
        const coach: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (coach) {
            ctx.status = 200;
            ctx.body = coach;
        } else {
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

        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // does specified coach exist?
        const coachId = +ctx.params.id || 0;
        const coach = await coachRepository.findOne(coachId);

        if (!coach) {
            ctx.status = 404;
            ctx.message = "The coach you are trying to retrieve athletes from doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === Rol.COACH)) {
            // check if the token of the user performing the request is not the coach whose athletes are trying to be retrieved from
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
            ctx.status = 200;
            ctx.body = athletes;
        }

    }

    @request("post", "/coaches")
    @summary("Create a coach")
    @body(coachSchema)
    public static async createCoach(ctx: BaseContext) {

        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        const coachToBeSaved: Coach = new Coach();
        coachToBeSaved.name = ctx.request.body.name;
        coachToBeSaved.email = ctx.request.body.email;
        // cannot assume password is present at this point
        if (ctx.request.body.password){
            coachToBeSaved.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);
        }
        const errors: ValidationError[] = await validate(coachToBeSaved, { validationError: { target: false } });

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if (ctx.request.body.password.length < 8) {
            ctx.status = 400;
            ctx.message = "The specified password must be at least 8 characters long";
        } else if (await coachRepository.findOne({ email: coachToBeSaved.email })) {
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else {
            const coach: Coach = await coachRepository.save(coachToBeSaved);
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

        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        const coach = await coachRepository.createQueryBuilder("coach")
            .addSelect("coach.password")
            .where("coach.id = :id", { id: +ctx.params.id || 0 })
            .getOne();

        const coachToBeUpdated: Coach = new Coach();
        coachToBeUpdated.id = +ctx.params.id || 0;
        coachToBeUpdated.name = ctx.request.body.name;
        coachToBeUpdated.email = ctx.request.body.email;
        coachToBeUpdated.password = coach?.password;
        
        const errors: ValidationError[] = await validate(coachToBeUpdated, { validationError: { target: false } });

        if (!coach) {
            ctx.status = 404;
            ctx.message = "The coach you are trying to update doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coachToBeUpdated.id) || (ctx.state.user.rol !== Rol.COACH)) {
            // check token is from a coach and its id and coach id are the same
            ctx.status = 403;
            ctx.message = "A coach can only be updated by its own user";
        } else if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if (await coachRepository.findOne({ id: Not(Equal(coachToBeUpdated.id)), email: coachToBeUpdated.email })) {
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else {
            const updatedCoach: Coach = await coachRepository.save(coachToBeUpdated);
            ctx.status = 201;
            ctx.body = updatedCoach;
        }

    }

    @request("delete", "/coaches/{id}")
    @summary("Delete coach by id")
    @path({
        id: { type: "number", required: true, description: "id of coach" }
    })
    public static async deleteCoach(ctx: BaseContext) {

        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // TODO: check token mail and coach mail are the same
        const coachToRemove: Coach = await coachRepository.findOne(+ctx.params.id || 0);

        if (!coachToRemove) {
            ctx.status = 404;
            ctx.message = "The coach you are trying to delete doesn't exist in the db";
        } else if ((+ctx.state.user.id !== coachToRemove.id) || (ctx.state.user.rol !== Rol.COACH)) {
            // check token is from a coach and its id and coach id are the same
            ctx.status = 403;
            ctx.message = "A coach can only be deleted by its own user";
        } else {
            await coachRepository.remove(coachToRemove);
            ctx.status = 204;
        }

    }

}
