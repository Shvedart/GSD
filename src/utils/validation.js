function validateSugar(value) {
    // Если значение пустое или undefined - это ок
    if (value === '' || value === undefined || value === null) {
        return true;
    }
    // Если значение есть - проверяем его
    const sugar = parseFloat(value);
    return !isNaN(sugar) && sugar >= 0 && sugar <= 40;
}

function validateInsulin(value) {
    // Если инсулин не указан - это ок
    if (!value) {
        return true;
    }
    // Если указан - проверяем его структуру
    return (
        typeof value === 'object' &&
        typeof value.type === 'string' &&
        typeof value.units === 'number' &&
        value.units >= 0 &&
        value.units <= 100
    );
}

function validateBreadUnits(value) {
    const breadUnits = parseFloat(value);
    return !isNaN(breadUnits) && breadUnits >= 0 && breadUnits <= 50;
}

function validateComment(value) {
    return typeof value === 'string' && value.length <= 200;
}

function validateEntry(entry) {
    return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.date === 'string' &&
        typeof entry.time === 'string' &&
        validateInsulin(entry.insulin) &&
        validateBreadUnits(entry.breadUnits) &&
        validateComment(entry.comment) &&
        validateSugar(entry.sugar)
    );
} 