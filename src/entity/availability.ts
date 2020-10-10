import { Entity, Column, PrimaryGeneratedColumn, OneToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IsBoolean } from "class-validator";
import { Athlete } from "../entity";

@Entity()
export class Availability {

    constructor(monday: boolean, tuesday: boolean, wednesday: boolean, thursday: boolean, friday: boolean, saturday: boolean, sunday: boolean) {
        this.monday = monday;
        this.tuesday = tuesday;
        this.wednesday = wednesday;
        this.thursday = thursday;
        this.friday = friday;
        this.saturday = saturday;
        this.sunday = sunday;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    monday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    tuesday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    wednesday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    thursday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    friday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    saturday: boolean;

    @Column({
        type: "boolean",
        default: true
    })
    @IsBoolean()
    sunday: boolean;

    @OneToOne(type => Athlete)
    athlete: Athlete;

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

export const availabilitySchema = {
    id: { type: "number", required: true, example: 1 },
    monday: { type: "boolean", required: true, example: true },
    tuesday: { type: "boolean", required: true, example: false },
    wednesday: { type: "boolean", required: true, example: true },
    thursday: { type: "boolean", required: true, example: true },
    friday: { type: "boolean", required: true, example: true },
    saturday: { type: "boolean", required: true, example: true },
    sunday: { type: "boolean", required: true, example: false }
};