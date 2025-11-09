import { Event, EventType, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { NotFoundError } from '@/lib/errors';

export type EventWithRelations = Event & {
  _count: {
    matches: number;
  };
};

export type CreateEventData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEventData = Partial<CreateEventData>;

export class EventRepository extends BaseRepository {
  public constructor(prismaClient?: PrismaClient) {
    super(prismaClient);
  }
  /**
   * Find all events with optional filtering
   */
  public async findAll(filters?: {
    type?: EventType;
    location?: string;
    status?: string;
  }): Promise<EventWithRelations[]> {
    const where: Prisma.EventWhereInput = {};
    
    if (filters?.type) where.eventType = filters.type;
    if (filters?.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters?.status) where.status = filters.status as any;

    return this.prisma.event.findMany({
      where,
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find event by ID
   */
  public async findById(id: string): Promise<EventWithRelations> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Create a new event
   */
  public async create(data: CreateEventData): Promise<Event> {
    return this.prisma.event.create({
      data,
    });
  }

  /**
   * Update an existing event
   */
  public async update(id: string, data: UpdateEventData): Promise<Event> {
    try {
      return await this.prisma.event.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Event with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete an event
   */
  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.event.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Event with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find events by skill requirements (for matching)
   */
  public async findBySkills(skills: string[]): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        requiredSkills: {
          hasSome: skills,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }
}