class Entry {
    constructor(entryData) {
        this.date = entryData.date;
        this.time = entryData.time;
        this.sugar = entryData.sugar;
        this.insulin = entryData.insulin;
        this.breadUnits = entryData.breadUnits;
        this.comment = entryData.comment;
    }

    createElement() {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';

        const entryHeader = document.createElement('div');
        entryHeader.className = 'entry-header';

        const timeElement = document.createElement('span');
        timeElement.className = 'entry-time';
        timeElement.textContent = this.time;

        const sugarBadge = document.createElement('span');
        sugarBadge.className = `sugar-badge ${this.sugar > 7 ? 'high' : 'normal'}`;
        sugarBadge.textContent = `${this.sugar} ммоль/л`;

        const insulinBadge = document.createElement('span');
        insulinBadge.className = 'insulin-badge';
        insulinBadge.textContent = `${this.insulin} ед.`;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<img src="icons/delete.svg" alt="Delete">';

        entryHeader.appendChild(timeElement);
        entryHeader.appendChild(sugarBadge);
        entryHeader.appendChild(insulinBadge);
        entryHeader.appendChild(deleteButton);

        const foodElement = document.createElement('div');
        foodElement.className = 'entry-food';

        const breadUnitsText = document.createElement('span');
        breadUnitsText.textContent = `${this.breadUnits} ХЕ`;

        const foodDivider = document.createElement('div');
        foodDivider.className = 'food-divider';

        const commentText = document.createElement('span');
        commentText.textContent = this.comment;

        foodElement.appendChild(breadUnitsText);
        foodElement.appendChild(foodDivider);
        foodElement.appendChild(commentText);

        entryElement.appendChild(entryHeader);
        entryElement.appendChild(foodElement);

        return entryElement;
    }
} 