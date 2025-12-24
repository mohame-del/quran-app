export const monthsMaghreb = ['جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

export function formatAppDate(input, { includeTime = true } = {}) {
  try {
    let date
    if (typeof input === 'string') {
      date = new Date(input)
    } else if (input instanceof Date) {
      date = input
    } else if (input && typeof input === 'object') {
      if (typeof input.toDate === 'function') {
        date = input.toDate()
      } else if (typeof input.seconds === 'number') {
        date = new Date(input.seconds * 1000)
      }
    }
    if (!date || isNaN(date.getTime())) return 'غير محدد'

    const day = String(date.getDate()).padStart(2, '0')
    const monthName = monthsMaghreb[date.getMonth()]
    const year = date.getFullYear()

    if (!includeTime) {
      return `${day} ${monthName} ${year}`
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day} ${monthName} ${year} - ${hours}:${minutes}`
  } catch {
    return 'غير محدد'
  }
}

