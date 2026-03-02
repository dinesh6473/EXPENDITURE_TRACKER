// ============================================
// API MODULE - Handles all data operations
// ============================================

// ---- EXPENSES ----

async function addExpense(amount, categoryId, categoryName, description, expenseDate) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await _supabase.from('expenses').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        category_id: categoryId,
        category_name: categoryName,
        description: description || '',
        expense_date: expenseDate || new Date().toISOString().split('T')[0]
    }).select().single();

    if (error) throw error;
    return data;
}

async function getExpenses(limit = null) {
    const user = await getUser();
    if (!user) return [];

    let query = _supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

async function getMonthlyExpenses() {
    const user = await getUser();
    if (!user) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await _supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', startOfMonth)
        .lte('expense_date', endOfMonth)
        .order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
}

async function deleteExpense(expenseId) {
    const { error } = await _supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

    if (error) throw error;
}

async function getTotalSpent() {
    const expenses = await getMonthlyExpenses();
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
}

async function getExpensesByCategory() {
    const expenses = await getMonthlyExpenses();
    const grouped = {};
    expenses.forEach(e => {
        if (!grouped[e.category_name]) {
            grouped[e.category_name] = 0;
        }
        grouped[e.category_name] += parseFloat(e.amount);
    });
    return grouped;
}

// ---- CATEGORIES ----

async function getCategories() {
    const { data, error } = await _supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

    if (error) throw error;
    return data || [];
}

async function addCategory(name, icon = '📦') {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await _supabase.from('categories').insert({
        user_id: user.id,
        name,
        icon,
        is_default: false
    }).select().single();

    if (error) throw error;
    return data;
}

// ---- SAVINGS ----

async function addSaving(amount, description = 'Savings deposit') {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await _supabase.from('savings').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        description
    }).select().single();

    if (error) throw error;
    return data;
}

async function getSavings() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

async function getTotalSavings() {
    const savings = await getSavings();
    return savings.reduce((sum, s) => sum + parseFloat(s.amount), 0);
}

async function deleteSaving(savingId) {
    const { error } = await _supabase
        .from('savings')
        .delete()
        .eq('id', savingId);

    if (error) throw error;
}

// ---- WALLET SUMMARY ----

async function getWalletSummary() {
    const profile = await getUserProfile();
    if (!profile) return null;

    const totalSpent = await getTotalSpent();
    const totalSavings = await getTotalSavings();
    const monthlyAllowance = parseFloat(profile.monthly_allowance);
    const remaining = monthlyAllowance - totalSpent - totalSavings;

    return {
        monthlyAllowance,
        totalSpent,
        totalSavings,
        remaining: Math.max(0, remaining)
    };
}
