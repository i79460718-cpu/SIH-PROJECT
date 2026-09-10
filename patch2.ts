import * as fs from 'fs';

const filePath = 'artifacts/api-server/src/domain/issueRepository.ts';
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `      title: input.title || analysis.normalizedIntent,
      description: input.description,
      category: analysis.detectedCategory,`;

const nextStr = `      title: input.title || analysis.normalizedIntent,
      description: input.description,
      originalLanguage: analysis.detectedLanguage,
      normalizedDescription: analysis.normalizedDescription,
      detectedIntent: analysis.normalizedIntent,
      category: analysis.detectedCategory,`;

code = code.replace(targetStr, nextStr);

const targetStr2 = `      description: input.description,
      locationText: input.locationText,
      evidenceUrl: input.evidenceUrl,
      reportedAt: now,
    });`;

const nextStr2 = `      description: input.description,
      locationText: input.locationText,
      evidenceUrl: input.evidenceUrl,
      reportedAt: now,
      originalLanguage: analysis.detectedLanguage,
      normalizedDescription: analysis.normalizedDescription,
      detectedIntent: analysis.normalizedIntent,
    });`;

code = code.replace(targetStr2, nextStr2);

fs.writeFileSync(filePath, code);
