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