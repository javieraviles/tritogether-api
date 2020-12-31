import * as jwt from "jsonwebtoken";
import * as bcryptjs from "bcryptjs";
import { BaseContext } from "koa";
import { config } from "../config";
import { getManager, Repository } from "typeorm";
import { request, summary, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import logger from "winston";
import { Athlete, Coach, Rol } from "../entity";
import { emailService } from "../service";

const authSchema = {
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "_TriTogether2020_" },
    isCoach: { type: "boolean", required: true, example: true }
};

const resetPasswordSchema = {
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    isCoach: { type: "boolean", required: true, example: true }
};

const changePasswordSchema = {
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "_TriTogether2020_" },
    newPassword: { type: "string", required: true, example: "?TriTogether2021*" },
    isCoach: { type: "boolean", required: true, example: true },
    isTemporary: { type: "boolean", required: true, example: true }
};

@responsesAll({ 200: { description: "success", }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Auth"])
export default class AuthController {

    @request("post", "/signin")
    @summary("Get a JWT token")
    @body(authSchema)
    public static async signIn(ctx: BaseContext) {

        if (!ctx.request.body.email || !ctx.request.body.password) {
            ctx.status = 400;
            ctx.message = "Both email and password must be specified";
            return;
        }

        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        let user: Coach | Athlete;

        if (Boolean(ctx.request.body.isCoach)) {
            // load coach by email, query users queryBuilder to addSelect(password), otherwise hidden
            user = await coachRepository.createQueryBuilder("coach")
                .addSelect("coach.password")
                .addSelect("coach.tmpPassword")
                .where("coach.email = :email", { email: ctx.request.body.email })
                .getOne();
        } else {
            // load athlete by email, query users queryBuilder to addSelect(password), otherwise hidden
            user = await athleteRepository.createQueryBuilder("athlete")
                .addSelect("athlete.password")
                .addSelect("athlete.tmpPassword")
                .where("athlete.email = :email", { email: ctx.request.body.email })
                .getOne();
        }

        if (!user) {
            ctx.status = 401;
            ctx.message = "User not found";
            return;
        }

        if (!await bcryptjs.compare(ctx.request.body.password, user.password)) {
            ctx.status = 401;
            ctx.message = "Incorrect password";
            return;
        }

        const rol = ctx.request.body.isCoach ? Rol.COACH : Rol.ATHLETE;

        const token = jwt.sign({
            id: user.id,
            rol: rol
        }, config.jwtSecret, { expiresIn: config.jwtExpiration });

        if(user.tmpPassword != null) {
            user.tmpPassword = null;
            if (Boolean(ctx.request.body.isCoach)) {
                await coachRepository.save(user);
            } else {
                await athleteRepository.save(user);
            }
        }

        ctx.status = 200;
        delete user.password;
        delete user.tmpPassword;
        user.rol = rol;
        /* eslint-disable @typescript-eslint/camelcase */
        ctx.body = { user: user, access_token: token };
    }

    @request("post", "/reset-password")
    @summary("Send an email with a temporary password and a reset link")
    @body(resetPasswordSchema)
    public static async resetPassword(ctx: BaseContext) {

        if (!ctx.request.body.email) {
            ctx.status = 400;
            ctx.message = "Email must be specified";
            return;
        }

        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        let user: Coach | Athlete;

        if (Boolean(ctx.request.body.isCoach)) {
            user = await coachRepository.findOne({ email: ctx.request.body.email });
        } else {
            user = await athleteRepository.findOne({ email: ctx.request.body.email });
        }

        if (!user) {
            ctx.status = 400;
            ctx.message = "Email not found";
            return;
        }

        const tmpPassword: string = AuthController.generateTmpPassword();

        user.tmpPassword = await bcryptjs.hash(tmpPassword, config.authSalt);

        if (Boolean(ctx.request.body.isCoach)) {
            await coachRepository.save(user);
        } else {
            await athleteRepository.save(user);
        }
        try {
            await emailService.sendPasswordRecoveryEmail(tmpPassword, ctx.request.body.email);
            ctx.status = 204;
        } catch (e) {
            if (e.errno === "ETIMEOUT" || e.errno === "ENOTFOUND") {
                ctx.status = 500;
                ctx.message = "The service seems very busy at the moment, please try later.";
                logger.error(`Error trying to communicate with the SMTP server: ${e}`);
            } else {
                throw e;
            }
        }
    }

    @request("put", "/change-password")
    @summary("Change user password")
    @body(changePasswordSchema)
    public static async changePassword(ctx: BaseContext) {

        if (!ctx.request.body.email || !ctx.request.body.password || !ctx.request.body.newPassword) {
            ctx.status = 400;
            ctx.message = "Both email and passwords must be specified";
            return;
        }

        if (ctx.request.body.newPassword.length < 8) {
            ctx.status = 400;
            ctx.message = "The new password must be at least 8 characters long";
            return;
        }

        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        let user: Coach | Athlete;
        const rol = ctx.request.body.isCoach ? Rol.COACH : Rol.ATHLETE;

        if (rol.valueOf() === Rol.COACH.valueOf()) {
            user = await coachRepository.createQueryBuilder("coach")
                .addSelect("coach.password")
                .addSelect("coach.tmpPassword")
                .where("coach.email = :email", { email: ctx.request.body.email })
                .getOne();
        } else {
            user = await athleteRepository.createQueryBuilder("athlete")
                .addSelect("athlete.password")
                .addSelect("athlete.tmpPassword")
                .where("athlete.email = :email", { email: ctx.request.body.email })
                .getOne();
        }

        if (!user) {
            ctx.status = 400;
            ctx.message = "User not found";
            return;
        }

        const validPassword = Boolean(ctx.request.body.isTemporary) ? user.tmpPassword || "" : user.password;

        if (!await bcryptjs.compare(ctx.request.body.password, validPassword)) {
            ctx.status = 400;
            ctx.message = "Incorrect password";
            return;
        }

        user.password = await bcryptjs.hash(ctx.request.body.newPassword, config.authSalt);
        user.tmpPassword = null;
        if (rol.valueOf() === Rol.COACH.valueOf()) {
            await coachRepository.save(user);
        } else {
            await athleteRepository.save(user);
        }
        ctx.status = 204;
    }

    private static generateTmpPassword() {
        let tmpPassword = "";
        const allowedCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = allowedCharacters.length;
        for (let i = 0; i < 12; i++) {
            tmpPassword += allowedCharacters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return tmpPassword;
    }

}
