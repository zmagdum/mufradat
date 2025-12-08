/**
 * Shared data transformers
 */

export const serializeUserProfile = (profile: any): any => {
  return {
    ...profile,
    createdAt: profile.createdAt?.toISOString?.() || profile.createdAt,
    updatedAt: profile.updatedAt?.toISOString?.() || profile.updatedAt,
    lastLogin: profile.lastLogin?.toISOString?.() || profile.lastLogin,
  };
};

export const deserializeUserProfile = (data: any): any => {
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined,
  };
};

