import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Length } from 'class-validator';

@Entity()
export class Discipline {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 20
    })
    @Length(5, 20)
    name: string;

    @CreateDateColumn({
        type: 'timestamp',
        select: false
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        select: false
    })
    updatedAt: Date;
}
