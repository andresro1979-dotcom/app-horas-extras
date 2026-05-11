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

// Calcula la diferencia en horas entre dos strings "HH:MM". Soporta cruce de medianoche.
export function calcHoras(inicio, fin) {
  if (!inicio || !fin) return null
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  if (isNaN(h1) || isNaN(h2)) return null
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 60) * 100) / 100
}
