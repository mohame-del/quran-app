// scripts/seed.ts
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding School...')

    // 1. Create School
    const email = 'sheikh@example.com'
    const passwordHash = await hash('123456', 10)

    const school = await prisma.school.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            schoolName: 'مدرسة الريان النموذجية',
            name: 'الشيخ محمد'
        }
    })

    console.log('School Created:', school.id)

    // 2. Create Students
    const studentsData = [
        { first: 'أحمد', last: 'بن علي', hizb: 5 },
        { first: 'يوسف', last: 'صلاح', hizb: 10 },
        { first: 'عمر', last: 'فاروق', hizb: 2 },
        { first: 'خالد', last: 'وليد', hizb: 15 },
        { first: 'زيد', last: 'عمرو', hizb: 0 },
        { first: 'حمزة', last: 'بن عبد المطلب', hizb: 20 },
    ]

    for (const s of studentsData) {
        await prisma.student.create({
            data: {
                firstName: s.first,
                lastName: s.last,
                currentHizb: s.hizb,
                schoolId: school.id,
            }
        })
    }

    console.log('Students seeded.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
