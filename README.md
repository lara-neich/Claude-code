# Design Prompt Generator

Upload images, GIFs, and videos of designs and get AI-generated prompts to recreate them.

## Features

- **Multi-format Support**: Upload images (PNG, JPG, WebP, SVG), GIFs, and videos (MP4, WebM, MOV)
- **AI-Powered Analysis**: Uses Claude's vision capabilities to analyze design elements
- **Structured Output**: Get organized prompt sections for style, colors, typography, layout, and more
- **Copy-Ready Prompts**: One-click copy for individual sections or the complete prompt
- **Modern UI**: Clean, dark-themed interface built with React and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for AI analysis)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Claude-code
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Usage

1. **Upload**: Drag and drop or click to upload design files
2. **Select**: Choose a design from your uploads to analyze
3. **Generate**: Click "Generate Prompt" to analyze the design
4. **Copy**: Use the copy buttons to grab individual sections or the full prompt

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Multer
- **AI**: Anthropic Claude API (Vision)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx      # Drag-and-drop file upload
│   │   ├── DesignPreview.tsx   # File gallery and preview
│   │   ├── PromptOutput.tsx    # Generated prompt display
│   │   └── Header.tsx          # App header
│   ├── App.tsx                 # Main app component
│   ├── types.ts                # TypeScript interfaces
│   └── index.css               # Global styles
├── server/
│   ├── index.ts                # Express server
│   └── analyzer.ts             # Claude AI integration
├── public/                     # Static assets
└── uploads/                    # Uploaded files (gitignored)
```

## API Endpoints

- `POST /api/upload` - Upload a design file
- `POST /api/analyze` - Analyze a design and generate prompts
- `GET /api/health` - Health check

## License

MIT
