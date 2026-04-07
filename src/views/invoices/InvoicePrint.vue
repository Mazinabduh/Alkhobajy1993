<template>
  <div class="print-view" dir="rtl">

    <!-- شريط التحكم (لا يظهر عند الطباعة) -->
    <div class="print-controls no-print">
      <button class="back-btn" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        رجوع
      </button>
      <div class="control-actions">
        <button class="ctrl-btn" @click="exportTxt">📄 TXT</button>
        <button class="ctrl-btn" @click="exportPdf">📑 PDF</button>
        <button class="ctrl-btn share" @click="shareSMS">💬 إرسال SMS</button>
        <button class="ctrl-btn primary" @click="doPrint">🖨️ طباعة</button>
      </div>
    </div>

    <!-- الفاتورة (تُطبع) -->
    <div class="invoice-print-wrapper" v-if="invoice">
      <div class="invoice-document" id="invoice-doc">

        <!-- رأس الفاتورة -->
        <div class="doc-header">
          <img v-if="settings.stationLogo" :src="settings.stationLogo" class="doc-logo" alt="شعار" />
          <div class="doc-logo-placeholder" v-else>⚡</div>

          <div class="doc-title-block">
            <h1 class="doc-title">{{ settings.stationName }}</h1>
            <p class="doc-subtitle">نظام إدارة المشتركين</p>
            <p v-if="settings.stationPhone" class="doc-phone">📞 {{ settings.stationPhone }}</p>
          </div>

          <div class="doc-invoice-info">
            <div class="info-row">
              <span>رقم الفاتورة:</span>
              <strong>{{ invoice.invoice_number }}</strong>
            </div>
            <div class="info-row">
              <span>التاريخ:</span>
              <strong>{{ formatDate(invoice.created_at) }}</strong>
            </div>
            <div class="info-row">
              <span>الفترة:</span>
              <strong>{{ invoice.period_month }}</strong>
            </div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <!-- بيانات المشترك -->
        <div class="doc-section">
          <h2 class="doc-section-title">بيانات المشترك</h2>
          <div class="subscriber-info-grid">
            <div class="sub-info-item">
              <span class="si-label">الاسم</span>
              <span class="si-value">{{ invoice.subscriber?.name }}</span>
            </div>
            <div class="sub-info-item">
              <span class="si-label">رقم الهاتف</span>
              <span class="si-value">{{ invoice.subscriber?.phone || '—' }}</span>
            </div>
            <div class="sub-info-item">
              <span class="si-label">رقم العداد</span>
              <span class="si-value mono">{{ invoice.subscriber?.meter_number }}</span>
            </div>
            <div class="sub-info-item" v-if="invoice.subscriber?.address">
              <span class="si-label">العنوان</span>
              <span class="si-value">{{ invoice.subscriber.address }}</span>
            </div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <!-- تفاصيل الاستهلاك -->
        <div class="doc-section">
          <h2 class="doc-section-title">تفاصيل الاستهلاك</h2>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>البيان</th>
                <th>القراءة السابقة</th>
                <th>القراءة الجديدة</th>
                <th>الاستهلاك</th>
                <th>سعر الوحدة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>استهلاك الكهرباء</td>
                <td class="num">{{ invoice.reading?.previous_reading ?? 0 }}</td>
                <td class="num">{{ invoice.reading?.current_reading ?? 0 }}</td>
                <td class="num">{{ invoice.consumption }} كيلوواط</td>
                <td class="num">{{ settings.unitPrice }} {{ settings.currency }}</td>
                <td class="num bold">{{ formatMoney(invoice.consumption_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ملخص مالي -->
        <div class="doc-section">
          <div class="financial-summary">

            <div class="summary-row" v-if="invoice.previous_balance > 0">
              <span>متأخرات سابقة</span>
              <span class="text-danger">{{ formatMoney(invoice.previous_balance) }}</span>
            </div>

            <div class="summary-row">
              <span>استهلاك {{ invoice.period_month }}</span>
              <span>{{ formatMoney(invoice.consumption_amount) }}</span>
            </div>

            <div class="summary-row" v-if="invoice.tax > 0">
              <span>الضريبة ({{ settings.taxRate }}%)</span>
              <span>{{ formatMoney(invoice.tax) }}</span>
            </div>

            <div class="summary-row" v-if="invoice.discount > 0">
              <span>الخصم</span>
              <span class="text-success">- {{ formatMoney(invoice.discount) }}</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row total">
              <span>الإجمالي المستحق</span>
              <strong>{{ formatMoney(invoice.total_amount) }}</strong>
            </div>

            <div class="summary-row paid" v-if="invoice.paid_amount > 0">
              <span>المبلغ المدفوع</span>
              <span class="text-success">{{ formatMoney(invoice.paid_amount) }}</span>
            </div>

            <div class="summary-row remaining" v-if="invoice.remaining_amount > 0">
              <span>المبلغ المتبقي</span>
              <strong class="text-danger">{{ formatMoney(invoice.remaining_amount) }}</strong>
            </div>

            <!-- الحالة -->
            <div class="status-stamp" :class="invoice.status">
              {{ statusStampLabel(invoice.status) }}
            </div>

          </div>
        </div>

        <!-- المدفوعات -->
        <div v-if="invoice.payments?.length > 0" class="doc-section">
          <h2 class="doc-section-title">سجل المدفوعات</h2>
          <table class="invoice-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الطريقة</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pay in invoice.payments" :key="pay.id">
                <td>{{ formatDate(pay.payment_date) }}</td>
                <td class="num bold text-success">{{ formatMoney(pay.amount) }}</td>
                <td>{{ methodLabel(pay.payment_method) }}</td>
                <td>{{ pay.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- تذييل الفاتورة -->
        <div class="doc-footer">
          <div class="doc-divider"></div>
          <p class="footer-message">{{ settings.footerMessage }}</p>
          <p class="footer-station">{{ settings.stationName }}</p>
          <p v-if="settings.stationPhone" class="footer-phone">📞 {{ settings.stationPhone }}</p>
          <p class="footer-date">تاريخ الطباعة: {{ formatDate(new Date().toISOString()) }}</p>
        </div>

      </div>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted }    from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInvoicesStore }  from '@/stores/invoices.js'
import { useSettingsStore }  from '@/stores/settings.js'
import { usePrintService }   from '@/services/PrintService.js'
import { useExportService }  from '@/services/ExportService.js'

const router   = useRouter()
const route    = useRoute()
const invoiceStore = useInvoicesStore()
const settings = useSettingsStore()

const invoice = ref(null)
const { printElement } = usePrintService()
const { exportTxtInvoice, exportPdfInvoice } = useExportService()

onMounted(async () => {
  await settings.loadSettings()
  invoice.value = await invoiceStore.getById(route.params.id)

  // طباعة تلقائية إذا جاء من معامل print
  if (route.query.auto === '1') {
    setTimeout(doPrint, 800)
  }
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function methodLabel(m) {
  return { cash: 'نقدي', transfer: 'تحويل', other: 'أخرى' }[m] ?? m
}

function statusStampLabel(s) {
  return { unpaid: 'غير مدفوع', partial: 'مدفوع جزئياً', paid: 'مدفوع بالكامل', cancelled: 'ملغية' }[s] ?? s
}

function doPrint() {
  window.print()
}

function exportTxt() {
  exportTxtInvoice(invoice.value, settings)
}

function exportPdf() {
  exportPdfInvoice(invoice.value, settings)
}

function shareSMS() {
  if (!invoice.value?.subscriber?.phone) return
  const msg = buildSMSMessage()
  window.location.href = `sms:${invoice.value.subscriber.phone}?body=${encodeURIComponent(msg)}`
}

function buildSMSMessage() {
  const inv = invoice.value
  return [
    `${settings.stationName}`,
    `فاتورة رقم: ${inv.invoice_number}`,
    `الفترة: ${inv.period_month}`,
    `الاستهلاك: ${inv.consumption} كيلوواط`,
    `المبلغ الإجمالي: ${formatMoney(inv.total_amount)}`,
    inv.remaining_amount > 0 ? `المتبقي: ${formatMoney(inv.remaining_amount)}` : 'تم السداد بالكامل ✅',
    settings.stationPhone ? `للاستفسار: ${settings.stationPhone}` : '',
  ].filter(Boolean).join('\n')
}
</script>

<style scoped>
.print-view {
  min-height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

/* ─── شريط التحكم ────────────────────────────── */
.print-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.875rem;
  cursor: pointer;
}

.control-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ctrl-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: rgba(255,255,255,0.04);
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.ctrl-btn:hover { border-color: var(--primary); color: var(--primary); }
.ctrl-btn.primary { background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: white; border-color: transparent; }
.ctrl-btn.share   { background: rgba(16,185,129,0.1); color: #34D399; border-color: rgba(16,185,129,0.3); }

/* ─── مجمع الفاتورة ──────────────────────────── */
.invoice-print-wrapper {
  flex: 1;
  padding: 16px;
  display: flex;
  justify-content: center;
}

/* ─── وثيقة الفاتورة ─────────────────────────── */
.invoice-document {
  background: white;
  color: #1a1a1a;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  font-family: 'Cairo', sans-serif;
  direction: rtl;
}

/* رأس الوثيقة */
.doc-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.doc-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 8px;
  flex-shrink: 0;
}

.doc-logo-placeholder {
  width: 64px; height: 64px;
  background: #1E40AF;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.doc-title-block { flex: 1; }

.doc-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1E40AF;
  margin: 0 0 2px;
}

.doc-subtitle {
  font-size: 0.8rem;
  color: #64748B;
  margin: 0 0 2px;
}

.doc-phone {
  font-size: 0.82rem;
  color: #475569;
  margin: 0;
}

.doc-invoice-info {
  text-align: left;
  direction: ltr;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.82rem;
  color: #64748B;
}

.info-row strong { color: #1a1a1a; }

/* الفاصل */
.doc-divider {
  height: 2px;
  background: linear-gradient(90deg, #1E40AF, #F59E0B);
  border-radius: 99px;
  margin: 16px 0;
}

/* أقسام الوثيقة */
.doc-section { margin-bottom: 20px; }

.doc-section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1E40AF;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E2E8F0;
}

/* شبكة بيانات المشترك */
.subscriber-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.sub-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-label { font-size: 0.72rem; color: #64748B; }
.si-value { font-size: 0.875rem; font-weight: 600; color: #1a1a1a; }
.si-value.mono { font-family: monospace; letter-spacing: 1px; }

/* جدول الفاتورة */
.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.invoice-table th {
  background: #F1F5F9;
  padding: 8px 10px;
  text-align: right;
  font-weight: 700;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.invoice-table td {
  padding: 8px 10px;
  border: 1px solid #E2E8F0;
  color: #334155;
}

.invoice-table .num  { text-align: center; font-family: monospace; }
.invoice-table .bold { font-weight: 700; }
.invoice-table .text-success { color: #059669; }

/* الملخص المالي */
.financial-summary {
  max-width: 300px;
  margin-right: auto;
  background: #F8FAFC;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid #E2E8F0;
  position: relative;
  overflow: hidden;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 0.85rem;
  color: #475569;
  border-bottom: 1px solid #F1F5F9;
}
.summary-row:last-of-type { border-bottom: none; }

.summary-row strong { font-weight: 700; color: #1a1a1a; }
.summary-row.total  { font-size: 0.95rem; font-weight: 700; color: #1a1a1a; }
.text-danger  { color: #DC2626 !important; }
.text-success { color: #059669 !important; }

.summary-divider {
  height: 1px;
  background: #CBD5E1;
  margin: 6px 0;
}

/* ختم الحالة */
.status-stamp {
  margin-top: 10px;
  padding: 6px 14px;
  border-radius: 8px;
  text-align: center;
  font-weight: 800;
  font-size: 0.9rem;
  border: 2px solid;
}

.status-stamp.paid      { color: #059669; border-color: #059669; background: rgba(5,150,105,0.05); }
.status-stamp.unpaid    { color: #DC2626; border-color: #DC2626; background: rgba(220,38,38,0.05); }
.status-stamp.partial   { color: #D97706; border-color: #D97706; background: rgba(217,119,6,0.05); }
.status-stamp.cancelled { color: #64748B; border-color: #64748B; background: rgba(100,116,139,0.05); }

/* تذييل الوثيقة */
.doc-footer {
  text-align: center;
  margin-top: 20px;
}

.footer-message  { font-size: 0.875rem; color: #1E40AF; font-weight: 600; margin: 8px 0 4px; }
.footer-station  { font-size: 0.8rem;   color: #475569; margin: 2px 0; }
.footer-phone    { font-size: 0.78rem;  color: #64748B; margin: 2px 0; }
.footer-date     { font-size: 0.7rem;   color: #94A3B8; margin-top: 6px; }

/* ─── التحميل ────────────────────────────────── */
.loading-state {
  display: flex; align-items: center; justify-content: center;
  flex: 1; gap: 12px; color: var(--text-muted);
}

.spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── أنماط الطباعة الفعلية ──────────────────── */
@media print {
  .no-print { display: none !important; }

  .print-view { background: white !important; }

  .invoice-print-wrapper {
    padding: 0 !important;
  }

  .invoice-document {
    box-shadow: none !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    padding: 20px !important;
  }

  @page {
    size: A4;
    margin: 15mm;
  }
}
</style>