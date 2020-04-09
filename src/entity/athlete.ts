import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Length, IsEmail } from "class-validator";
import { Coach } from "./coach";

@Entity()
export class Athlete {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    @Length(5, 80)
    name: string;

    @Column({
        length: 100
    })
    @Length(10, 100)
    @IsEmail()
    email: string;

    @Column({
        length: 60,
        select: false
    })
    @Length(60)
    password: string;

    @ManyToOne(type => Coach, { onDelete: "SET NULL" })
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

export const athleteSchema = {
    id: { type: "number", required: true, example: 1 },
    name: { type: "string", required: true, example: "Javier Aviles" },
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "_TriTogether2020_" }
};