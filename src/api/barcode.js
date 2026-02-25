import request from '@/utils/request'

/** Scan a barcode / QR code — look up product by code */
export function scanBarcode(code) {
    return request({ url: '/barcode/scan', method: 'get', params: { code } })
}

/** Get barcode data for a single product */
export function getBarcodeForProduct(productId) {
    return request({ url: `/barcode/product/${productId}`, method: 'get' })
}

/** Get barcode data for multiple products */
export function getBarcodeForProducts(ids) {
    return request({ url: '/barcode/batch', method: 'post', data: { ids } })
}
