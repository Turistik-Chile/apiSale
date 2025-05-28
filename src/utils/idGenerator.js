/**
 * Genera un ID seguro basado en la fecha de la venta
 * Formato: TUR-YYYYMMDD-XXXX donde XXXX es una combinación de timestamp y número aleatorio
 * @param {Date} saleDate - Fecha de la venta
 * @returns {string} ID transformado
 */
export const generateSecureId = (saleDate) => {
    const year = saleDate.getFullYear();
    const month = String(saleDate.getMonth() + 1).padStart(2, '0');
    const day = String(saleDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Generar parte única usando timestamp y número aleatorio
    const timestamp = Date.now().toString(36);
    const random = Math.floor(Math.random() * 1000).toString(36).padStart(3, '0');
    const uniquePart = (timestamp + random).slice(-4).toUpperCase();
    
    return `TUR-${dateStr}-${uniquePart}`;
};

/**
 * Extrae el ID numérico original de un ID seguro
 * @param {string} secureId - ID seguro generado
 * @returns {number|null} ID numérico original o null si el formato es inválido
 */
export const extractNumericId = (secureId) => {
    try {
        const parts = secureId.split('-');
        if (parts.length !== 3) return null;
        
        const numericPart = parts[2];
        return parseInt(numericPart, 36);
    } catch (error) {
        return null;
    }
}; 