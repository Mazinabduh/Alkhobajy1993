export function useMessageService() {

  async function sendMessage(phone, message) {
    console.warn('[MessageService] sendMessage stub', phone, message)
    return { success: false, error: 'Service not implemented' }
  }

  async function sendBulkMessages(phones, message) {
    console.warn('[MessageService] sendBulkMessages stub', phones, message)
    return { sent: 0, failed: 0, errors: [] }
  }

  async function sendWhatsApp(phone, message) {
    console.warn('[MessageService] sendWhatsApp stub', phone, message)
    return { success: false, error: 'Service not implemented' }
  }

  async function fetchTemplates() {
    console.warn('[MessageService] fetchTemplates stub')
    return []
  }

  async function createTemplate(data) {
    console.warn('[MessageService] createTemplate stub', data)
    return null
  }

  return {
    sendMessage,
    sendBulkMessages,
    sendWhatsApp,
    fetchTemplates,
    createTemplate,
  }
}
