export function useSubscriberService() {

  async function fetchSubscribers(params = {}) {
    console.warn('[SubscriberService] fetchSubscribers stub', params)
    return []
  }

  async function fetchSubscriberById(id) {
    console.warn('[SubscriberService] fetchSubscriberById stub', id)
    return null
  }

  async function createSubscriber(data) {
    console.warn('[SubscriberService] createSubscriber stub', data)
    return null
  }

  async function updateSubscriber(id, data) {
    console.warn('[SubscriberService] updateSubscriber stub', id, data)
    return null
  }

  async function deleteSubscriber(id) {
    console.warn('[SubscriberService] deleteSubscriber stub', id)
    return null
  }

  async function setStatus(id, status) {
    console.warn('[SubscriberService] setStatus stub', id, status)
    return null
  }

  async function updateBalance(id, amount) {
    console.warn('[SubscriberService] updateBalance stub', id, amount)
    return null
  }

  async function getStatement(subscriberId) {
    console.warn('[SubscriberService] getStatement stub', subscriberId)
    return []
  }

  return {
    fetchSubscribers,
    fetchSubscriberById,
    createSubscriber,
    updateSubscriber,
    deleteSubscriber,
    setStatus,
    updateBalance,
    getStatement,
  }
}
