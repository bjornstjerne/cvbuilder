module.exports = async (req, res) => {
    const SERVER_MAX_PDF_BYTES = 4 * 1024 * 1024;

    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With, Accept, Content-Type'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBase64 } = req.body || {};
        if (!fileBase64 || typeof fileBase64 !== 'string') {
            return res.status(400).json({ error: 'Missing PDF payload' });
        }

        const raw = fileBase64.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(raw, 'base64');
        if (!pdfBuffer.length) {
            return res.status(400).json({ error: 'Invalid PDF payload' });
        }

        if (pdfBuffer.length > SERVER_MAX_PDF_BYTES) {
            return res.status(413).json({
                error: 'PDF too large for server fallback (max 4MB)',
                hint: 'Use browser extraction fallback or upload a smaller file.'
            });
        }

        const pdfParse = require('pdf-parse');
        const parsed = await pdfParse(pdfBuffer);
        const text = (parsed?.text || '').trim();

        if (!text) {
            return res.status(422).json({
                error: 'No extractable text found in PDF',
                hint: 'This file may be scanned/image-based. Try DOCX or paste text.'
            });
        }

        res.status(200).json({ text });
    } catch (error) {
        console.error('PDF extraction error:', error);
        res.status(500).json({
            error: 'PDF extraction failed',
            message: error.message
        });
    }
};
