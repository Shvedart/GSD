class DayCard {
    constructor(date, entries) {
        this.date = date;
        this.entries = entries;
        this.isExpanded = true; // По умолчанию записи развернуты
    }

    calculateTotalBreadUnits() {
        return this.entries.reduce((total, entry) => {
            return total + (entry.breadUnits || 0);
        }, 0);
    }

    createElement() {
        const card = document.createElement('div');
        card.classList.add('day-card');

        const header = document.createElement('div');
        header.classList.add('day-header');

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

        card.appendChild(header);

        // Создаем контейнер для записей
        const entriesContainer = document.createElement('div');
        entriesContainer.classList.add('entries-container');

        // Сортируем записи по времени для отображения
        const sortedEntries = sortDayEntriesByTime([...this.entries]);
        
        // Создаем компоненты Entry, передавая отсортированные записи
        sortedEntries.forEach(entryData => {
            const entry = new Entry(entryData, sortedEntries);
            entriesContainer.appendChild(entry.createElement());
        });

        card.appendChild(entriesContainer);

        const totalBreadUnits = this.calculateTotalBreadUnits();
        if (totalBreadUnits > 0) {
            const footer = document.createElement('div');
            footer.classList.add('day-footer');

            const icon = document.createElement('img');
            icon.src = 'icons/bread-units-24.svg';
            icon.classList.add('bread-units-icon');
            footer.appendChild(icon);

            const total = document.createElement('span');
            total.textContent = `Всего ${totalBreadUnits}ХЕ`;
            footer.appendChild(total);

            card.appendChild(footer);
        }

        // Добавляем обработчик клика для сворачивания/разворачивания
        toggleButton.addEventListener('click', () => {
            this.isExpanded = !this.isExpanded;
            entriesContainer.style.display = this.isExpanded ? 'block' : 'none';
            toggleButton.innerHTML = `<img src="icons/${this.isExpanded ? 'arrow_up' : 'arrow_down'}.svg" alt="${this.isExpanded ? 'Свернуть' : 'Развернуть'}">`;
        });

        return card;
    }
} 