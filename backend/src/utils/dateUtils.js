const subDays = (date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const format = (date) => date.toISOString().slice(0, 10);

module.exports = { subDays, startOfDay, format };
