import * as fs from 'fs';

const filePath = 'artifacts/api-server/src/domain/issueRepository.ts';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `      aiAnalysis: {
        isSpam: analysis.isSpam,
        spamScore: analysis.spamScore,
        detectedCategory: analysis.detectedCategory,
        categoryConfidence: analysis.categoryConfidence,
        detectedLanguage: analysis.detectedLanguage,`;

const nextStr = `      aiAnalysis: {
        isSpam: analysis.isSpam,
        spamScore: analysis.spamScore,
        detectedCategory: analysis.detectedCategory,
        categoryConfidence: analysis.categoryConfidence,
        detectedLanguage: analysis.detectedLanguage,
        languageConfidence: analysis.languageConfidence,
        normalizedDescription: analysis.normalizedDescription,
        normalizedIntent: analysis.normalizedIntent,`;

code = code.replace(targetStr, nextStr);

fs.writeFileSync(filePath, code);
