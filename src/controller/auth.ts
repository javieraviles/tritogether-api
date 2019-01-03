import * as jwt from 'jsonwebtoken';
import * as bcryptjs from 'bcryptjs';
import { BaseContext } from 'koa';
import { config } from '../config';
import { getManager, Repository } from 'typeorm';
import { Athlete } from '../entity/athlete';
import { Coach } from '../entity/coach';

export default class AuthController {

    public static async signIn(ctx: BaseContext) {

        if (!ctx.request.body.email || !ctx.request.body.password) {
            ctx.status = 400;
            ctx.body = 'Both email and password must be specified';
            return;
        }

        // get an athlete repository to perform operations with athlete
        const athleteRepository: Repository<Athlete> = getManager().getRepository(Athlete);

        // get a coach repository to perform operations with coach
        const coachRepository: Repository<Coach> = getManager().getRepository(Coach);

        let user: any;

        if (Boolean(ctx.request.body.isCoach)) {
            // load coach by email, query users queryBuilder to addSelect(password), otherwise hidden
            user = await coachRepository.createQueryBuilder('coach')
                .addSelect('coach.password')
                .where('coach.email = :email', { email: ctx.request.body.email })
                .getOne();
        } else {
            // load athlete by email, query users queryBuilder to addSelect(password), otherwise hidden
            user = await athleteRepository.createQueryBuilder('athlete')
                .addSelect('athlete.password')
                .where('athlete.email = :email', { email: ctx.request.body.email })
                .getOne();
        }

        if (!user) {
            ctx.status = 401;
            ctx.body = 'User not found';
            return;
        }

        if (!await bcryptjs.compare(ctx.request.body.password, user.password)) {
            ctx.status = 401;
            ctx.body = 'Incorrect password';
            return;
        }

        const rol = ctx.request.body.isCoach ? 'coach' : 'athlete';

        const token = jwt.sign({
            id: user.id,
            name: user.name,
            email: user.email,
            rol: rol
        }, config.jwtSecret, { expiresIn: config.jwtExpiration });

        ctx.status = 200;
        delete user.password;
        user.rol = rol;
        ctx.body = { user: user, access_token: token };
    }

}
