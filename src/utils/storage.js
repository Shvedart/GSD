const STORAGE_KEY = 'gsd-entries';

function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntries() {
    const entries = localStorage.getItem(STORAGE_KEY);
    return entries ? JSON.parse(entries) : [];
}

function addEntry(entry) {
    const entries = loadEntries();
    
    // Ищем или создаем группу для текущей даты
    let dayGroup = entries.find(group => group.date === entry.date);
    if (!dayGroup) {
        dayGroup = { date: entry.date, entries: [] };
        entries.push(dayGroup);
    }
    
    // Добавляем запись в группу
    dayGroup.entries.push(entry);
    
    // Сохраняем обновленный список
    saveEntries(entries);
}

function deleteEntry(date, entryIndex) {
    const entries = loadEntries();
    const dayGroupIndex = entries.findIndex(group => group.date === date);
    
    if (dayGroupIndex !== -1) {
        const dayGroup = entries[dayGroupIndex];
        dayGroup.entries.splice(entryIndex, 1);
        
        // Если это была последняя запись в дне, удаляем весь день
        if (dayGroup.entries.length === 0) {
            entries.splice(dayGroupIndex, 1);
        }
        
        saveEntries(entries);
    }
}

function getDayStats(entries) {
    let totalInsulin = 0;
    let totalBreadUnits = 0;
    let averageSugar = 0;
    let sugarReadings = 0;

    entries.forEach(entry => {
        if (entry.insulin) {
            totalInsulin += entry.insulin;
        }
        if (entry.breadUnits) {
            totalBreadUnits += entry.breadUnits;
        }
        if (entry.sugar !== undefined && entry.sugar !== null && entry.sugar !== '') {
            averageSugar += parseFloat(entry.sugar);
            sugarReadings++;
        }
    });

    return {
        totalInsulin,
        totalBreadUnits,
        averageSugar: sugarReadings ? (averageSugar / sugarReadings).toFixed(1) : '-'
    };
} 