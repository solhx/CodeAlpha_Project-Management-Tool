// frontend/src/store/slices/taskSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';

const initialState = {
  // All tasks keyed by ID for O(1) lookup
  byId:          {},

  // Task IDs grouped by column
  byColumn:      {},

  // Currently open task in modal
  activeTaskId:  null,

  // Filter state
  filters: {
    priority:  'all',
    status:    'all',
    assignee:  'all',
    search:    '',
    dueDate:   'all',   // 'all' | 'overdue' | 'today' | 'this_week'
  },

  // Sort state
  sort: {
    field: 'order',     // 'order' | 'dueDate' | 'priority' | 'title' | 'createdAt'
    dir:   'asc',
  },

  // UI state
  isCreating:    false,
  isDragging:    false,
  draggedTaskId: null,

  // Pagination for "My Tasks" view
  pagination: {
    page:  1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// ── Priority sort weights ──
const PRIORITY_WEIGHT = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // ── Bulk load tasks for a board ──
    setTasks: (state, action) => {
      const tasks = action.payload;
      state.byId     = {};
      state.byColumn = {};

      tasks.forEach((task) => {
        state.byId[task._id] = task;

        const colId = task.column?._id || task.column;
        if (!state.byColumn[colId]) state.byColumn[colId] = [];
        if (!state.byColumn[colId].includes(task._id)) {
          state.byColumn[colId].push(task._id);
        }
      });
    },

    // ── Add single task ──
    addTask: (state, action) => {
      const task  = action.payload;
      const colId = task.column?._id || task.column;

      state.byId[task._id] = task;

      if (!state.byColumn[colId]) state.byColumn[colId] = [];
      if (!state.byColumn[colId].includes(task._id)) {
        state.byColumn[colId].push(task._id);
      }
    },

    // ── Update task fields ──
    updateTask: (state, action) => {
      const updated = action.payload;
      const id      = updated._id;
      if (!state.byId[id]) return;

      const oldColId = state.byId[id].column?._id || state.byId[id].column;
      const newColId = updated.column?._id         || updated.column || oldColId;

      // Update the record
      state.byId[id] = { ...state.byId[id], ...updated };

      // If column changed, update byColumn index
      if (oldColId && newColId && oldColId !== newColId) {
        if (state.byColumn[oldColId]) {
          state.byColumn[oldColId] = state.byColumn[oldColId].filter((tid) => tid !== id);
        }
        if (!state.byColumn[newColId]) state.byColumn[newColId] = [];
        if (!state.byColumn[newColId].includes(id)) {
          state.byColumn[newColId].push(id);
        }
      }
    },

    // ── Remove task ──
    removeTask: (state, action) => {
      const id    = action.payload;
      const task  = state.byId[id];
      if (!task) return;

      const colId = task.column?._id || task.column;
      delete state.byId[id];

      if (state.byColumn[colId]) {
        state.byColumn[colId] = state.byColumn[colId].filter((tid) => tid !== id);
      }

      if (state.activeTaskId === id) state.activeTaskId = null;
    },

    // ── Optimistic move ──
    moveTask: (state, action) => {
      const { taskId, sourceColumnId, targetColumnId, newOrder } = action.payload;
      const task = state.byId[taskId];
      if (!task) return;

      // Remove from source column
      if (state.byColumn[sourceColumnId]) {
        state.byColumn[sourceColumnId] = state.byColumn[sourceColumnId]
          .filter((id) => id !== taskId);
      }

      // Insert into target column at newOrder
      if (!state.byColumn[targetColumnId]) state.byColumn[targetColumnId] = [];
      const targetIds = state.byColumn[targetColumnId].filter((id) => id !== taskId);
      targetIds.splice(newOrder, 0, taskId);
      state.byColumn[targetColumnId] = targetIds;

      // Update task record
      state.byId[taskId] = {
        ...task,
        column: targetColumnId,
        order:  newOrder,
      };
    },

    // ── Reorder within same column ──
    reorderTasksInColumn: (state, action) => {
      const { columnId, orderedIds } = action.payload;
      state.byColumn[columnId] = orderedIds;
      orderedIds.forEach((id, index) => {
        if (state.byId[id]) state.byId[id].order = index;
      });
    },

    // ── Set active task (modal open) ──
    setActiveTask: (state, action) => {
      state.activeTaskId = action.payload;
    },

    clearActiveTask: (state) => {
      state.activeTaskId = null;
    },

    // ── Drag state ──
    setDragging: (state, action) => {
      state.isDragging    = action.payload.isDragging;
      state.draggedTaskId = action.payload.taskId || null;
    },

    // ── Creating state ──
    setIsCreating: (state, action) => {
      state.isCreating = action.payload;
    },

    // ── Filters ──
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key]   = value;
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // ── Sort ──
    setSort: (state, action) => {
      const { field, dir } = action.payload;
      if (state.sort.field === field) {
        // Toggle direction if same field
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.field = field;
        state.sort.dir   = dir || 'asc';
      }
    },

    // ── Pagination ──
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },

    // ── Clear all tasks (board unmount) ──
    clearTasks: (state) => {
      state.byId          = {};
      state.byColumn      = {};
      state.activeTaskId  = null;
      state.isDragging    = false;
      state.draggedTaskId = null;
    },

    // ── Update checklist item optimistically ──
    updateChecklistItem: (state, action) => {
      const { taskId, itemIndex, isCompleted } = action.payload;
      const task = state.byId[taskId];
      if (!task?.checklist?.[itemIndex]) return;
      state.byId[taskId].checklist[itemIndex].isCompleted = isCompleted;
    },

    // ── Add / remove watcher ──
    toggleWatcher: (state, action) => {
      const { taskId, userId } = action.payload;
      const task = state.byId[taskId];
      if (!task) return;

      const watchers = task.watchers || [];
      const exists   = watchers.includes(userId);

      state.byId[taskId].watchers = exists
        ? watchers.filter((id) => id !== userId)
        : [...watchers, userId];
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  removeTask,
  moveTask,
  reorderTasksInColumn,
  setActiveTask,
  clearActiveTask,
  setDragging,
  setIsCreating,
  setFilter,
  resetFilters,
  setSort,
  setPagination,
  setPage,
  clearTasks,
  updateChecklistItem,
  toggleWatcher,
} = taskSlice.actions;

