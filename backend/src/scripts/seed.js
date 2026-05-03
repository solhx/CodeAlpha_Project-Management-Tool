// backend/src/scripts/seed.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Project from '../models/Project.model.js';
import Board from '../models/Board.model.js';
import Column from '../models/Column.model.js';
import Task from '../models/Task.model.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Board.deleteMany({}),
      Column.deleteMany({}),
      Task.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // ── Create Users ──
    const adminUser = await User.create({
      name:       'Admin User',
      email:      'admin@proflow.com',
      password:   'Admin1234',
      role:       'admin',
      isVerified: true,
    });

    const memberUser = await User.create({
      name:       'Jane Member',
      email:      'member@proflow.com',
      password:   'Member1234',
      role:       'user',
      isVerified: true,
    });

    const devUser = await User.create({
      name:       'Bob Developer',
      email:      'dev@proflow.com',
      password:   'Dev12345',
      role:       'user',
      isVerified: true,
    });

    console.log('👤 Users created');

    // ── Create Project ──
    const project = await Project.create({
      name:        'ProFlow Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX.',
      owner:       adminUser._id,
      color:       '#6366f1',
      icon:        '🚀',
      status:      'active',
      members: [
        { user: adminUser._id,  role: 'owner'  },
        { user: memberUser._id, role: 'admin'  },
        { user: devUser._id,    role: 'member' },
      ],
      tags: ['design', 'frontend', 'high-priority'],
    });

    console.log('📁 Project created');

    // ── Create Board ──
    const board = await Board.create({
      name:       'Sprint 1',
      project:    project._id,
      createdBy:  adminUser._id,
      background: '#f8fafc',
    });

    // ── Create Columns ──
    const columnData = [
      { title: 'To Do',       color: '#e2e8f0', order: 0 },
      { title: 'In Progress', color: '#dbeafe', order: 1 },
      { title: 'Review',      color: '#fef3c7', order: 2 },
      { title: 'Done',        color: '#dcfce7', order: 3 },
    ];

    const columns = await Column.insertMany(
      columnData.map((c) => ({ ...c, board: board._id }))
    );

    const [todoCol, inProgressCol, reviewCol, doneCol] = columns;

    // ── Create Tasks ──
    const tasks = [
      {
        title:       'Design new homepage wireframes',
        description: 'Create wireframes for the new homepage design using Figma.',
        board:       board._id,
        column:      todoCol._id,
        project:     project._id,
        createdBy:   adminUser._id,
        assignees:   [memberUser._id],
        priority:    'high',
        status:      'todo',
        order:       0,
        dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        labels:      [{ text: 'Design', color: '#8b5cf6' }],
      },
      {
        title:       'Setup Next.js project structure',
        description: 'Initialize the Next.js project with TypeScript, Tailwind CSS, and folder structure.',
        board:       board._id,
        column:      inProgressCol._id,
        project:     project._id,
        createdBy:   adminUser._id,
        assignees:   [devUser._id],
        priority:    'critical',
        status:      'in_progress',
        order:       0,
        dueDate:     new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        labels:      [{ text: 'Frontend', color: '#3b82f6' }],
        checklist: [
          { text: 'Install dependencies',  isCompleted: true  },
          { text: 'Configure Tailwind',    isCompleted: true  },
          { text: 'Setup folder structure', isCompleted: false },
          { text: 'Configure ESLint',      isCompleted: false },
        ],
      },
      {
        title:       'Define color system and typography',
        description: 'Establish the design system with colors, fonts, and spacing guidelines.',
        board:       board._id,
        column:      reviewCol._id,
        project:     project._id,
        createdBy:   memberUser._id,
        assignees:   [memberUser._id, adminUser._id],
        priority:    'medium',
        status:      'review',
        order:       0,
        labels:      [
          { text: 'Design', color: '#8b5cf6' },
          { text: 'UI',     color: '#ec4899'  },
        ],
      },
      {
        title:       'Project requirements documentation',
        description: 'Complete all documentation for the project scope and requirements.',
        board:       board._id,
        column:      doneCol._id,
        project:     project._id,
        createdBy:   adminUser._id,
        assignees:   [adminUser._id],
        priority:    'low',
        status:      'done',
        order:       0,
        labels:      [{ text: 'Docs', color: '#14b8a6' }],
      },
      {
        title:       'Implement authentication flow',
        description: 'Build login, register, and JWT token refresh functionality.',
        board:       board._id,
        column:      todoCol._id,
        project:     project._id,
        createdBy:   adminUser._id,
        assignees:   [devUser._id],
        priority:    'critical',
        status:      'todo',
        order:       1,
        dueDate:     new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        labels:      [
          { text: 'Backend',  color: '#22c55e' },
          { text: 'Security', color: '#ef4444' },
        ],
      },
    ];

    await Task.insertMany(tasks);
    console.log('✅ Tasks created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('─────────────────────────────────');
    console.log('📧 Admin:  admin@proflow.com  / Admin1234');
    console.log('📧 Member: member@proflow.com / Member1234');
    console.log('📧 Dev:    dev@proflow.com    / Dev12345');
    console.log('─────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();