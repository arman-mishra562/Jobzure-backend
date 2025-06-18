import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed TargetJobLocation
    const targetJobLocations = [
        'USA',
        'Canada',
        'UK',
        'Australia',
        'Germany',
        'France',
        'Netherlands',
        'Singapore',
        'Japan',
        'India',
    ];

    for (const location of targetJobLocations) {
        await prisma.targetJobLocation.upsert({
            where: { value: location },
            update: {},
            create: { value: location },
        });
    }

    // Seed InterestedRole
    const interestedRoles = [
        'Full_Stack_Developer',
        'Frontend_Developer',
        'Backend_Developer',
        'DevOps_Engineer',
        'Data_Scientist',
        'Machine_Learning_Engineer',
        'Mobile_Developer',
        'UI_UX_Designer',
        'Product_Manager',
        'QA_Engineer',
        'Software_Architect',
        'System_Administrator',
    ];

    for (const role of interestedRoles) {
        await prisma.interestedRole.upsert({
            where: { value: role },
            update: {},
            create: { value: role },
        });
    }

    // Seed InterestedIndustry
    const interestedIndustries = [
        'EDUCATION',
        'HEALTHCARE',
        'FINANCE',
        'E_COMMERCE',
        'TECHNOLOGY',
        'ENTERTAINMENT',
        'TRANSPORTATION',
        'REAL_ESTATE',
        'MANUFACTURING',
        'RETAIL',
        'CONSULTING',
        'NON_PROFIT',
    ];

    for (const industry of interestedIndustries) {
        await prisma.interestedIndustry.upsert({
            where: { value: industry },
            update: {},
            create: { value: industry },
        });
    }

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 