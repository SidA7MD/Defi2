// Native fetch used

async function testLogin() {
    console.log('Testing Admin Login API...');
    try {
        const response = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@ihsan.org',
                password: 'password123'
            })
        });

        const status = response.status;
        const data = await response.json();

        console.log('Status:', status);
        if (status === 200) {
            console.log('LOGIN SUCCESS!');
            console.log('Token received:', data.accessToken ? 'YES' : 'NO');
        } else {
            console.error('LOGIN FAILED:', data);
        }
    } catch (err) {
        console.error('API ERROR:', err.message);
    }
}

testLogin();
