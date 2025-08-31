// MagnumStarBot WebApp JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('MagnumStarBot WebApp загружен');

    // Анимация появления панели баланса
    const balanceNavbar = document.querySelector('.balance-navbar');
    balanceNavbar.style.transform = 'translateY(-100%)';
    balanceNavbar.style.opacity = '0';

    setTimeout(() => {
        balanceNavbar.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        balanceNavbar.style.transform = 'translateY(0)';
        balanceNavbar.style.opacity = '1';
    }, 300);

    // Функция обновления баланса
    function updateBalance(type, amount) {
        const balanceElement = document.getElementById(`${type}-balance`);
        if (balanceElement) {
            const currentAmount = parseInt(balanceElement.textContent.replace(',', ''));
            const targetAmount = amount;

            // Анимация счетчика
            animateNumber(balanceElement, currentAmount, targetAmount, 1000);
        }
    }

    // Анимация чисел
    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Используем easeOut функцию для плавной анимации
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + difference * easeOutProgress);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // Пульсирующий эффект для баланса
    function addPulseEffect() {
        const balanceItems = document.querySelectorAll('.balance-item');

        balanceItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'pulse 2s infinite';
            }, index * 500);
        });
    }

    // Добавляем CSS анимацию pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Запускаем пульсирующий эффект через 2 секунды
    setTimeout(addPulseEffect, 2000);

    // Пример использования (можно удалить в продакшене)
    setTimeout(() => updateBalance('stars', 1350), 3000);
    setTimeout(() => updateBalance('magnum', 6123), 5000);

    // Анимация появления карточек
    const features = document.querySelectorAll('.feature');

    features.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';

        setTimeout(() => {
            feature.style.transition = 'all 0.5s ease';
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Добавляем эффект при наведении
    features.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        feature.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Простая анимация заголовка
    const header = document.querySelector('.header h1');
    let hue = 0;

    setInterval(() => {
        hue = (hue + 1) % 360;
        header.style.textShadow = `2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px hsl(${hue}, 70%, 50%)`;
    }, 50);
});
