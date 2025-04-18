function validateSugar(value) {
    const sugar = parseFloat(value);
    return !isNaN(sugar) && sugar >= 0 && sugar <= 40;
}

function validateInsulin(value) {
    const insulin = parseFloat(value);
    return !isNaN(insulin) && insulin >= 0 && insulin <= 100;
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
        validateSugar(entry.sugar) &&
        validateInsulin(entry.insulin) &&
        validateBreadUnits(entry.breadUnits) &&
        validateComment(entry.comment)
    );
} 