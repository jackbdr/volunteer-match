/**
 * Invitation response action enum
 */
export enum InvitationAction {
  ACCEPT = 'accept',
  DECLINE = 'decline',
}

export const INVITATION_ACTIONS = [InvitationAction.ACCEPT, InvitationAction.DECLINE] as const;
