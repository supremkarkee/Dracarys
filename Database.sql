-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: Dracarys
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database script
--


--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `tutee_id` int NOT NULL,
  `tutor_id` int NOT NULL,
  `subject_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lesson_date` date NOT NULL,
  `lesson_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('pending','accepted','declined') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `tutor_message` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `tutee_id` (`tutee_id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `favorite_id` int NOT NULL AUTO_INCREMENT,
  `tutee_id` int NOT NULL,
  `tutor_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `user_tutor` (`tutee_id`,`tutor_id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,4,1,'2026-03-23 02:31:05');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `tutee_id` int DEFAULT NULL,
  `tutor_id` int DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_general_ci,
  `review_date` date DEFAULT NULL,
  PRIMARY KEY (`review_id`),
  KEY `tutee_id` (`tutee_id`),
  KEY `tutor_id` (`tutor_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,1,5,'Alice explains mathematics concepts very clearly','2025-01-15'),(2,2,2,4,'Great help with chemistry exam preparation','2025-02-10'),(3,3,3,5,'Excellent programming tutor, very patient','2025-03-01'),(4,4,1,2,'its perfect lesson','2026-03-23');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `subject_id` int NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'Mathematics','Includes algebra, calculus and geometry'),(2,'Physics','Mechanics, motion and energy concepts'),(3,'Chemistry','Organic and inorganic chemistry fundamentals'),(4,'English','Grammar, writing and literature'),(5,'Computer Science','Programming and algorithms'),(6,'History','World history and civilizations'),(7,'Geography','Physical and human geography maps'),(8,'Music','Music theory and instruments'),(9,'Economics','Macro and micro economics principles'),(10,'Biology','Cell biology and genetics');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutee_subjects`
--

DROP TABLE IF EXISTS `tutee_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutee_subjects` (
  `tutee_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`tutee_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `tutee_subjects_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  CONSTRAINT `tutee_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutee_subjects`
--

LOCK TABLES `tutee_subjects` WRITE;
/*!40000 ALTER TABLE `tutee_subjects` DISABLE KEYS */;
INSERT INTO `tutee_subjects` VALUES (1,1),(3,1),(1,2),(2,3),(3,5);
/*!40000 ALTER TABLE `tutee_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutees`
--

DROP TABLE IF EXISTS `tutees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutees` (
  `tutee_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `school_level` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `grade_level` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`tutee_id`),
  UNIQUE KEY `user_id_unique` (`user_id`),
  CONSTRAINT `tutees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutees`
--

LOCK TABLES `tutees` WRITE;
/*!40000 ALTER TABLE `tutees` DISABLE KEYS */;
INSERT INTO `tutees` VALUES (1,'U003','High School','Grade 10'),(2,'U004','High School','Grade 12'),(3,'U006','Middle School','Grade 8'),(4,'S001',NULL,NULL);
/*!40000 ALTER TABLE `tutees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutor_subjects`
--

DROP TABLE IF EXISTS `tutor_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutor_subjects` (
  `tutor_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`tutor_id`,`subject_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `tutor_subjects_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  CONSTRAINT `tutor_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutor_subjects`
--

LOCK TABLES `tutor_subjects` WRITE;
/*!40000 ALTER TABLE `tutor_subjects` DISABLE KEYS */;
INSERT INTO `tutor_subjects` VALUES (1,1),(3,1),(1,2),(2,3),(2,4),(3,5),(4,6),(4,7),(5,4),(5,8),(6,1),(6,2),(6,3),(6,5);
/*!40000 ALTER TABLE `tutor_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutors`
--

DROP TABLE IF EXISTS `tutors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutors` (
  `tutor_id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `qualification` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `languages` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'English',
  `lesson_count` int DEFAULT '0',
  `points` int DEFAULT '0',
  `verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`tutor_id`),
  UNIQUE KEY `user_id_unique` (`user_id`),
  CONSTRAINT `tutors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutors`
--

LOCK TABLES `tutors` WRITE;
/*!40000 ALTER TABLE `tutors` DISABLE KEYS */;
INSERT INTO `tutors` (`tutor_id`, `user_id`, `rating`, `description`, `qualification`, `lesson_count`, `points`) VALUES (1,'U001',4.8,'Experienced mathematics tutor specializing in algebra and calculus for high school students.','MSc Mathematics - University of London',120,0),(2,'U002',4.5,'Chemistry tutor helping students understand complex concepts through practical examples.','BSc Chemistry - University of Manchester',85,0),(3,'U005',4.9,'Software engineer and programming tutor with strong background in algorithms and problem solving.','BSc Computer Science - MIT',150,0),(4,'U007',4.7,'Passionate History and Geography teacher blending facts with incredible stories.','BA History - Cambridge',95,110),(5,'U008',4.6,'Creative teacher specializing in English literature and Music theory.','MA Literature - Oxford',75,90),(6,'U009',5.0,'Polymath tutor who completely covers Mathematics, Physics, Chemistry, and Computer Science!','PhD Physics - Imperial College',210,200);
/*!40000 ALTER TABLE `tutors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favourites_tutors`
--

DROP TABLE IF EXISTS `favourites_tutors`;
CREATE TABLE `favourites_tutors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `tutee_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_fav` (`tutor_id`,`tutee_id`),
  KEY `favourites_tutors_ibfk_2` (`tutee_id`),
  CONSTRAINT `favourites_tutors_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  CONSTRAINT `favourites_tutors_ibfk_2` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `flagged_tutors`
--

DROP TABLE IF EXISTS `flagged_tutors`;
CREATE TABLE `flagged_tutors` (
  `flag_id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `tutee_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`flag_id`),
  UNIQUE KEY `unique_flag` (`tutor_id`,`tutee_id`),
  KEY `flagged_tutors_ibfk_2` (`tutee_id`),
  CONSTRAINT `flagged_tutors_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  CONSTRAINT `flagged_tutors_ibfk_2` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('tutor','tutee','admin') COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('S001','test test','test1234@gmail.com','$2b$10$/m/X.GQO9hVMqq3PJXgQAuJoqUi27CKYVxleL8wZfWCbSgXsXYptq','tutee'),('U001','Alice Johnson','alice.johnson@email.com','$2b$10$JFlMi1IZQhKegHyguIkm5egs4G/NjrjM9nFXkHPqGJXdEEl8UBxCS','tutor'),('U002','Brian Smith','brian.smith@email.com','$2b$10$RidMoiss1m9/3dwwML01NODwJttGMS7q3Bj5HHLDBqeGlsDpJ/Ls.','tutor'),('U003','Catherine Lee','catherine.lee@email.com','$2b$10$CnLwPJpl/S0eCqlqHenR/O2zZ2m8xbaMYW3f.mo/hOuV0IrwVL.CO','tutee'),('U004','Daniel Brown','daniel.brown@email.com','$2b$10$ZZFSXWmOD64uZ/PnM.qp8.8GD/mMHLT0qBaIlAWVbV3dglbxiekga','tutee'),('U005','Emily Davis','emily.davis@email.com','$2b$10$lFhFrY/PAa.xiogKoDd21OH9R15KFZ6VDGq8g8ywrXgrTn0BwFhMy','tutor'),('U006','Frank Wilson','frank.wilson@email.com','$2b$10$u4mIBJkeyejbTE.53csbQueOfvPIi1.J6cifpKQUsfEUsH/Zh/6cm','tutee'),('U007','George Martin','george.martin@email.com','$2b$10$JFlMi1IZQhKegHyguIkm5egs4G/NjrjM9nFXkHPqGJXdEEl8UBxCS','tutor'),('U008','Hannah Clark','hannah.clark@email.com','$2b$10$JFlMi1IZQhKegHyguIkm5egs4G/NjrjM9nFXkHPqGJXdEEl8UBxCS','tutor'),('U009','Ian Wright','ian.wright@email.com','$2b$10$JFlMi1IZQhKegHyguIkm5egs4G/NjrjM9nFXkHPqGJXdEEl8UBxCS','tutor'),('U486073','sad opl','sss@gmail.com','$2b$10$stirbHwAtCJ7biguVcUoy.AmRCqWzG0Kbh0fLASYww2FqfThD44BK','tutor'),('U700109','bla blaa','blaaa@gmail.com','$2b$10$EgJ8RAatOahru1Gl7.yrwO8cvAAXN2Saswko.Zg4ThB5rMf.vrXLS','tutee'),('U9487','jj ll','bvhj@gmail.com','$2b$10$Q/Wq3n.Mgh8OO.5uFZTwvON2iJ/0vkWfcAWQCkTV5BHM0ahN7SKve','tutor');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-23  2:58:51
