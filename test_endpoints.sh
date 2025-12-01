#!/bin/bash

echo "Testing /api/optimize-section..."
curl -X POST http://localhost:3000/api/optimize-section \
  -H "Content-Type: application/json" \
  -d '{
    "sectionText": "I worked at Google. I wrote code. It was good.",
    "sectionType": "Experience",
    "model": "models/gemini-2.0-flash-lite-001"
  }'
echo -e "\n\n"

echo "Testing /api/analyze (Interview Questions)..."
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cvText": "Senior Software Engineer with 10 years of experience in Python and AI.",
    "jdText": "",
    "model": "models/gemini-2.0-flash-lite-001"
  }'
echo -e "\n"
