
const SUPABASE_URL = 'https://gfzlfsuqslugbcobqcsn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmemxmc3Vxc2x1Z2Jjb2JxY3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzk3MDIsImV4cCI6MjA4Nzc1NTcwMn0.rddMNAALPs9bUUZcbXDd-4Q7m9uD752wvxIk8nZb0hg';
const EMAIL = 'dineshkarthik813@gmail.com';

async function research() {
    try {
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,name`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const profiles = await profileRes.json();
        
        console.log('Total profiles found:', profiles.length);
        profiles.forEach(p => console.log(`- ${p.email} (ID: ${p.id})`));

        const user = profiles.find(p => p.email.toLowerCase() === EMAIL.toLowerCase());
        
        if (user) {
            console.log('\nUser FOUND:', user);
            const transRes = await fetch(`${SUPABASE_URL}/rest/v1/wallet_transactions?user_id=eq.${user.id}&order=created_at.desc&limit=5`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const transactions = await transRes.json();
            console.log('Last transactions:', JSON.stringify(transactions, null, 2));
        } else {
            console.log('\nUser NOT FOUND with email:', EMAIL);
        }
    } catch (err) {
        console.error('Error:', err);
    }
} research();
