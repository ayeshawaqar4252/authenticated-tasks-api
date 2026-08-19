import { NotFoundException } from '@nestjs/common';

import { TasksService } from './tasks.service';

import {
  Task,
  TaskStatus,
} from '../entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;

  let taskRepository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  let projectRepository: {
    findOne: jest.Mock;
  };

  let userRepository: {
    findOne: jest.Mock;
  };

  let tagRepository: {
    findBy: jest.Mock;
  };

  beforeEach(() => {
    taskRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    projectRepository = {
      findOne: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    tagRepository = {
      findBy: jest.fn(),
    };

    service = new TasksService(
      taskRepository as any,
      projectRepository as any,
      userRepository as any,
      tagRepository as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return tasks belonging to the user', async () => {
      const tasks = [
        {
          id: 16,
          title: 'Complete NestJS API',
        },
      ] as Task[];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getMany: jest.fn(),
      };

      queryBuilder.leftJoinAndSelect.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.where.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.andWhere.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.getMany.mockResolvedValue(tasks);

      taskRepository.createQueryBuilder.mockReturnValue(
        queryBuilder,
      );

      const result = await service.findAll(7);

      expect(result).toEqual(tasks);

      expect(
        taskRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('task');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'project.owner_id = :userId',
        {
          userId: 7,
        },
      );
    });

    it('should apply filters when provided', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getMany: jest.fn(),
      };

      queryBuilder.leftJoinAndSelect.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.where.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.andWhere.mockReturnValue(
        queryBuilder,
      );

      queryBuilder.getMany.mockResolvedValue([]);

      taskRepository.createQueryBuilder.mockReturnValue(
        queryBuilder,
      );

      await service.findAll(
        7,
        TaskStatus.IN_PROGRESS,
        4,
        8,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        {
          status: TaskStatus.IN_PROGRESS,
        },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.id = :projectId',
        {
          projectId: 4,
        },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'assignee.id = :assigneeId',
        {
          assigneeId: 8,
        },
      );
    });
  });

  describe('findById', () => {
    it('should return a task by id for the owner', async () => {
      const task = {
        id: 16,
        title: 'Complete NestJS API',
      } as Task;

      taskRepository.findOne.mockResolvedValue(task);

      const result = await service.findById(16, 7);

      expect(result).toEqual(task);

      expect(
        taskRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 16,
          project: {
            owner: {
              id: 7,
            },
          },
        },
        relations: {
          project: true,
          assignee: true,
          tags: true,
        },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findById(999, 7),
      ).rejects.toThrow(
        new NotFoundException('Task not found'),
      );
    });
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const project = {
        id: 4,
        name: 'My NestJS Project',
      };

      const task = {
        id: 17,
        title: 'New Task',
        description: 'Test task',
        status: TaskStatus.TODO,
        priority: 3,
        project,
        assignee: null,
        tags: [],
      } as unknown as Task;

      projectRepository.findOne.mockResolvedValue(project);

      tagRepository.findBy.mockResolvedValue([]);

      taskRepository.create.mockReturnValue(task);

      taskRepository.save.mockResolvedValue(task);

      const result = await service.create(
        {
          title: 'New Task',
          description: 'Test task',
          status: TaskStatus.TODO,
          priority: 3,
          projectId: 4,
        },
        7,
      );

      expect(result).toEqual(task);

      expect(
        projectRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 4,
          owner: {
            id: 7,
          },
        },
      });

      expect(
        taskRepository.create,
      ).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Test task',
        status: TaskStatus.TODO,
        priority: 3,
        project,
        assignee: null,
        tags: [],
      });

      expect(
        taskRepository.save,
      ).toHaveBeenCalledWith(task);
    });

    it('should throw NotFoundException when project is not owned by user', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'New Task',
            status: TaskStatus.TODO,
            priority: 3,
            projectId: 999,
          },
          7,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Project not found or you are not the owner',
        ),
      );

      expect(
        taskRepository.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const task = {
        id: 16,
        title: 'Old Title',
        description: 'Old description',
        status: TaskStatus.TODO,
        priority: 3,
        project: {
          id: 4,
        },
        assignee: null,
        tags: [],
      } as unknown as Task;

      taskRepository.findOne.mockResolvedValue(task);

      taskRepository.save.mockResolvedValue({
        ...task,
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
        priority: 5,
      });

      const result = await service.update(
        16,
        {
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS,
          priority: 5,
        },
        7,
      );

      expect(task.title).toBe('Updated Title');

      expect(task.status).toBe(
        TaskStatus.IN_PROGRESS,
      );

      expect(task.priority).toBe(5);

      expect(
        taskRepository.save,
      ).toHaveBeenCalledWith(task);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when updating a missing task', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          999,
          {
            title: 'Updated Task',
          },
          7,
        ),
      ).rejects.toThrow(
        new NotFoundException('Task not found'),
      );

      expect(
        taskRepository.save,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a task successfully', async () => {
      const task = {
        id: 16,
        title: 'Task to delete',
        project: {
          id: 4,
        },
      } as unknown as Task;

      taskRepository.findOne.mockResolvedValue(task);

      taskRepository.remove.mockResolvedValue(task);

      await service.remove(16, 7);

      expect(
        taskRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 16,
          project: {
            owner: {
              id: 7,
            },
          },
        },
        relations: {
          project: true,
        },
      });

      expect(
        taskRepository.remove,
      ).toHaveBeenCalledWith(task);
    });

    it('should throw NotFoundException when removing a missing task', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(999, 7),
      ).rejects.toThrow(
        new NotFoundException('Task not found'),
      );

      expect(
        taskRepository.remove,
      ).not.toHaveBeenCalled();
    });
  });
});