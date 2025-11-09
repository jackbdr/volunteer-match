import { Volunteer, EventMatch, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { NotFoundError } from '@/lib/errors';

export type VolunteerWithRelations = Volunteer & {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  matches: EventMatch[];
};

export type CreateVolunteerData = Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVolunteerData = Partial<Omit<Volunteer, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export class VolunteerRepository extends BaseRepository {
  public constructor(prismaClient?: PrismaClient) {
    super(prismaClient);
  }
  /**
   * Find all volunteers with user information
   */
  public async findAll(): Promise<VolunteerWithRelations[]> {
    return this.prisma.volunteer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        matches: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find volunteer by ID
   */
  public async findById(id: string): Promise<VolunteerWithRelations> {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        matches: true,
      },
    });

    if (!volunteer) {
      throw new NotFoundError(`Volunteer with ID ${id} not found`);
    }

    return volunteer;
  }

  /**
   * Find volunteer by user ID
   */
  public async findByUserId(userId: string): Promise<VolunteerWithRelations | null> {
    return this.prisma.volunteer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        matches: true,
      },
    });
  }

  /**
   * Create a new volunteer profile
   */
  public async create(data: CreateVolunteerData): Promise<Volunteer> {
    return this.prisma.volunteer.create({
      data,
    });
  }

  /**
   * Update volunteer profile
   */
  public async update(id: string, data: UpdateVolunteerData): Promise<Volunteer> {
    try {
      return await this.prisma.volunteer.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Volunteer with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Update volunteer by user ID
   */
  public async updateByUserId(userId: string, data: UpdateVolunteerData): Promise<Volunteer> {
    try {
      return await this.prisma.volunteer.update({
        where: { userId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Volunteer profile for user ${userId} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete volunteer profile
   */
  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.volunteer.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Volunteer with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find volunteers by skills (for matching)
   */
  public async findBySkills(skills: string[]): Promise<VolunteerWithRelations[]> {
    return this.prisma.volunteer.findMany({
      where: {
        skills: {
          hasSome: skills,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        matches: true,
      },
    });
  }

  /**
   * Find volunteers by location (for location-based matching)
   */
  public async findByLocation(location: string, _radiusKm?: number): Promise<Volunteer[]> {
    return this.prisma.volunteer.findMany({
      where: {
        location: {
          contains: location,
          mode: 'insensitive',
        },
      },
    });
  }
}