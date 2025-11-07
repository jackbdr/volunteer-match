import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Base repository class providing common database operations
 * All specific repositories should extend this class
 */
export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  public constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }
}