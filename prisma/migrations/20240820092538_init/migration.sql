-- CreateTable
CREATE TABLE `Customer` (
    `customer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `date_created` DATETIME(3) NOT NULL,
    `last_login` DATETIME(3) NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Drink` (
    `drink_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `total_buying` INTEGER NOT NULL,
    `recomended` BOOLEAN NULL,
    `name_picture` VARCHAR(191) NOT NULL,
    `condition_drink` BOOLEAN NOT NULL,

    PRIMARY KEY (`drink_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrinkCondition` (
    `condition_id` INTEGER NOT NULL AUTO_INCREMENT,
    `condition_type` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `drink_id` INTEGER NOT NULL,

    PRIMARY KEY (`condition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Food` (
    `food_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `total_buying` INTEGER NOT NULL,
    `recomended` BOOLEAN NOT NULL,
    `name_picture` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`food_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Like` (
    `like_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `drink_id` INTEGER NULL,
    `food_id` INTEGER NULL,

    PRIMARY KEY (`like_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rating` (
    `rating_id` INTEGER NOT NULL AUTO_INCREMENT,
    `rating_value` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date_created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer_id` INTEGER NOT NULL,
    `drink_id` INTEGER NULL,
    `food_id` INTEGER NULL,

    PRIMARY KEY (`rating_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DrinkCondition` ADD CONSTRAINT `DrinkCondition_drink_id_fkey` FOREIGN KEY (`drink_id`) REFERENCES `Drink`(`drink_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_drink_id_fkey` FOREIGN KEY (`drink_id`) REFERENCES `Drink`(`drink_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `Food`(`food_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_drink_id_fkey` FOREIGN KEY (`drink_id`) REFERENCES `Drink`(`drink_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rating` ADD CONSTRAINT `Rating_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `Food`(`food_id`) ON DELETE SET NULL ON UPDATE CASCADE;
