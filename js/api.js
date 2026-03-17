// ============================================
// API MODULE - Handles all data operations
// ============================================

const APP_TIME_ZONE = 'Asia/Kolkata';
const APP_TIME_ZONE_OFFSET = '+05:30';
const FUTURE_TIME_ERROR_MESSAGE = 'Invalid time. Future time is not allowed.';
const APP_ERROR_MESSAGES = {
    invalidAmount: 'Please enter a valid amount greater than 0.',
    insufficientWallet: 'Insufficient wallet balance for this action.',
    insufficientSavings: 'Insufficient savings balance for this withdrawal.',
    invalidCategory: 'Please enter a valid category name.',
    invalidAutoPayEndDate: 'End date must be today or later.',
    invalidCustomDays: 'Custom days must be a whole number greater than 0.',
    protectedSavingsDelete: 'Withdrawal entries cannot be deleted because they already affected wallet balance.'
};

function createAppError(code, message, meta = {}) {
    const err = new Error(message);
    err.code = code;
    err.meta = meta;
    return err;
}

function isAppErrorCode(err, code) {
    return !!err && err.code === code;
}

function getCurrentIstParts() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(now).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`,
        seconds: parts.second
    };
}

function getCurrentIstDate() {
    return getCurrentIstParts().date;
}

function getCurrentIstTime() {
    return getCurrentIstParts().time;
}

function getCurrentIstDateTime() {
    return new Date(buildExpenseTimestamp(getCurrentIstDate(), getCurrentIstTime()));
}

function to12HourParts(time24) {
    const [hourStr = '00', minute = '00'] = String(time24 || '00:00').split(':');
    let hour = parseInt(hourStr, 10);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) hour = 0;

    const meridiem = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return {
        hour: String(hour12),
        minute,
        meridiem
    };
}

function to24HourTime(hour12, minute, meridiem) {
    const parsedHour = parseInt(hour12, 10);
    const parsedMinute = parseInt(minute, 10);

    if (Number.isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12) {
        throw new Error('Please select a valid hour.');
    }

    if (Number.isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) {
        throw new Error('Please select a valid minute.');
    }

    if (meridiem !== 'AM' && meridiem !== 'PM') {
        throw new Error('Please select AM or PM.');
    }

    let hour24 = parsedHour % 12;
    if (meridiem === 'PM') hour24 += 12;

    return `${String(hour24).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')}`;
}

function validateExpenseDateTime(expenseDate, expenseTime) {
    const expenseDateTime = new Date(buildExpenseTimestamp(expenseDate, expenseTime));
    if (Number.isNaN(expenseDateTime.getTime())) {
        throw new Error('Please enter a valid date and time.');
    }

    if (expenseDateTime.getTime() > getCurrentIstDateTime().getTime()) {
        throw new Error(FUTURE_TIME_ERROR_MESSAGE);
    }

    return expenseDateTime;
}

function isFutureTimeValidationError(err) {
    return err && err.message === FUTURE_TIME_ERROR_MESSAGE;
}

function validatePositiveAmount(amount, label = 'Amount') {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw createAppError('INVALID_AMOUNT', `${label} must be greater than 0.`);
    }
    return parsedAmount;
}

function requireNonEmptyText(value, message = APP_ERROR_MESSAGES.invalidCategory) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        throw createAppError('INVALID_TEXT', message);
    }
    return normalized;
}

function validateAutoPaymentInput(amount, frequency, customDays, endDate) {
    validatePositiveAmount(amount);

    if (frequency === 'Custom') {
        const days = parseInt(customDays, 10);
        if (!Number.isInteger(days) || days <= 0) {
            throw createAppError('INVALID_CUSTOM_DAYS', APP_ERROR_MESSAGES.invalidCustomDays);
        }
    }

    const today = getCurrentIstDate();
    if (!endDate || endDate < today) {
        throw createAppError('INVALID_AUTO_PAY_END_DATE', APP_ERROR_MESSAGES.invalidAutoPayEndDate);
    }
}

