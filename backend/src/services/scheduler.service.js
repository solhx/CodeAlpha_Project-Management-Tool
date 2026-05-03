// backend/src/services/scheduler.service.js
import cron from 'node-cron';
import Task from '../models/Task.model.js';
import { notificationService } from './notification.service.js';

// Runs every day at 8:00 AM
export const startScheduler = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running due date reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tasks = await Task.find({
      dueDate: { $gte: tomorrow, $lt: dayAfter },
      status: { $ne: 'done' },
      isArchived: false,
    }).populate('assignees createdBy', 'name email');

    console.log(`📋 Found ${tasks.length} tasks due tomorrow`);

    for (const task of tasks) {
      await notificationService.notifyDueDateReminder(task);
    }

    console.log('✅ Due date reminder job completed');
  });

  // Also runs overdue check every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⚠️ Running overdue task check...');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['done'] },
      isArchived: false,
    }).populate('assignees createdBy', 'name email');

    console.log(`🚨 Found ${overdueTasks.length} overdue tasks`);
  });

  console.log('🕐 Task scheduler started');
};