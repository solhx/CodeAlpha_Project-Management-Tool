// backend/src/services/notification.service.js
import Notification from '../models/Notification.model.js';
import { getIO } from '../config/socket.js';

class NotificationService {
  async create({ recipient, sender, type, message, link, metadata }) {
    if (recipient.toString() === sender?.toString()) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      link,
      metadata,
    });

    await notification.populate('sender', 'name avatar');

    // Real-time push via Socket.io
    getIO()
      .to(`user:${recipient}`)
      .emit('notification:new', { notification });

    return notification;
  }

  async notifyTaskAssignment(task, assigner, assigneeIds) {
    const promises = assigneeIds.map((assigneeId) =>
      this.create({
        recipient: assigneeId,
        sender: assigner._id,
        type: 'task_assigned',
        message: `${assigner.name} assigned you to "${task.title}"`,
        link: `/projects/${task.project}/boards/${task.board}?task=${task._id}`,
        metadata: { taskId: task._id, projectId: task.project, boardId: task.board },
      })
    );
    await Promise.allSettled(promises);
  }

  async notifyComment(comment, task, author) {
    const recipients = new Set();

    // Notify task creator
    if (task.createdBy.toString() !== author._id.toString()) {
      recipients.add(task.createdBy.toString());
    }

    // Notify all assignees
    task.assignees.forEach((id) => {
      if (id.toString() !== author._id.toString()) {
        recipients.add(id.toString());
      }
    });

    // Notify watchers
    task.watchers?.forEach((id) => {
      if (id.toString() !== author._id.toString()) {
        recipients.add(id.toString());
      }
    });

    const promises = [...recipients].map((recipientId) =>
      this.create({
        recipient: recipientId,
        sender: author._id,
        type: 'comment_added',
        message: `${author.name} commented on "${task.title}"`,
        link: `/projects/${task.project}/boards/${task.board}?task=${task._id}`,
        metadata: { taskId: task._id, commentId: comment._id, projectId: task.project },
      })
    );
    await Promise.allSettled(promises);
  }

  async notifyMention(mentionedUserId, commenter, task) {
    await this.create({
      recipient: mentionedUserId,
      sender: commenter._id,
      type: 'comment_mention',
      message: `${commenter.name} mentioned you in "${task.title}"`,
      link: `/projects/${task.project}/boards/${task.board}?task=${task._id}`,
      metadata: { taskId: task._id, projectId: task.project },
    });
  }

  async notifyProjectInvite(invitedUserId, inviter, project) {
    await this.create({
      recipient: invitedUserId,
      sender: inviter._id,
      type: 'project_invite',
      message: `${inviter.name} invited you to project "${project.name}"`,
      link: `/projects/${project._id}`,
      metadata: { projectId: project._id },
    });
  }

  async notifyDueDateReminder(task) {
    const recipients = [...new Set([
      task.createdBy.toString(),
      ...task.assignees.map((id) => id.toString()),
    ])];

    const promises = recipients.map((recipientId) =>
      this.create({
        recipient: recipientId,
        sender: null,
        type: 'due_date_reminder',
        message: `Task "${task.title}" is due tomorrow`,
        link: `/projects/${task.project}/boards/${task.board}?task=${task._id}`,
        metadata: { taskId: task._id, projectId: task.project },
      })
    );
    await Promise.allSettled(promises);
  }
}

export const notificationService = new NotificationService();