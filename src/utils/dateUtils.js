function formatDate(date) {
    const d = new Date(date);
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentTime() {
    return formatTime(new Date());
}

function formatDateTime(dateStr, timeStr) {
    return `${dateStr} ${timeStr}`;
}

function sortEntriesByDate(entries) {
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function sortDayEntriesByTime(entries) {
    return entries.sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
}

function getTimeDifferenceInHours(time1, time2) {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    let diffHours = hours2 - hours1;
    const diffMinutes = minutes2 - minutes1;
    
    // Если время перешло через полночь
    if (diffHours < 0) {
        diffHours += 24;
    }
    
    return diffHours + diffMinutes / 60;
}

function getSugarColor(sugar, time, dayEntries) {
    if (!sugar) return null;

    // Сортируем записи по времени
    const sortedEntries = sortDayEntriesByTime([...dayEntries]);
    
    // Проверяем, является ли это первой записью за день
    if (sortedEntries[0].time === time) {
        return parseFloat(sugar) <= 5.0 ? 'normal' : 'high';
    }

    // Находим текущую запись и её индекс
    const currentIndex = sortedEntries.findIndex(entry => entry.time === time);
    if (currentIndex === -1) return 'normal';

    // Если в текущей записи есть еда, используем правило для первой записи
    if (sortedEntries[currentIndex].comment && sortedEntries[currentIndex].comment.trim() !== '') {
        return parseFloat(sugar) <= 5.0 ? 'normal' : 'high';
    }

    // Ищем предыдущую запись с едой
    let prevFoodEntry = null;
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (sortedEntries[i].comment && sortedEntries[i].comment.trim() !== '') {
            prevFoodEntry = sortedEntries[i];
            break;
        }
    }

    // Если нет предыдущей записи с едой, используем правило для первой записи
    if (!prevFoodEntry) {
        return parseFloat(sugar) <= 5.0 ? 'normal' : 'high';
    }

    // Вычисляем разницу во времени
    const hoursDiff = getTimeDifferenceInHours(prevFoodEntry.time, time);

    // Определяем цвет в зависимости от времени после еды
    if (hoursDiff <= 1) {
        return parseFloat(sugar) <= 7.0 ? 'normal' : 'high';
    } else if (hoursDiff <= 2) {
        return parseFloat(sugar) <= 6.7 ? 'normal' : 'high';
    } else {
        return parseFloat(sugar) <= 5.8 ? 'normal' : 'high';
    }
}

// Экспортируем функции
window.formatDate = formatDate;
window.getCurrentDate = getCurrentDate;
window.formatTime = formatTime;
window.getCurrentTime = getCurrentTime;
window.formatDateTime = formatDateTime;
window.sortEntriesByDate = sortEntriesByDate;
window.sortDayEntriesByTime = sortDayEntriesByTime;
window.getSugarColor = getSugarColor; 