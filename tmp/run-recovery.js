async function runRecovery() {
    try {
        const response = await fetch('http://localhost:3000/api/debug/recovery', { method: 'POST' });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Recovery Fetch Error:', error.message);
    }
}
runRecovery();
