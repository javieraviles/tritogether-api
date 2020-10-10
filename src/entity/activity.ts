import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Length, IsNotEmpty, IsDate } from "class-validator";
import { Athlete, Discipline } from "../entity";

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 255
    })
    @Length(10, 255)
    description: string;

    @Column({
        type: "date"
    })
    @IsDate()
    date: Date;

    @IsNotEmpty()
    @ManyToOne(type => Athlete, { onDelete: "CASCADE" })
    athlete: Athlete;

    @IsNotEmpty()
    @ManyToOne(type => Discipline, { onDelete: "CASCADE" })
    discipline: Discipline;

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

export const activitySchema = {
    id: { type: "number", required: true, example: 1 },
    description: { type: "string", required: true, example: "10x100m crol A5 r2' + 200m easy" },
    date: { type: "string", required: true, example: "2019-04-18" },
    discipline: { type: "object", required: true, example: "{\"id\":1,\"name\":\"swimming\"}" }
};