import { Volunteer, UserRole } from '@prisma/client';
import { VolunteerRepository, CreateVolunteerData, VolunteerWithRelations } from '@/lib/repositories/volunteer.repository';
import { ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors';
import { createVolunteerSchema } from '@/lib/validations/volunteer';
import type { AuthUser } from '@/lib/types/auth';

export class VolunteerService {
  private volunteerRepository: VolunteerRepository;

  public constructor(volunteerRepository: VolunteerRepository = new VolunteerRepository()) {
    this.volunteerRepository = volunteerRepository;
  }

  /**
   * Get all volunteers (admin only)
   */
  public async getAllVolunteers(user: AuthUser): Promise<VolunteerWithRelations[]> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can view all volunteers');
    }

    return this.volunteerRepository.findAll();
  }

  /**
   * Get volunteer by ID
   */
  public async getVolunteerById(id: string, user: AuthUser): Promise<VolunteerWithRelations> {
    const volunteer = await this.volunteerRepository.findById(id);

    if (user.role !== UserRole.ADMIN && volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only view your own volunteer profile');
    }

    return volunteer;
  }

  /**
   * Get current user's volunteer profile
   */
  public async getCurrentUserProfile(user: AuthUser): Promise<VolunteerWithRelations> {
    const volunteer = await this.volunteerRepository.findByUserId(user.id);
    
    if (!volunteer) {
      throw new NotFoundError('Volunteer profile not found. Please create your profile first.');
    }

    return volunteer;
  }

  /**
   * Create volunteer profile
   */
  public async createProfile(user: AuthUser, data: unknown): Promise<Volunteer> {
    const existingProfile = await this.volunteerRepository.findByUserId(user.id);
    if (existingProfile) {
      throw new ValidationError('Volunteer profile already exists for this user');
    }

    const validatedData = createVolunteerSchema.parse(data);

    const volunteerData: CreateVolunteerData = {
      ...validatedData,
      userId: user.id,
      bio: validatedData.bio || null,
    };

    return this.volunteerRepository.create(volunteerData);
  }

  /**
   * Update volunteer profile
   */
  public async updateProfile(user: AuthUser, data: unknown): Promise<Volunteer> {
    const validatedData = createVolunteerSchema.partial().parse(data);

    return this.volunteerRepository.updateByUserId(user.id, validatedData);
  }

  /**
   * Update volunteer profile by ID (admin only)
   */
  public async updateVolunteerById(id: string, user: AuthUser, data: unknown): Promise<Volunteer> {
    const volunteer = await this.volunteerRepository.findById(id);

    if (user.role !== UserRole.ADMIN && volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only update your own volunteer profile');
    }

    const validatedData = createVolunteerSchema.partial().parse(data);

    return this.volunteerRepository.update(id, validatedData);
  }

  /**
   * Delete volunteer profile
   */
  public async deleteProfile(user: AuthUser): Promise<void> {
    const volunteer = await this.volunteerRepository.findByUserId(user.id);
    if (!volunteer) {
      throw new NotFoundError('Volunteer profile not found');
    }

    return this.volunteerRepository.delete(volunteer.id);
  }

}

export const volunteerService = new VolunteerService();