import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.projects, {
    nullable: false,
  })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];
}