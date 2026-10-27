import { describe, it, expect } from 'vitest';
import { verifyAuthHeader, checkWorkPermission, AuthUserContext } from '../api/authMiddleware';

describe('API Auth & Work Permissions Middleware', () => {
  it('throws UNAUTHORIZED when Authorization header is missing or malformed', async () => {
    await expect(verifyAuthHeader(undefined)).rejects.toThrow('UNAUTHORIZED: Missing or malformed Bearer token');
    await expect(verifyAuthHeader('')).rejects.toThrow('UNAUTHORIZED: Missing or malformed Bearer token');
    await expect(verifyAuthHeader('Basic 12345')).rejects.toThrow('UNAUTHORIZED: Missing or malformed Bearer token');
  });

  it('correctly grants main_admin universal access to all works', () => {
    const mainAdmin: AuthUserContext = {
      uid: 'admin_ifti',
      email: 'ifti@admin.com',
      name: 'Ifti',
      isMainAdmin: true,
    };

    const perm = checkWorkPermission(mainAdmin, 'work-99', 'someone_else', ['other_user']);
    expect(perm.isAllowed).toBe(true);
    expect(perm.isWorkAdmin).toBe(true);
  });

  it('identifies work creator as work admin', () => {
    const workCreator: AuthUserContext = {
      uid: 'user_creator',
      email: 'creator@example.com',
      name: 'Creator',
      isMainAdmin: false,
    };

    const perm = checkWorkPermission(workCreator, 'work-1', 'user_creator', ['user_a', 'user_b']);
    expect(perm.isAllowed).toBe(true);
    expect(perm.isWorkAdmin).toBe(true);
  });

  it('allows assigned members but does not grant work admin rights', () => {
    const member: AuthUserContext = {
      uid: 'user_member',
      email: 'member@example.com',
      name: 'Member',
      isMainAdmin: false,
    };

    const perm = checkWorkPermission(member, 'work-1', 'creator_user', ['user_member', 'other_user']);
    expect(perm.isAllowed).toBe(true);
    expect(perm.isWorkAdmin).toBe(false);
  });

  it('identifies ifti.k.hoq@gmail.com as global main admin by default', async () => {
    const authContext = await verifyAuthHeader('Bearer dev_token_user_admin');
    expect(authContext.isMainAdmin).toBe(true);
    expect(authContext.email).toBe('ifti.k.hoq@gmail.com');
  });

  it('rejects unassigned users with forbidden access (isAllowed = false)', () => {
    const intruder: AuthUserContext = {
      uid: 'unassigned_guy',
      email: 'intruder@example.com',
      name: 'Intruder',
      isMainAdmin: false,
    };

    const perm = checkWorkPermission(intruder, 'work-1', 'creator_user', ['user_member']);
    expect(perm.isAllowed).toBe(false);
    expect(perm.isWorkAdmin).toBe(false);
  });
});

