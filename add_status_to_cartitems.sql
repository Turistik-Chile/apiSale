-- Agregar columna Status a la tabla CartItems
ALTER TABLE [dbo].[CartItems]
ADD [Status] [nvarchar](20) NOT NULL DEFAULT 'ACTIVE';

-- Actualizar el schema de Prisma
-- Ejecutar después: npx prisma db pull && npx prisma generate 