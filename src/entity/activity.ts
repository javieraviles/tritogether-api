import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Length, IsNotEmpty, IsDate } from 'class-validator';
import { Athlete } from './athlete';
import { Discipline } from './discipline';

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 255
    })
    @Length(10, 255)
    description: string;

    @Column()
    @IsDate()
    date: Date;

    @IsNotEmpty()
    @ManyToOne(type => Athlete, { onDelete: 'CASCADE' })
    athlete: Athlete;

    @IsNotEmpty()
    @ManyToOne(type => Discipline, { onDelete: 'CASCADE' })
    discipline: Discipline;

    @CreateDateColumn({type: 'timestamp'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp'})
    updatedAt: Date;
}