function buildExpenseTimestamp(expenseDate, expenseTime) {
    const safeDate = expenseDate || getCurrentIstDate();
    const safeTime = expenseTime || getCurrentIstTime();
    return `${safeDate}T${safeTime}:00${APP_TIME_ZONE_OFFSET}`;
}

function getExpenseDateTime(expense) {
    const rawValue = expense?.created_at || expense?.expense_date;
    if (!rawValue) return null;

    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getMonthKeyInAppTimeZone(value) {
    if (!value) return '';

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit'
    }).formatToParts(parsed).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    return `${parts.year}-${parts.month}`;
}

function isCurrentAppMonth(value) {
    const currentMonthKey = getCurrentIstDate().slice(0, 7);
    return getMonthKeyInAppTimeZone(value) === currentMonthKey;
}

function formatExpenseTime(value) {
    if (!value) return '-';

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: APP_TIME_ZONE
    }).toUpperCase();
}

async function getSavingById(savingId) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await _supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', savingId)
        .single();

    if (error) throw error;
    return data;
}

// ---- EXPENSES ----

async function addExpense(amount, categoryId, categoryName, description, expenseDate, expenseTime) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');

    const parsedAmount = validatePositiveAmount(amount, 'Expense amount');
    const normalizedCategoryName = requireNonEmptyText(categoryName);
    const expenseDateTime = validateExpenseDateTime(expenseDate, expenseTime);
    const wallet = await getWalletSummary();
    if (wallet && parsedAmount > wallet.remaining) {
        throw createAppError(
            'INSUFFICIENT_WALLET',
            `${APP_ERROR_MESSAGES.insufficientWallet} Available: ₹${wallet.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        );
    }

    const { data, error } = await _supabase.from('expenses').insert({
        user_id: user.id,
        amount: parsedAmount,
        category_id: categoryId,
        category_name: normalizedCategoryName,
        description: description || '',
        expense_date: expenseDate || getCurrentIstDate(),
        created_at: expenseDateTime.toISOString()
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
        .order('created_at', { ascending: false })
        .order('expense_date', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

async function getMonthlyExpenses() {
    const user = await getUser();
    if (!user) return [];

    const { date } = getCurrentIstParts();
    const [year, month] = date.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await _supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', startOfMonth)
        .lte('expense_date', endOfMonth)
        .order('created_at', { ascending: false })
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
    const normalizedName = requireNonEmptyText(name);

    const { data, error } = await _supabase.from('categories').insert({
        user_id: user.id,
        name: normalizedName,
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
    const parsedAmount = validatePositiveAmount(amount, 'Savings amount');
    const wallet = await getWalletSummary();
    if (wallet && parsedAmount > wallet.remaining) {
        throw createAppError(
            'INSUFFICIENT_WALLET',
            `Insufficient wallet balance. Available: ₹${wallet.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        );
    }

    const { data, error } = await _supabase.from('savings').insert({
        user_id: user.id,
        amount: parsedAmount,
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
    const saving = await getSavingById(savingId);
    if (parseFloat(saving.amount) < 0) {
        throw createAppError('PROTECTED_SAVINGS_DELETE', APP_ERROR_MESSAGES.protectedSavingsDelete);
    }

    const { error } = await _supabase
        .from('savings')
        .delete()
        .eq('id', savingId);

    if (error) throw error;
}

// ---- WALLET TRANSACTIONS ----

async function addWalletTransaction(amount, description = 'Wallet top-up') {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');
    const parsedAmount = validatePositiveAmount(amount, 'Wallet amount');

    const { data, error } = await _supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: parsedAmount,
        description
    }).select().single();

    if (error) throw error;
    return data;
}

async function getWalletTransactions() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// ---- WALLET SUMMARY ----

