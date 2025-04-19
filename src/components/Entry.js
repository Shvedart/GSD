class Entry {
    constructor(entryData, dayEntries = []) {
        this.time = entryData.time;
        this.sugar = entryData.sugar;
        this.insulin = entryData.insulin;
        this.comment = entryData.comment; // еда/комментарий
        this.breadUnits = entryData.breadUnits;
        this.date = entryData.date;
        this.dayEntries = dayEntries;
    }

    getInsulinTypeInRussian(type) {
        const types = {
            'novorapid': 'Новорапид',
            'levemir': 'Левемир'
        };
        return types[type.toLowerCase()] || type;
    }

    isHighSugar() {
        if (!this.sugar) return false;
        
        // Находим индекс текущей записи
        const currentIndex = this.dayEntries.findIndex(entry => 
            entry.time === this.time
        );
        
        if (currentIndex === -1) return false;
        
        // Если это первая запись за день (натощак)
        if (currentIndex === 0) {
            return parseFloat(this.sugar) > 5.0;
        }

        // Ищем последнюю запись с едой перед текущей
        let lastFoodIndex = -1;
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (this.dayEntries[i].comment) {
                lastFoodIndex = i;
                break;
            }
        }

        // Если нет предыдущей записи с едой или текущая запись содержит еду
        if (lastFoodIndex === -1 || this.comment) {
            return parseFloat(this.sugar) > 5.0;
        }

        // Вычисляем разницу во времени
        const prevTime = this.timeToMinutes(this.dayEntries[lastFoodIndex].time);
        const currentTime = this.timeToMinutes(this.time);
        let timeDiff = currentTime - prevTime;

        // Если время перешло через полночь
        if (timeDiff < 0) {
            timeDiff += 24 * 60;
        }

        const sugarValue = parseFloat(this.sugar);

        // Применяем правила в зависимости от времени после еды
        if (timeDiff <= 60) { // До 1 часа после еды
            return sugarValue > 7.0;
        } else if (timeDiff <= 120) { // До 2 часов после еды
            return sugarValue > 6.7;
        } else { // 3 часа и более после еды
            return sugarValue > 5.8;
        }
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    shouldShowDivider() {
        if (!this.comment) {
            return false;
        }

        // Находим индекс текущей записи
        const currentIndex = this.dayEntries.findIndex(entry => 
            entry.time === this.time
        );

        // Если это первая запись дня, не показываем разделитель
        return currentIndex > 0;
    }

    createElement() {
        const note = document.createElement('div');
        note.classList.add('note', 'entry');  // Добавляем класс entry для идентификации

        // Добавляем divider если нужно
        if (this.shouldShowDivider()) {
            const divider = document.createElement('div');
            divider.classList.add('entry-divider');
            note.appendChild(divider);
        }

        // Основная запись (data)
        const data = document.createElement('div');
        data.classList.add('data');

        // Контейнер для времени, сахара и инсулина
        const dataRow = document.createElement('div');
        dataRow.classList.add('data-row');

        // Время
        const timeContainer = document.createElement('div');
        timeContainer.classList.add('time-container');
        
        const timeIcon = document.createElement('img');
        timeIcon.src = 'icons/timer-14.svg';
        timeIcon.classList.add('timer-icon');
        timeContainer.appendChild(timeIcon);
        
        const timeText = document.createElement('span');
        timeText.textContent = this.time;
        timeContainer.appendChild(timeText);
        
        dataRow.appendChild(timeContainer);

        // Сахар и инсулин
        const hasBadges = this.sugar !== undefined || (this.insulin && this.insulin.type);
        if (hasBadges) {
            if (this.sugar !== undefined && this.sugar !== null && this.sugar !== '') {
                const sugarBadge = document.createElement('div');
                const isHigh = this.isHighSugar();
                sugarBadge.classList.add('sugar-badge', isHigh ? 'high' : 'normal');
                
                const sugarIcon = document.createElement('img');
                sugarIcon.src = `icons/sugar-14-${isHigh ? 'red' : 'green'}.svg`;
                sugarIcon.classList.add('sugar-icon');
                sugarBadge.appendChild(sugarIcon);
                
                const sugarText = document.createElement('span');
                sugarText.textContent = this.sugar;
                sugarBadge.appendChild(sugarText);
                
                dataRow.appendChild(sugarBadge);
            }

            if (this.insulin && this.insulin.type) {
                const insulinBadge = document.createElement('div');
                insulinBadge.classList.add('insulin-badge');
                
                const insulinIcon = document.createElement('img');
                insulinIcon.src = 'icons/insulin-14.svg';
                insulinIcon.classList.add('insulin-icon');
                insulinBadge.appendChild(insulinIcon);
                
                const insulinText = document.createElement('span');
                const insulinType = this.getInsulinTypeInRussian(this.insulin.type);
                insulinText.textContent = `${insulinType} ${this.insulin.units} ед.`;
                insulinBadge.appendChild(insulinText);
                
                dataRow.appendChild(insulinBadge);
            }
        }

        // Кнопка удаления
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<img src="icons/delete.svg" alt="Удалить">';
        dataRow.appendChild(deleteButton);

        data.appendChild(dataRow);

        // Еда (если есть)
        if (this.comment) {
            const foodContainer = document.createElement('div');
            foodContainer.classList.add('food-container');

            if (hasBadges) {
                // Для записи с сахаром/инсулином добавляем вертикальную линию
                const line = document.createElement('div');
                line.classList.add('food-line');
                foodContainer.appendChild(line);
            }

            const foodText = document.createElement('div');
            foodText.classList.add('entry-food');
            
            let foodContent = this.comment;
            if (this.breadUnits) {
                foodContent += ` (${this.breadUnits}ХЕ)`;
            }
            foodText.textContent = foodContent;
            
            foodContainer.appendChild(foodText);
            data.appendChild(foodContainer);
        }

        note.appendChild(data);
        return note;
    }
} 