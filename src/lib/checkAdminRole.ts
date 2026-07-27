import { supabase } from './supbaseClient';

/**
 * Check if the current authenticated user has admin access
 * @returns Promise<boolean> - true if user is admin or super_admin
 */
export async function checkAdminRole(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !roleData) return false;

    return ['admin', 'super_admin'].includes(roleData.role);
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Get the current user's role
 * @returns Promise<string | null> - role name or null if not found
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !roleData) return null;

    return roleData.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
