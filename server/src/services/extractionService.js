const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Extract text from PDF
const extractPdfText = async (filePath) => {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
};

// Extract text from image using OCR (placeholder - would use cloud OCR in production)
const extractImageText = async (filePath) => {
  // In production, integrate with Google Vision, AWS Textract, or Azure Computer Vision
  console.log('Image OCR would be processed here:', filePath);
  return '';
};

// Parse dates using regex patterns
const extractDates = (text) => {
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/g,   // MM-DD-YYYY
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g,   // March 4, 2026
  ];

  const dates = [];
  datePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      dates.push(match[0]);
    }
  });

  return [...new Set(dates)]; // Remove duplicates
};

// Extract monetary amounts
const extractAmounts = (text) => {
  const amountPattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const amounts = [];
  let match;

  while ((match = amountPattern.exec(text)) !== null) {
    amounts.push({
      raw: match[0],
      value: parseFloat(match[1].replace(/,/g, '')),
    });
  }

  return amounts;
};

// Extract emails
const extractEmails = (text) => {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return [...new Set(text.match(emailPattern) || [])];
};

// Extract phone numbers
const extractPhones = (text) => {
  const phonePattern = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  return [...new Set(text.match(phonePattern) || [])];
};

// Extract common event keywords
const extractEventTypes = (text) => {
  const eventKeywords = [
    'approval',
    'approved',
    'estimate',
    'invoice',
    'receipt',
    'change order',
    'inspection',
    'permit',
    'warranty',
    'installation',
    'repair',
    'replacement',
    'completed',
    'started',
    'payment',
    'received',
    'submitted',
    'requested',
  ];

  const events = [];
  eventKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(text)) {
      events.push(keyword.toLowerCase());
    }
  });

  return events;
};

// Main extraction function
const extractDocumentData = async (filePath, fileName) => {
  try {
    let text = '';
    const ext = path.extname(fileName).toLowerCase();

    // Extract text based on file type
    if (ext === '.pdf') {
      text = await extractPdfText(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      text = await extractImageText(filePath);
    } else if (['.txt', '.csv'].includes(ext)) {
      text = fs.readFileSync(filePath, 'utf-8');
    }

    if (!text) {
      return null;
    }

    // Extract data
    const extracted = {
      fileName,
      fileType: ext,
      dates: extractDates(text),
      amounts: extractAmounts(text),
      emails: extractEmails(text),
      phones: extractPhones(text),
      eventTypes: extractEventTypes(text),
      textPreview: text.substring(0, 500),
      fullText: text,
    };

    return extracted;
  } catch (error) {
    console.error('Document extraction error:', error);
    return null;
  }
};

module.exports = {
  extractPdfText,
  extractImageText,
  extractDates,
  extractAmounts,
  extractEmails,
  extractPhones,
  extractEventTypes,
  extractDocumentData,
};
