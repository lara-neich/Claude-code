import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { analyzeDesign } from './analyzer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4()
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueId}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const fileId = path.basename(req.file.filename, path.extname(req.file.filename))

  res.json({
    id: fileId,
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  })
})

// Design analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { fileId, fileName, fileType } = req.body

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' })
    }

    // Find the file in uploads directory
    const files = fs.readdirSync(uploadsDir)
    const matchingFile = files.find(f => f.startsWith(fileId))

    if (!matchingFile) {
      return res.status(404).json({ error: 'File not found' })
    }

    const filePath = path.join(uploadsDir, matchingFile)

    // Analyze the design
    const result = await analyzeDesign(filePath, fileName, fileType)

    res.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze design',
    })
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
