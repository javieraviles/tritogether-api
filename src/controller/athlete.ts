import { BaseContext } from "koa";
import * as bcryptjs from "bcryptjs";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { config } from "../config";
import { Athlete, athleteSchema } from "../entity/athlete";
import { Coach, coachSchema } from "../entity/coach";
import { Notification } from "../entity/notification";
import { NotificationStatus } from "../entity/notificationStatus";
import { Availability } from "../entity/availability";

@responsesAll({ 200: { description: "success", response: athleteSchema }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Athlete"])
export default class AthleteController {

    @request("get", "/athletes")
    @summary("Find all athletes")
    public static async getAthletes(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load all athletes with their coaches included
        const athletes: Athlete[] = await athleteRepository.find({
            order: {
                name: ctx.query.order === "ASC" ? "ASC" : "DESC"
            },
            skip: +ctx.query.skip || 0,
            take: +ctx.query.take || 10
        });

        // return loaded athletes
        ctx.status = 200;
        ctx.body = athletes;
    }

    @request("get", "/athletes/{id}")
    @summary("Find athlete by id")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    public static async getAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        const athlete: Athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ["coach", "availability"] });

        if (!athlete) {
            // return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The athlete you are trying to retrieve doesn't exist in the db";
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === "athlete"))
            || ((!athlete.coach) && (ctx.state.user.rol === "coach"))
            || (athlete.coach && (+ctx.state.user.id !== athlete.coach.id) && (ctx.state.user.rol === "coach"))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "Athlete information can only be retrieved by the owner athlete or its current coach";
        } else {
            // return loaded athlete
            ctx.status = 200;
            ctx.body = athlete;
        }

    }

    @request("post", "/athletes")
    @summary("Create an athlete")
    @body(athleteSchema)
    public static async createAthlete(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // build up entity athlete to be saved
        const athleteToBeSaved: Athlete = new Athlete();
        athleteToBeSaved.name = ctx.request.body.name;
        athleteToBeSaved.email = ctx.request.body.email;

        // cannot assume password is present at this point
        if (ctx.request.body.password) {
            athleteToBeSaved.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);
        }

        // if valid coach specified, relate it.
        let coach: Coach = new Coach();
        if (Boolean(ctx.request.body.coach) && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            athleteToBeSaved.coach = coach;
        }

        // validate athlete entity
        const errors: ValidationError[] = await validate(athleteToBeSaved, { validationError: { target: false } }); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (ctx.request.body.password.length < 8) {
            // return bad request status code if password is shorter than 8 characters
            ctx.status = 400;
            ctx.message = "The specified password must be at least 8 characters long";
        } else if (await athleteRepository.findOne({ email: athleteToBeSaved.email })) {
            // return bad request status code and email already exists error
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else {
            const defaultAvailability = new Availability(true, true, true, true, true, true, true);
            athleteToBeSaved.availability = defaultAvailability;
            // save the athlete contained in the POST body
            const athlete: Athlete = await athleteRepository.save(athleteToBeSaved);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = athlete;
        }
    }

    @request("put", "/athletes/{id}")
    @summary("Update an athlete")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    @body(athleteSchema)
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
        athleteToBeUpdated.availability = ctx.request.body.availability;
        athleteToBeUpdated.password = await bcryptjs.hash(ctx.request.body.password, config.authSalt);

        // if valid coach specified, relate it. Else, remove it.
        let coach: Coach = new Coach();
        if (Boolean(ctx.request.body.coach) && (coach = await coachRepository.findOne(+ctx.request.body.coach.id || 0))) {
            athleteToBeUpdated.coach = coach;
        } else {
            athleteToBeUpdated.coach = null;
        }

        // get athlete from db with password
        const athlete: Athlete = await athleteRepository.createQueryBuilder("athlete")
            .addSelect("athlete.password")
            .where("athlete.id = :id", { id: athleteToBeUpdated.id })
            .getOne();

        // validate athlete entity
        const errors: ValidationError[] = await validate(athleteToBeUpdated, { validationError: { target: false } }); // errors is an array of validation errors

        if (errors.length > 0) {
            // return bad request status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if ((+ctx.state.user.id !== athleteToBeUpdated.id) || (ctx.state.user.rol !== "athlete")) {
            // check token is from an athlete and its id and athlete id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "An athlete can only be updated by its own user";
        } else if (!athlete) {
            // check if an athlete with the specified id exists
            // if not, return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The athlete you are trying to update doesn't exist in the db";
        } else if (await athleteRepository.findOne({ id: Not(Equal(athleteToBeUpdated.id)), email: athleteToBeUpdated.email })) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.message = "The specified e-mail address already exists";
        } else if (!await bcryptjs.compare(ctx.request.body.password, athlete.password)) {
            // password must remain the same
            ctx.status = 400;
            ctx.message = "Incorrect password";
        } else {
            // save the athlete contained in the PUT body
            const athlete: Athlete = await athleteRepository.save(athleteToBeUpdated);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = athlete;
        }

    }

    @request("put", "/athletes/{id}/coach")
    @summary("Update coach of an athlete. Existing PENDING notification must be present already")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    @body(coachSchema)
    public static async updateAthleteCoach(ctx: BaseContext) {

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        // get a notification repository to perform operations with notification
        const notificationRepository: Repository<Notification> = getManager().getRepository(Notification);

        // if valid coach specified, find it.
        // If no coach specified, current coach wants to remove himself
        let coachId: number = +ctx.request.body.id;
        if(Number.isNaN(coachId)) {
            coachId = +ctx.state.user.id;
        }
        const coach: Coach = await coachRepository.createQueryBuilder("coach")
            .addSelect("coach.password")
            .where("coach.id = :id", { id: coachId })
            .getOne();

        // get athlete from db with coach included to double check
        // the athlete doesn't have a coach already
        const athlete = await athleteRepository.createQueryBuilder("athlete")
            .leftJoinAndSelect("athlete.coach", "coach")
            .where("athlete.id = :id", { id: +ctx.params.id || 0 })
            .getOne();

        // check if there is a PENDING coaching notification between this coach and this athlete
        const notification: Notification = await notificationRepository.findOne({
            relations: ["athlete", "coach"],
            where: { athlete: +ctx.params.id || 0, coach: +ctx.request.body.id || 0, status: NotificationStatus.PENDING }
        });
        
        if (!athlete || !coach) {
            // check if an athlete and a coach with the specified ids exist
            // if not, return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The athlete/coach you are trying to update doesn't exist in the db";
        } else if (+ctx.state.user.id !== coach.id) {
            // check if the request is being performed by the new athlete's coach if new coach
            // or by the old coach in case the coach is being removed
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "Athlete's coach must be the one performing the request";
        } else if (!notification && ctx.request.body.id) {
            // when setting a new coach
            // check if there was a PENDING coaching notification between specified athlete and coach
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "There is no PENDING coaching notification between specified athlete and coach";
        } else if (athlete.coach && ctx.request.body.id) {
            // when setting a new coach
            // check if there is a coach assigned already
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.message = "There is a coach assigned to the athlete already";
        } else if (!ctx.request.body.id && (!athlete.coach || (athlete.coach.id !== coach.id))) {
            // only current coach can remove himself
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "Only current athlete's coach can remove himself";
        } else if (!ctx.request.body.id && (!ctx.request.body.password || !await bcryptjs.compare(ctx.request.body.password, coach.password))) {
            // coach must inform his password correctly
            ctx.status = 400;
            ctx.message = "Incorrect password";
        } else {
            // update the coach or remove it if no coach specified
            athlete.coach = +ctx.request.body.id ? coach : null;
            // save the athlete
            const savedAthlete: Athlete = await athleteRepository.save(athlete);
            // return created status code and updated athlete
            ctx.status = 201;
            ctx.body = savedAthlete;
        }

    }

    @request("delete", "/athletes/{id}")
    @summary("Delete athlete by id")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    public static async deleteAthlete(ctx: BaseContext) {

        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const availabilityRepository: Repository<Availability> = getManager().getRepository(Availability);

        // find the athlete by specified id
        const athleteToRemove: Athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ["availability"] });
        if (!athleteToRemove) {
            // return a NOT FOUND status code and error message
            ctx.status = 404;
            ctx.message = "The athlete you are trying to delete doesn't exist in the db";
        } else if ((+ctx.state.user.id !== athleteToRemove.id) || (ctx.state.user.rol !== "athlete")) {
            // check token is from an athlete and its id and athlete id are the same
            // return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.message = "An athlete can only be deleted by its own user";
        } else {
            // the athlete is there so can be removed
            await athleteRepository.remove(athleteToRemove);
            // I dont like this, but for now, availability can only be removed programatically
            availabilityRepository.remove(athleteToRemove.availability);
            // return a NO CONTENT status code
            ctx.status = 204;
        }

    }

}
