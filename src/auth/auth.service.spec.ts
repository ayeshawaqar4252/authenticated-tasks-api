import { expect } from '@jest/globals';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  let usersService: {
    findByEmail: jest.Mock;
    createUser: jest.Mock;
  };

  let jwtService: {
    signAsync: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      usersService.createUser.mockResolvedValue({
        id: 8,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      });

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.id).toBe(8);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      expect(usersService.createUser).toHaveBeenCalled();

      const createUserCall =
        usersService.createUser.mock.calls[0];

      expect(createUserCall[0]).toBe('Test User');
      expect(createUserCall[1]).toBe('test@example.com');
      expect(createUserCall[2]).not.toBe('password123');

      const passwordMatches = await bcrypt.compare(
        'password123',
        createUserCall[2],
      );

      expect(passwordMatches).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 7,
        name: 'Ayesha',
        email: 'ayesha@test.com',
        password: 'hashed-password',
      });

      await expect(
        service.register({
          name: 'Ayesha',
          email: 'ayesha@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'Email already registered',
        ),
      );

      expect(
        usersService.createUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword =
        await bcrypt.hash('password123', 10);

      usersService.findByEmail.mockResolvedValue({
        id: 7,
        name: 'Ayesha',
        email: 'ayesha@test.com',
        password: hashedPassword,
      });

      jwtService.signAsync.mockResolvedValue(
        'test-jwt-token',
      );

      const result = await service.login({
        email: 'ayesha@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'test-jwt-token',
      });

      expect(
        usersService.findByEmail,
      ).toHaveBeenCalledWith(
        'ayesha@test.com',
      );

      expect(
        jwtService.signAsync,
      ).toHaveBeenCalledWith({
        sub: 7,
        email: 'ayesha@test.com',
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid email or password',
        ),
      );

      expect(
        jwtService.signAsync,
      ).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword =
        await bcrypt.hash('correct-password', 10);

      usersService.findByEmail.mockResolvedValue({
        id: 7,
        name: 'Ayesha',
        email: 'ayesha@test.com',
        password: hashedPassword,
      });

      await expect(
        service.login({
          email: 'ayesha@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid email or password',
        ),
      );

      expect(
        jwtService.signAsync,
      ).not.toHaveBeenCalled();
    });
  });
});