async function getWalletSummary() {
    const profile = await getUserProfile();
    if (!profile) return null;

    const [expenses, savings] = await Promise.all([
        getMonthlyExpenses(),
        getSavings()
    ]);

    const totalSpent = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalSavings = savings.reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
    const monthlySavings = savings
        .filter(saving => isCurrentAppMonth(saving.created_at))
        .reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
    const totalSavingsWithdrawn = savings
        .filter(saving => parseFloat(saving.amount) < 0)
        .reduce((sum, saving) => sum + Math.abs(parseFloat(saving.amount)), 0);

    // Savings withdrawals are internal transfers, not fresh wallet top-ups.
    const monthlyAllowance = Math.max(
        0,
        (parseFloat(profile.monthly_allowance) || 0) - totalSavingsWithdrawn
    );
    const usageAmount = Math.max(0, totalSpent + monthlySavings);
    const usagePercent = monthlyAllowance > 0
        ? Math.min(100, (usageAmount / monthlyAllowance) * 100)
        : 0;
    const remaining = monthlyAllowance - totalSpent - totalSavings;

    return {
        monthlyAllowance,
        totalSpent,
        totalSavings,
        monthlySavings,
        totalSavingsWithdrawn,
        usageAmount,
        usagePercent,
        rawRemaining: remaining,
        remaining: Math.max(0, remaining)
    };
}

async function topUpWallet(amount, description = 'Wallet top-up') {
    const parsedAmount = validatePositiveAmount(amount, 'Wallet amount');
    const profile = await getUserProfile();
    if (!profile) throw new Error('Profile not found');

    const currentAllowance = Math.max(0, parseFloat(profile.monthly_allowance) || 0);
    const newTotal = currentAllowance + parsedAmount;

    await updateProfile({ monthly_allowance: newTotal });

    try {
        await addWalletTransaction(parsedAmount, description);
    } catch (err) {
        await updateProfile({ monthly_allowance: currentAllowance });
        throw err;
    }

    return newTotal;
}

async function transferSavingsToWallet(amount) {
    const parsedAmount = validatePositiveAmount(amount, 'Withdrawal amount');
    const wallet = await getWalletSummary();
    if (wallet && parsedAmount > wallet.totalSavings) {
        throw createAppError(
            'INSUFFICIENT_SAVINGS',
            `${APP_ERROR_MESSAGES.insufficientSavings} Available: ₹${wallet.totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        );
    }

    const profile = await getUserProfile();
    if (!profile) throw new Error('Profile not found');

    const { data: savingEntry, error: savingError } = await _supabase.from('savings').insert({
        user_id: profile.id,
        amount: -parsedAmount,
        description: 'Withdrawn to wallet'
    }).select().single();

    if (savingError) throw savingError;

    const currentAllowance = Math.max(0, parseFloat(profile.monthly_allowance) || 0);
    const newAllowance = currentAllowance + parsedAmount;

    try {
        await updateProfile({ monthly_allowance: newAllowance });
        await addWalletTransaction(parsedAmount, 'Transferred from Savings');
    } catch (err) {
        await _supabase.from('savings').delete().eq('id', savingEntry.id);
        await updateProfile({ monthly_allowance: currentAllowance });
        throw err;
    }

    return newAllowance;
}

// ---- AUTO PAYMENTS ----

async function addAutoPayment(amount, categoryId, categoryName, description, frequency, customDays, executeTime, endDate, nextExecutionAt) {
    const user = await getUser();
    if (!user) throw new Error('Not authenticated');
    const parsedAmount = validatePositiveAmount(amount, 'Auto Pay amount');
    const normalizedCategoryName = requireNonEmptyText(categoryName);
    validateAutoPaymentInput(parsedAmount, frequency, customDays, endDate);

    const payload = {
        user_id: user.id,
        amount: parsedAmount,
        category_id: categoryId,
        category_name: normalizedCategoryName,
        description: description || '',
        frequency,
        execute_time: executeTime,
        end_date: endDate,
        next_execution_at: nextExecutionAt,
        is_active: true
    };

    if (frequency === 'Custom' && customDays) {
        payload.custom_days = parseInt(customDays);
    }

    const { data, error } = await _supabase.from('auto_payments').insert(payload).select().single();

    if (error) throw error;
    return data;
}

async function getAutoPayments() {
    const user = await getUser();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('auto_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
async function deleteAutoPayment(id) {
    const { error } = await _supabase
        .from('auto_payments')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
