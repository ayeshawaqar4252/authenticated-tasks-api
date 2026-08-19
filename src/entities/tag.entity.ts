import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Task } from './task.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    unique: true,
  })
  name!: string;

  @ManyToMany(() => Task, (task) => task.tags)
  tasks!: Task[];
}
