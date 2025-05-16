-- Verificar si ya existe algún duplicado
IF EXISTS (
    SELECT IdSaleProvider, COUNT(*)
    FROM Sales
    WHERE IdSaleProvider IS NOT NULL
    GROUP BY IdSaleProvider
    HAVING COUNT(*) > 1
)
BEGIN
    RAISERROR ('Existen IDs de venta duplicados. Por favor, revise y corrija los datos antes de agregar la restricción única.', 16, 1);
    RETURN;
END

-- Eliminar el índice existente si existe
IF EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE name = 'IX_Sales_IdSaleProvider'
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    DROP INDEX IX_Sales_IdSaleProvider ON Sales;
END

-- Crear la restricción única
IF NOT EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE name = 'UQ_Sales_IdSaleProvider'
    AND object_id = OBJECT_ID('Sales')
)
BEGIN
    ALTER TABLE Sales
    ADD CONSTRAINT UQ_Sales_IdSaleProvider UNIQUE (IdSaleProvider);
END 