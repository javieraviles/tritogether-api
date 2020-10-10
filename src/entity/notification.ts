import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { Athlete, Coach, NotificationStatus } from "../entity";

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @IsNotEmpty()
    @Column()
    status: NotificationStatus;

    @IsNotEmpty()
    @ManyToOne(type => Athlete, { onDelete: "CASCADE" })
    athlete: Athlete;

    @IsNotEmpty()
    @ManyToOne(type => Coach, { onDelete: "CASCADE" })
    coach: Coach;

    @CreateDateColumn({
        type: "timestamp",
        select: false
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: "timestamp",
        select: false
    })
    updatedAt: Date;
}

export const notificationSchema = {
    id: { type: "number", required: true, example: 21 },
    status: { type: "string", required: true, example: "PENDING" },
    coach: { type: "object", required: true, example: "{\"id\":1,\"name\":\"Coach Javi\",\"email\":\"coachjavi@gmail.com\"}" },
    athlete: { type: "object", required: true, example: "{\"id\":1,\"name\":\"Athlete Javi\",\"email\":\"athletejavi@gmail.com\"}" }
};
