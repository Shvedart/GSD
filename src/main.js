// Основной класс приложения
class GSDTracker {
    constructor() {
        this.form = document.getElementById('gsdForm');
        this.entriesContainer = document.getElementById('entries');
        this.dateInput = document.getElementById('date');
        this.timeInput = document.getElementById('time');
        this.sugarInput = document.getElementById('sugar');
        this.insulinInput = document.getElementById('insulin');
        this.unitsValue = document.getElementById('unitsValue');
        this.foodInput = document.getElementById('food');
        this.breadUnitsValue = document.getElementById('breadUnitsValue');

        this.initializeForm();
        this.initializeUnitsControls();
        this.loadAndDisplayEntries();
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
            insulin: parseInt(this.unitsValue.textContent),
            breadUnits: parseFloat(this.breadUnitsValue.textContent),
            comment: this.foodInput.value
        };

        if (validateEntry(entry)) {
            addEntry(entry);
            this.loadAndDisplayEntries();
            this.form.reset();
            this.dateInput.value = getCurrentDate();
            this.timeInput.value = getCurrentTime();
            this.unitsValue.textContent = '5';
            this.breadUnitsValue.textContent = '1.5';
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