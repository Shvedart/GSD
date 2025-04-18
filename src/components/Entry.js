class Entry {
    constructor(entryData) {
        this.date = entryData.date;
        this.time = entryData.time;
        this.sugar = entryData.sugar;
        this.insulin = entryData.insulin;
        this.breadUnits = entryData.breadUnits;
        this.comment = entryData.comment;
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

        const timeElement = document.createElement('span');
        timeElement.className = 'entry-time';
        timeElement.textContent = this.time;
        entryHeader.appendChild(timeElement);

        // Добавляем бейдж сахара только если он указан
        if (this.sugar !== undefined && this.sugar !== null && this.sugar !== '') {
            const sugarBadge = document.createElement('span');
            sugarBadge.className = `sugar-badge ${this.sugar > 7 ? 'high' : 'normal'}`;
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

        return entryElement;
    }
} 