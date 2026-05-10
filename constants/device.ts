/** Reserved device key for admin "quick add activity" when GeneratedHashKey is left empty (Web). */
export const WEB_ADMIN_QUICK_ADD_DEVICE_HASH_KEY = 'waken-web-admin'

/** Inclusive length bounds for custom `generatedHashKey` on devices / activity POST. */
export const GENERATED_HASH_KEY_MIN_LENGTH = 8
export const GENERATED_HASH_KEY_MAX_LENGTH = 128

/** Server page size; smaller pages keep the admin panel from growing too tall. */
export const DEVICE_LIST_PAGE_SIZE = 10

/** Max scroll height for the device list block inside the card. */
export const DEVICE_LIST_MAX_HEIGHT = 'min(70vh,48rem)'
