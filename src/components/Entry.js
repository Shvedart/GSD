class Entry {
    constructor(entryData, dayEntries) {
        this.date = entryData.date;
        this.time = entryData.time;
        this.sugar = entryData.sugar;
        this.insulin = entryData.insulin;
        this.breadUnits = entryData.breadUnits;
        this.comment = entryData.comment;
        this.dayEntries = dayEntries || [];
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
            entry.time === this.time && entry.sugar === this.sugar
        );
        
        if (currentIndex === -1) return false;
        
        // Если это первая запись за день
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
        // Показываем разделитель только если в текущей записи есть еда
        if (!this.comment) {
            return false;
        }

        // Находим текущую запись
        const currentIndex = this.dayEntries.findIndex(entry => 
            entry.time === this.time
        );

        // Если это первая запись дня, не показываем разделитель
        if (currentIndex === 0) {
            return false;
        }

        // Если есть еда и это не первая запись - показываем разделитель
        return true;
    }

    createElement() {
        const container = document.createElement('div');
        container.className = 'entry-container';

        // Добавляем разделитель
        if (this.shouldShowDivider()) {
            const divider = document.createElement('div');
            divider.className = 'entry-divider';
            container.appendChild(divider);
        }

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
            const isHigh = this.isHighSugar();
            sugarBadge.className = 'sugar-badge ' + (isHigh ? 'high' : 'normal');

            // Добавляем иконку сахара
            const sugarIcon = document.createElement('img');
            sugarIcon.src = isHigh ? 'icons/sugar-14-red.svg' : 'icons/sugar-14-green.svg';
            sugarIcon.alt = 'Сахар';
            sugarIcon.className = 'sugar-icon';
            sugarBadge.appendChild(sugarIcon);

            // Добавляем значение сахара
            const sugarValue = document.createElement('span');
            sugarValue.textContent = this.sugar;
            sugarBadge.appendChild(sugarValue);

            entryHeader.appendChild(sugarBadge);
        }

        // Добавляем информацию об инсулине только если он указан
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

        // Добавляем кнопку удаления
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<img src="icons/delete.svg" alt="Delete">';
        entryHeader.appendChild(deleteButton);

        entryElement.appendChild(entryHeader);

        // Добавляем информацию о еде и хлебных единицах
        if (this.comment || this.breadUnits) {
            const foodElement = document.createElement('div');
            foodElement.className = 'entry-food';
            
            let foodText = this.comment || '';
            if (this.breadUnits) {
                foodText += ` (${this.breadUnits} ХЕ)`;
            }
            foodElement.textContent = foodText;
            
            entryElement.appendChild(foodElement);
        }

        container.appendChild(entryElement);
        return container;
    }
} 