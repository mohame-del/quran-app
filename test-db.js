const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting...')
        await prisma.$connect()
        console.log('Connected successfully.')
        const count = await prisma.school.count()
        console.log('School count:', count)
    } catch (e) {
        console.error('DB Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
