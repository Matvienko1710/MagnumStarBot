async function getBalance() {
    const userId = 123; // Замените на реальный ID пользователя
    const balanceDiv = document.getElementById('balance');

    try {
        const response = await fetch(`/api/balance/${userId}`);
        const data = await response.json();

        if (data.success) {
            balanceDiv.textContent = `Balance: ${data.data.magnumCoins} Coins, ${data.data.stars} Stars`;
        } else {
            balanceDiv.textContent = `Error: ${data.error}`;
        }
    } catch (error) {
        balanceDiv.textContent = 'Failed to load balance.';
        console.error(error);
    }
}

getBalance();