-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 16, 2026 at 01:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `onlinetutoring_platform`
--
CREATE DATABASE IF NOT EXISTS `onlinetutoring_platform`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `onlinetutoring_platform`;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE IF NOT EXISTS `reviews` (
  `review_id` int(11) NOT NULL,
  `tutee_id` int(11) DEFAULT NULL,
  `tutor_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `feedback` text DEFAULT NULL,
  `review_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `tutee_id`, `tutor_id`, `rating`, `feedback`, `review_date`) VALUES
(1, 1, 1, 5, 'Alice explains mathematics concepts very clearly', '2025-01-15'),
(2, 2, 2, 4, 'Great help with chemistry exam preparation', '2025-02-10'),
(3, 3, 3, 5, 'Excellent programming tutor, very patient', '2025-03-01');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE IF NOT EXISTS `subjects` (
  `subject_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `subject_name`, `description`) VALUES
(1, 'Mathematics', 'Includes algebra, calculus and geometry'),
(2, 'Physics', 'Mechanics, motion and energy concepts'),
(3, 'Chemistry', 'Organic and inorganic chemistry fundamentals'),
(4, 'English', 'Grammar, writing and literature'),
(5, 'Computer Science', 'Programming and algorithms');

-- --------------------------------------------------------

--
-- Table structure for table `tutees`
--

CREATE TABLE IF NOT EXISTS `tutees` (
  `tutee_id` int(11) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `school_level` varchar(50) DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutees`
--

INSERT INTO `tutees` (`tutee_id`, `user_id`, `school_level`, `grade_level`) VALUES
(1, 'U003', 'High School', 'Grade 10'),
(2, 'U004', 'High School', 'Grade 12'),
(3, 'U006', 'Middle School', 'Grade 8');

-- --------------------------------------------------------

--
-- Table structure for table `tutee_subjects`
--

CREATE TABLE IF NOT EXISTS `tutee_subjects` (
  `tutee_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutee_subjects`
--

INSERT INTO `tutee_subjects` (`tutee_id`, `subject_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(3, 5);

-- --------------------------------------------------------

--
-- Table structure for table `tutors`
--

CREATE TABLE IF NOT EXISTS `tutors` (
  `tutor_id` int(11) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `subjects` varchar(255) DEFAULT NULL,
  `lesson_count` int(11) DEFAULT 0,
  `points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutors`
--

-- TUTOR seed data is inserted by scripts/seed-db.js (which bcrypt-hashes passwords).
-- Run: node scripts/seed-db.js  (after docker compose up)

-- --------------------------------------------------------

--
-- Table structure for table `tutor_subjects`
--

CREATE TABLE IF NOT EXISTS `tutor_subjects` (
  `tutor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tutor_subjects`
--

INSERT INTO `tutor_subjects` (`tutor_id`, `subject_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 1),
(3, 5);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('tutor', 'tutee') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
--
-- Dumping data for table `users`
--

-- !! SECURITY FIX: Plaintext passwords have been removed from this file !!
-- Seed users are now inserted by scripts/seed-db.js using bcrypt-hashed passwords.
-- After running `docker compose up`, execute:  node scripts/seed-db.js
--
-- Indexes for dumped tables
--

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `tutee_id` (`tutee_id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`);

--
-- Indexes for table `tutees`
--
ALTER TABLE `tutees`
  ADD PRIMARY KEY (`tutee_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tutee_subjects`
--
ALTER TABLE `tutee_subjects`
  ADD PRIMARY KEY (`tutee_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `tutors`
--
ALTER TABLE `tutors`
  ADD PRIMARY KEY (`tutor_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tutor_subjects`
--
ALTER TABLE `tutor_subjects`
  ADD PRIMARY KEY (`tutor_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `users`
--

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tutees`
--
ALTER TABLE `tutees`
  MODIFY `tutee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tutors`
--
ALTER TABLE `tutors`
  MODIFY `tutor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`);

--
-- Constraints for table `tutees`
--
ALTER TABLE `tutees`
  ADD CONSTRAINT `tutees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `tutee_subjects`
--
ALTER TABLE `tutee_subjects`
  ADD CONSTRAINT `tutee_subjects_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`),
  ADD CONSTRAINT `tutee_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`);

--
-- Constraints for table `tutors`
--
ALTER TABLE `tutors`
  ADD CONSTRAINT `tutors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `tutor_subjects`
--
ALTER TABLE `tutor_subjects`
  ADD CONSTRAINT `tutor_subjects_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`),
  ADD CONSTRAINT `tutor_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
