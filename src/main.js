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
        this.initializeExportImport();
        this.initializeEntryActions();

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
        this.breadUnitsValue.textContent = '1.0';
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
            this.breadUnitsValue.textContent = '1.0';
        }
    }

    initializeFoodControl() {
        // Показываем/скрываем контрол хлебных единиц при вводе еды
        this.foodInput.addEventListener('input', () => {
            this.updateBreadUnitsVisibility();
        });

        // Устанавливаем начальное значение
        this.breadUnitsValue.textContent = '1.0';
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
            this.breadUnitsValue.textContent = '1.0';
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

    initializeExportImport() {
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importConfirmModal = document.getElementById('importConfirmModal');
        const cancelImportBtn = document.getElementById('cancelImport');
        const confirmImportBtn = document.getElementById('confirmImport');
        const importSuccessBanner = document.getElementById('importSuccessBanner');
        let pendingImportData = null;
        let bannerTimeout = null;

        // Экспорт данных
        exportBtn.addEventListener('click', () => {
            const entries = loadEntries();
            const dataStr = JSON.stringify(entries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gsd-entries-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Импорт данных
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (!Array.isArray(imported)) {
                            alert('Файл не содержит корректных данных.');
                            return;
                        }
                        // Сохраняем данные для подтверждения
                        pendingImportData = imported;
                        importConfirmModal.style.display = 'flex';
                    } catch (err) {
                        alert('Ошибка чтения файла: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });

        // Обработка модального окна подтверждения импорта
        cancelImportBtn.addEventListener('click', () => {
            pendingImportData = null;
            importConfirmModal.style.display = 'none';
        });
        confirmImportBtn.addEventListener('click', () => {
            if (pendingImportData) {
                localStorage.setItem('gsd-entries', JSON.stringify(pendingImportData));
                this.loadAndDisplayEntries();
                pendingImportData = null;
                importConfirmModal.style.display = 'none';
                // Показываем баннер
                importSuccessBanner.style.display = 'block';
                importSuccessBanner.style.opacity = '1';
                if (bannerTimeout) clearTimeout(bannerTimeout);
                bannerTimeout = setTimeout(() => {
                    importSuccessBanner.style.opacity = '0';
                    setTimeout(() => {
                        importSuccessBanner.style.display = 'none';
                    }, 300);
                }, 5000);
            }
        });
        // Закрытие модального окна по клику вне области
        importConfirmModal.addEventListener('click', (e) => {
            if (e.target === importConfirmModal) {
                pendingImportData = null;
                importConfirmModal.style.display = 'none';
            }
        });
        // Закрытие модального окна по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && importConfirmModal.style.display === 'flex') {
                pendingImportData = null;
                importConfirmModal.style.display = 'none';
            }
        });
    }

    initializeEntryActions() {
        const entryActionsModal = document.getElementById('entryActionsModal');
        const deleteEntryBtn = document.getElementById('deleteEntryBtn');
        const editEntryBtn = document.getElementById('editEntryBtn');
        const cancelEntryActionBtn = document.getElementById('cancelEntryActionBtn');
        let pendingEntry = null;

        // Открытие модалки по клику на more-btn
        this.entriesContainer.addEventListener('click', (e) => {
            const moreBtn = e.target.closest('.more-btn');
            if (moreBtn) {
                const entryElement = moreBtn.closest('.entry');
                const dayCard = entryElement.closest('.day-card');
                const date = dayCard.querySelector('h2').textContent;
                const time = entryElement.querySelector('.time-container span').textContent;
                const entries = loadEntries();
                const originalDate = entries.find(group => formatDate(group.date) === date)?.date;
                if (originalDate) {
                    // Находим индекс записи по времени
                    const dayGroup = entries.find(group => group.date === originalDate);
                    const entryIndex = dayGroup.entries.findIndex(entry => entry.time === time);
                    pendingEntry = { date: originalDate, entryIndex, entryElement, time };
                    entryActionsModal.style.display = 'flex';
                }
            }
        });

        // Удалить
        deleteEntryBtn.addEventListener('click', () => {
            if (pendingEntry) {
                const { date, entryIndex, time } = pendingEntry;
                const entries = loadEntries();
                const dayGroup = entries.find(group => group.date === date);
                if (dayGroup) {
                    // Находим индекс по времени для надёжности
                    const idx = dayGroup.entries.findIndex(entry => entry.time === time);
                    if (idx !== -1) {
                        dayGroup.entries.splice(idx, 1);
                        if (dayGroup.entries.length === 0) {
                            const dayIndex = entries.findIndex(group => group.date === date);
                            entries.splice(dayIndex, 1);
                        }
                        localStorage.setItem('gsd-entries', JSON.stringify(entries));
                        this.loadAndDisplayEntries();
                    }
                }
                pendingEntry = null;
                entryActionsModal.style.display = 'none';
            }
        });

        // Редактировать
        editEntryBtn.addEventListener('click', () => {
            if (pendingEntry) {
                const { date, entryIndex, time } = pendingEntry;
                const entries = loadEntries();
                const dayGroup = entries.find(group => group.date === date);
                if (dayGroup) {
                    // Находим индекс по времени для надёжности
                    const idx = dayGroup.entries.findIndex(entry => entry.time === time);
                    if (idx !== -1) {
                        const entry = dayGroup.entries[idx];
                        // Заполняем форму
                        this.dateInput.value = entry.date;
                        this.timeInput.value = entry.time;
                        this.sugarInput.value = entry.sugar !== undefined ? entry.sugar : '';
                        this.insulinInput.value = entry.insulin ? entry.insulin.type : '';
                        this.unitsValue.textContent = entry.insulin ? entry.insulin.units : '5';
                        this.foodInput.value = entry.comment || '';
                        this.breadUnitsValue.textContent = entry.breadUnits !== undefined ? entry.breadUnits : '1.0';
                        this.updateInsulinUnitsVisibility();
                        this.updateBreadUnitsVisibility();
                        // После редактирования удаляем старую запись
                        dayGroup.entries.splice(idx, 1);
                        if (dayGroup.entries.length === 0) {
                            const dayIndex = entries.findIndex(group => group.date === date);
                            entries.splice(dayIndex, 1);
                        }
                        localStorage.setItem('gsd-entries', JSON.stringify(entries));
                        this.loadAndDisplayEntries();
                    }
                }
                pendingEntry = null;
                entryActionsModal.style.display = 'none';
            }
        });

        // Отмена
        cancelEntryActionBtn.addEventListener('click', () => {
            pendingEntry = null;
            entryActionsModal.style.display = 'none';
        });
        // Закрытие по клику вне окна
        entryActionsModal.addEventListener('click', (e) => {
            if (e.target === entryActionsModal) {
                pendingEntry = null;
                entryActionsModal.style.display = 'none';
            }
        });
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && entryActionsModal.style.display === 'flex') {
                pendingEntry = null;
                entryActionsModal.style.display = 'none';
            }
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GSDTracker();
});

// Удаляем старую функцию deleteEntry, так как теперь используем модальное окно 