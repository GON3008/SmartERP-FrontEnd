import request from '@/utils/request'

/** Check OCR/Gemini model availability */
export function getOcrStatus() {
    return request({ url: '/ocr/status', method: 'get' })
}

/** Upload invoice image for OCR analysis */
export function scanInvoiceImage(formData) {
    return request({
        url: '/ocr/scan-image',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
    })
}

/** Paste invoice text for AI extraction */
export function scanInvoiceText(text) {
    return request({ url: '/ocr/scan-text', method: 'post', data: { text }, timeout: 180000 })
}

/** Confirm OCR result → create StockIn records */
export function createStockInFromOcr(payload) {
    return request({ url: '/ocr/create-stock-in', method: 'post', data: payload })
}
