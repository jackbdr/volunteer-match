import { PrismaClient, UserRole, EventType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // Clear existing data (in correct order due to foreign key constraints)
  await prisma.eventMatch.deleteMany();
  await prisma.event.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Cleared existing data');

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@volunteermatch.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: await bcrypt.hash('password123', 10),
    },
  });

  console.log('👤 Created admin user:', admin.email);

  // ============================================
  // CREATE VOLUNTEER USERS
  // ============================================

  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      role: UserRole.VOLUNTEER,
      password: await bcrypt.hash('password123', 10),
      volunteer: {
        create: {
          skills: ['teaching', 'mentoring', 'public_speaking'],
          availability: ['saturday_morning', 'sunday_afternoon'],
          location: 'London',
          preferredCauses: ['education', 'youth_development'],
          bio: 'Experienced teacher passionate about helping young people reach their potential.',
        },
      },
    },
    include: {
      volunteer: true,
    },
  });

  console.log('👤 Created volunteer:', john.email);

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      name: 'Sarah Smith',
      role: UserRole.VOLUNTEER,
      password: await bcrypt.hash('password123', 10),
      volunteer: {
        create: {
          skills: ['first_aid', 'event_setup', 'teamwork'],
          availability: ['saturday_morning', 'saturday_afternoon'],
          location: 'Brighton',
          preferredCauses: ['environment', 'community_health'],
          bio: 'First aid certified volunteer who loves outdoor activities and environmental work.',
        },
      },
    },
    include: {
      volunteer: true,
    },
  });

  console.log('👤 Created volunteer:', sarah.email);

  const emma = await prisma.user.create({
    data: {
      email: 'emma@example.com',
      name: 'Emma Johnson',
      role: UserRole.VOLUNTEER,
      password: await bcrypt.hash('password123', 10),
      volunteer: {
        create: {
          skills: ['teaching', 'first_aid', 'teamwork'],
          availability: ['saturday_morning', 'sunday_morning'],
          location: 'London',
          preferredCauses: ['education', 'elderly_support'],
          bio: 'Multi-skilled volunteer with experience in both teaching and healthcare settings.',
        },
      },
    },
    include: {
      volunteer: true,
    },
  });

  console.log('👤 Created volunteer:', emma.email);

  const michael = await prisma.user.create({
    data: {
      email: 'michael@example.com',
      name: 'Michael Brown',
      role: UserRole.VOLUNTEER,
      password: await bcrypt.hash('password123', 10),
      volunteer: {
        create: {
          skills: ['physical_labour', 'driving', 'teamwork'],
          availability: ['saturday_afternoon', 'sunday_afternoon'],
          location: 'Brighton',
          preferredCauses: ['environment', 'animal_welfare'],
          bio: 'Enjoys hands-on outdoor volunteer work and has a full UK driving license.',
        },
      },
    },
    include: {
      volunteer: true,
    },
  });

  console.log('👤 Created volunteer:', michael.email);

  // ============================================
  // CREATE EVENTS
  // ============================================

  const event1 = await prisma.event.create({
    data: {
      title: 'Youth Mentoring Session',
      description: 'Online mentoring session for underprivileged youth aged 14-16. Help students with homework, career advice, and life skills development. This is a rewarding opportunity to make a real difference in young people\'s lives.',
      eventType: EventType.VIRTUAL,
      requiredSkills: ['teaching', 'mentoring'],
      timeSlot: 'saturday_morning',
      location: 'Online',
      startTime: new Date('2025-11-15T10:00:00Z'),
      duration: 120,
      status: "PUBLISHED",
      registrationDeadline: new Date('2025-11-13T23:59:59Z'),
      maxVolunteers: 6,
    },
  });

  console.log('📅 Created event:', event1.title);

  const event2 = await prisma.event.create({
    data: {
      title: 'Beach Cleanup - Brighton',
      description: 'Join us for an environmental cleanup event at Brighton Beach. Help protect marine life and keep our beaches clean. All equipment provided. Wear comfortable clothes and bring sun protection.',
      eventType: EventType.PHYSICAL,
      requiredSkills: ['teamwork', 'physical_labour'],
      timeSlot: 'saturday_afternoon',
      location: 'Brighton',
      startTime: new Date('2025-11-16T14:00:00Z'),
      duration: 180,
      status: "PUBLISHED",
      registrationDeadline: new Date('2025-11-15T12:00:00Z'),
      maxVolunteers: 25,
    },
  });

  console.log('📅 Created event:', event2.title);

  const event3 = await prisma.event.create({
    data: {
      title: 'First Aid Training Workshop',
      description: 'Teach basic first aid skills to community members. Previous first aid certification required. You\'ll be helping people learn life-saving skills including CPR, wound care, and emergency response.',
      eventType: EventType.PHYSICAL,
      requiredSkills: ['first_aid', 'teaching'],
      timeSlot: 'sunday_afternoon',
      location: 'London',
      startTime: new Date('2025-11-17T14:00:00Z'),
      duration: 240,
      status: 'DRAFT',
      registrationDeadline: new Date('2025-11-16T18:00:00Z'),
      maxVolunteers: 12,
    },
  });

  console.log('📅 Created event:', event3.title);

  const event4 = await prisma.event.create({
    data: {
      title: 'Community Food Bank',
      description: 'Help sort and distribute food packages to families in need. Physical work required including lifting boxes and organizing inventory. A great way to directly support your local community.',
      eventType: EventType.PHYSICAL,
      requiredSkills: ['teamwork', 'physical_labour'],
      timeSlot: 'saturday_morning',
      location: 'London',
      startTime: new Date('2025-11-15T09:00:00Z'),
      duration: 180,
      status: "PUBLISHED",
      registrationDeadline: null,
      maxVolunteers: null,
    },
  });

  console.log('📅 Created event:', event4.title);

  const event5 = await prisma.event.create({
    data: {
      title: 'Virtual Tutoring - Math & Science',
      description: 'Online tutoring session for high school students preparing for exams. Help students understand challenging concepts in mathematics and science. Teaching experience preferred but not required.',
      eventType: EventType.VIRTUAL,
      requiredSkills: ['teaching', 'mentoring', 'public_speaking'],
      timeSlot: 'sunday_morning',
      location: 'Online',
      startTime: new Date('2025-11-17T10:00:00Z'),
      duration: 90,
      status: "PUBLISHED",
      registrationDeadline: new Date('2025-11-16T20:00:00Z'),
      maxVolunteers: 4,
    },
  });

  console.log('📅 Created event:', event5.title);

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  👥 Users created:');
  console.log('    - 1 admin user');
  console.log('    - 4 volunteer users');
  console.log('  📅 Events created:');
  console.log('    - 2 virtual events');
  console.log('    - 3 physical events');
  console.log('\n🔐 Demo credentials:');
  console.log('  Admin:     admin@volunteermatch.com / password123');
  console.log('  Volunteer: john@example.com / password123');
  console.log('  Volunteer: sarah@example.com / password123');
  console.log('  Volunteer: emma@example.com / password123');
  console.log('  Volunteer: michael@example.com / password123');
  console.log('\n💡 Next steps:');
  console.log('  - Run: npx prisma studio');
  console.log('  - Browse your seed data at http://localhost:5555');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });