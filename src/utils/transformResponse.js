/**
 * Transforma una venta para la respuesta de la API
 * @param {Object} sale - Venta original de la base de datos
 * @returns {Object} Venta transformada para la respuesta
 */
export const transformSaleResponse = (sale) => {
  return {
    id: sale.secureId,
    ProviderName: sale.ProviderName,
    Status: sale.Status,
    QtyPax: sale.QtyPax
  };
}; 