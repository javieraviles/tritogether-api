import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Length, IsEmail } from 'class-validator';

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

    @Column({
        length: 60,
        select: false
    })
    @Length(60)
    password: string;

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
