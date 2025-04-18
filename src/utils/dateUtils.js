function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getCurrentDate() {
    return formatDate(new Date());
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
        return (timeB[0] * 60 + timeB[1]) - (timeA[0] * 60 + timeA[1]);
    });
} 