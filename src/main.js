// Основной класс приложения
class GSDTracker {
    constructor() {
        this.form = document.getElementById('gsdForm');
        this.entriesContainer = document.getElementById('entries');
        this.dateInput = document.getElementById('date');
        this.timeInput = document.getElementById('time');
        this.sugarInput = document.getElementById('sugar');
        this.insulinInput = document.getElementById('insulin');
        this.insulinUnits = document.getElementById('insulinUnits');
        this.unitsValue = document.getElementById('unitsValue');
        this.foodInput = document.getElementById('food');
        this.breadUnits = document.getElementById('breadUnits');
        this.breadUnitsValue = document.getElementById('breadUnitsValue');

        // Создаем instance приложения глобально доступным
        window.gsdTracker = this;

        this.initializeForm();
        this.initializeUnitsControls();
        this.initializeInsulinControl();
        this.initializeFoodControl();
        this.loadAndDisplayEntries();

        // Инициализируем начальное состояние контрола хлебных единиц
        this.updateBreadUnitsVisibility();
    }

    initializeForm() {
        // Устанавливаем текущие дату и время
        this.dateInput.value = getCurrentDate();
        this.timeInput.value = getCurrentTime();

        // Обработчик отправки формы
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Сбрасываем значения при загрузке
        this.breadUnitsValue.textContent = '0';
    }

    initializeInsulinControl() {
        // Показываем/скрываем контрол единиц инсулина при изменении типа
        this.insulinInput.addEventListener('change', () => {
            this.insulinUnits.style.display = this.insulinInput.value ? 'flex' : 'none';
        });
    }

    updateBreadUnitsVisibility() {
        const hasFood = this.foodInput.value.trim() !== '';
        this.breadUnits.style.display = hasFood ? 'flex' : 'none';
        if (!hasFood) {
            this.breadUnitsValue.textContent = '0';
        }
    }

    initializeFoodControl() {
        // Показываем/скрываем контрол хлебных единиц при вводе еды
        this.foodInput.addEventListener('input', () => {
            this.updateBreadUnitsVisibility();
        });
    }

    initializeUnitsControls() {
        // Обработчики для кнопок изменения единиц инсулина
        document.getElementById('decreaseUnits').addEventListener('click', () => {
            const currentValue = parseInt(this.unitsValue.textContent);
            if (currentValue > 0) {
                this.unitsValue.textContent = currentValue - 1;
            }
        });

        document.getElementById('increaseUnits').addEventListener('click', () => {
            const currentValue = parseInt(this.unitsValue.textContent);
            this.unitsValue.textContent = currentValue + 1;
        });

        // Обработчики для кнопок изменения хлебных единиц
        document.getElementById('decreaseBreadUnits').addEventListener('click', () => {
            const currentValue = parseFloat(this.breadUnitsValue.textContent);
            if (currentValue > 0) {
                this.breadUnitsValue.textContent = (currentValue - 0.5).toFixed(1);
            }
        });

        document.getElementById('increaseBreadUnits').addEventListener('click', () => {
            const currentValue = parseFloat(this.breadUnitsValue.textContent);
            this.breadUnitsValue.textContent = (currentValue + 0.5).toFixed(1);
        });
    }

    handleFormSubmit() {
        const entry = {
            date: this.dateInput.value,
            time: this.timeInput.value,
            sugar: this.sugarInput.value ? parseFloat(this.sugarInput.value) : '',
            comment: this.foodInput.value
        };

        // Добавляем инсулин только если выбран его тип
        if (this.insulinInput.value && this.insulinInput.value !== 'Нет') {
            entry.insulin = {
                type: this.insulinInput.value,
                units: parseInt(this.unitsValue.textContent)
            };
        }

        // Добавляем хлебные единицы только если указана еда
        if (this.foodInput.value.trim()) {
            entry.breadUnits = parseFloat(this.breadUnitsValue.textContent);
        } else {
            entry.breadUnits = 0;
        }

        if (validateEntry(entry)) {
            addEntry(entry);
            this.loadAndDisplayEntries();
            this.form.reset();
            this.dateInput.value = getCurrentDate();
            this.timeInput.value = getCurrentTime();
            this.unitsValue.textContent = '5';
            this.breadUnitsValue.textContent = '0';
            this.insulinUnits.style.display = 'none';
            this.breadUnits.style.display = 'none';
        } else {
            alert('Пожалуйста, проверьте введенные данные');
        }
    }

    loadAndDisplayEntries() {
        const entries = loadEntries();
        const sortedEntries = sortEntriesByDate(entries);
        
        // Очищаем контейнер и добавляем карточки дней
        this.entriesContainer.innerHTML = '';
        sortedEntries.forEach(dayData => {
            const dayCard = new DayCard(dayData.date, dayData.entries);
            this.entriesContainer.appendChild(dayCard.createElement());
        });

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const entryElement = e.target.closest('.entry');
                const dayCard = entryElement.closest('.day-card');
                const date = dayCard.querySelector('h2').textContent;
                const entryIndex = Array.from(dayCard.querySelectorAll('.entry')).indexOf(entryElement);
                
                // Получаем исходную дату из данных
                const entries = loadEntries();
                const originalDate = entries.find(group => formatDate(group.date) === date)?.date;
                
                if (originalDate) {
                    deleteEntry(originalDate, entryIndex);
                    this.loadAndDisplayEntries();
                }
            });
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GSDTracker();
});

// Функция для удаления записи
window.deleteEntry = function(date, time) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        const entries = loadEntries();
        const dayGroup = entries.find(group => group.date === date);
        
        if (dayGroup) {
            const entryIndex = dayGroup.entries.findIndex(entry => entry.time === time);
            if (entryIndex !== -1) {
                dayGroup.entries.splice(entryIndex, 1);
                
                // Если в дне не осталось записей, удаляем весь день
                if (dayGroup.entries.length === 0) {
                    const dayIndex = entries.findIndex(group => group.date === date);
                    entries.splice(dayIndex, 1);
                }
                
                saveEntries(entries);
                // Используем метод класса для обновления отображения
                window.gsdTracker.loadAndDisplayEntries();
            }
        }
    }
}; 