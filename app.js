const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'weekend'];
const PUBLIC_ROWS = [
  ['office', 'In office'], ['out', 'Out of office'], ['court', 'In court'],
  ['jail', 'At jail'], ['travel', 'Travel time'], ['miles', 'Miles travel']
];
const STORAGE_KEY = 'attorney-timesheet-v1';

const publicBody = document.querySelector('#publicTable tbody');
PUBLIC_ROWS.forEach(([key, label]) => {
  const row = document.createElement('tr');
  row.dataset.row = key;
  row.innerHTML = `<th scope="row">${label}</th>${DAYS.map(day => `<td><input data-save name="pd_${key}_${day}" inputmode="decimal" aria-label="${label}, ${day}"></td>`).join('')}<td class="row-total">0.0</td>`;
  publicBody.appendChild(row);
});

const privateRow = document.querySelector('#privateTable tbody tr');
privateRow.innerHTML += DAYS.map(day => `<td><input data-save name="private_${day}" inputmode="decimal" aria-label="Private practice, ${day}"></td>`).join('') + '<td class="grand-total" id="privateTotal">0.0</td>';

const numberValue = input => {
  const value = Number.parseFloat(input?.value || '0');
  return Number.isFinite(value) && value >= 0 ? value : 0;
};
const format = value => value.toFixed(1);

function recalculate() {
  const dayTotals = Array(DAYS.length).fill(0);
  let hoursTotal = 0;
  PUBLIC_ROWS.forEach(([key]) => {
    const row = publicBody.querySelector(`[data-row="${key}"]`);
    let rowTotal = 0;
    DAYS.forEach((day, index) => {
      const amount = numberValue(row.querySelector(`[name="pd_${key}_${day}"]`));
      rowTotal += amount;
      if (key !== 'miles') dayTotals[index] += amount;
    });
    row.querySelector('.row-total').textContent = key === 'miles' ? rowTotal.toFixed(0) : format(rowTotal);
    if (key !== 'miles') hoursTotal += rowTotal;
  });
  dayTotals.forEach((total, index) => document.querySelector(`[data-day-total="${index}"]`).textContent = format(total));
  document.querySelector('#pdHours').textContent = format(hoursTotal);
  document.querySelector('#pdHoursBox').textContent = format(hoursTotal);
  document.querySelector('#pdMiles').textContent = publicBody.querySelector('[data-row="miles"] .row-total').textContent;

  const privateTotal = DAYS.reduce((sum, day) => sum + numberValue(document.querySelector(`[name="private_${day}"]`)), 0);
  document.querySelector('#privateTotal').textContent = format(privateTotal);
}

function save() {
  const values = {};
  document.querySelectorAll('[data-save]').forEach(input => values[input.name] = input.value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

function load() {
  try {
    const values = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    Object.entries(values).forEach(([name, value]) => {
      const input = document.querySelector(`[name="${CSS.escape(name)}"]`);
      if (input) input.value = value;
    });
  } catch (_) { localStorage.removeItem(STORAGE_KEY); }
}

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

document.addEventListener('input', event => {
  if (!event.target.matches('[data-save]')) return;
  recalculate(); save();
});
document.querySelector('#printButton').addEventListener('click', () => { save(); window.print(); });
document.querySelector('#clearButton').addEventListener('click', () => {
  if (!confirm('Clear all entries for this week?')) return;
  document.querySelectorAll('[data-save]').forEach(input => input.value = '');
  localStorage.removeItem(STORAGE_KEY);
  recalculate(); notify('Week cleared');
});

load(); recalculate();
