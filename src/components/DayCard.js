class DayCard {
    constructor(date, entries) {
        this.date = date;
        this.entries = entries;
    }

    createElement() {
        const cardElement = document.createElement('div');
        cardElement.className = 'day-card';

        const header = document.createElement('h2');
        header.textContent = formatDate(this.date);
        cardElement.appendChild(header);

        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'entries-container';

        // Сортируем записи по времени
        const sortedEntries = sortDayEntriesByTime(this.entries);
        
        sortedEntries.forEach(entryData => {
            const entry = new Entry(entryData, sortedEntries);
            entriesContainer.appendChild(entry.createElement());
        });

        cardElement.appendChild(entriesContainer);
        return cardElement;
    }
} 