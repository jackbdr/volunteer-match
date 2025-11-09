import { EventMatch, MatchStatus, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { NotFoundError } from '@/lib/errors';

export type EventMatchWithRelations = EventMatch & {
  event: {
    id: string;
    title: string;
    startTime: Date;
    eventType: string;
  };
  volunteer: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
};

export type CreateEventMatchData = Omit<EventMatch, 'id' | 'matchedAt'>;

export class EventMatchRepository extends BaseRepository {
  public constructor(prismaClient?: PrismaClient) {
    super(prismaClient);
  }

  /**
   * Find all matches
   */
  public async findAll(): Promise<EventMatchWithRelations[]> {
    return this.prisma.eventMatch.findMany({
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
        volunteer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    }) as Promise<EventMatchWithRelations[]>;
  }

  /**
   * Find all matches for an event
   */
  public async findByEventId(eventId: string): Promise<EventMatchWithRelations[]> {
    return this.prisma.eventMatch.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
        volunteer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    }) as Promise<EventMatchWithRelations[]>;
  }

  /**
   * Find all matches for a volunteer
   */
  public async findByVolunteerId(volunteerId: string): Promise<EventMatchWithRelations[]> {
    return this.prisma.eventMatch.findMany({
      where: { volunteerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
        volunteer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    }) as Promise<EventMatchWithRelations[]>;
  }

  /**
   * Find matches for a volunteer by status
   */
  public async findByVolunteerIdAndStatus(volunteerId: string, status: MatchStatus): Promise<any[]> {
    return this.prisma.eventMatch.findMany({
      where: { 
        volunteerId,
        status 
      },
      include: {
        event: true,
        volunteer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    });
  }

  /**
   * Find match by ID
   */
  public async findById(id: string): Promise<EventMatchWithRelations> {
    const match = await this.prisma.eventMatch.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
        volunteer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundError(`Event match with ID ${id} not found`);
    }

    return match as EventMatchWithRelations;
  }

  /**
   * Create a new event match
   */
  public async create(data: CreateEventMatchData): Promise<EventMatch> {
    return this.prisma.eventMatch.create({
      data,
    });
  }

  /**
   * Update match status
   */
  public async updateStatus(id: string, status: MatchStatus): Promise<EventMatch> {
    try {
      return await this.prisma.eventMatch.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Event match with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Update match fields
   */
  public async update(id: string, data: Partial<Omit<EventMatch, 'id' | 'eventId' | 'volunteerId' | 'matchedAt'>>): Promise<EventMatch> {
    try {
      return await this.prisma.eventMatch.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Event match with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Check if a match already exists
   */
  public async findByEventAndVolunteer(eventId: string, volunteerId: string): Promise<EventMatch | null> {
    return this.prisma.eventMatch.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId,
        },
      },
    });
  }

  /**
   * Delete a match
   */
  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.eventMatch.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Event match with ID ${id} not found`);
      }
      throw error;
    }
  }
}