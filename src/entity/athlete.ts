import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { Length, IsEmail, IsOptional } from "class-validator";
import { Coach, Availability } from "../entity";

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

    @Column({
        length: 60,
        nullable: true,
        select: false
    })
    @Length(60)
    @IsOptional()
    tmpPassword: string;

    @ManyToOne(type => Coach, { onDelete: "SET NULL" })
    coach: Coach;

    @OneToOne(type => Availability, { cascade: true })
    @JoinColumn()
    availability: Availability;

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

    rol?: string;
}

export const athleteSchema = {
    id: { type: "number", required: true, example: 1 },
    name: { type: "string", required: true, example: "Javier Aviles" },
    email: { type: "string", required: true, example: "avileslopez.javier@gmail.com" },
    password: { type: "string", required: true, example: "_TriTogether2020_" }
};