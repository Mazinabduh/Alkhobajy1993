export function useMeterService() {

  async function fetchMeters(params = {}) {
    console.warn('[MeterService] fetchMeters stub', params)
    return []
  }

  async function fetchMeterById(id) {
    console.warn('[MeterService] fetchMeterById stub', id)
    return null
  }

  async function createMeter(data) {
    console.warn('[MeterService] createMeter stub', data)
    return null
  }

  async function updateMeter(id, data) {
    console.warn('[MeterService] updateMeter stub', id, data)
    return null
  }

  async function deleteMeter(id) {
    console.warn('[MeterService] deleteMeter stub', id)
    return null
  }

  async function assignToSubscriber(meterId, subscriberId, installDate) {
    console.warn('[MeterService] assignToSubscriber stub', meterId, subscriberId, installDate)
    return null
  }

  async function unassign(meterId) {
    console.warn('[MeterService] unassign stub', meterId)
    return null
  }

  return {
    fetchMeters,
    fetchMeterById,
    createMeter,
    updateMeter,
    deleteMeter,
    assignToSubscriber,
    unassign,
  }
}
