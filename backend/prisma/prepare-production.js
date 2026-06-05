const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Replace sqlite with postgresql
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('🚀 [Prisma Production Setup] schema.prisma successfully converted to PostgreSQL provider!');
  } else {
    console.log('ℹ️ [Prisma Production Setup] schema.prisma is already using ' + (schema.match(/provider\s*=\s*"(.*?)"/)?.[1] || 'another') + ' provider.');
  }
} catch (error) {
  console.error('❌ [Prisma Production Setup] Error converting schema.prisma:', error.message);
  process.exit(1);
}
