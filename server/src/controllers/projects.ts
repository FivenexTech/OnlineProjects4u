import type { RequestHandler } from 'express'
import { ProjectModel } from '../models/project.js'
import { AppError } from '../middleware/errors.js'
import { projectQuerySchema } from '../schemas/project.js'

export const listProjects: RequestHandler = async (request, response, next) => {
  try {
    const { search, category, page, limit } = projectQuerySchema.parse(request.query)
    const filter: Record<string, unknown> = { publicationStatus: 'published' }
    if (category) filter.category = category
    if (search) filter.$text = { $search: search }
    const [items, total] = await Promise.all([ProjectModel.find(filter).select('-privateFiles').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), ProjectModel.countDocuments(filter)])
    response.json({ data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const getProject: RequestHandler = async (request, response, next) => {
  try { const project = await ProjectModel.findOne({ slug: request.params.slug, publicationStatus: 'published' }).select('-privateFiles').lean(); if (!project) throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND'); response.json({ data: project }) } catch (error) { next(error) }
}

export const createProject: RequestHandler = async (request, response, next) => {
  try { const project = await ProjectModel.create(request.body); response.status(201).json({ data: project }) } catch (error) { next(error) }
}