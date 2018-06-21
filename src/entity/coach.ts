import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Length, IsEmail } from 'class-validator';
import { Athlete } from './athlete';

@Entity()
export class Coach {
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

    @OneToMany(type => Athlete, athlete => athlete.coach)
    athletes: Athlete[];

    @CreateDateColumn({type: 'timestamp'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt: Date;
}
