import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import {
  Task,
  TaskStatus,
} from '../entities/task.entity';

import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { Tag } from '../entities/tag.entity';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(
    userId: number,
    status?: TaskStatus,
    projectId?: number,
    assigneeId?: number,
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.tags', 'tags')
      .where('project.owner_id = :userId', {
        userId,
      });

    if (status) {
      query.andWhere('task.status = :status', {
        status,
      });
    }

    if (projectId !== undefined) {
      query.andWhere('project.id = :projectId', {
        projectId,
      });
    }

    if (assigneeId !== undefined) {
      query.andWhere('assignee.id = :assigneeId', {
        assigneeId,
      });
    }

    return query.getMany();
  }

  async findById(
    id: number,
    userId: number,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: {
        id,
        project: {
          owner: {
            id: userId,
          },
        },
      },
      relations: {
        project: true,
        assignee: true,
        tags: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(
    createTaskDto: CreateTaskDto,
    userId: number,
  ): Promise<Task> {
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      tagIds,
    } = createTaskDto;

    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        owner: {
          id: userId,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found or you are not the owner',
      );
    }

    let assignee: User | null = null;

    if (assigneeId !== undefined) {
      assignee = await this.userRepository.findOne({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException(
          'Assignee not found',
        );
      }
    }

    let tags: Tag[] = [];

    if (tagIds !== undefined) {
      tags = await this.tagRepository.findBy({
        id: In(tagIds),
      });

      if (tags.length !== tagIds.length) {
        throw new NotFoundException(
          'One or more tags not found',
        );
      }
    }

    const task = this.taskRepository.create({
      title,
      description: description ?? null,
      status: status ?? TaskStatus.TODO,
      priority,
      project,
      assignee,
      tags,
    });

    return this.taskRepository.save(task);
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    userId: number,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: {
        id,
        project: {
          owner: {
            id: userId,
          },
        },
      },
      relations: {
        project: true,
        assignee: true,
        tags: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      tagIds,
    } = updateTaskDto;

    if (projectId !== undefined) {
      const project = await this.projectRepository.findOne({
        where: {
          id: projectId,
          owner: {
            id: userId,
          },
        },
      });

      if (!project) {
        throw new NotFoundException(
          'Project not found or you are not the owner',
        );
      }

      task.project = project;
    }

    if (assigneeId !== undefined) {
      const assignee = await this.userRepository.findOne({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException(
          'Assignee not found',
        );
      }

      task.assignee = assignee;
    }

    if (tagIds !== undefined) {
      const tags = await this.tagRepository.findBy({
        id: In(tagIds),
      });

      if (tags.length !== tagIds.length) {
        throw new NotFoundException(
          'One or more tags not found',
        );
      }

      task.tags = tags;
    }

    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    return this.taskRepository.save(task);
  }

  async remove(
    id: number,
    userId: number,
  ): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: {
        id,
        project: {
          owner: {
            id: userId,
          },
        },
      },
      relations: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.remove(task);
  }
}