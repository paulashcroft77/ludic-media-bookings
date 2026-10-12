export const TEAM_DOMAIN = "ludicgroup.com";

export function isTeamEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${TEAM_DOMAIN}`);
}
