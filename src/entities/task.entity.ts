import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Project } from './project.entity';
import { User } from './user.entity';
import { Tag } from './tag.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
@Check(`"priority" >= 1 AND "priority" <= 5`)
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
  })
  status!: TaskStatus;

  @Column({
    type: 'integer',
  })
  priority!: number;

  @ManyToOne(() => Project, (project) => project.tasks, {
    nullable: false,
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, (user) => user.assignedTasks, {
    nullable: true,
  })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User | null;

  @Column({
    name: 'due_date',
    type: 'date',
    nullable: true,
  })
  dueDate!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ManyToMany(() => Tag, (tag) => tag.tasks)
  @JoinTable({
    name: 'task_tags',
    joinColumn: {
      name: 'task_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id',
    },
  })
  tags!: Tag[];
}
