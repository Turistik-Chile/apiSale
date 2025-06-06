-- Verificar si hay datos en la tabla
IF EXISTS (SELECT 1 FROM Sales WHERE Time IS NOT NULL)
BEGIN
    -- Crear una tabla temporal
    CREATE TABLE #TempSales (
        Id INT,
        Time VARCHAR(8)
    );

    -- Respaldar los datos existentes
    INSERT INTO #TempSales (Id, Time)
    SELECT Id, Time FROM Sales;

    -- Modificar la columna
    ALTER TABLE Sales ALTER COLUMN Time VARCHAR(8) NOT NULL;

    -- Restaurar los datos
    UPDATE s
    SET s.Time = t.Time
    FROM Sales s
    INNER JOIN #TempSales t ON s.Id = t.Id;

    -- Eliminar la tabla temporal
    DROP TABLE #TempSales;
END
ELSE
BEGIN
    -- Si no hay datos, simplemente modificar la columna
    ALTER TABLE Sales ALTER COLUMN Time VARCHAR(8) NOT NULL;
END
