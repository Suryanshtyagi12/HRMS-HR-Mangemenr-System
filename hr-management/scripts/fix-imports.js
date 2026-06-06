const fs = require('fs');
const files = [
  'auth.ts',
  'app/api/departments/route.ts',
  'app/api/employees/route.ts',
  'app/api/employees/[id]/route.ts',
  'app/api/employees/[id]/photo/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import\s+\{\s*PrismaClient\s*\}\s+from\s+['"]@prisma\/client['"];?\r?\n/g, '');
  content = content.replace(/import\s+\{\s*PrismaClient,\s*([^}]*)\}\s+from\s+['"]@prisma\/client['"];?\r?\n/g, 'import { $1 } from "@prisma/client";\n');
  content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\);?/g, "import prisma from '@/lib/prisma';");
  
  // Clean up any stray `import {} from "@prisma/client";`
  content = content.replace(/import\s+\{\s*\}\s+from\s+['"]@prisma\/client['"];?\r?\n/g, '');
  
  fs.writeFileSync(file, content);
}
console.log('Fixed imports in app and auth!');
