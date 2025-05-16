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

        this.settingsModal = document.getElementById('settingsModal');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');

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

        this.sugarInput.addEventListener('focus', () => {
            this.sugarInput.classList.remove('input-error');
            this.sugarInput.placeholder = 'Сахар';
        });

        this.initializeEditEntryModal();

        // Открытие модалки по клику на иконку настроек
        const settingsIcon = document.querySelector('.heading-block-form .input-icon[src="icons/settings.svg"]');
        if (settingsIcon) {
            settingsIcon.style.cursor = 'pointer';
            settingsIcon.addEventListener('click', () => {
                this.settingsModal.style.display = 'flex';
            });
        }
        // Закрытие модалки по клику вне окна
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.settingsModal.style.display = 'none';
            }
        });
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal.style.display === 'flex') {
                this.settingsModal.style.display = 'none';
            }
        });
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
        // Корректно обрабатываем пустое значение сахара
        let sugarValue = this.sugarInput.value;
        if (sugarValue === '' || sugarValue === null || sugarValue === undefined) {
            sugarValue = '';
        } else {
            sugarValue = parseFloat(sugarValue);
        }
        const entry = {
            date: this.dateInput.value,
            time: this.timeInput.value,
            sugar: sugarValue,
            comment: this.foodInput.value,
            breadUnits: this.foodInput.value.trim() ? parseFloat(this.breadUnitsValue.textContent) : 0
        };
        if (this.insulinInput.value && this.insulinInput.value !== 'Нет') {
            entry.insulin = {
                type: this.insulinInput.value,
                units: parseInt(this.unitsValue.textContent)
            };
        }
        const submitBtn = document.querySelector('.submit-btn');
        if (validateEntry(entry)) {
            // Считаем streak до добавления записи
            const entriesBefore = loadEntries();
            const sortedBefore = [...entriesBefore].sort((a, b) => a.date.localeCompare(b.date));
            let streakBefore = 0;
            let spheroliaBefore = 0;
            for (let i = 1; i < sortedBefore.length; i++) {
                const prev = sortedBefore[i - 1];
                const curr = sortedBefore[i];
                const sortedDayEntries = [...prev.entries].sort((a, b) => a.time.localeCompare(b.time));
                const prevHasRed = sortedDayEntries.some(e => {
                    if (e.sugar === undefined || e.sugar === null || e.sugar === '') return false;
                    const entryObj = new Entry(e, sortedDayEntries);
                    return entryObj.isHighSugar();
                });
                if (!prevHasRed && curr.entries.length > 0) {
                    streakBefore++;
                    spheroliaBefore++;
                } else {
                    streakBefore = 0;
                }
            }
            addEntry(entry);
            this.loadAndDisplayEntries();
            // Считаем streak после добавления записи
            const entriesAfter = loadEntries();
            const sortedAfter = [...entriesAfter].sort((a, b) => a.date.localeCompare(b.date));
            let streakAfter = 0;
            let spheroliaAfter = 0;
            for (let i = 1; i < sortedAfter.length; i++) {
                const prev = sortedAfter[i - 1];
                const curr = sortedAfter[i];
                const sortedDayEntries = [...prev.entries].sort((a, b) => a.time.localeCompare(b.time));
                const prevHasRed = sortedDayEntries.some(e => {
                    if (e.sugar === undefined || e.sugar === null || e.sugar === '') return false;
                    const entryObj = new Entry(e, sortedDayEntries);
                    return entryObj.isHighSugar();
                });
                if (!prevHasRed && curr.entries.length > 0) {
                    streakAfter++;
                    spheroliaAfter++;
                } else {
                    streakAfter = 0;
                }
            }
            // Если streak увеличился — эмулируем клик по последнему цветку
            if (streakAfter > streakBefore) {
                const flowersContainer = document.getElementById('flowersContainer');
                if (flowersContainer && flowersContainer.children.length > 0) {
                    const lastFlower = flowersContainer.children[flowersContainer.children.length - 1];
                    lastFlower.click();
                }
            }
            
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
                    }, 3000);
                }
                this.isEditMode = false;
            }
            // --- Новое: меняем кнопку на зелёную ---
            if (submitBtn) {
                submitBtn.classList.add('btn-success');
                submitBtn.textContent = 'Запись добавлена';
                setTimeout(() => {
                    submitBtn.classList.remove('btn-success');
                    submitBtn.textContent = 'Добавить';
                }, 3000);
            }

            // Считаем награды
            const luminaryBefore = Math.floor(spheroliaBefore / 5);
            const astraBefore = Math.floor(spheroliaBefore / 10);
            const luminaryAfter = Math.floor(spheroliaAfter / 5);
            const astraAfter = Math.floor(spheroliaAfter / 10);
            // Определяем, какой цветок новый
            let newFlower = null;
            if (astraAfter > astraBefore) {
                newFlower = 'premium';
            } else if (luminaryAfter > luminaryBefore) {
                newFlower = 'unique';
            } else if (spheroliaAfter > spheroliaBefore) {
                newFlower = 'regular';
            }
            if (newFlower) {
                setTimeout(() => {
                    this.showRewardModal(newFlower);
                }, 400); // небольшая задержка для плавности
            }
        } else {
            // Проверяем ошибку только по сахару
            if (!validateSugar(sugarValue)) {
                this.sugarInput.classList.add('input-error');
                this.sugarInput.value = '';
                this.sugarInput.placeholder = 'Значение до 40 ед.';
            }
            // --- Новое: меняем кнопку на красную ---
            if (submitBtn) {
                submitBtn.classList.add('btn-error');
                submitBtn.textContent = 'Произошла ошибка';
                setTimeout(() => {
                    submitBtn.classList.remove('btn-error');
                    submitBtn.textContent = 'Добавить';
                }, 3000);
            }
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
                    // Показываем баннер удаления
                    const deleteSuccessBanner = document.getElementById('deleteSuccessBanner');
                    if (deleteSuccessBanner) {
                        deleteSuccessBanner.style.display = 'block';
                        deleteSuccessBanner.style.opacity = '1';
                        setTimeout(() => {
                            deleteSuccessBanner.style.opacity = '0';
                            setTimeout(() => {
                                deleteSuccessBanner.style.display = 'none';
                            }, 300);
                        }, 5000);
                    }
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
        // --- Заглушка, если нет записей ---
        let emptyStub = document.getElementById('emptyEntriesStub');
        if (!emptyStub) {
            emptyStub = document.createElement('div');
            emptyStub.id = 'emptyEntriesStub';
            emptyStub.className = 'empty-entries-stub';
            emptyStub.innerHTML = `
                <img src="img/first-note.png" alt="Первая запись" class="modal-img>
                <div class="empty-entries-text">
                    <h2 class="empty-entries-title">Добавьте первую запись</h2>
                    <div class="text-descriptor empty-entries-desc">У вас пока нет ни одной записи.<br>Заполните форму, чтобы добавить первую.</div>
                </div>
            `;
            this.entriesContainer.parentNode.insertBefore(emptyStub, this.entriesContainer);
        }
        if (sortedEntries.length === 0) {
            emptyStub.style.display = 'block';
        } else {
            emptyStub.style.display = 'none';
        }
        // --- Конец заглушки ---
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

        this.renderFlowersBlock(entries);
    }

    renderFlowersBlock(entries) {
        const flowersBlock = document.getElementById('flowersBlock');
        if (!flowersBlock) return;
        // Считаем общее количество обычных цветков (Spherolia)
        let spherolia = 0;
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        let streak = 0;
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            const sortedDayEntries = [...prev.entries].sort((a, b) => a.time.localeCompare(b.time));
            const prevHasRed = sortedDayEntries.some(e => {
                if (e.sugar === undefined || e.sugar === null || e.sugar === '') return false;
                const entryObj = new Entry(e, sortedDayEntries);
                return entryObj.isHighSugar();
            });
            if (!prevHasRed && curr.entries.length > 0) {
                streak++;
                spherolia++;
            } else {
                streak = 0;
            }
        }
        // Новая логика: Luminary и Astra Lyria считаются от общего числа Spherolia
        const luminary = Math.floor(spherolia / 5);
        const astra = Math.floor(spherolia / 10);
        // Если нет ни одного цветка — скрываем блок
        if (spherolia === 0) {
            flowersBlock.style.display = 'none';
            flowersBlock.innerHTML = '';
            return;
        }
        flowersBlock.style.display = 'block';
        // Склонение слова "цветок"
        function flowerWord(n) {
            n = Math.abs(n) % 100;
            let n1 = n % 10;
            if (n > 10 && n < 20) return 'цветков';
            if (n1 > 1 && n1 < 5) return 'цветка';
            if (n1 === 1) return 'цветок';
            return 'цветков';
        }
        // Рендерим блок
        flowersBlock.innerHTML = `
            <div class="flowers-block-header">
                <div class="flowers-block-title">Ваши цветочки</div>
                <div class="flowers-block-desc">То, что ты делаешь, очень ценно — продолжай!</div>
            </div>
            <div class="flowers-block-list">
                <div class="flower-item"><img src="img/spherolia.png" class="flower-img" data-type="regular"><div class="flower-caption"><b>${spherolia} ${flowerWord(spherolia)}</b><br>Ромашка</div></div>
                ${luminary > 0 ? `<div class="flower-item"><img src="img/luminary.png" class="flower-img" data-type="unique"><div class="flower-caption"><b>${luminary} ${flowerWord(luminary)}</b><br>Пиона</div></div>` : `<div class='flower-item flower-placeholder'><div class='flower-placeholder-box'>Ещё не открытый<br>цветок</div></div>`}
                ${astra > 0 ? `<div class="flower-item"><img src="img/astra-lyria.png" class="flower-img" data-type="premium"><div class="flower-caption"><b>${astra} ${flowerWord(astra)}</b><br>Астра Роза</div></div>` : `<div class='flower-item flower-placeholder'><div class='flower-placeholder-box'>Ещё не открытый<br>цветок</div></div>`}
            </div>
        `;
        // Клик по картинке — показать попап награды
        flowersBlock.querySelectorAll('.flower-img').forEach(img => {
            img.addEventListener('click', () => {
                const type = img.dataset.type;
                this.showRewardModal(type);
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
            this.settingsModal.style.display = 'none';
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
                        this.settingsModal.style.display = 'none';
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
                // --- Больше не открываем старую модалку ---
                return;
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
                        // Показываем баннер удаления
                        const deleteSuccessBanner = document.getElementById('deleteSuccessBanner');
                        if (deleteSuccessBanner) {
                            deleteSuccessBanner.style.display = 'block';
                            deleteSuccessBanner.style.opacity = '1';
                            setTimeout(() => {
                                deleteSuccessBanner.style.opacity = '0';
                                setTimeout(() => {
                                    deleteSuccessBanner.style.display = 'none';
                                }, 300);
                            }, 5000);
                        }
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

    showRewardModal(type = 'regular') {
        this.rewardModal = document.getElementById('rewardModal');
        const modalContent = this.rewardModal.querySelector('.reward-modal-content');
        // Удаляем старое видео, если есть
        const oldBg = modalContent.querySelector('.reward-bg-video');
        if (oldBg) oldBg.remove();
        // Выбираем видео и подпись по типу цветка
        let videoSrc = 'mp4/spherolia.mp4';
        let flowerTitle = 'Ромашка';
        let text = 'Ты справился без единого<br> вылета — это маленькое чудо,<br> которое ты создал сам.';
        if (type === 'unique') {
            videoSrc = 'mp4/luminary.mp4';
            flowerTitle = 'Пиона';
            text = '5 дней без единого<br>вылета — это победа гармонии.<br>Ты сильнее, чем думаешь! ';
        } else if (type === 'premium') {
            videoSrc = 'mp4/astra-lyria.mp4';
            flowerTitle = 'Астра Роза';
            text = '10 дней, большая<br> победа — большой шаг вперёд!<br> Горжусь тобой!';
        }
        // Добавляем видео на фон
        const bgVideo = document.createElement('video');
        bgVideo.src = videoSrc;
        bgVideo.className = 'reward-bg-video';
        bgVideo.autoplay = true;
        bgVideo.loop = false;
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.style.position = 'absolute';
        bgVideo.style.top = 0;
        bgVideo.style.left = 0;
        bgVideo.style.width = '100%';
        bgVideo.style.height = '100%';
        bgVideo.style.objectFit = 'cover';
        bgVideo.style.zIndex = 0;
        bgVideo.style.borderRadius = '20px';
        modalContent.style.position = 'relative';
        modalContent.insertBefore(bgVideo, modalContent.firstChild);
        // Подпись и текст поверх видео
        let textDiv = modalContent.querySelector('.reward-text');
        if (!textDiv) {
            textDiv = document.createElement('div');
            textDiv.className = 'reward-text';
            modalContent.insertBefore(textDiv, modalContent.querySelector('#closeRewardBtn'));
        }
        let titleDiv = modalContent.querySelector('.reward-flower-title');
        if (!titleDiv) {
            titleDiv = document.createElement('div');
            titleDiv.className = 'reward-flower-title';
            modalContent.insertBefore(titleDiv, textDiv);
        }
        titleDiv.textContent = flowerTitle;
        textDiv.innerHTML = text;
        this.rewardModal.style.display = 'flex';
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

    initializeEditEntryModal() {
        const editEntryModal = document.getElementById('editEntryModal');
        const editEntryForm = document.getElementById('editEntryForm');
        const editDeleteBtn = document.getElementById('editDeleteBtn');
        const editSaveBtn = document.getElementById('editSaveBtn');
        const confirmDeleteEntryModal = document.getElementById('confirmDeleteEntryModal');
        const cancelDeleteEntryBtn = document.getElementById('cancelDeleteEntryBtn');
        const confirmDeleteEntryBtn = document.getElementById('confirmDeleteEntryBtn');
        // --- Новое: элементы для управления ---
        const editInsulinSelect = document.getElementById('editInsulin');
        const editInsulinUnits = document.getElementById('editInsulinUnits');
        const editUnitsValue = document.getElementById('editUnitsValue');
        const editDecreaseUnits = document.getElementById('editDecreaseUnits');
        const editIncreaseUnits = document.getElementById('editIncreaseUnits');
        const editFoodInput = document.getElementById('editFood');
        const editBreadUnits = document.getElementById('editBreadUnits');
        const editBreadUnitsValue = document.getElementById('editBreadUnitsValue');
        const editDecreaseBreadUnits = document.getElementById('editDecreaseBreadUnits');
        const editIncreaseBreadUnits = document.getElementById('editIncreaseBreadUnits');
        // ---
        let editingEntry = null;

        // --- Логика отображения единиц инсулина ---
        function updateEditInsulinUnitsVisibility() {
            const selectedValue = editInsulinSelect.value;
            editInsulinUnits.style.display = selectedValue && selectedValue !== 'Нет' && selectedValue !== '' ? 'flex' : 'none';
        }
        editInsulinSelect.addEventListener('change', updateEditInsulinUnitsVisibility);

        // --- Логика изменения количества единиц инсулина ---
        editDecreaseUnits.addEventListener('click', () => {
            const currentValue = parseInt(editUnitsValue.textContent);
            if (currentValue > 0) {
                editUnitsValue.textContent = currentValue - 1;
            }
        });
        editIncreaseUnits.addEventListener('click', () => {
            const currentValue = parseInt(editUnitsValue.textContent);
            editUnitsValue.textContent = currentValue + 1;
        });

        // --- Логика хлебных единиц ---
        function updateEditBreadUnitsVisibility() {
            const hasFood = editFoodInput.value.trim() !== '';
            editBreadUnits.style.display = hasFood ? 'flex' : 'none';
            if (!hasFood) {
                editBreadUnitsValue.textContent = '1.0';
            }
        }
        editFoodInput.addEventListener('input', updateEditBreadUnitsVisibility);
        editDecreaseBreadUnits.addEventListener('click', () => {
            const currentValue = parseFloat(editBreadUnitsValue.textContent);
            if (currentValue > 0) {
                editBreadUnitsValue.textContent = (currentValue - 0.5).toFixed(1);
            }
        });
        editIncreaseBreadUnits.addEventListener('click', () => {
            const currentValue = parseFloat(editBreadUnitsValue.textContent);
            editBreadUnitsValue.textContent = (currentValue + 0.5).toFixed(1);
        });

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
                    const dayGroup = entries.find(group => group.date === originalDate);
                    const entryIndex = dayGroup.entries.findIndex(entry => entry.time === time);
                    if (entryIndex !== -1) {
                        const entry = dayGroup.entries[entryIndex];
                        document.getElementById('editDate').value = entry.date;
                        document.getElementById('editTime').value = entry.time;
                        document.getElementById('editSugar').value = entry.sugar || '';
                        // --- инсулин ---
                        if (entry.insulin && typeof entry.insulin === 'object') {
                            editInsulinSelect.value = entry.insulin.type;
                            editUnitsValue.textContent = entry.insulin.units;
                        } else {
                            editInsulinSelect.value = '';
                            editUnitsValue.textContent = '5';
                        }
                        updateEditInsulinUnitsVisibility();
                        // --- еда ---
                        editFoodInput.value = entry.comment || '';
                        editBreadUnitsValue.textContent = entry.breadUnits !== undefined ? entry.breadUnits : '1.0';
                        updateEditBreadUnitsVisibility();
                        editingEntry = { date: originalDate, entryIndex };
                        editEntryModal.style.display = 'flex';
                    }
                }
            }
        });

        // Сохранить изменения (заменить запись)
        editEntryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!editingEntry) return;
            const entries = loadEntries();
            const dayGroup = entries.find(group => group.date === editingEntry.date);
            if (dayGroup && dayGroup.entries[editingEntry.entryIndex]) {
                // Обновляем запись
                const insulinType = editInsulinSelect.value;
                let insulinObj = undefined;
                if (insulinType && insulinType !== 'Нет') {
                    insulinObj = {
                        type: insulinType,
                        units: parseInt(editUnitsValue.textContent)
                    };
                }
                const updatedEntry = {
                    date: document.getElementById('editDate').value,
                    time: document.getElementById('editTime').value,
                    sugar: parseFloat(document.getElementById('editSugar').value),
                    comment: editFoodInput.value,
                    breadUnits: parseFloat(editBreadUnitsValue.textContent)
                };
                if (insulinObj) {
                    updatedEntry.insulin = insulinObj;
                }
                const newDate = updatedEntry.date;
                const oldDate = editingEntry.date;
                // Если дата не изменилась — просто обновляем
                if (newDate === oldDate) {
                    dayGroup.entries[editingEntry.entryIndex] = updatedEntry;
                } else {
                    // Удаляем из старой группы
                    dayGroup.entries.splice(editingEntry.entryIndex, 1);
                    if (dayGroup.entries.length === 0) {
                        const dayIndex = entries.findIndex(group => group.date === oldDate);
                        entries.splice(dayIndex, 1);
                    }
                    // Добавляем в новую группу
                    let newDayGroup = entries.find(group => group.date === newDate);
                    if (!newDayGroup) {
                        newDayGroup = { date: newDate, entries: [] };
                        entries.push(newDayGroup);
                    }
                    newDayGroup.entries.push(updatedEntry);
                }
                saveEntries(entries);
                this.loadAndDisplayEntries();
                editEntryModal.style.display = 'none';
                // Показываем баннер
                const editSuccessBanner = document.getElementById('editSuccessBanner');
                if (editSuccessBanner) {
                    editSuccessBanner.style.display = 'block';
                    editSuccessBanner.style.opacity = '1';
                    setTimeout(() => {
                        editSuccessBanner.style.opacity = '0';
                        setTimeout(() => {
                            editSuccessBanner.style.display = 'none';
                        }, 300);
                    }, 3000);
                }
            }
        });

        // Кнопка удаления — открываем подтверждение
        editDeleteBtn.addEventListener('click', () => {
            editEntryModal.style.display = 'none';
            confirmDeleteEntryModal.style.display = 'flex';
        });
        // Отмена удаления
        cancelDeleteEntryBtn.addEventListener('click', () => {
            confirmDeleteEntryModal.style.display = 'none';
            editEntryModal.style.display = 'flex';
        });
        // Подтвердить удаление
        confirmDeleteEntryBtn.addEventListener('click', () => {
            if (!editingEntry) return;
            const entries = loadEntries();
            const dayGroup = entries.find(group => group.date === editingEntry.date);
            if (dayGroup) {
                dayGroup.entries.splice(editingEntry.entryIndex, 1);
                if (dayGroup.entries.length === 0) {
                    const dayIndex = entries.findIndex(group => group.date === editingEntry.date);
                    entries.splice(dayIndex, 1);
                }
                saveEntries(entries);
                this.loadAndDisplayEntries();
                confirmDeleteEntryModal.style.display = 'none';
                // Показываем баннер удаления
                const deleteSuccessBanner = document.getElementById('deleteSuccessBanner');
                if (deleteSuccessBanner) {
                    deleteSuccessBanner.style.display = 'block';
                    deleteSuccessBanner.style.opacity = '1';
                    setTimeout(() => {
                        deleteSuccessBanner.style.opacity = '0';
                        setTimeout(() => {
                            deleteSuccessBanner.style.display = 'none';
                        }, 300);
                    }, 3000);
                }
            }
        });
        // Закрытие модалки по клику вне области
        editEntryModal.addEventListener('click', (e) => {
            if (e.target === editEntryModal) {
                editEntryModal.style.display = 'none';
            }
        });
        confirmDeleteEntryModal.addEventListener('click', (e) => {
            if (e.target === confirmDeleteEntryModal) {
                confirmDeleteEntryModal.style.display = 'none';
            }
        });
        // Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (editEntryModal.style.display === 'flex') editEntryModal.style.display = 'none';
                if (confirmDeleteEntryModal.style.display === 'flex') confirmDeleteEntryModal.style.display = 'none';
            }
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new GSDTracker();
});

// Удаляем старую функцию deleteEntry, так как теперь используем модальное окно 