import { Volunteer, UserRole, MatchStatus, EventStatus } from '@prisma/client';
import { VolunteerRepository, CreateVolunteerData, VolunteerWithRelations } from '@/lib/repositories/volunteer.repository';
import { EventMatchRepository, EventMatchWithRelations } from '@/lib/repositories/event-match.repository';
import { ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors';
import { CreateVolunteerInput, UpdateVolunteerInput } from '@/lib/validations/volunteer';
import type { AuthUser } from '@/lib/types/auth';

export class VolunteerService {
  private volunteerRepository: VolunteerRepository;
  private eventMatchRepository: EventMatchRepository;

  public constructor(
    volunteerRepository: VolunteerRepository = new VolunteerRepository(),
    eventMatchRepository: EventMatchRepository = new EventMatchRepository()
  ) {
    this.volunteerRepository = volunteerRepository;
    this.eventMatchRepository = eventMatchRepository;
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
  public async createProfile(user: AuthUser, validatedData: CreateVolunteerInput): Promise<Volunteer> {
    const existingProfile = await this.volunteerRepository.findByUserId(user.id);
    if (existingProfile) {
      throw new ValidationError('Volunteer profile already exists for this user');
    }

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
  public async updateProfile(user: AuthUser, validatedData: UpdateVolunteerInput): Promise<Volunteer> {
    return this.volunteerRepository.updateByUserId(user.id, validatedData);
  }

  /**
   * Update volunteer profile by ID (admin only)
   */
  public async updateVolunteerById(id: string, user: AuthUser, validatedData: UpdateVolunteerInput): Promise<Volunteer> {
    const volunteer = await this.volunteerRepository.findById(id);

    if (user.role !== UserRole.ADMIN && volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only update your own volunteer profile');
    }

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

  /**
   * Get pending invitations for current user
   */
  public async getPendingInvitations(user: AuthUser): Promise<EventMatchWithRelations[]> {
    const volunteer = await this.getCurrentUserProfile(user);

    const invitations = await this.eventMatchRepository.findByVolunteerIdAndStatus(
      volunteer.id,
      MatchStatus.PENDING
    );

    return invitations.filter(inv => 
      inv.event.status === EventStatus.PUBLISHED && 
      inv.event.startTime >= new Date()
    );
  }

  /**
   * Get accepted matches (registered events) for current user
   */
  public async getAcceptedMatches(user: AuthUser): Promise<EventMatchWithRelations[]> {
    const volunteer = await this.getCurrentUserProfile(user);

    const matches = await this.eventMatchRepository.findByVolunteerIdAndStatus(
      volunteer.id,
      MatchStatus.ACCEPTED
    );

    return matches.filter(match => 
      match.event.status === EventStatus.PUBLISHED && 
      match.event.startTime >= new Date()
    );
  }

  /**
   * Respond to an event invitation (accept/decline)
   */
  public async respondToInvitation(
    user: AuthUser,
    matchId: string,
    action: 'accept' | 'decline'
  ): Promise<void> {
    const match = await this.eventMatchRepository.findById(matchId);
    
    if (!match) {
      throw new NotFoundError('Invitation not found');
    }

    const volunteer = await this.volunteerRepository.findById(match.volunteerId);
    if (volunteer.userId !== user.id) {
      throw new ForbiddenError('You can only respond to your own invitations');
    }

    const newStatus = action === 'accept' ? MatchStatus.ACCEPTED : MatchStatus.DECLINED;
    await this.eventMatchRepository.update(match.id, { status: newStatus });
  }

}

export const volunteerService = new VolunteerService();