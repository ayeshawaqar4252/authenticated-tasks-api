import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('Authenticated Tasks API (e2e)', () => {
  let app: INestApplication<App>;

  let accessToken: string;
  let projectId: number;
  let taskId: number;

  const email = `e2e-${Date.now()}@test.com`;
  const password = 'Test@12345';

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/auth/register')
        .send({
          name: 'E2E Test User',
          email,
          password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');

      expect(response.body).toHaveProperty(
        'name',
        'E2E Test User',
      );

      expect(response.body).toHaveProperty(
        'email',
        email,
      );

      expect(response.body).not.toHaveProperty(
        'password',
      );
    });

    it('should login and return JWT token', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

      expect(response.body).toHaveProperty(
        'access_token',
      );

      expect(
        typeof response.body.access_token,
      ).toBe('string');

      accessToken = response.body.access_token;
    });
  });

  describe('Projects', () => {
    it('should create a project with JWT authentication', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/projects')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          name: 'E2E Test Project',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');

      expect(response.body).toHaveProperty(
        'name',
        'E2E Test Project',
      );

      projectId = response.body.id;
    });

    it('should reject unauthenticated project request', async () => {
      await request(app.getHttpServer())
        .post('/projects')
        .send({
          name: 'Unauthorized Project',
        })
        .expect(401);
    });
  });

  describe('Tasks', () => {
    it('should create a task with JWT authentication', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .post('/tasks')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          title: 'E2E Test Task',
          description: 'Testing authenticated task API',
          priority: 3,
          projectId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');

      expect(response.body).toHaveProperty(
        'title',
        'E2E Test Task',
      );

      expect(response.body).toHaveProperty(
        'project',
      );

      taskId = response.body.id;
    });

    it('should return the authenticated user tasks', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .get('/tasks')
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      expect(
        response.body.some(
          (task: { id: number }) =>
            task.id === taskId,
        ),
      ).toBe(true);
    });

    it('should return a task by id', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .get(`/tasks/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);

      expect(response.body).toHaveProperty(
        'id',
        taskId,
      );

      expect(response.body).toHaveProperty(
        'title',
        'E2E Test Task',
      );
    });

    it('should update a task', async () => {
      const response = await request(
        app.getHttpServer(),
      )
        .patch(`/tasks/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          title: 'Updated E2E Task',
          priority: 5,
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        'id',
        taskId,
      );

      expect(response.body).toHaveProperty(
        'title',
        'Updated E2E Task',
      );

      expect(response.body).toHaveProperty(
        'priority',
        5,
      );
    });

    it('should reject unauthenticated task request', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });

    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(200);
    });

    it('should return 404 after deleting the task', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .expect(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});