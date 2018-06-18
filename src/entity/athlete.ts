import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Length, IsEmail } from 'class-validator';
import { Coach } from './coach';

@Entity()
export class Athlete {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    @Length(10, 80)
    name: string;

    @Column({
        length: 100
    })
    @Length(10, 100)
    @IsEmail()
    email: string;

    @ManyToOne(type => Coach, coach => coach.athletes, { onDelete: 'SET NULL' })
    coach: Promise<Coach>;
}
