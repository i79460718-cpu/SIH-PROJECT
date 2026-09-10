import * as fs from 'fs';

const filePath = 'artifacts/api-server/src/domain/issueRepository.ts';
let code = fs.readFileSync(filePath, 'utf8');

// The faulty string is:
const faultyStr = `    const analysis = await this.analyseReport({
      description: input.description,
      originalLanguage: analysis.detectedLanguage,
      normalizedDescription: analysis.normalizedDescription,
      detectedIntent: analysis.normalizedIntent,
      location: input.locationText,`;

const fixedStr = `    const analysis = await this.analyseReport({
      description: input.description,
      location: input.locationText,`;

code = code.replace(faultyStr, fixedStr);

fs.writeFileSync(filePath, code);
