class Entry {
    constructor(entryData, dayEntries) {
        this.date = entryData.date;
        this.time = entryData.time;
        this.sugar = entryData.sugar;
        this.insulin = entryData.insulin;
        this.breadUnits = entryData.breadUnits;
        this.comment = entryData.comment;
        this.dayEntries = dayEntries;
    }

    getInsulinTypeInRussian(type) {
        const types = {
            'novorapid': 'Новорапид',
            'levemir': 'Левемир'
        };
        return types[type.toLowerCase()] || type;
    }

    createElement() {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';

        const entryHeader = document.createElement('div');
        entryHeader.className = 'entry-header';

        // Создаем контейнер для времени с иконкой
        const timeContainer = document.createElement('span');
        timeContainer.className = 'time-container';

        // Добавляем иконку таймера
        const timerIcon = document.createElement('img');
        timerIcon.src = 'icons/timer-14.svg';
        timerIcon.alt = 'Время';
        timerIcon.className = 'timer-icon';
        timeContainer.appendChild(timerIcon);

        // Добавляем время
        const timeElement = document.createElement('span');
        timeElement.className = 'entry-time';
        timeElement.textContent = this.time;
        timeContainer.appendChild(timeElement);

        entryHeader.appendChild(timeContainer);

        // Добавляем бейдж сахара только если он указан
        if (this.sugar !== undefined && this.sugar !== null && this.sugar !== '') {
            const sugarBadge = document.createElement('span');
            const sugarColor = getSugarColor(this.sugar, this.time, this.dayEntries);
            sugarBadge.className = `sugar-badge ${sugarColor}`;
            sugarBadge.textContent = `${this.sugar} ммоль/л`;
            entryHeader.appendChild(sugarBadge);
        }

        // Добавляем бейдж инсулина только если он указан
        if (this.insulin && this.insulin.type) {
            const insulinBadge = document.createElement('span');
            insulinBadge.className = 'insulin-badge';
            
            // Добавляем иконку инсулина
            const insulinIcon = document.createElement('img');
            insulinIcon.src = 'icons/insulin-14.svg';
            insulinIcon.alt = 'Инсулин';
            insulinIcon.className = 'insulin-icon';
            insulinBadge.appendChild(insulinIcon);

            // Добавляем текст с типом и количеством
            const insulinText = document.createElement('span');
            const insulinType = this.getInsulinTypeInRussian(this.insulin.type);
            insulinText.innerHTML = `${insulinType} <strong>${this.insulin.units}</strong> ед.`;
            insulinBadge.appendChild(insulinText);

            entryHeader.appendChild(insulinBadge);
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<img src="icons/delete.svg" alt="Delete">';
        entryHeader.appendChild(deleteButton);

        // Добавляем информацию о еде только если она указана
        if (this.comment && this.comment.trim() !== '') {
            const foodElement = document.createElement('div');
            foodElement.className = 'entry-food';

            const breadUnitsText = document.createElement('span');
            breadUnitsText.textContent = `${this.breadUnits} ХЕ`;

            const foodDivider = document.createElement('div');
            foodDivider.className = 'food-divider';

            const commentText = document.createElement('span');
            commentText.textContent = this.comment;

            foodElement.appendChild(breadUnitsText);
            foodElement.appendChild(foodDivider);
            foodElement.appendChild(commentText);

            entryElement.appendChild(entryHeader);
            entryElement.appendChild(foodElement);
        } else {
            entryElement.appendChild(entryHeader);
        }

        return entryElement;
    }
} 