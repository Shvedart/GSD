class DayCard {
    constructor(date, entries) {
        this.date = date;
        this.entries = entries;
        this.isExpanded = true; // По умолчанию записи развернуты
    }

    createElement() {
        const cardElement = document.createElement('div');
        cardElement.className = 'day-card';

        // Создаем заголовок с иконками
        const header = document.createElement('div');
        header.className = 'day-header';

        // Добавляем иконку календаря
        const calendarIcon = document.createElement('img');
        calendarIcon.src = 'icons/calendar-24.svg';
        calendarIcon.alt = 'Календарь';
        calendarIcon.className = 'calendar-icon';
        header.appendChild(calendarIcon);

        // Добавляем дату
        const dateText = document.createElement('h2');
        dateText.textContent = formatDate(this.date);
        header.appendChild(dateText);

        // Добавляем кнопку сворачивания/разворачивания
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-btn';
        toggleButton.innerHTML = `<img src="icons/arrow_up.svg" alt="Свернуть">`;
        header.appendChild(toggleButton);

        cardElement.appendChild(header);

        // Создаем контейнер для записей
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'entries-container';

        // Сортируем записи по времени
        const sortedEntries = sortDayEntriesByTime(this.entries);
        
        sortedEntries.forEach(entryData => {
            const entry = new Entry(entryData, sortedEntries);
            entriesContainer.appendChild(entry.createElement());
        });

        cardElement.appendChild(entriesContainer);

        // Добавляем обработчик клика для сворачивания/разворачивания
        toggleButton.addEventListener('click', () => {
            this.isExpanded = !this.isExpanded;
            entriesContainer.style.display = this.isExpanded ? 'block' : 'none';
            toggleButton.innerHTML = `<img src="icons/${this.isExpanded ? 'arrow_up' : 'arrow_down'}.svg" alt="${this.isExpanded ? 'Свернуть' : 'Развернуть'}">`;
        });

        return cardElement;
    }
} 