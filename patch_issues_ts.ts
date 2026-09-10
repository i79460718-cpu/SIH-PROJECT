import * as fs from 'fs';

let filePath = 'artifacts/api-server/src/routes/issues.ts';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/req\.params\.id/g, 'req.params.id as string');
code = code.replace(/req\.query\.district/g, 'req.query.district as string');
code = code.replace(/req\.query\.category/g, 'req.query.category as string');
code = code.replace(/req\.query\.priority/g, 'req.query.priority as string');
code = code.replace(/req\.query\.status/g, 'req.query.status as string');
code = code.replace(/req\.query\.department/g, 'req.query.department as string');
code = code.replace(/req\.query\.search/g, 'req.query.search as string');

fs.writeFileSync(filePath, code);
