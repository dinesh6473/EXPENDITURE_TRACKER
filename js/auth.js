// ============================================
// AUTH MODULE - Handles all authentication logic
// ============================================

function assertNonNegativeProfileAmount(amount, fieldLabel = 'Amount') {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        throw new Error(`${fieldLabel} cannot be negative.`);
    }
    return parsedAmount;
}

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
    assertNonNegativeProfileAmount(monthlyAllowance, 'Wallet amount');
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

// Google Sign In
async function signInWithGoogle() {
    const { data, error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
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

    if (Object.prototype.hasOwnProperty.call(updates, 'monthly_allowance') && updates.monthly_allowance !== null) {
        updates.monthly_allowance = assertNonNegativeProfileAmount(updates.monthly_allowance, 'Wallet balance');
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'age') && updates.age !== null) {
        const parsedAge = parseInt(updates.age, 10);
        if (!Number.isInteger(parsedAge) || parsedAge < 5 || parsedAge > 100) {
            throw new Error('Age must be between 5 and 100.');
        }
        updates.age = parsedAge;
    }

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
