import { db } from '@/lib/db';
import { 
  user, 
  role, 
  userRole, 
  team, 
  teamMember, 
  userOrganization,
  auditLog,
  type User,
  type Role,
  type UserRole,
  type Team,
  type TeamMember,
  type UserOrganization,
} from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

/**
 * Utilitários para o sistema de administração
 */

// ============================================================================
// GESTÃO DE ROLES
// ============================================================================

/**
 * Buscar role por nome
 */
export async function getRoleByName(roleName: string): Promise<Role | null> {
  const roles = await db
    .select()
    .from(role)
    .where(eq(role.name, roleName))
    .limit(1);
  
  return roles[0] || null;
}

/**
 * Buscar todas as roles do sistema
 */
export async function getSystemRoles(): Promise<Role[]> {
  return await db
    .select()
    .from(role)
    .where(eq(role.isSystemRole, true));
}

/**
 * Buscar roles de uma organização
 */
export async function getOrganizationRoles(organizationId: string): Promise<Role[]> {
  return await db
    .select()
    .from(role)
    .where(
      or(
        eq(role.organizationId, organizationId),
        eq(role.isSystemRole, true)
      )
    );
}

// ============================================================================
// GESTÃO DE USER ROLES
// ============================================================================

/**
 * Atribuir role a um usuário
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy: string,
  organizationId?: string,
  teamId?: string,
  expiresAt?: Date
): Promise<UserRole> {
  const [newUserRole] = await db
    .insert(userRole)
    .values({
      userId,
      roleId,
      assignedBy,
      organizationId,
      teamId,
      expiresAt,
    })
    .returning();

  // Log da auditoria
  await logAdminAction(
    assignedBy,
    'user.role.assigned',
    'user_role',
    newUserRole.id,
    null,
    { userId, roleId, organizationId, teamId },
    organizationId,
    teamId
  );

  return newUserRole;
}

/**
 * Remover role de um usuário
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string,
  removedBy: string,
  organizationId?: string,
  teamId?: string
): Promise<void> {
  const conditions = [
    eq(userRole.userId, userId),
    eq(userRole.roleId, roleId),
    eq(userRole.isActive, true),
  ];

  if (organizationId) {
    conditions.push(eq(userRole.organizationId, organizationId));
  }

  if (teamId) {
    conditions.push(eq(userRole.teamId, teamId));
  }

  await db
    .update(userRole)
    .set({ isActive: false })
    .where(and(...conditions));

  // Log da auditoria
  await logAdminAction(
    removedBy,
    'user.role.removed',
    'user_role',
    `${userId}-${roleId}`,
    { userId, roleId, organizationId, teamId },
    null,
    organizationId,
    teamId
  );
}

/**
 * Buscar roles de um usuário
 */
export async function getUserRoles(
  userId: string,
  organizationId?: string,
  teamId?: string
): Promise<any[]> {
  const conditions = [
    eq(userRole.userId, userId),
    eq(userRole.isActive, true),
  ];

  if (organizationId) {
    conditions.push(eq(userRole.organizationId, organizationId));
  }

  if (teamId) {
    conditions.push(eq(userRole.teamId, teamId));
  }

  return await db
    .select()
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(and(...conditions));
}

/**
 * Verificar se usuário tem uma role específica
 */
export async function userHasRole(
  userId: string,
  roleName: string,
  organizationId?: string,
  teamId?: string
): Promise<boolean> {
  const targetRole = await getRoleByName(roleName);
  if (!targetRole) return false;

  const userRoles = await getUserRoles(userId, organizationId, teamId);
  return userRoles.some(ur => ur.role.name === roleName);
}

/**
 * Buscar todas as permissões de um usuário
 */
export async function getUserPermissions(
  userId: string,
  organizationId?: string,
  teamId?: string
): Promise<string[]> {
  const userRoles = await getUserRoles(userId, organizationId, teamId);
  const permissions = new Set<string>();

  for (const userRole of userRoles) {
    const rolePermissions = userRole.role.permissions as string[];
    rolePermissions.forEach(permission => permissions.add(permission));
  }

  return Array.from(permissions);
}

