-- phpMyAdmin SQL Dump
-- version 5.2.1
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

-- --------------------------------------------------------

-- Table structure for table `users`
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('tutor','tutee') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password`, `role`) VALUES
(1, 'Alice', 'Johnson', 'alice.johnson@email.com', 'hashed_pass_1', 'tutor'),
(2, 'Brian', 'Smith', 'brian.smith@email.com', 'hashed_pass_2', 'tutor'),
(3, 'Catherine', 'Lee', 'catherine.lee@email.com', 'hashed_pass_3', 'tutee'),
(4, 'Daniel', 'Brown', 'daniel.brown@email.com', 'hashed_pass_4', 'tutee'),
(5, 'Emily', 'Davis', 'emily.davis@email.com', 'hashed_pass_5', 'tutor'),
(6, 'Frank', 'Wilson', 'frank.wilson@email.com', 'hashed_pass_6', 'tutee');

-- --------------------------------------------------------

-- Table structure for table `subjects`
CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subjects` (`subject_id`, `subject_name`, `description`) VALUES
(1, 'Mathematics', 'Includes algebra, calculus and geometry'),
(2, 'Physics', 'Mechanics, motion and energy concepts'),
(3, 'Chemistry', 'Organic and inorganic chemistry fundamentals'),
(4, 'English', 'Grammar, writing and literature'),
(5, 'Computer Science', 'Programming and algorithms');

-- --------------------------------------------------------

-- Table structure for table `tutors`
CREATE TABLE `tutors` (
  `tutor_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `language` varchar(100) DEFAULT NULL,
  `status` varchar(10) DEFAULT 'active' CHECK (`status` in ('active','flagged')),
  `lesson_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tutors` (`tutor_id`, `user_id`, `rating`, `description`, `qualification`, `language`, `status`, `lesson_count`) VALUES
(1, 1, 4.8, 'Experienced mathematics tutor specializing in algebra and calculus for high school students.', 'MSc Mathematics - University of London', 'English', 'active', 120),
(2, 2, 4.5, 'Chemistry tutor helping students understand complex concepts through practical examples.', 'BSc Chemistry - University of Manchester', 'English, Spanish', 'active', 85),
(3, 5, 4.9, 'Software engineer and programming tutor with strong background in algorithms and problem solving.', 'BSc Computer Science - MIT', 'English, French', 'active', 150);
-- --------------------------------------------------------

-- Table structure for table `tutees`
CREATE TABLE `tutees` (
  `tutee_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `school_level` varchar(50) DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tutees` (`tutee_id`, `user_id`, `school_level`, `grade_level`) VALUES
(1, 3, 'High School', 'Grade 10'),
(2, 4, 'High School', 'Grade 12'),
(3, 6, 'Middle School', 'Grade 8');

-- --------------------------------------------------------

-- Table structure for table `bookings`
CREATE TABLE `bookings` (
  `booking_id` int(11) NOT NULL,
  `tutee_id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `lesson_date` date NOT NULL,
  `lesson_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('pending','accepted','declined') DEFAULT 'pending',
  `tutor_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `bookings` (`booking_id`, `tutee_id`, `tutor_id`, `subject_id`, `lesson_date`, `lesson_time`, `end_time`, `status`, `tutor_message`) VALUES
(1, 1, 1, 1, '2026-03-20', '10:00:00', '11:00:00', 'accepted', 'Looking forward to our math review session!'),
(2, 2, 2, 3, '2026-03-22', '14:30:00', '16:00:00', 'accepted', 'Please bring your periodic table.'),
(3, 3, 3, 5, '2026-03-25', '18:00:00', '19:00:00', 'pending', NULL),
(4, 1, 1, 2, '2026-03-26', '09:00:00', '10:00:00', 'declined', 'Sorry, I have a scheduling conflict at this time.');

-- --------------------------------------------------------

-- Table structure for table `flagged_tutors`
CREATE TABLE `flagged_tutors` (
  `flagged_id` int(11) NOT NULL,
  `tutee_id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Table structure for table `favorites`
CREATE TABLE `favorites` (
  `favorite_id` int(11) NOT NULL,
  `tutee_id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `favorites` (`favorite_id`, `tutee_id`, `tutor_id`) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 3, 1);

-- --------------------------------------------------------

-- Table structure for table `reviews`
CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `tutee_id` int(11) DEFAULT NULL,
  `tutor_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `feedback` text DEFAULT NULL,
  `review_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `reviews` (`review_id`, `tutee_id`, `tutor_id`, `rating`, `feedback`, `review_date`) VALUES
(1, 1, 1, 5, 'Alice explains mathematics concepts very clearly', '2025-01-15'),
(2, 2, 2, 4, 'Great help with chemistry exam preparation', '2025-02-10'),
(3, 3, 3, 5, 'Excellent programming tutor, very patient', '2025-03-01');

-- --------------------------------------------------------

-- Table structure for table `tutor_subjects`
CREATE TABLE `tutor_subjects` (
  `tutor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tutor_subjects` (`tutor_id`, `subject_id`) VALUES
(1, 1), (1, 2), (2, 3), (2, 4), (3, 1), (3, 5);

-- --------------------------------------------------------

-- Table structure for table `tutee_subjects`
CREATE TABLE `tutee_subjects` (
  `tutee_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tutee_subjects` (`tutee_id`, `subject_id`) VALUES
(1, 1), (1, 2), (2, 3), (3, 1), (3, 5);

-- --------------------------------------------------------
-- INDEXES & CONSTRAINTS
-- --------------------------------------------------------

ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`);

ALTER TABLE `tutors`
  ADD PRIMARY KEY (`tutor_id`),
  ADD UNIQUE KEY `user_id_unique` (`user_id`); -- Added Unique constraint

ALTER TABLE `tutees`
  ADD PRIMARY KEY (`tutee_id`),
  ADD UNIQUE KEY `user_id_unique` (`user_id`); -- Added Unique constraint

ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `tutee_id` (`tutee_id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `subject_id` (`subject_id`);

ALTER TABLE `favorites`
  ADD PRIMARY KEY (`favorite_id`),
  ADD UNIQUE KEY `user_tutor_unique` (`tutee_id`,`tutor_id`),
  ADD KEY `tutor_id` (`tutor_id`);

ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `tutee_id` (`tutee_id`),
  ADD KEY `tutor_id` (`tutor_id`);

ALTER TABLE `tutor_subjects`
  ADD PRIMARY KEY (`tutor_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

ALTER TABLE `tutee_subjects`
  ADD PRIMARY KEY (`tutee_id`,`subject_id`),
  ADD KEY `subject_id` (`subject_id`);

-- --------------------------------------------------------
-- AUTO_INCREMENTS
-- --------------------------------------------------------

ALTER TABLE `users` MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
ALTER TABLE `subjects` MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
ALTER TABLE `tutors` MODIFY `tutor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `tutees` MODIFY `tutee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
ALTER TABLE `bookings` MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE `flagged_tutors` MODIFY `flagged_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;
ALTER TABLE `favorites` MODIFY `favorite_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE `reviews` MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------
-- FOREIGN KEYS
-- --------------------------------------------------------

ALTER TABLE `tutors` ADD CONSTRAINT `tutors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
ALTER TABLE `tutees` ADD CONSTRAINT `tutees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE;

ALTER TABLE `tutor_subjects`
  ADD CONSTRAINT `tutor_subjects_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutors` (`tutor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tutor_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

ALTER TABLE `tutee_subjects`
  ADD CONSTRAINT `tutee_subjects_ibfk_1` FOREIGN KEY (`tutee_id`) REFERENCES `tutees` (`tutee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tutee_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;