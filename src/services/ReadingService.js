export function useReadingService() {

  async function fetchReadings(params = {}) {
    console.warn('[ReadingService] fetchReadings stub', params)
    return []
  }

  async function fetchReadingById(id) {
    console.warn('[ReadingService] fetchReadingById stub', id)
    return null
  }

  async function getLastReading(subscriberId) {
    console.warn('[ReadingService] getLastReading stub', subscriberId)
    return null
  }

  async function createReading(data) {
    console.warn('[ReadingService] createReading stub', data)
    return null
  }

  async function updateReading(id, data) {
    console.warn('[ReadingService] updateReading stub', id, data)
    return null
  }

  async function deleteReading(id) {
    console.warn('[ReadingService] deleteReading stub', id)
    return null
  }

  return {
    fetchReadings,
    fetchReadingById,
    getLastReading,
    createReading,
    updateReading,
    deleteReading,
  }
}
