# CV Builder - AI-Powered CV Analysis Tool

A modern web application that analyzes CVs using Google's Gemini AI, provides job fit scoring, and generates personalized interview questions.

![Playwright tests](https://github.com/bjornstjerne/cvbuilder/actions/workflows/playwright.yml/badge.svg)

## Features

✨ **File Upload Support**
- Upload PDF and Word documents (.pdf, .docx)
- Automatic text extraction using pdf.js and mammoth.js
- Manual text input also supported

🤖 **AI-Powered Analysis**
- Secure backend integration with Google Gemini API
- CV strength scoring (0-100)
- Job description matching
- Personalized improvement suggestions
- Missing keyword detection
- Custom interview question generation

🔒 **Secure Architecture**
- API key stored securely in backend `.env` file
- No client-side exposure of sensitive credentials
- CORS-enabled for local development

## Project Structure

```
CvBuilder/
├── index.html          # Frontend UI
├── style.css           # Styling
├── script.js           # Frontend logic
├── server.js           # Backend API server
├── .env                # Environment variables (API key)
├── .gitignore          # Git ignore rules
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Setup & Installation

### Prerequisites
- Node.js v18+ installed
- Google Gemini API key

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - The `.env` file is already configured with your API key
   - To use a different key, edit `.env`:
     ```
     GEMINI_API_KEY=your_api_key_here
     PORT=3000
     ```

3. **Start the Backend Server**
   ```bash
   node server.js
   ```
   
   You should see:
   ```
   🚀 CV Builder backend running on http://localhost:3000
   📊 API endpoint: http://localhost:3000/api/analyze
   ```

## Running UI tests

We use Playwright for end-to-end UI tests. To run them locally:

```bash
npm ci
npx playwright install --with-deps
npm run test:ui
```

CI (GitHub Actions) runs the Playwright tests on push and PRs. Test artifacts (videos & reports) are uploaded to the workflow artifacts and can be downloaded from the Actions run.


4. **Open the Frontend**
   - Open `index.html` in your web browser
   - Or navigate to: `file:///Users/bjornstjerne/Desktop/Google_Antigravity/CvBuilder/index.html`

## Usage

1. **Upload or Paste CV**
   - Click "Upload PDF/Word" to select a file
   - Or paste CV text directly into the text area

2. **Add Job Description (Optional)**
   - Paste a job description to get job fit scoring
   - Identifies missing keywords from the job posting

3. **Analyze**
   - Click "Analyze & Match"
   - Wait for AI analysis (typically 3-5 seconds)
   - View results including score, suggestions, and interview questions

## API Endpoints

### POST `/api/analyze`
Analyzes CV text and optional job description.

**Request Body:**
```json
{
  "cvText": "Your CV content...",
  "jdText": "Job description (optional)"
}
```

**Response:**
```json
{
  "score": 85,
  "jdScore": 78,
  "summary": "Brief candidate summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "interviewQuestions": [
    {"type": "behavioral", "text": "Question..."},
    {"type": "technical", "text": "Question..."}
  ]
}
```

### GET `/api/health`
Health check endpoint.

## Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- pdf.js - PDF text extraction
- mammoth.js - Word document parsing
- Google Fonts (Inter, Outfit)

### Backend
- Node.js
- Express.js - Web framework
- CORS - Cross-origin resource sharing
- dotenv - Environment variable management
- Google Gemini API - AI analysis

## Deployment

### Local Development
Already configured! Just run `node server.js`.

### Production Deployment Options

**Vercel** (Recommended)
- Deploy frontend as static site
- Convert `server.js` to Vercel serverless function
- Add `GEMINI_API_KEY` to environment variables

**Netlify**
- Similar to Vercel
- Use Netlify Functions for backend

**Railway/Heroku**
- Traditional server deployment
- Set environment variables in platform dashboard

## Security Notes

⚠️ **Important**: 
- Never commit `.env` to version control (already in `.gitignore`)
- Rotate API keys if accidentally exposed
- Consider rate limiting for production use
- Validate and sanitize all user inputs

## License

MIT License - Feel free to use for personal or commercial projects.

## Author

Built with ❤️ using Google's Gemini AI

---

**Need Help?** 
- Check the walkthrough: `.gemini/antigravity/brain/.../walkthrough.md`
- Ensure backend server is running before using the app
- Check browser console for error messages