export default taskSlice.reducer;

// ─────────────────────────────────────────────
//  SELECTORS
// ─────────────────────────────────────────────

// Raw
export const selectTasksById       = (state) => state.tasks.byId;
export const selectTasksByColumn   = (state) => state.tasks.byColumn;
export const selectActiveTaskId    = (state) => state.tasks.activeTaskId;
export const selectFilters         = (state) => state.tasks.filters;
export const selectSort            = (state) => state.tasks.sort;
export const selectIsDragging      = (state) => state.tasks.isDragging;
export const selectDraggedTaskId   = (state) => state.tasks.draggedTaskId;
export const selectIsCreating      = (state) => state.tasks.isCreating;
export const selectPagination      = (state) => state.tasks.pagination;

// Single task
export const selectTaskById = (taskId) =>
  (state) => state.tasks.byId[taskId] || null;

// Active task object
export const selectActiveTask = createSelector(
  selectTasksById,
  selectActiveTaskId,
  (byId, activeId) => (activeId ? byId[activeId] : null)
);

// All tasks as array
export const selectAllTasks = createSelector(
  selectTasksById,
  (byId) => Object.values(byId)
);

// Tasks for a specific column (ordered)
export const selectTasksForColumn = (columnId) =>
  createSelector(
    selectTasksById,
    selectTasksByColumn,
    (byId, byColumn) => {
      const ids = byColumn[columnId] || [];
      return ids.map((id) => byId[id]).filter(Boolean);
    }
  );

// Filtered + sorted tasks for a column
export const selectFilteredTasksForColumn = (columnId) =>
  createSelector(
    selectTasksById,
    selectTasksByColumn,
    selectFilters,
    selectSort,
    (byId, byColumn, filters, sort) => {
      const ids   = byColumn[columnId] || [];
      let tasks   = ids.map((id) => byId[id]).filter(Boolean);

      // Apply filters
      if (filters.priority !== 'all') {
        tasks = tasks.filter((t) => t.priority === filters.priority);
      }
      if (filters.status !== 'all') {
        tasks = tasks.filter((t) => t.status === filters.status);
      }
      if (filters.assignee !== 'all') {
        tasks = tasks.filter((t) =>
          t.assignees?.some((a) => (a._id || a) === filters.assignee)
        );
      }
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        tasks = tasks.filter((t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }
      if (filters.dueDate === 'overdue') {
        tasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
        );
      }
      if (filters.dueDate === 'today') {
        tasks = tasks.filter((t) => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate).toDateString() === new Date().toDateString();
        });
      }
      if (filters.dueDate === 'this_week') {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        tasks = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) <= weekEnd
        );
      }

      // Apply sort
      tasks.sort((a, b) => {
        let valA, valB;
        switch (sort.field) {
          case 'priority':
            valA = PRIORITY_WEIGHT[a.priority] ?? 4;
            valB = PRIORITY_WEIGHT[b.priority] ?? 4;
            break;
          case 'dueDate':
            valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            break;
          case 'title':
            valA = a.title?.toLowerCase() || '';
            valB = b.title?.toLowerCase() || '';
            break;
          case 'createdAt':
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            break;
          default: // 'order'
            valA = a.order ?? 0;
            valB = b.order ?? 0;
        }
        if (valA < valB) return sort.dir === 'asc' ? -1 :  1;
        if (valA > valB) return sort.dir === 'asc' ?  1 : -1;
        return 0;
      });

      return tasks;
    }
  );

// Tasks assigned to current user
export const selectMyTasks = (userId) =>
  createSelector(
    selectAllTasks,
    (tasks) =>
      tasks.filter((t) =>
        t.assignees?.some((a) => (a._id || a) === userId)
      )
  );

// Overdue count
export const selectOverdueCount = createSelector(
  selectAllTasks,
  (tasks) =>
    tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length
);

// Active filters count (for badge display)
export const selectActiveFiltersCount = createSelector(
  selectFilters,
  (filters) =>
    Object.entries(filters).filter(
      ([, value]) => value !== 'all' && value !== ''
    ).length
);