// ============================================================================
// GESTÃO DE TEAMS
// ============================================================================

/**
 * Criar um novo time
 */
export async function createTeam(
  name: string,
  organizationId: string,
  createdBy: string,
  description?: string,
  parentTeamId?: string,
  managerId?: string
): Promise<Team> {
  const [newTeam] = await db
    .insert(team)
    .values({
      name,
      description,
      organizationId,
      parentTeamId,
      managerId,
    })
    .returning();

  // Log da auditoria
  await logAdminAction(
    createdBy,
    'team.created',
    'team',
    newTeam.id,
    null,
    { name, organizationId, parentTeamId, managerId },
    organizationId
  );

  return newTeam;
}

/**
 * Adicionar membro ao time
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  addedBy: string,
  roleInTeam: 'member' | 'lead' | 'manager' | 'admin' = 'member'
): Promise<void> {
  await db
    .insert(teamMember)
    .values({
      teamId,
      userId,
      addedBy,
      roleInTeam,
    });

  // Log da auditoria
  await logAdminAction(
    addedBy,
    'team.member.added',
    'team_member',
    `${teamId}-${userId}`,
    null,
    { teamId, userId, roleInTeam }
  );
}

/**
 * Remover membro do time
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  await db
    .update(teamMember)
    .set({ isActive: false })
    .where(
      and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, userId)
      )
    );

  // Log da auditoria
  await logAdminAction(
    removedBy,
    'team.member.removed',
    'team_member',
    `${teamId}-${userId}`,
    { teamId, userId, isActive: true },
    { teamId, userId, isActive: false }
  );
}

/**
 * Buscar membros de um time
 */
export async function getTeamMembers(teamId: string): Promise<any[]> {
  return await db
    .select()
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(
      and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.isActive, true)
      )
    );
}

// ============================================================================
// GESTÃO DE USER ORGANIZATION
// ============================================================================

/**
 * Adicionar usuário à organização
 */
export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  invitedBy: string,
  roleInOrganization: 'owner' | 'admin' | 'manager' | 'member' | 'guest' = 'member'
): Promise<void> {
  await db
    .insert(userOrganization)
    .values({
      userId,
      organizationId,
      roleInOrganization,
      invitedBy,
      invitedAt: new Date(),
    });

  // Log da auditoria
  await logAdminAction(
    invitedBy,
    'organization.member.added',
    'user_organization',
    `${userId}-${organizationId}`,
    null,
    { userId, organizationId, roleInOrganization },
    organizationId
  );
}

// ============================================================================
// AUDITORIA
// ============================================================================

/**
 * Registrar ação administrativa no log de auditoria
 */
export async function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  oldValues?: any,
  newValues?: any,
  organizationId?: string,
  teamId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await db.insert(auditLog).values({
    userId,
    organizationId,
    teamId,
    action,
    resource,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  });
}

// ============================================================================
// VERIFICAÇÕES DE PERMISSÃO
// ============================================================================

/**
 * Verificar se usuário é admin do sistema
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  // Verificar se é master admin
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userData[0]?.isMasterAdmin) {
    return true;
  }

  // Verificar se tem role de admin
  return await userHasRole(userId, 'admin');
}

/**
 * Verificar se usuário é admin de uma organização
 */
export async function isOrganizationAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Se é admin do sistema, é admin de qualquer organização
  if (await isSystemAdmin(userId)) {
    return true;
  }

  // Verificar se tem role de admin na organização
  return await userHasRole(userId, 'admin', organizationId);
}

/**
 * Verificar se usuário é manager de uma organização
 */
export async function isOrganizationManager(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Se é admin, também é manager
  if (await isOrganizationAdmin(userId, organizationId)) {
    return true;
  }

  // Verificar se tem role de manager na organização
  return await userHasRole(userId, 'manager', organizationId);
} 