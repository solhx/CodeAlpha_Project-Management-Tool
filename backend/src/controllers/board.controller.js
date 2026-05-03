// backend/src/controllers/board.controller.js
import Board from '../models/Board.model.js';
import Column from '../models/Column.model.js';
import Task from '../models/Task.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/v1/boards?projectId=
export const getBoards = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) throw new ApiError(400, 'projectId is required');

  const boards = await Board.find({ project: projectId, isArchived: false })
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, { boards }));
});

// GET /api/v1/boards/:id — full board with columns + tasks
export const getBoardById = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id).populate('createdBy', 'name avatar');
  if (!board) throw new ApiError(404, 'Board not found');

  const columns = await Column.find({ board: req.params.id }).sort({ order: 1 });
  const tasks = await Task.find({ board: req.params.id, isArchived: false })
    .sort({ order: 1 })
    .populate('assignees', 'name avatar')
    .populate('createdBy', 'name avatar')
    .populate('column', 'title');

  return res.status(200).json(
    new ApiResponse(200, { board, columns, tasks })
  );
});

// POST /api/v1/boards
export const createBoard = asyncHandler(async (req, res) => {
  const { name, description, projectId, background } = req.body;

  const board = await Board.create({
    name, description, background,
    project: projectId,
    createdBy: req.user._id,
  });

  // Create default columns
  const defaultColumns = ['To Do', 'In Progress', 'Review', 'Done'];
  const columns = await Column.insertMany(
    defaultColumns.map((title, index) => ({
      title, board: board._id, order: index,
    }))
  );

  return res.status(201).json(new ApiResponse(201, { board, columns }, 'Board created'));
});

// PUT /api/v1/boards/:id
export const updateBoard = asyncHandler(async (req, res) => {
  const board = await Board.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!board) throw new ApiError(404, 'Board not found');
  return res.status(200).json(new ApiResponse(200, { board }));
});

// DELETE /api/v1/boards/:id
export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) throw new ApiError(404, 'Board not found');

  const columns = await Column.find({ board: req.params.id });
  const columnIds = columns.map((c) => c._id);

  await Promise.all([
    Task.deleteMany({ column: { $in: columnIds } }),
    Column.deleteMany({ board: req.params.id }),
    Board.findByIdAndDelete(req.params.id),
  ]);

  return res.status(200).json(new ApiResponse(200, {}, 'Board deleted'));
});

// POST /api/v1/boards/:boardId/columns
export const createColumn = asyncHandler(async (req, res) => {
  const { title, color } = req.body;
  const lastColumn = await Column.findOne({ board: req.params.boardId }).sort({ order: -1 });
  const order = lastColumn ? lastColumn.order + 1 : 0;

  const column = await Column.create({
    title, color, order,
    board: req.params.boardId,
  });

  return res.status(201).json(new ApiResponse(201, { column }, 'Column created'));
});

// PUT /api/v1/boards/:boardId/columns/:columnId
export const updateColumn = asyncHandler(async (req, res) => {
  const column = await Column.findByIdAndUpdate(req.params.columnId, req.body, { new: true });
  if (!column) throw new ApiError(404, 'Column not found');
  return res.status(200).json(new ApiResponse(200, { column }));
});

// DELETE /api/v1/boards/:boardId/columns/:columnId
export const deleteColumn = asyncHandler(async (req, res) => {
  const column = await Column.findById(req.params.columnId);
  if (!column) throw new ApiError(404, 'Column not found');

  await Task.deleteMany({ column: req.params.columnId });
  await Column.findByIdAndDelete(req.params.columnId);

  return res.status(200).json(new ApiResponse(200, {}, 'Column deleted'));
});

// PATCH /api/v1/boards/:boardId/columns/reorder
export const reorderColumns = asyncHandler(async (req, res) => {
  const { columns } = req.body; // [{ id, order }]

  const updates = columns.map(({ id, order }) =>
    Column.findByIdAndUpdate(id, { order }, { new: true })
  );
  await Promise.all(updates);

  return res.status(200).json(new ApiResponse(200, {}, 'Columns reordered'));
});