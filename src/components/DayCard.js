class DayCard {
    constructor(date, entries) {
        this.date = date;
        this.entries = sortDayEntriesByTime(entries);
    }

    createElement() {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        const dateElement = document.createElement('h2');
        dateElement.textContent = this.date;

        const dayEntries = document.createElement('div');
        dayEntries.className = 'day-entries';

        this.entries.forEach(entryData => {
            const entry = new Entry(entryData);
            dayEntries.appendChild(entry.createElement());
        });

        const stats = getDayStats(this.entries);
        const dayFooter = document.createElement('div');
        dayFooter.className = 'day-footer';
        dayFooter.innerHTML = `
            <span>Инсулин: ${stats.totalInsulin} ед.</span>
            <span>ХЕ: ${stats.totalBreadUnits}</span>
            <span>Средний сахар: ${stats.averageSugar} ммоль/л</span>
        `;

        dayHeader.appendChild(dateElement);
        dayCard.appendChild(dayHeader);
        dayCard.appendChild(dayEntries);
        dayCard.appendChild(dayFooter);

        return dayCard;
    }
} 