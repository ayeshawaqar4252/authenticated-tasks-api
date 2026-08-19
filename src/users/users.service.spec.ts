import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: getRepositoryToken(User),
            useValue: {
              findOne: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
            },
          },
        ],
      }).compile();

    service = module.get<UsersService>(UsersService);

    repository = module.get(
      getRepositoryToken(User),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = {
        id: 7,
        name: 'Ayesha',
        email: 'ayesha@test.com',
      } as User;

      repository.findOne.mockResolvedValue(user);

      const result = await service.findById(7);

      expect(result).toEqual(user);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it('should return null when user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = {
        id: 7,
        name: 'Ayesha',
        email: 'ayesha@test.com',
        password: 'hashed-password',
      } as User;

      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(
        'ayesha@test.com',
      );

      expect(result).toEqual(user);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          email: 'ayesha@test.com',
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          createdAt: true,
        },
      });
    });
  });

  describe('createUser', () => {
    it('should create and save a new user', async () => {
      const user = {
        id: 8,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      } as User;

      repository.create.mockReturnValue(user);
      repository.save.mockResolvedValue(user);

      const result = await service.createUser(
        'Test User',
        'test@example.com',
        'hashed-password',
      );

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      });

      expect(repository.save).toHaveBeenCalledWith(user);

      expect(result).toEqual(user);
    });
  });
});