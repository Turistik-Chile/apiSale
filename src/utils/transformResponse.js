/**
 * Transforma una venta para la respuesta de la API
 * @param {Object} sale - Venta original de la base de datos
 * @returns {Object} Venta transformada para la respuesta
 */
export const transformSaleResponse = (sale) => {
  const { Id, secureId, ...saleData } = sale;
  return {
    id: secureId,
    ...saleData,
    CartItems: sale.CartItems?.map(item => {
      const { Id, SaleId, ...itemData } = item;
      return itemData;
    })
  };
}; 