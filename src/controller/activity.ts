import { BaseContext } from "koa";
import { getManager, Repository, Raw } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll, query } from "koa-swagger-decorator";
import { Activity, activitySchema, Discipline, Athlete, Rol } from "../entity";

@responsesAll({ 200: { description: "success", }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Activity"])
export default class ActivityController {

    @request("get", "/athletes/{id}/activities")
    @summary("Find activities for a specific athlete")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    @query({
        month: { type: "string", required: true, description: "month to get activities from"}
    })
    public static async getAthleteActivities(ctx: BaseContext) {

        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // load athlete by id with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        // can't assume either that the athlete will exist
        let coachId: number = null;
        let athlete: Athlete = new Athlete();
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ["coach"] })) {
            coachId = athlete.coach ? athlete.coach.id : null;
        }

        if (!athlete) {
            ctx.status = 404;
            ctx.message = "The athlete you are trying to retrieve activities from doesn't exist in the db";
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === Rol.ATHLETE))
            || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === Rol.COACH))
        ) {
            // check if the token of the user performing the request is not either the athlete or the current athlete's coach
            ctx.status = 403;
            ctx.message = "A collection of activities can only be retrieved by the owner athlete or its current coach";
        } else if (!ctx.query.month) {
            ctx.status = 400;
            ctx.message = "A specific month should be specified as query param";
        } else {
            // TODO: only current year as only month is specified
            const activities: Activity[] = await activityRepository.find({
                relations: ["discipline"],
                where: { athlete: +ctx.params.id || 0, date: Raw(alias => `date_part('month',"Activity".date) = ${ctx.query.month}`) },
                order: {
                    date: "ASC",
                    discipline: "ASC"
                }
            });
            ctx.status = 200;
            ctx.body = activities;
        }
    }

    @request("get", "/athletes/{athleteId}/activities/{activityId}")
    @summary("Find a specific activity from an athlete")
    @path({
        athleteId: { type: "number", required: true, description: "id of athlete" },
        activityId: { type: "number", required: true, description: "id of activity" },
    })
    public static async getAthleteActivity(ctx: BaseContext) {

        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        const activity: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ["athlete", "discipline"] });

        // load activity athlete with coach entity included
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        // can't assume either that the athlete will exist
        let coachId: number = null;
        let athlete: Athlete = new Athlete();
        if (athlete = await athleteRepository.findOne(+ctx.params.athleteId || 0, { relations: ["coach"] })) {
            coachId = athlete.coach ? athlete.coach.id : null;
        }

        if (!activity) {
            ctx.status = 404;
            ctx.message = "The activity you are trying to retrieve doesn't exist in the db";
        } else if (!athlete) {
            ctx.status = 404;
            ctx.message = "The athlete you are trying to retrieve the activity from doesn't exist in the db";
        } else if (athlete.id !== activity.athlete.id) {
            ctx.status = 400;
            ctx.message = "The specified athlete is not the owner of the activity";
        } else if (((+ctx.state.user.id !== athlete.id) && (ctx.state.user.rol === Rol.ATHLETE))
            || ((+ctx.state.user.id !== coachId) && (ctx.state.user.rol === Rol.COACH))
        ) {
            // check if the token of the user performing the request is not either the athlete
            // or the current athlete's coach related to the activity
            ctx.status = 403;
            ctx.message = "An activity can only be retrieved by the owner athlete or its current coach";
        } else {
            ctx.status = 200;
            ctx.body = activity;
        }
    }

    @request("post", "/athletes/{id}/activities")
    @summary("Create an activity")
    @path({
        id: { type: "number", required: true, description: "id of athlete" }
    })
    @body(activitySchema)
    public static async createActivity(ctx: BaseContext) {

        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const disciplineRepository: Repository<Discipline> = getManager().getRepository(Discipline);

        const activityToBeSaved: Activity = new Activity();
        activityToBeSaved.description = ctx.request.body.description;
        activityToBeSaved.date = new Date(ctx.request.body.date);

        // if valid athlete specified, relate it.
        // the athlete could not have a coach assigned at this moments so can't assume athlete.coach.id will exist
        let athlete: Athlete = new Athlete();
        let coachId: number = null;
        if (athlete = await athleteRepository.findOne(+ctx.params.id || 0, { relations: ["coach"] })) {
            activityToBeSaved.athlete = athlete;
            coachId = activityToBeSaved.athlete.coach ? activityToBeSaved.athlete.coach.id : null;
        }

        // if valid discipline specified, relate it.
        let discipline: Discipline = new Discipline();
        if (ctx.request.body.discipline && (discipline = await disciplineRepository.findOne(+ctx.request.body.discipline.id || 0))) {
            activityToBeSaved.discipline = discipline;
        }
        const errors: ValidationError[] = await validate(activityToBeSaved, { validationError: { target: false } });

        if (!athlete) {
            ctx.status = 404;
            ctx.message = "The athlete you are trying to create activities for doesn't exist in the db";
        } else if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if (+ctx.state.user.id !== (coachId) || (ctx.state.user.rol !== Rol.COACH)) {
            // check token is from a coach and its id and athlete's coach id are the same
            ctx.status = 403;
            ctx.message = "An activity can only be created by the coach of the specified athlete";
        } else {
            const activity: Activity = await activityRepository.save(activityToBeSaved);
            ctx.status = 201;
            ctx.body = activity;
        }
    }

    @request("put", "/athletes/{athleteId}/activities/{activityId}")
    @summary("Update an activity")
    @path({
        athleteId: { type: "number", required: true, description: "id of athlete" },
        activityId: { type: "number", required: true, description: "id of activity" },
    })
    @body(activitySchema)
    public static async updateActivity(ctx: BaseContext) {

        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);
        const disciplineRepository: Repository<Discipline> = getManager().getRepository(Discipline);

        const activity: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ["athlete", "athlete.coach"] });

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
        const errors: ValidationError[] = await validate(activityToBeUpdated, { validationError: { target: false } });

        if (!activity) {
            ctx.status = 404;
            ctx.message = "The activity you are trying to update doesn't exist in the db";
        } else if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
        } else if ((+ctx.params.athleteId || 0) != activity.athlete.id) {
            // check if the athlete didn't change for the activity
            ctx.status = 400;
            ctx.message = "The specified athlete and the owner athlete of the activity are not the same";
        } else if ((!activity.athlete.coach) || +ctx.state.user.id !== (activity.athlete.coach.id) || (ctx.state.user.rol !== Rol.COACH)) {
            // check token is from a coach and its id and athlete's coach id are the same
            ctx.status = 403;
            ctx.message = "An activity can only be updated by the coach of the owner athlete";
        } else {
            const activity: Activity = await activityRepository.save(activityToBeUpdated);
            ctx.status = 201;
            ctx.body = activity;
        }

    }

    @request("delete", "/athletes/{athleteId}/activities/{activityId}")
    @summary("Delete activity by activityId")
    @path({
        athleteId: { type: "number", required: true, description: "id of athlete" },
        activityId: { type: "number", required: true, description: "id of activity" },
    })
    public static async deleteActivity(ctx: BaseContext) {

        const activityRepository: Repository<Activity> = getManager().getRepository(Activity);

        const activityToRemove: Activity = await activityRepository.findOne(+ctx.params.activityId || 0, { relations: ["athlete", "athlete.coach"] });
        if (!activityToRemove) {
            ctx.status = 404;
            ctx.message = "The activity you are trying to delete doesn't exist in the db";
        } else if ((+ctx.params.athleteId || 0) != activityToRemove.athlete.id) {
            ctx.status = 400;
            ctx.message = "The athlete you are specifying and the owner of the activity are not the same";
        } else if ((!activityToRemove.athlete.coach) || (+ctx.state.user.id !== activityToRemove.athlete.coach.id) || (ctx.state.user.rol !== Rol.COACH)) {
            // check token is from a coach and its id and coach athlete id are the same
            ctx.status = 403;
            ctx.message = "An activity can only be deleted by the coach of the owner athlete";
        } else {
            await activityRepository.remove(activityToRemove);
            ctx.status = 204;
        }

    }

}
