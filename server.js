import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';


const app = express();
const port = 3000;

app.use(express.json());


const users = new Map();


const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidName = (name) =>
  typeof name === 'string' && /^[A-Za-z\s.]{2,50}$/.test(name.trim());

const isValidAge = (age) =>
  Number.isInteger(age) && age >= 1 && age <= 120;

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create one or more users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/User'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Created user(s)
 */

app.post('/users', (req, res) => {
  const data = req.body;
  const inputArray = Array.isArray(data) ? data : [data];
  const addedUsers = [];

  for (const user of inputArray) {
    const { name, email, age } = user;

    if (!name || !email || age === undefined) {
      return res.status(400).json({ message: 'Each user must have name, email, and age' });
    }

    if (!isValidName(name)) {
      return res.status(400).json({ message: `Invalid name: ${name}` });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: `Invalid email format: ${email}` });
    }

    if (!isValidAge(age)) {
      return res.status(400).json({ message: `Invalid age: ${age}` });
    }

    const id = uuidv4();
    const newUser = { id, name, email, age };
    users.set(id, newUser);
    addedUsers.push(newUser);
  }

  return res.status(201).json(Array.isArray(data) ? addedUsers : addedUsers[0]);
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */

app.get('/users', (req, res) => {
  return res.status(200).json(Array.from(users.values()));
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A user
 *       404:
 *         description: User not found
 */


app.get('/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.status(200).json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Updated user
 *       404:
 *         description: User not found
 */

app.put('/users/:id', (req, res) => {
  const { name, email, age } = req.body;
  const user = users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (name && !isValidName(name)) {
    return res.status(400).json({ message: 'Invalid name format' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (age !== undefined && !isValidAge(age)) {
    return res.status(400).json({ message: 'Invalid age. Must be 1-120' });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (age !== undefined) user.age = age;

  users.set(req.params.id, user);
  return res.status(200).json(user);
});

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Bulk update users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               allOf:
 *                 - $ref: '#/components/schemas/UserUpdate'
 *                 - required:
 *                     - id
 *     responses:
 *       200:
 *         description: Updated users
 */

app.put('/users', (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: 'Request body must be an array of user updates' });
  }

  const results = [];

  for (const update of updates) {
    const { id, name, email, age } = update;

    if (!id) {
      return res.status(400).json({ message: 'Each user update must include an id' });
    }

    const user = users.get(id);
    if (!user) {
      return res.status(404).json({ message: `User not found: ${id}` });
    }

    if (name && !isValidName(name)) {
      return res.status(400).json({ message: `Invalid name for user ${id}` });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: `Invalid email for user ${id}` });
    }

    if (age !== undefined && !isValidAge(age)) {
      return res.status(400).json({ message: `Invalid age for user ${id}` });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (age !== undefined) user.age = age;

    users.set(id, user);
    results.push(user);
  }

  return res.status(200).json(results);
});
 /**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: User not found
 */

app.delete('/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  users.delete(req.params.id);
  return res.status(200).json({ message: 'User deleted successfully' });
});

/**
 * @swagger
 * /users:
 *   delete:
 *     summary: Bulk delete users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       200:
 *         description: Deleted users
 */

app.delete('/users', (req, res) => {
  const ids = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'Request body must be an array of user IDs' });
  }

  const deleted = [];
  const notFound = [];

  for (const id of ids) {
    if (users.has(id)) {
      users.delete(id);
      deleted.push(id);
    } else {
      notFound.push(id);
    }
  }

  return res.status(200).json({
    message: 'Bulk delete completed',deleted, notFound
  });
});
 /**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - age
 *       properties:
 *         name:
 *           type: string
 *           example: Aarav Jain
 *         email:
 *           type: string
 *           example: aarav@example.com
 *         age:
 *           type: integer
 *           example: 22
 *     UserUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         age:
 *           type: integer
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'API for managing users (single and bulk operations)',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js'], 
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
