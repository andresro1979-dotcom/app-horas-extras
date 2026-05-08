// Convierte horas decimales a formato HH:MM
// Ejemplos: 2.8 → "2:48", 0.5 → "0:30", 4.0 → "4:00"
export function formatHoras(decimal) {
  if (decimal === null || decimal === undefined || decimal === '') return '0:00'
  const num = parseFloat(String(decimal).replace(',', '.'))
  if (isNaN(num)) return '0:00'
  const h = Math.floor(num)
  const m = Math.round((num - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}
