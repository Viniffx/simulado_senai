function parseDateToSql(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);

    if (!match) {
        return null;
    }

    const [, day, month, year] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

    if (
        Number(year) < 1000 ||
        date.getUTCFullYear() !== Number(year) ||
        date.getUTCMonth() !== Number(month) - 1 ||
        date.getUTCDate() !== Number(day)
    ) {
        return null;
    }

    return `${year}-${month}-${day}`;
}

module.exports = { parseDateToSql };
