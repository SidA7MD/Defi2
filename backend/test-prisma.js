require('dotenv').config();
const connectionString = process.env.DATABASE_URL;
console.log('DATABASE_URL from env:', connectionString ? connectionString.replace(/:.+@/, ':****@') : 'UNDEFINED');

try {
    console.log('Testing Core Node.js new URL()...');
    const parsed = new URL(connectionString);
    console.log('Core URL parsing SUCCESS:', parsed.protocol, parsed.host, parsed.pathname);
} catch (err) {
    console.error('CORE URL PARSING FAILED:', err.message);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString
        }
    }
});
(async () => {
    try {
        console.log('Testing Prisma connection after .env fix...');
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);
        const user = await prisma.user.findFirst();
        console.log('First user:', user ? user.email : 'None found');
    } catch (e) {
        console.error('PRISMA ERROR:');
        console.error(e);
    } finally {
        try { await prisma.$disconnect(); } catch (err) { }
    }
})();
