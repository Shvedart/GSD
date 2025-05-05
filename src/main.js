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
        this.initializeRewardModal();
        this.chipsList = [
            "кофе со сливками", "огурец", "черри", "редисок", "ржаной хлеб", "омлет", "яйцо вареное", "сыр", "сметана", "ряженка", "гречка", "индейка", "макароны", "яблоко", "котлеты куриные", "квашеная капуста", "салат", "киви", "кефир", "запеканка творожная", "говядина", "йогурт"
        ];
        this.renderChips("");
        this.foodInput.addEventListener('input', () => {
            this.renderChips(this.foodInput.value);
        });

        // Инициализируем начальное состояние контрола хлебных единиц
        this.updateBreadUnitsVisibility();
        this.isEditMode = false;
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
        this.unitsValue.textContent = '7';
        
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
            // Проверка на новый календарный день
            const entries = loadEntries();
            const isNewDay = !entries.some(group => group.date === entry.date);
            let yesterdayDate = null;
            if (isNewDay) {
                // Найти вчерашний день
                const yesterday = new Date(entry.date);
                yesterday.setDate(yesterday.getDate() - 1);
                yesterdayDate = yesterday.toISOString().slice(0, 10);
                const yesterdayGroup = entries.find(group => group.date === yesterdayDate);
                if (yesterdayGroup && !this.wasRewardShownForDay(yesterdayDate)) {
                    // Проверить, были ли красные сахара
                    const hasRed = yesterdayGroup.entries.some(e => {
                        if (e.sugar === undefined || e.sugar === null || e.sugar === '') return false;
                        // Используем ту же логику, что и для бейджа
                        const entryObj = new Entry(e, yesterdayGroup.entries);
                        return entryObj.isHighSugar();
                    });
                    if (!hasRed) {
                        this.showRewardModal();
                        this.markRewardShownForDay(yesterdayDate);
                    }
                }
            }
            addEntry(entry);
            this.loadAndDisplayEntries();
            
            // Сохраняем текущее значение инсулина
            const currentInsulin = this.insulinInput.value;
            
            // Сбрасываем форму
            this.form.reset();
            
            // Восстанавливаем значения после сброса
            this.dateInput.value = getCurrentDate();
            this.timeInput.value = getCurrentTime();
            this.unitsValue.textContent = '7';
            this.breadUnitsValue.textContent = '1.0';
            this.breadUnits.style.display = 'none';
            
            // Восстанавливаем значение инсулина и обновляем видимость поля единиц
            this.insulinInput.value = currentInsulin;
            this.updateInsulinUnitsVisibility();
            // Показываем баннер только если это было редактирование
            if (this.isEditMode) {
                const editSuccessBanner = document.getElementById('editSuccessBanner');
                if (editSuccessBanner) {
                    editSuccessBanner.style.display = 'block';
                    editSuccessBanner.style.opacity = '1';
                    setTimeout(() => {
                        editSuccessBanner.style.opacity = '0';
                        setTimeout(() => {
                            editSuccessBanner.style.display = 'none';
                        }, 300);
                    }, 5000);
                }
                this.isEditMode = false;
            }
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

        this.renderFlowers(entries);
    }

    renderFlowers(entries) {
        const flowersContainer = document.getElementById('flowersContainer');
        if (!flowersContainer) return;
        // Цветочек за каждый день, если предыдущий день был без превышения сахара и сегодня есть запись
        let count = 0;
        // Сортируем по дате (на всякий случай)
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            // В предыдущем дне не было превышения
            const prevHasRed = prev.entries.some(e => {
                if (e.sugar === undefined || e.sugar === null || e.sugar === '') return false;
                const entryObj = new Entry(e, prev.entries);
                return entryObj.isHighSugar();
            });
            // В текущем дне есть хотя бы одна запись
            if (!prevHasRed && curr.entries.length > 0) {
                count++;
            }
        }
        flowersContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = 'icons/flowers.svg';
            img.alt = 'День без превышения';
            img.className = 'flower-icon';
            flowersContainer.appendChild(img);
        }
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
                        this.unitsValue.textContent = entry.insulin ? entry.insulin.units : '7';
                        this.foodInput.value = entry.comment || '';
                        this.breadUnitsValue.textContent = entry.breadUnits !== undefined ? entry.breadUnits : '1.0';
                        this.updateInsulinUnitsVisibility();
                        this.updateBreadUnitsVisibility();
                        // Скроллим к форме
                        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // После редактирования удаляем старую запись
                        dayGroup.entries.splice(idx, 1);
                        if (dayGroup.entries.length === 0) {
                            const dayIndex = entries.findIndex(group => group.date === date);
                            entries.splice(dayIndex, 1);
                        }
                        localStorage.setItem('gsd-entries', JSON.stringify(entries));
                        this.loadAndDisplayEntries();
                        // Включаем режим редактирования
                        this.isEditMode = true;
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

    initializeRewardModal() {
        this.rewardModal = document.getElementById('rewardModal');
        this.closeRewardBtn = document.getElementById('closeRewardBtn');
        this.rewardShownKey = 'gsd-reward-shown';
        this.closeRewardBtn.addEventListener('click', () => {
            this.rewardModal.style.display = 'none';
        });
    }

    showRewardModal() {
        this.rewardModal.style.display = 'flex';
    }

    wasRewardShownForDay(date) {
        const shown = localStorage.getItem(this.rewardShownKey);
        if (!shown) return false;
        try {
            const arr = JSON.parse(shown);
            return arr.includes(date);
        } catch {
            return false;
        }
    }
    markRewardShownForDay(date) {
        let arr = [];
        const shown = localStorage.getItem(this.rewardShownKey);
        if (shown) {
            try { arr = JSON.parse(shown); } catch {}
        }
        if (!arr.includes(date)) arr.push(date);
        localStorage.setItem(this.rewardShownKey, JSON.stringify(arr));
    }

    renderChips(filter) {
        const chipsContainer = document.getElementById('chipsContainer');
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '';
        // Фильтруем по последнему слову после запятой
        let value = (filter || '').trim();
        let lastWord = value.split(',').pop().trim().toLowerCase();
        if (!lastWord) {
            chipsContainer.style.display = 'none';
            return;
        }
        const filtered = this.chipsList.filter(text => text.toLowerCase().startsWith(lastWord));
        if (filtered.length === 0) {
            chipsContainer.style.display = 'none';
            return;
        }
        chipsContainer.style.display = 'flex';
        filtered.forEach(text => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.textContent = text;
            chip.addEventListener('click', () => {
                const foodInput = document.getElementById('food');
                let current = foodInput.value;
                let parts = current.split(',');
                // Заменяем последнее слово на выбранный чипс (без запятой)
                parts[parts.length - 1] = ' ' + text;
                foodInput.value = parts.join(',').replace(/^\s+/, '');
                foodInput.focus();
                this.updateBreadUnitsVisibility();
                this.renderChips(foodInput.value); // обновить фильтр после добавления
            });
            chipsContainer.appendChild(chip);
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GSDTracker();
});

// Удаляем старую функцию deleteEntry, так как теперь используем модальное окно 