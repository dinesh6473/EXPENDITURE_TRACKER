// ============================================
// AUTH MODULE - Handles all authentication logic
// ============================================

// Check if user is logged in
async function getUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    return user;
}

// Check session
async function getSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
}

// Sign Up
async function signUp(email, password, name, monthlyAllowance, age, gender, currentlyPursuing, pursuingDetail) {
    // Create auth user — profile is auto-created via database trigger
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                monthly_allowance: monthlyAllowance,
                age: age,
                gender: gender,
                currently_pursuing: currentlyPursuing,
                pursuing_detail: pursuingDetail
            }
        }
    });

    if (error) throw error;
    return data;
}

// Login
async function login(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

// Logout
async function logout() {
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
}

// Get user profile from profiles table
async function getUserProfile() {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
}

// Update profile
async function updateProfile(updates) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await _supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Protect page - redirect to login if not authenticated
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect to dashboard if already logged in
async function redirectIfLoggedIn() {
    const session = await getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}
