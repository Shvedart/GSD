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

        // Элементы модального окна
        this.deleteModal = document.getElementById('deleteModal');
        this.cancelDeleteBtn = document.getElementById('cancelDelete');
        this.confirmDeleteBtn = document.getElementById('confirmDelete');
        this.pendingDelete = null;

        // Создаем instance приложения глобально доступным
        window.gsdTracker = this;

        this.initializeForm();
        this.initializeUnitsControls();
        this.initializeInsulinControl();
        this.initializeFoodControl();
        this.initializeDeleteModal();
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

        // Устанавливаем начальные значения
        this.breadUnitsValue.textContent = '0';
        this.unitsValue.textContent = '5';
        
        // Устанавливаем начальное состояние поля инсулина
        this.updateInsulinUnitsVisibility();
    }

    initializeInsulinControl() {
        this.insulinInput.addEventListener('change', () => {
            this.updateInsulinUnitsVisibility();
        });
    }

    updateInsulinUnitsVisibility() {
        const selectedValue = this.insulinInput.value;
        this.insulinUnits.style.display = selectedValue && selectedValue !== 'Нет' ? 'flex' : 'none';
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

        if (this.insulinInput.value && this.insulinInput.value !== 'Нет') {
            entry.insulin = {
                type: this.insulinInput.value,
                units: parseInt(this.unitsValue.textContent)
            };
        }

        if (this.foodInput.value.trim()) {
            entry.breadUnits = parseFloat(this.breadUnitsValue.textContent);
        } else {
            entry.breadUnits = 0;
        }

        if (validateEntry(entry)) {
            addEntry(entry);
            this.loadAndDisplayEntries();
            
            // Сохраняем текущее значение инсулина
            const currentInsulin = this.insulinInput.value;
            
            // Сбрасываем форму
            this.form.reset();
            
            // Восстанавливаем значения после сброса
            this.dateInput.value = getCurrentDate();
            this.timeInput.value = getCurrentTime();
            this.unitsValue.textContent = '5';
            this.breadUnitsValue.textContent = '0';
            this.breadUnits.style.display = 'none';
            
            // Восстанавливаем значение инсулина и обновляем видимость поля единиц
            this.insulinInput.value = currentInsulin;
            this.updateInsulinUnitsVisibility();
        } else {
            alert('Пожалуйста, проверьте введенные данные');
        }
    }

    initializeDeleteModal() {
        // Обработчик закрытия модального окна по кнопке отмены
        this.cancelDeleteBtn.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Обработчик подтверждения удаления
        this.confirmDeleteBtn.addEventListener('click', () => {
            if (this.pendingDelete) {
                const { date, entryIndex } = this.pendingDelete;
                const entries = loadEntries();
                const dayGroup = entries.find(group => group.date === date);
                
                if (dayGroup) {
                    dayGroup.entries.splice(entryIndex, 1);
                    
                    // Если в дне не осталось записей, удаляем весь день
                    if (dayGroup.entries.length === 0) {
                        const dayIndex = entries.findIndex(group => group.date === date);
                        entries.splice(dayIndex, 1);
                    }
                    
                    saveEntries(entries);
                    this.loadAndDisplayEntries();
                }
                this.hideDeleteModal();
            }
        });

        // Закрытие модального окна при клике вне его области
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.hideDeleteModal();
            }
        });

        // Закрытие модального окна по клавише Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.deleteModal.style.display === 'flex') {
                this.hideDeleteModal();
            }
        });
    }

    showDeleteModal(date, entryIndex) {
        this.pendingDelete = { date, entryIndex };
        this.deleteModal.style.display = 'flex';
        // Фокус на кнопку отмены для удобства использования клавиатуры
        this.cancelDeleteBtn.focus();
    }

    hideDeleteModal() {
        this.pendingDelete = null;
        this.deleteModal.style.display = 'none';
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
                e.preventDefault();
                e.stopPropagation();
                
                const entryElement = button.closest('.entry');
                if (!entryElement) return;
                
                const dayCard = entryElement.closest('.day-card');
                if (!dayCard) return;
                
                const dateText = dayCard.querySelector('h2').textContent;
                const entries = loadEntries();
                const originalDate = entries.find(group => formatDate(group.date) === dateText)?.date;
                
                if (originalDate) {
                    const dayGroup = entries.find(group => group.date === originalDate);
                    const entryIndex = Array.from(dayCard.querySelectorAll('.entry')).indexOf(entryElement);
                    
                    if (dayGroup && entryIndex !== -1) {
                        this.showDeleteModal(originalDate, entryIndex);
                    }
                }
            });
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GSDTracker();
});

// Удаляем старую функцию deleteEntry, так как теперь используем модальное окно 