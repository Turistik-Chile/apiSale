-- Actualizar el valor por defecto de Status en la tabla Sales
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__Sales__Status__61316BF4')
BEGIN
    ALTER TABLE Sales DROP CONSTRAINT DF__Sales__Status__61316BF4;
END

ALTER TABLE Sales ADD CONSTRAINT DF__Sales__Status__61316BF4 DEFAULT 'PROCESSING' FOR Status;
GO

-- Actualizar los registros existentes que tengan estado PENDING a PROCESSING
UPDATE Sales SET Status = 'PROCESSING' WHERE Status = 'PENDING';
GO 