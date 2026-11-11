-- AlterTable
ALTER TABLE `Restaurant` ADD COLUMN `ownerId` INTEGER NULL;

-- Restaurantes que já existiam passam a pertencer ao primeiro usuário cadastrado
UPDATE `Restaurant` SET `ownerId` = (SELECT MIN(`id`) FROM `User`) WHERE `ownerId` IS NULL;

-- AddForeignKey
ALTER TABLE `Restaurant` ADD CONSTRAINT `Restaurant_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
