-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: vehicle_requisition_portal
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `activity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_hash` (`key_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_keys`
--

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_workflows`
--

DROP TABLE IF EXISTS `approval_workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campus_id` int DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `campus_id` (`campus_id`),
  CONSTRAINT `approval_workflows_ibfk_1` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_workflows`
--

LOCK TABLES `approval_workflows` WRITE;
/*!40000 ALTER TABLE `approval_workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,5,'CREATE_REQUEST','vehicle_request',1,'{\"destination\": \"KATNI\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-13 04:28:31'),(2,3,'HOD_APPROVE','vehicle_request',1,'{\"remarks\": \"\", \"newStatus\": \"Pending_COO\"}','::1','2026-06-13 04:29:23'),(3,2,'COO_REJECT','vehicle_request',1,'{\"remarks\": \"\", \"newStatus\": \"Rejected_COO\"}','::1','2026-06-13 04:30:07'),(4,5,'CREATE_REQUEST','vehicle_request',2,'{\"destination\": \"KATNI MURWARA\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-13 07:36:26'),(5,3,'HOD_REJECT','vehicle_request',2,'{\"remarks\": \"\", \"newStatus\": \"Rejected_HOD\"}','::1','2026-06-13 07:37:32'),(6,5,'CREATE_REQUEST','vehicle_request',3,'{\"destination\": \"KATNI MURWARA\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 04:24:48'),(7,3,'HOD_APPROVE','vehicle_request',3,'{\"remarks\": \"ALALALAL LALALALABEC NWSDUOHWDB QWHBUODHEQI\", \"newStatus\": \"Approved_HOD\"}','::1','2026-06-15 04:25:31'),(8,4,'ASSIGN_VEHICLE','vehicle_request',3,'{\"vehicle_id\": \"1\", \"driver_name\": \"Ramesh\"}','::1','2026-06-15 04:27:18'),(9,4,'RECORD_PICKUP','vehicle_request',3,'{}','::1','2026-06-15 04:27:28'),(10,4,'RECORD_DROPOFF','vehicle_request',3,'{}','::1','2026-06-15 04:27:37'),(11,5,'CREATE_REQUEST','vehicle_request',4,'{\"destination\": \"Katni Junction\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 04:52:03'),(12,3,'HOD_APPROVE','vehicle_request',4,'{\"remarks\": \"approved No worries\", \"newStatus\": \"Approved_HOD\"}','::1','2026-06-15 04:53:34'),(13,4,'ASSIGN_VEHICLE','vehicle_request',4,'{\"vehicle_id\": \"1\", \"driver_name\": \"Rajesh Kumar\"}','::1','2026-06-15 04:57:12'),(14,4,'RECORD_PICKUP','vehicle_request',4,'{}','::1','2026-06-15 04:57:16'),(15,4,'RECORD_DROPOFF','vehicle_request',4,'{}','::1','2026-06-15 04:57:17'),(16,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:20:53'),(17,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:23:29'),(18,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:29:28'),(19,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:31:08'),(20,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:34:44'),(21,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 06:37:58'),(22,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-15 06:39:59'),(23,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-15 07:00:06'),(24,1,'DEACTIVATE_EMPLOYEE','employee',4,'{}','::1','2026-06-15 07:01:24'),(25,1,'DEACTIVATE_EMPLOYEE','employee',4,'{}','::1','2026-06-15 07:01:48'),(26,1,'UPDATE_EMPLOYEE','employee',4,'{\"is_active\": 1}','::1','2026-06-15 07:03:52'),(27,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 07:05:10'),(28,5,'CREATE_REQUEST','vehicle_request',5,'{\"destination\": \"CHINA\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-15 07:06:54'),(29,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 07:09:23'),(30,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 07:17:29'),(31,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 07:17:59'),(32,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 07:22:24'),(33,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 09:39:00'),(34,5,'CREATE_REQUEST','vehicle_request',6,'{\"destination\": \"KOLKATA\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-15 09:39:51'),(35,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 09:40:21'),(36,3,'HOD_APPROVE','vehicle_request',6,'{\"remarks\": \"\", \"newStatus\": \"Pending_COO\"}','::1','2026-06-15 09:40:30'),(37,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 09:40:58'),(38,2,'COO_APPROVE','vehicle_request',6,'{\"remarks\": \"\", \"newStatus\": \"Approved_COO\"}','::1','2026-06-15 09:41:06'),(39,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 09:41:31'),(40,4,'ASSIGN_VEHICLE','vehicle_request',6,'{\"vehicle_id\": \"1\", \"driver_name\": \"Rajesh Kumar\"}','::1','2026-06-15 09:41:59'),(41,4,'ASSIGN_VEHICLE','vehicle_request',5,'{\"vehicle_id\": \"2\", \"driver_name\": \"Amit Patel\"}','::1','2026-06-15 09:42:25'),(42,4,'RECORD_PICKUP','vehicle_request',5,'{}','::1','2026-06-15 09:42:31'),(43,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 09:44:01'),(44,5,'CREATE_REQUEST','vehicle_request',7,'{\"destination\": \"Shahdol Railway Station\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 09:45:08'),(45,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 09:45:26'),(46,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 09:45:51'),(47,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 09:46:06'),(48,3,'HOD_APPROVE','vehicle_request',7,'{\"remarks\": \"nOTHING\", \"newStatus\": \"Approved_HOD\"}','::1','2026-06-15 09:46:14'),(49,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 09:46:43'),(50,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 09:55:54'),(51,4,'ASSIGN_VEHICLE','vehicle_request',7,'{\"vehicle_id\": \"4\", \"driver_name\": \"Suresh Singh\"}','::1','2026-06-15 09:56:04'),(52,4,'RECORD_PICKUP','vehicle_request',6,'{}','::1','2026-06-15 09:56:07'),(53,4,'RECORD_PICKUP','vehicle_request',7,'{}','::1','2026-06-15 09:56:07'),(54,4,'RECORD_DROPOFF','vehicle_request',6,'{}','::1','2026-06-15 09:56:08'),(55,4,'RECORD_DROPOFF','vehicle_request',5,'{}','::1','2026-06-15 09:56:11'),(56,4,'RECORD_DROPOFF','vehicle_request',7,'{}','::1','2026-06-15 09:56:16'),(57,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 10:06:04'),(58,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 10:06:23'),(59,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 10:07:15'),(60,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 10:08:36'),(61,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:10:03'),(62,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 10:11:31'),(63,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 10:13:48'),(64,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:14:14'),(65,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:28:26'),(66,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:28:35'),(67,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 10:29:26'),(68,3,'CREATE_REQUEST','vehicle_request',8,'{\"status\": \"Pending_COO\", \"destination\": \"ANNUPUR STATION\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 10:30:32'),(69,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 10:30:55'),(70,2,'COO_APPROVE','vehicle_request',8,'{\"remarks\": \"OK \", \"newStatus\": \"Approved_COO\"}','::1','2026-06-15 10:31:01'),(71,2,'CREATE_REQUEST','vehicle_request',9,'{\"status\": \"Approved_COO\", \"destination\": \"BURHAR RAILWAY\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 10:40:57'),(72,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 10:46:24'),(73,2,'CREATE_REQUEST','vehicle_request',10,'{\"status\": \"Approved_COO\", \"destination\": \"wd\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 10:46:40'),(74,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:46:56'),(75,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:52:37'),(76,5,'CREATE_REQUEST','vehicle_request',11,'{\"status\": \"Pending_HOD\", \"destination\": \"katni junction\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-15 10:53:21'),(77,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 10:53:40'),(78,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 10:58:47'),(79,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 10:59:52'),(80,5,'CREATE_REQUEST','vehicle_request',12,'{\"status\": \"Pending_HOD\", \"destination\": \"Shahdol Post Office\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 11:01:04'),(81,3,'HOD_APPROVE','vehicle_request',12,'{\"remarks\": \"Bad\", \"newStatus\": \"Approved_HOD\"}','::1','2026-06-15 11:02:27'),(82,3,'HOD_APPROVE','vehicle_request',11,'{\"remarks\": \"Very bad\", \"newStatus\": \"Pending_COO\"}','::1','2026-06-15 11:02:32'),(83,5,'CREATE_REQUEST','vehicle_request',13,'{\"status\": \"Pending_HOD\", \"destination\": \"Shahdol Post Office\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 11:03:21'),(84,3,'HOD_APPROVE','vehicle_request',13,'{\"remarks\": \"Naah bro\", \"newStatus\": \"Approved_HOD\"}','::1','2026-06-15 11:04:31'),(85,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 11:06:09'),(86,5,'CREATE_REQUEST','vehicle_request',14,'{\"status\": \"Pending_HOD\", \"destination\": \"Jabalpur railway\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-15 11:07:00'),(87,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 11:10:52'),(88,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 11:11:07'),(89,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-15 12:01:12'),(90,1,'DEACTIVATE_EMPLOYEE','employee',5,'{}','::1','2026-06-15 12:01:35'),(91,1,'UPDATE_EMPLOYEE','employee',5,'{\"is_active\": 1}','::1','2026-06-15 12:01:39'),(92,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 12:07:47'),(93,5,'CREATE_REQUEST','vehicle_request',15,'{\"status\": \"Pending_HOD\", \"destination\": \"shahdol railway\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-15 12:08:30'),(94,5,'CREATE_REQUEST','vehicle_request',16,'{\"status\": \"Pending_HOD\", \"destination\": \"gwesgrdsx\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-15 12:09:14'),(95,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-15 12:09:50'),(96,3,'HOD_APPROVE','vehicle_request',14,'{\"remarks\": \"joke\", \"newStatus\": \"Pending_COO\"}','::1','2026-06-15 12:10:21'),(97,3,'HOD_REJECT','vehicle_request',15,'{\"remarks\": \"not\", \"newStatus\": \"Rejected_HOD\"}','::1','2026-06-15 12:10:34'),(98,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-15 12:11:31'),(99,2,'COO_REJECT','vehicle_request',14,'{\"remarks\": \"nope\", \"newStatus\": \"Rejected_COO\"}','::1','2026-06-15 12:13:43'),(100,2,'COO_APPROVE','vehicle_request',11,'{\"remarks\": \"ok\", \"newStatus\": \"Approved_COO\"}','::1','2026-06-15 12:13:48'),(101,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-15 12:14:06'),(102,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-15 12:14:47'),(103,4,'ASSIGN_VEHICLE','vehicle_request',12,'{\"vehicle_id\": \"1\", \"driver_name\": \"Suresh Singh\"}','::1','2026-06-15 12:15:16'),(104,4,'ASSIGN_VEHICLE','vehicle_request',11,'{\"vehicle_id\": \"2\", \"driver_name\": \"Vikram Sharma\"}','::1','2026-06-15 12:15:59'),(105,4,'RECORD_PICKUP','vehicle_request',12,'{}','::1','2026-06-15 12:16:19'),(106,4,'RECORD_PICKUP','vehicle_request',11,'{}','::1','2026-06-15 12:16:20'),(107,4,'RECORD_DROPOFF','vehicle_request',11,'{}','::1','2026-06-15 12:16:21'),(108,4,'RECORD_DROPOFF','vehicle_request',12,'{}','::1','2026-06-15 12:17:22'),(109,4,'ASSIGN_VEHICLE','vehicle_request',9,'{\"vehicle_id\": \"1\", \"driver_name\": \"Rajesh Kumar\"}','::1','2026-06-15 12:17:31'),(110,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-15 12:19:38'),(111,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-16 04:28:38'),(112,1,'CREATE_DELEGATION','delegation',0,'{\"end_date\": \"2026-06-25\", \"start_date\": \"2026-06-24\", \"delegatee_id\": \"3\"}','::1','2026-06-16 04:38:30'),(113,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 04:44:45'),(114,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:00:14'),(115,5,'CREATE_REQUEST','vehicle_request',17,'{\"status\": \"Pending_HOD\", \"destination\": \"Katni Junction\", \"travel_type\": \"Beyond Anuppur/Shahdol\"}','::1','2026-06-16 05:01:08'),(116,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 05:10:09'),(117,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:11:46'),(118,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 05:19:06'),(119,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:26:27'),(120,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-16 05:30:13'),(121,1,'CREATE_REQUEST','vehicle_request',18,'{\"status\": \"Pending_HOD\", \"destination\": \"Station\", \"travel_type\": \"Within Anuppur/Shahdol\"}','::1','2026-06-16 05:30:13'),(122,1,'DELETE_REQUEST','vehicle_request',18,'{\"status_to\": \"Deleted\", \"status_from\": \"Pending_HOD\"}','::1','2026-06-16 05:30:13'),(123,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 05:35:19'),(124,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:35:39'),(125,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 05:38:20'),(126,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:38:51'),(127,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 05:51:05'),(128,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 05:51:13'),(129,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 06:02:19'),(130,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 06:02:33'),(131,5,'USER_LOGIN','employees',5,'{}','::1','2026-06-16 06:08:10'),(132,5,'DELETE_REQUEST','vehicle_request',16,'{\"status_to\": \"Deleted\", \"status_from\": \"Pending_HOD\"}','::1','2026-06-16 06:09:51'),(133,5,'USER_LOGOUT','employees',5,'{}','::1','2026-06-16 06:10:36'),(134,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-16 06:10:44'),(135,3,'HOD_REJECT','vehicle_request',17,'{\"remarks\": \"TESTING\", \"newStatus\": \"Rejected_HOD\"}','::1','2026-06-16 06:11:02'),(136,3,'USER_LOGOUT','employees',3,'{}','::1','2026-06-16 06:11:22'),(137,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-16 06:11:31'),(138,2,'USER_LOGOUT','employees',2,'{}','::1','2026-06-16 06:11:56'),(139,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-16 06:12:19'),(140,4,'RECORD_PICKUP','vehicle_request',9,'{}','::1','2026-06-16 06:12:25'),(141,4,'RECORD_DROPOFF','vehicle_request',9,'{}','::1','2026-06-16 06:12:25'),(142,4,'USER_LOGIN','employees',4,'{}','::1','2026-06-16 06:27:44'),(143,4,'DRIVER_STATUS_CHANGED','driver',2,'{\"changed_by\": \"Garage Manager\", \"new_status\": \"On Leave\", \"driver_name\": \"Suresh Singh\", \"employee_number\": \"EMP-D002\", \"previous_status\": \"Active\"}','::1','2026-06-16 06:28:01'),(144,4,'DRIVER_STATUS_CHANGED','driver',2,'{\"changed_by\": \"Garage Manager\", \"new_status\": \"Active\", \"driver_name\": \"Suresh Singh\", \"employee_number\": \"EMP-D002\", \"previous_status\": \"On Leave\"}','::1','2026-06-16 06:28:04'),(145,4,'DRIVER_STATUS_CHANGED','driver',3,'{\"changed_by\": \"Garage Manager\", \"new_status\": \"On Leave\", \"driver_name\": \"Amit Patel\", \"employee_number\": \"EMP-D003\", \"previous_status\": \"Active\"}','::1','2026-06-16 06:31:39'),(146,4,'ASSIGN_VEHICLE','vehicle_request',8,'{\"vehicle_id\": \"3\", \"driver_name\": \"Manoj Yadav\"}','::1','2026-06-16 06:31:59'),(147,4,'DRIVER_STATUS_CHANGED','driver',3,'{\"changed_by\": \"Garage Manager\", \"new_status\": \"Active\", \"driver_name\": \"Amit Patel\", \"employee_number\": \"EMP-D003\", \"previous_status\": \"On Leave\"}','::1','2026-06-16 06:32:12'),(148,4,'RECORD_PICKUP','vehicle_request',8,'{}','::1','2026-06-16 06:32:16'),(149,4,'RECORD_DROPOFF','vehicle_request',8,'{}','::1','2026-06-16 06:32:17'),(150,4,'ASSIGN_VEHICLE','vehicle_request',13,'{\"vehicle_id\": \"1\", \"driver_name\": \"Manoj Yadav\"}','::1','2026-06-16 06:32:24'),(151,4,'ASSIGN_VEHICLE','vehicle_request',10,'{\"vehicle_id\": \"2\", \"driver_name\": \"Rajesh Kumar\"}','::1','2026-06-16 06:32:30'),(152,4,'RECORD_PICKUP','vehicle_request',13,'{}','::1','2026-06-16 06:32:31'),(153,4,'RECORD_PICKUP','vehicle_request',10,'{}','::1','2026-06-16 06:32:31'),(154,4,'RECORD_DROPOFF','vehicle_request',13,'{}','::1','2026-06-16 06:32:32'),(155,4,'RECORD_DROPOFF','vehicle_request',10,'{}','::1','2026-06-16 06:32:33'),(156,4,'USER_LOGOUT','employees',4,'{}','::1','2026-06-16 06:36:52'),(157,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-16 06:37:03'),(158,1,'CANCEL_DELEGATION','delegation',1,'{}','::1','2026-06-16 06:39:23'),(159,1,'USER_LOGOUT','employees',1,'{}','::1','2026-06-16 06:48:05'),(160,2,'USER_LOGIN','employees',2,'{}','::1','2026-06-16 06:48:24'),(161,2,'USER_LOGOUT','employees',2,'{}','::1','2026-06-16 06:49:01'),(162,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-16 10:37:15'),(163,3,'USER_LOGIN','employees',3,'{}','::1','2026-06-16 10:54:09'),(164,1,'USER_LOGIN','employees',1,'{}','::1','2026-06-16 11:57:45'),(165,1,'USER_LOGOUT','employees',1,'{}','::1','2026-06-16 11:58:42');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campus_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `campus_id` (`campus_id`),
  CONSTRAINT `buildings_ibfk_1` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campuses`
--

DROP TABLE IF EXISTS `campuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campuses`
--

LOCK TABLES `campuses` WRITE;
/*!40000 ALTER TABLE `campuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `campuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cost_centers`
--

DROP TABLE IF EXISTS `cost_centers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cost_centers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cost_centers`
--

LOCK TABLES `cost_centers` WRITE;
/*!40000 ALTER TABLE `cost_centers` DISABLE KEYS */;
/*!40000 ALTER TABLE `cost_centers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delegations`
--

DROP TABLE IF EXISTS `delegations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delegator_id` int NOT NULL,
  `delegatee_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delegator_id` (`delegator_id`),
  KEY `delegatee_id` (`delegatee_id`),
  CONSTRAINT `delegations_ibfk_1` FOREIGN KEY (`delegator_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delegations_ibfk_2` FOREIGN KEY (`delegatee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delegations`
--

LOCK TABLES `delegations` WRITE;
/*!40000 ALTER TABLE `delegations` DISABLE KEYS */;
INSERT INTO `delegations` VALUES (1,1,3,'2026-06-24','2026-06-25',0,'2026-06-16 04:38:30');
/*!40000 ALTER TABLE `delegations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_budgets`
--

DROP TABLE IF EXISTS `department_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `fiscal_year` year NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `spent_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_dept_year` (`department_id`,`fiscal_year`),
  CONSTRAINT `department_budgets_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_budgets`
--

LOCK TABLES `department_budgets` WRITE;
/*!40000 ALTER TABLE `department_budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Human Resources','HR','2026-06-10 12:58:52'),(2,'Information Technology','IT','2026-06-10 12:58:52'),(3,'Finance & Accounts','FIN','2026-06-10 12:58:52'),(4,'Operations','OPS','2026-06-10 12:58:52'),(5,'Administration','ADM','2026-06-10 12:58:52');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campus_id` int DEFAULT NULL,
  `license_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `license_number` (`license_number`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES (1,NULL,'XV0AGW65GJTKRU2','2030-05-16','Rajesh Kumar','EMP-D001','rajesh.d@orient.com','9876543210',1,1),(2,NULL,'02AJX77ZGWFYALH','2030-06-16','Suresh Singh','EMP-D002','suresh.d@orient.com','9876543211',1,1),(3,NULL,'TSN25RLVHG5GKGB','2030-11-16','Amit Patel','EMP-D003','amit.d@orient.com','9876543212',1,1),(4,NULL,'441U3OKCOYDY27E','2029-04-16','Vikram Sharma','EMP-D004','vikram.d@orient.com','9876543213',1,1),(5,NULL,'7U395WWDSBXI8IE','2027-08-16','Manoj Yadav','EMP-D005','manoj.d@orient.com','9876543214',1,1);
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `to_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Sent','Failed') COLLATE utf8mb4_unicode_ci DEFAULT 'Sent',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
INSERT INTO `email_logs` VALUES (1,'sharad.bhilwara@gmail.com','New Request for Approval','<p>Request #17 to Katni Junction from your department requires approval.</p>','Sent',NULL,'2026-06-16 05:01:08'),(2,'newharsh31@gmail.com','Request Rejected HOD','<p>Your request to Katni Junction was rejected by HOD. Remarks: TESTING</p>','Sent',NULL,'2026-06-16 06:11:02'),(3,'nisha.bhilwara@gmail.com','Trip Started','<p>Your trip is now in transit.</p>','Sent',NULL,'2026-06-16 06:12:25'),(4,'nisha.bhilwara@gmail.com','Trip Completed','<p>Your trip has been completed.</p>','Sent',NULL,'2026-06-16 06:12:25'),(5,'sharad.bhilwara@gmail.com','Vehicle Assigned','<p>A vehicle has been assigned to your request. Driver: Manoj Yadav</p>','Sent',NULL,'2026-06-16 06:31:59'),(6,'sharad.bhilwara@gmail.com','Trip Started','<p>Your trip is now in transit.</p>','Sent',NULL,'2026-06-16 06:32:16'),(7,'sharad.bhilwara@gmail.com','Trip Completed','<p>Your trip has been completed.</p>','Sent',NULL,'2026-06-16 06:32:17'),(8,'newharsh31@gmail.com','Vehicle Assigned','<p>A vehicle has been assigned to your request. Driver: Manoj Yadav</p>','Sent',NULL,'2026-06-16 06:32:24'),(9,'nisha.bhilwara@gmail.com','Vehicle Assigned','<p>A vehicle has been assigned to your request. Driver: Rajesh Kumar</p>','Sent',NULL,'2026-06-16 06:32:30'),(10,'newharsh31@gmail.com','Trip Started','<p>Your trip is now in transit.</p>','Sent',NULL,'2026-06-16 06:32:31'),(11,'nisha.bhilwara@gmail.com','Trip Started','<p>Your trip is now in transit.</p>','Sent',NULL,'2026-06-16 06:32:31'),(12,'newharsh31@gmail.com','Trip Completed','<p>Your trip has been completed.</p>','Sent',NULL,'2026-06-16 06:32:32'),(13,'nisha.bhilwara@gmail.com','Trip Completed','<p>Your trip has been completed.</p>','Sent',NULL,'2026-06-16 06:32:33');
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergency_contacts`
--

DROP TABLE IF EXISTS `emergency_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `emergency_contacts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergency_contacts`
--

LOCK TABLES `emergency_contacts` WRITE;
/*!40000 ALTER TABLE `emergency_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `emergency_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('Employee','HOD','COO','Garage','Admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Employee',
  `department_id` int DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_employees_email` (`email`),
  KEY `idx_employees_number` (`employee_number`),
  KEY `idx_employees_department` (`department_id`),
  KEY `idx_employees_role` (`role`),
  CONSTRAINT `fk_employee_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'EMP001','harshbohra41@gmail.com','$2b$10$QdtlzrHtok/6vFL9eZh1tenzLvL8w5n45F7cbMFRbQOE5fVr32K0S','System Administrator',NULL,'Admin',5,'+91-9000000001',1,'2026-06-10 12:58:52','2026-06-16 04:23:22'),(2,'EMP002','nisha.bhilwara@gmail.com','$2b$10$QdtlzrHtok/6vFL9eZh1tenzLvL8w5n45F7cbMFRbQOE5fVr32K0S','Rajesh Kumar',NULL,'COO',5,'+91-9000000002',1,'2026-06-10 12:58:52','2026-06-16 04:23:22'),(3,'EMP003','sharad.bhilwara@gmail.com','$2b$10$QdtlzrHtok/6vFL9eZh1tenzLvL8w5n45F7cbMFRbQOE5fVr32K0S','Priya Sharma',NULL,'HOD',1,'+91-9000000003',1,'2026-06-10 12:58:52','2026-06-16 04:23:22'),(4,'EMP004','bohrakartikeya@gmail.com','$2b$10$QdtlzrHtok/6vFL9eZh1tenzLvL8w5n45F7cbMFRbQOE5fVr32K0S','Garage Manager',NULL,'Garage',5,'+91-9000000007',1,'2026-06-10 12:58:52','2026-06-16 04:23:22'),(5,'EMP005','newharsh31@gmail.com','$2b$10$QdtlzrHtok/6vFL9eZh1tenzLvL8w5n45F7cbMFRbQOE5fVr32K0S','Neha Gupta',NULL,'Employee',1,'+91-9000000008',1,'2026-06-10 12:58:52','2026-06-16 04:23:22'),(6,'EMP1000','hod_finance@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','HOD Finance',NULL,'HOD',3,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58'),(7,'EMP1001','emp_finance@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','Employee Finance',NULL,'Employee',3,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58'),(8,'EMP1002','hod_information@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','HOD Information',NULL,'HOD',2,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58'),(9,'EMP1003','emp_information@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','Employee Information',NULL,'Employee',2,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58'),(10,'EMP1004','hod_operations@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','HOD Operations',NULL,'HOD',4,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58'),(11,'EMP1005','emp_operations@example.com','$2b$10$lkTIAJQLLMsofXwkF1bjUuAK0zfsKkcK020ncj8P/425LklQjHL0G','Employee Operations',NULL,'Employee',4,NULL,1,'2026-06-16 11:54:58','2026-06-16 11:54:58');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_login_attempts`
--

DROP TABLE IF EXISTS `failed_login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_time` (`email`,`attempt_time`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_login_attempts`
--

LOCK TABLES `failed_login_attempts` WRITE;
/*!40000 ALTER TABLE `failed_login_attempts` DISABLE KEYS */;
INSERT INTO `failed_login_attempts` VALUES (1,'newharsh31@gmail.com','::1','2026-06-15 06:18:01'),(2,'newharsh31@gmail.com','::1','2026-06-15 06:19:05'),(3,'admin@test.com','::1','2026-06-15 06:22:55'),(4,'wrong@test.com','::1','2026-06-15 06:32:15'),(5,'newharsh31@gmail.com','::1','2026-06-15 10:22:51'),(6,'newharsh31@gmail.com','::1','2026-06-15 10:23:38'),(7,'fgh','::1','2026-06-15 12:06:34');
/*!40000 ALTER TABLE `failed_login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fuel_logs`
--

DROP TABLE IF EXISTS `fuel_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fuel_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `log_date` datetime NOT NULL,
  `liters` decimal(8,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `odometer_reading` int NOT NULL,
  `receipt_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `fuel_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fuel_logs_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fuel_logs`
--

LOCK TABLES `fuel_logs` WRITE;
/*!40000 ALTER TABLE `fuel_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `fuel_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_history`
--

DROP TABLE IF EXISTS `login_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `login_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_history`
--

LOCK TABLES `login_history` WRITE;
/*!40000 ALTER TABLE `login_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_records`
--

DROP TABLE IF EXISTS `maintenance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `maintenance_id` int DEFAULT NULL,
  `vehicle_id` int NOT NULL,
  `maintenance_date` date NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendor` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `maintenance_id` (`maintenance_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`maintenance_id`) REFERENCES `vehicle_maintenance` (`id`) ON DELETE SET NULL,
  CONSTRAINT `maintenance_records_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_records`
--

LOCK TABLES `maintenance_records` WRITE;
/*!40000 ALTER TABLE `maintenance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email_enabled` tinyint(1) DEFAULT '1',
  `sms_enabled` tinyint(1) DEFAULT '0',
  `push_enabled` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('System','Request','Approval','Maintenance','Alert') COLLATE utf8mb4_unicode_ci DEFAULT 'System',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,5,'Request Approved HOD','Your request to Shahdol Post Office was approved by HOD. Remarks: Bad','Approval',1,'2026-06-15 11:02:27'),(2,5,'Request Pending COO','Your request to katni junction was approved by HOD. Remarks: Very bad','Approval',1,'2026-06-15 11:02:32'),(3,5,'Request Approved HOD','Your request to Shahdol Post Office was approved by HOD. Remarks: Naah bro','Approval',1,'2026-06-15 11:04:31'),(4,3,'New Request for Approval','Request #15 to shahdol railway from your department requires approval.','Approval',0,'2026-06-15 12:08:30'),(5,3,'New Request for Approval','Request #16 to gwesgrdsx from your department requires approval.','Approval',0,'2026-06-15 12:09:14'),(6,5,'Request Pending COO','Your request to Jabalpur railway was approved by HOD. Remarks: joke','Approval',1,'2026-06-15 12:10:21'),(7,2,'New Request for Approval','Request #14 to Jabalpur railway requires your approval.','Approval',0,'2026-06-15 12:10:21'),(8,5,'Request Rejected HOD','Your request to shahdol railway was rejected by HOD. Remarks: not','Approval',1,'2026-06-15 12:10:34'),(9,5,'Request Rejected COO','Your request to Jabalpur railway was rejected by COO. Remarks: nope','Approval',1,'2026-06-15 12:13:43'),(10,5,'Request Approved COO','Your request to katni junction was approved by COO. Remarks: ok','Approval',1,'2026-06-15 12:13:48'),(11,4,'New Approved Request','Request #11 to katni junction was approved and needs a vehicle.','Request',0,'2026-06-15 12:13:48'),(12,5,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Suresh Singh','System',1,'2026-06-15 12:15:16'),(13,5,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Vikram Sharma','System',1,'2026-06-15 12:15:59'),(14,5,'Trip Started','Your trip is now in transit.','System',1,'2026-06-15 12:16:19'),(15,5,'Trip Started','Your trip is now in transit.','System',1,'2026-06-15 12:16:20'),(16,5,'Trip Completed','Your trip has been completed.','System',1,'2026-06-15 12:16:21'),(17,5,'Trip Completed','Your trip has been completed.','System',1,'2026-06-15 12:17:22'),(18,2,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Rajesh Kumar','System',0,'2026-06-15 12:17:31'),(19,3,'New Request for Approval','Request #17 to Katni Junction from your department requires approval.','Approval',0,'2026-06-16 05:01:08'),(20,5,'Request Rejected HOD','Your request to Katni Junction was rejected by HOD. Remarks: TESTING','Approval',0,'2026-06-16 06:11:02'),(21,2,'Trip Started','Your trip is now in transit.','System',0,'2026-06-16 06:12:25'),(22,2,'Trip Completed','Your trip has been completed.','System',0,'2026-06-16 06:12:25'),(23,3,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Manoj Yadav','System',0,'2026-06-16 06:31:59'),(24,3,'Trip Started','Your trip is now in transit.','System',0,'2026-06-16 06:32:16'),(25,3,'Trip Completed','Your trip has been completed.','System',0,'2026-06-16 06:32:17'),(26,5,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Manoj Yadav','System',0,'2026-06-16 06:32:24'),(27,2,'Vehicle Assigned','A vehicle has been assigned to your request. Driver: Rajesh Kumar','System',0,'2026-06-16 06:32:30'),(28,5,'Trip Started','Your trip is now in transit.','System',0,'2026-06-16 06:32:31'),(29,2,'Trip Started','Your trip is now in transit.','System',0,'2026-06-16 06:32:31'),(30,5,'Trip Completed','Your trip has been completed.','System',0,'2026-06-16 06:32:32'),(31,2,'Trip Completed','Your trip has been completed.','System',0,'2026-06-16 06:32:33');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `refresh_tokens_ibfk_1` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (2,5,'28207b56b5121b4d4ba1c6c0d34d90ec6a73c30950d12616cc835fe13e88aadf',0,'2026-06-22 00:50:33','2026-06-15 06:20:33'),(3,5,'9b3e51012014bec64b27d50b916809232bee29827b10665ddcf15729b6fe1c30',0,'2026-06-22 00:50:53','2026-06-15 06:20:53'),(4,5,'dadc7c4c62858f0f2ba268f1873fed76ef3bd74bf9cadff207e5f5d842096446',0,'2026-06-22 00:53:30','2026-06-15 06:23:29'),(5,5,'2047853e1c46b7036b3f5a5fc19baf55fae4e41f81eed7727d241ea6762abb98',1,'2026-06-22 00:59:28','2026-06-15 06:29:28'),(6,5,'b50c2cc1eb9581b6a70abd69586c7f4f3e7e3c6c89b19aefff951a60e0b4e3b9',1,'2026-06-22 01:01:09','2026-06-15 06:31:08'),(7,5,'d6b23fa78fe86d603f89cd7a3d2fad74af34db96e616169d99caa1149ff4e877',0,'2026-06-22 01:04:45','2026-06-15 06:34:44'),(8,5,'2a200b7b92099cc4b20549873c295f0540ed0a76769debca1940fe12fa7576fb',1,'2026-06-22 01:07:58','2026-06-15 06:37:58'),(9,1,'822e0b8f580fc22e158c63283c749b6621be4e46d100296d5b8b2f575da83399',0,'2026-06-22 01:10:00','2026-06-15 06:39:59'),(10,1,'892022715359a2b85434843e6b01620b1484dc06b696ccab9354f37e5c5e2beb',1,'2026-06-22 01:30:06','2026-06-15 07:00:06'),(11,5,'86c65ca6594900fcf0c08fc7a02c3b1b70f13767778ed6364085f3cc2c9b1fd8',1,'2026-06-22 01:35:10','2026-06-15 07:05:10'),(12,3,'5e913afd87de52d2be5d941cf4bbb6d206580809c9a9a9ee8e42e6f47499e005',1,'2026-06-22 01:39:24','2026-06-15 07:09:23'),(13,2,'c4bb6e2b707896de0ae6add4dd00d56801d4063880001476fbe747c68f4ff86e',1,'2026-06-22 01:47:30','2026-06-15 07:17:29'),(14,5,'cf5438237ffcdc9cc5471d00ae283a9ffa297e2965f2f669532e55e36abe0792',1,'2026-06-22 01:48:00','2026-06-15 07:17:59'),(15,2,'4cfe434ba0b66d8bb31e7fe8f4f8514d8a6c20a396f3139422cacb942e90141e',0,'2026-06-22 01:52:25','2026-06-15 07:22:24'),(16,5,'5d049eea52ea6af267530a34e34a68ceeba064d259a15dc698382a5f848945b5',1,'2026-06-22 04:09:01','2026-06-15 09:39:00'),(17,3,'248b22b11e9ed466dc6f5cd4b0fd1c2bd01117450e67275c2969648d94553ccf',1,'2026-06-22 04:10:21','2026-06-15 09:40:21'),(18,2,'9e770470655b9f3865220d4ba013b2e22358ae0c1bb84da0c92bf407c4b98f99',1,'2026-06-22 04:10:59','2026-06-15 09:40:58'),(19,4,'bd2a1b93a2d04e8d0815e0604db105a6529316ea6be2ae80aca9053324a4481c',1,'2026-06-22 04:11:32','2026-06-15 09:41:31'),(20,5,'5b688b7e2b3ae1127976b611de6e047ae96c1cda3b01e0a2af01ecf6dd2b2066',1,'2026-06-22 04:14:01','2026-06-15 09:44:01'),(21,5,'60ef4da64ae8b3dd60b50a18e1fb4d1fa0d203741d1e1606f43ae650fdeeaa05',1,'2026-06-22 04:15:26','2026-06-15 09:45:26'),(22,5,'eb29050b4a4790c874d8f9b834e744198b0c981fe25021f4158a41c616b76512',1,'2026-06-22 04:15:52','2026-06-15 09:45:51'),(23,3,'1a33358262d7e3f2fdc6d299835554aaf986f59b25a73c28ffa335202763620b',1,'2026-06-22 04:16:07','2026-06-15 09:46:06'),(24,4,'00d1f31b33b3ee210688bf4c5a3308287c2e3c0a6ccefb7047013dcd915c62c4',1,'2026-06-22 04:16:43','2026-06-15 09:46:43'),(25,4,'c13517863050f4f0e16777ad6a3fa68ce51f915a2234c595b328e3f1b04d517e',1,'2026-06-22 04:25:54','2026-06-15 09:55:54'),(26,3,'6f868222a0fbf33a96eeb83c4ad797eaeadc148721e7a06e4ca7a73034b5586c',1,'2026-06-22 04:36:04','2026-06-15 10:06:04'),(27,2,'5a6ce0127e755940648aecedb88b8de9435e6cada6f0bfa6dc8f9ab9c6caea4d',1,'2026-06-22 04:36:24','2026-06-15 10:06:23'),(28,2,'452969d531fcfbbe9f3fd98cb55f56d1a5523582cd11274cbae646229f82e02d',1,'2026-06-22 04:37:16','2026-06-15 10:07:15'),(29,2,'6d6a9ce38a84682481ea1690dc355241ac117edb4d9ed939fd6a22c7976dec57',1,'2026-06-22 04:38:36','2026-06-15 10:08:36'),(30,5,'89b09a7e262b4164cbbc1996c4b3ac02506331c35cc585b8c921b34da878a8c9',1,'2026-06-22 04:40:04','2026-06-15 10:10:03'),(31,4,'706b839b551039c372f1e859568c11eee325dc28abec6694c2db78e94e61e311',1,'2026-06-22 04:41:31','2026-06-15 10:11:31'),(32,4,'0240c501d83068dbaeee663f69a7f7b4e309d0bedf651f1f711ab0ef8d6ba5ac',1,'2026-06-22 04:43:49','2026-06-15 10:13:48'),(33,5,'e7044e99c73d67ed6998a16aad76832678dc96a7f2fcee1d1761a7ec1a8ff70b',1,'2026-06-22 04:44:14','2026-06-15 10:14:14'),(34,5,'ee825b58eccaa48afdd0d5ac799e5b0a25467f7a994713e36c2b2b2bc99265e5',1,'2026-06-22 04:58:26','2026-06-15 10:28:26'),(35,5,'7ffeae2475caa89b2857837ab9a6f045c9cafd643860b365c8b130edc315b8d1',1,'2026-06-22 04:58:35','2026-06-15 10:28:35'),(36,3,'8a4ce2bd9743726451efe5e3d7b03ced4e4c7c0b32069bae82c3a422cf47ea33',1,'2026-06-22 04:59:26','2026-06-15 10:29:26'),(37,2,'5fe493450180a4cee440a4c3d1f832135f9ad85559033050e2df8501d36b94cb',0,'2026-06-22 05:00:55','2026-06-15 10:30:55'),(38,2,'e8522a634a353692a207164ca24e5e06283e7c5b727796bf0f5d9bd2bb81d715',1,'2026-06-22 05:16:24','2026-06-15 10:46:24'),(39,5,'00987eada86afdd49ca8d8afa4c6fa9175a431f336033b5ab7851d0ed7c224f4',1,'2026-06-22 05:16:56','2026-06-15 10:46:56'),(40,5,'4d9cbff98a95da0b9f0425122806f310e4f75461d067e316b488281e3630951e',1,'2026-06-22 05:22:37','2026-06-15 10:52:37'),(41,3,'9b174822725f75e66270124cac19ba4da05f23648a5d62b09c2a8f32f3aabebd',1,'2026-06-22 05:23:41','2026-06-15 10:53:40'),(42,5,'816ac7fbe7cfd08c9561088ae5453fee24554ae135107a5ef09db38ba4ccdd4a',1,'2026-06-22 05:28:47','2026-06-15 10:58:47'),(43,3,'da9cb26f6327f4299ebcca32a0f3a88fc7b60ecbeed6e950f215f409789e2fb0',0,'2026-06-22 05:29:53','2026-06-15 10:59:52'),(44,5,'fcf3feffe22f93cc40d5cf680bfd396066341fba0164e952c9836d88d24f827b',1,'2026-06-22 05:36:09','2026-06-15 11:06:09'),(45,5,'18975183531ce581c13a28e2825ab52a59b17c57de69778469352008d3326baa',0,'2026-06-22 05:40:53','2026-06-15 11:10:52'),(46,3,'c4c77ebe44f39df3fce0a123e28f4d6020a39ab9d007359ebd9a10ca642bd8ac',1,'2026-06-22 05:41:08','2026-06-15 11:11:07'),(47,1,'16ff65d3cf9adce231877d84b0d13c1b07fd4b0a3b267aee2d955943e02affae',1,'2026-06-22 06:31:12','2026-06-15 12:01:12'),(48,5,'314ca6b3d23319a9a5c8ce5667a81c50534489b3592dc2857669ff5860128eb3',1,'2026-06-22 06:37:47','2026-06-15 12:07:47'),(49,3,'6ed4317bc22392b70a38caade1a1e80da3a2b33030727ebfee41ee1458bd949c',1,'2026-06-22 06:39:51','2026-06-15 12:09:50'),(50,2,'9dfa294591a99176f83e9745549ef1af0f3855ba1c44d2b6fdd2c3e87ed4773f',1,'2026-06-22 06:41:31','2026-06-15 12:11:31'),(51,5,'527e093395fde620b5c8c53bad3f2795ac76896cc3c7580f994e46b7cd72e07d',1,'2026-06-22 06:44:07','2026-06-15 12:14:06'),(52,4,'385321b99b320f5b96e9912d1affe01e2c9379d6b031e22fabaf6617a51c8a2e',1,'2026-06-22 06:44:48','2026-06-15 12:14:47'),(53,1,'e2d5b343196fd0dfe529c2bf2901423a963b22c6fc83f3242368a1706469e2a8',0,'2026-06-22 06:49:39','2026-06-15 12:19:38'),(54,1,'47a0e8e6d1b67e1feed1dd0f7735618eb90fd16e0692c2937268fbcbd534aeee',0,'2026-06-22 22:58:38','2026-06-16 04:28:38'),(55,5,'c00d0b620a0eb6d94c5841d5670a7bf394cc4b6193185a447954b266d4d11f29',0,'2026-06-22 23:14:45','2026-06-16 04:44:45'),(56,5,'7df99e006fae000ab7b95d0c163f42708a3daa1a882b35916ae969dfa54b0889',1,'2026-06-22 23:30:15','2026-06-16 05:00:14'),(57,5,'6dbbaea7036517d173a52a586c4e3d27c0b9428da5f7fd3e1ec1c45b9d196ec8',1,'2026-06-22 23:41:46','2026-06-16 05:11:46'),(58,5,'197becb054a07d922dbd01e66ed846e5015d4e3d4460f14eae080b00b01bda28',1,'2026-06-22 23:56:27','2026-06-16 05:26:27'),(59,1,'a245a0991894ca3f2abf72d1c1cd025c79130c4c799bec4a07fb896fffdeb27f',0,'2026-06-23 00:00:13','2026-06-16 05:30:13'),(60,5,'55450f684eb5144554ac3c2dc18be4f6d401f61ba0de1f02db77f9b006112fdd',1,'2026-06-23 00:05:40','2026-06-16 05:35:39'),(61,5,'00e2d7037670bc1cb4f7de6042dd6e6fa06a67b233a96749e4c9d3ab807eec0c',1,'2026-06-23 00:08:51','2026-06-16 05:38:51'),(62,5,'3d1d2d9e83081955f3209e54b7a0ebf40b62ac74ece3e144c9eb7108366cd35e',1,'2026-06-23 00:21:13','2026-06-16 05:51:13'),(63,5,'a729434ea3f42e22a597d37d43a574476ff0bcb2626a8daf24fd6af1199d155d',0,'2026-06-23 00:32:33','2026-06-16 06:02:33'),(64,5,'c4f681e742e4ee95f1573dd8cbcc4fce46bd3a93e539d641d72828066e1e55a5',1,'2026-06-23 00:38:11','2026-06-16 06:08:10'),(65,3,'9eb508a9ff9549c87fa62a8da0a001231e34191d113df75103192feaee4ad7f7',1,'2026-06-23 00:40:44','2026-06-16 06:10:44'),(66,2,'d4164aec1008af303f262541ad716c63e872c276d00bbe093c39281206b80498',1,'2026-06-23 00:41:31','2026-06-16 06:11:31'),(67,4,'281c1c5159fe73614c98005a3476f4f56eed9e78d3a1ea13c21377dfe7af9101',0,'2026-06-23 00:42:19','2026-06-16 06:12:19'),(68,4,'a864e8c4b371e84656c22d7adb512cc035598c41e8de806fc5b46d30cdc49434',1,'2026-06-23 00:57:44','2026-06-16 06:27:44'),(69,1,'77e00ca87b764267f9c9bc191a572641367589b0ec95ecbffcbe516e8f60ac28',1,'2026-06-23 01:07:04','2026-06-16 06:37:03'),(70,2,'7189cc39c173aa07b7c5ae7b46c43104268f9315d926d72f0bd504d682e250d1',1,'2026-06-23 01:18:25','2026-06-16 06:48:24'),(71,3,'bac2b852e963d2604e89a3f407470a7eb2e04cb91b2fb71dc2c79bda7952a286',0,'2026-06-23 05:06:53','2026-06-16 10:36:52'),(72,1,'b5a6b6dddc1aa2811176163b81b7d256fc80766e9e6ce31181cf1b793ab813c0',0,'2026-06-23 05:07:15','2026-06-16 10:37:15'),(73,3,'5a201c33f48f32c5b782fd145e41c1437b48860f5ef0b910157cf09a648c792d',0,'2026-06-23 05:24:10','2026-06-16 10:54:09'),(74,1,'261a378661c98975187a5ceff3a724ec7d48013075532f029a2a2d5946500402',1,'2026-06-23 06:27:45','2026-06-16 11:57:45');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_exports`
--

DROP TABLE IF EXISTS `report_exports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_exports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `generated_by` int NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` enum('PDF','Excel','CSV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `report_id` (`report_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `report_exports_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `report_exports_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_exports`
--

LOCK TABLES `report_exports` WRITE;
/*!40000 ALTER TABLE `report_exports` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_exports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `query_config` json DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_attachments`
--

DROP TABLE IF EXISTS `request_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `request_attachments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `request_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_attachments`
--

LOCK TABLES `request_attachments` WRITE;
/*!40000 ALTER TABLE `request_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_comments`
--

DROP TABLE IF EXISTS `request_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `request_comments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `request_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_comments`
--

LOCK TABLES `request_comments` WRITE;
/*!40000 ALTER TABLE `request_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_history`
--

DROP TABLE IF EXISTS `request_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `status_from` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_to` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `action_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `request_history_ibfk_2` (`changed_by`),
  CONSTRAINT `request_history_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `request_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_history`
--

LOCK TABLES `request_history` WRITE;
/*!40000 ALTER TABLE `request_history` DISABLE KEYS */;
INSERT INTO `request_history` VALUES (2,6,NULL,'Pending_HOD',5,'2026-06-15 09:39:51',NULL,NULL),(3,6,'Pending_HOD','Pending_COO',3,'2026-06-15 09:40:30',NULL,NULL),(4,6,'Pending_COO','Approved_COO',2,'2026-06-15 09:41:06',NULL,NULL),(5,6,'Approved_COO','Vehicle_Assigned',4,'2026-06-15 09:41:59',NULL,NULL),(6,5,'Approved_COO','Vehicle_Assigned',4,'2026-06-15 09:42:25',NULL,NULL),(7,5,'Vehicle_Assigned','In_Transit',4,'2026-06-15 09:42:31',NULL,NULL),(8,7,NULL,'Pending_HOD',5,'2026-06-15 09:45:08',NULL,NULL),(9,7,'Pending_HOD','Approved_HOD',3,'2026-06-15 09:46:14',NULL,NULL),(10,7,'Approved_HOD','Vehicle_Assigned',4,'2026-06-15 09:56:04',NULL,NULL),(11,6,'Vehicle_Assigned','In_Transit',4,'2026-06-15 09:56:07',NULL,NULL),(12,7,'Vehicle_Assigned','In_Transit',4,'2026-06-15 09:56:07',NULL,NULL),(13,6,'In_Transit','Completed',4,'2026-06-15 09:56:08',NULL,NULL),(14,5,'In_Transit','Completed',4,'2026-06-15 09:56:11',NULL,NULL),(15,7,'In_Transit','Completed',4,'2026-06-15 09:56:16',NULL,NULL),(16,8,NULL,'Pending_COO',3,'2026-06-15 10:30:32',NULL,NULL),(17,8,'Pending_COO','Approved_COO',2,'2026-06-15 10:31:01',NULL,NULL),(18,9,NULL,'Approved_COO',2,'2026-06-15 10:40:57',NULL,NULL),(19,10,NULL,'Approved_COO',2,'2026-06-15 10:46:40',NULL,NULL),(20,11,NULL,'Pending_HOD',5,'2026-06-15 10:53:21',NULL,NULL),(21,12,NULL,'Pending_HOD',5,'2026-06-15 11:01:04',NULL,NULL),(22,12,'Pending_HOD','Approved_HOD',3,'2026-06-15 11:02:27',NULL,NULL),(23,11,'Pending_HOD','Pending_COO',3,'2026-06-15 11:02:32',NULL,NULL),(24,13,NULL,'Pending_HOD',5,'2026-06-15 11:03:21',NULL,NULL),(25,13,'Pending_HOD','Approved_HOD',3,'2026-06-15 11:04:31',NULL,NULL),(26,14,NULL,'Pending_HOD',5,'2026-06-15 11:07:00',NULL,NULL),(27,15,NULL,'Pending_HOD',5,'2026-06-15 12:08:30',NULL,NULL),(28,16,NULL,'Pending_HOD',5,'2026-06-15 12:09:14',NULL,NULL),(29,14,'Pending_HOD','Pending_COO',3,'2026-06-15 12:10:21',NULL,NULL),(30,15,'Pending_HOD','Rejected_HOD',3,'2026-06-15 12:10:34',NULL,NULL),(31,14,'Pending_COO','Rejected_COO',2,'2026-06-15 12:13:43',NULL,NULL),(32,11,'Pending_COO','Approved_COO',2,'2026-06-15 12:13:48',NULL,NULL),(33,12,'Approved_HOD','Vehicle_Assigned',4,'2026-06-15 12:15:16',NULL,NULL),(34,11,'Approved_COO','Vehicle_Assigned',4,'2026-06-15 12:15:59',NULL,NULL),(35,12,'Vehicle_Assigned','In_Transit',4,'2026-06-15 12:16:19',NULL,NULL),(36,11,'Vehicle_Assigned','In_Transit',4,'2026-06-15 12:16:20',NULL,NULL),(37,11,'In_Transit','Completed',4,'2026-06-15 12:16:21',NULL,NULL),(38,12,'In_Transit','Completed',4,'2026-06-15 12:17:22',NULL,NULL),(39,9,'Approved_COO','Vehicle_Assigned',4,'2026-06-15 12:17:31',NULL,NULL),(40,17,NULL,'Pending_HOD',5,'2026-06-16 05:01:08','Created','Request submitted by employee'),(41,18,NULL,'Pending_HOD',1,'2026-06-16 05:30:13','Created','Request submitted by employee'),(42,18,'Pending_HOD','Deleted',1,'2026-06-16 05:30:13','Deleted','Deleted by requester'),(43,16,'Pending_HOD','Deleted',5,'2026-06-16 06:09:51','Deleted','Deleted by requester'),(44,17,'Pending_HOD','Rejected_HOD',3,'2026-06-16 06:11:02','HOD_Rejected','TESTING'),(45,9,'Vehicle_Assigned','In_Transit',4,'2026-06-16 06:12:25','In_Transit','Passenger picked up'),(46,9,'In_Transit','Completed',4,'2026-06-16 06:12:25','Completed','Trip completed successfully'),(47,8,'Approved_COO','Vehicle_Assigned',4,'2026-06-16 06:31:59','Assigned','Assigned to driver Manoj Yadav'),(48,8,'Vehicle_Assigned','In_Transit',4,'2026-06-16 06:32:16','In_Transit','Passenger picked up'),(49,8,'In_Transit','Completed',4,'2026-06-16 06:32:17','Completed','Trip completed successfully'),(50,13,'Approved_HOD','Vehicle_Assigned',4,'2026-06-16 06:32:24','Assigned','Assigned to driver Manoj Yadav'),(51,10,'Approved_COO','Vehicle_Assigned',4,'2026-06-16 06:32:30','Assigned','Assigned to driver Rajesh Kumar'),(52,13,'Vehicle_Assigned','In_Transit',4,'2026-06-16 06:32:31','In_Transit','Passenger picked up'),(53,10,'Vehicle_Assigned','In_Transit',4,'2026-06-16 06:32:31','In_Transit','Passenger picked up'),(54,13,'In_Transit','Completed',4,'2026-06-16 06:32:32','Completed','Trip completed successfully'),(55,10,'In_Transit','Completed',4,'2026-06-16 06:32:33','Completed','Trip completed successfully');
/*!40000 ALTER TABLE `request_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `travel_purposes`
--

DROP TABLE IF EXISTS `travel_purposes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travel_purposes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `travel_purposes`
--

LOCK TABLES `travel_purposes` WRITE;
/*!40000 ALTER TABLE `travel_purposes` DISABLE KEYS */;
/*!40000 ALTER TABLE `travel_purposes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_checklists`
--

DROP TABLE IF EXISTS `trip_checklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_checklists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trip_id` int NOT NULL,
  `exterior_clean` tinyint(1) DEFAULT '1',
  `interior_clean` tinyint(1) DEFAULT '1',
  `fuel_level` decimal(5,2) DEFAULT '100.00',
  `tyre_pressure_ok` tinyint(1) DEFAULT '1',
  `documents_present` tinyint(1) DEFAULT '1',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_id` (`trip_id`),
  CONSTRAINT `trip_checklists_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trip_logs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_checklists`
--

LOCK TABLES `trip_checklists` WRITE;
/*!40000 ALTER TABLE `trip_checklists` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_checklists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_logs`
--

DROP TABLE IF EXISTS `trip_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `start_odometer` int NOT NULL,
  `end_odometer` int DEFAULT NULL,
  `start_location_id` int DEFAULT NULL,
  `end_location_id` int DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_id` (`assignment_id`),
  KEY `start_location_id` (`start_location_id`),
  KEY `end_location_id` (`end_location_id`),
  CONSTRAINT `trip_logs_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `vehicle_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_logs_ibfk_2` FOREIGN KEY (`start_location_id`) REFERENCES `vehicle_locations` (`id`),
  CONSTRAINT `trip_logs_ibfk_3` FOREIGN KEY (`end_location_id`) REFERENCES `vehicle_locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_logs`
--

LOCK TABLES `trip_logs` WRITE;
/*!40000 ALTER TABLE `trip_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campus_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `employee_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_locked` tinyint(1) DEFAULT '0',
  `email_verified` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_number` (`employee_number`),
  KEY `campus_id` (`campus_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_assignments`
--

DROP TABLE IF EXISTS `vehicle_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Assigned','In_Progress','Completed','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Assigned',
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_id` (`request_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `driver_id` (`driver_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `vehicle_assignments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_assignments_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `vehicle_assignments_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  CONSTRAINT `vehicle_assignments_ibfk_4` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_assignments`
--

LOCK TABLES `vehicle_assignments` WRITE;
/*!40000 ALTER TABLE `vehicle_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_categories`
--

DROP TABLE IF EXISTS `vehicle_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_categories`
--

LOCK TABLES `vehicle_categories` WRITE;
/*!40000 ALTER TABLE `vehicle_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_documents`
--

DROP TABLE IF EXISTS `vehicle_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `doc_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `idx_doc_expiry` (`expiry_date`),
  CONSTRAINT `vehicle_documents_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_documents`
--

LOCK TABLES `vehicle_documents` WRITE;
/*!40000 ALTER TABLE `vehicle_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_fitness`
--

DROP TABLE IF EXISTS `vehicle_fitness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_fitness` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `vehicle_fitness_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_fitness`
--

LOCK TABLES `vehicle_fitness` WRITE;
/*!40000 ALTER TABLE `vehicle_fitness` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_fitness` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_gps_tracking`
--

DROP TABLE IF EXISTS `vehicle_gps_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_gps_tracking` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT '0.00',
  `heading` decimal(5,2) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gps_vehicle_time` (`vehicle_id`,`recorded_at`),
  CONSTRAINT `vehicle_gps_tracking_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_gps_tracking`
--

LOCK TABLES `vehicle_gps_tracking` WRITE;
/*!40000 ALTER TABLE `vehicle_gps_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_gps_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_insurance`
--

DROP TABLE IF EXISTS `vehicle_insurance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_insurance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `provider` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `premium_amount` decimal(10,2) DEFAULT NULL,
  `start_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `vehicle_insurance_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_insurance`
--

LOCK TABLES `vehicle_insurance` WRITE;
/*!40000 ALTER TABLE `vehicle_insurance` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_insurance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_locations`
--

DROP TABLE IF EXISTS `vehicle_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campus_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Garage','Parking Lot','Service Center') COLLATE utf8mb4_unicode_ci DEFAULT 'Parking Lot',
  PRIMARY KEY (`id`),
  KEY `campus_id` (`campus_id`),
  CONSTRAINT `vehicle_locations_ibfk_1` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_locations`
--

LOCK TABLES `vehicle_locations` WRITE;
/*!40000 ALTER TABLE `vehicle_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_maintenance`
--

DROP TABLE IF EXISTS `vehicle_maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_maintenance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `scheduled_date` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Scheduled','In_Progress','Completed','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Scheduled',
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `vehicle_maintenance_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_maintenance_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_maintenance`
--

LOCK TABLES `vehicle_maintenance` WRITE;
/*!40000 ALTER TABLE `vehicle_maintenance` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_pollution`
--

DROP TABLE IF EXISTS `vehicle_pollution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_pollution` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `vehicle_pollution_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_pollution`
--

LOCK TABLES `vehicle_pollution` WRITE;
/*!40000 ALTER TABLE `vehicle_pollution` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_pollution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_requests`
--

DROP TABLE IF EXISTS `vehicle_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `department_id` int NOT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `workflow_id` int DEFAULT NULL,
  `pickup_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `travel_type` enum('Within Anuppur/Shahdol','Beyond Anuppur/Shahdol') COLLATE utf8mb4_unicode_ci NOT NULL,
  `passengers` int NOT NULL DEFAULT '1',
  `travel_date` date NOT NULL,
  `travel_time` time NOT NULL,
  `return_date` date DEFAULT NULL,
  `return_time` time DEFAULT NULL,
  `status` enum('Pending_HOD','Approved_HOD','Rejected_HOD','Pending_COO','Approved_COO','Rejected_COO','Vehicle_Assigned','In_Transit','Completed','Cancelled','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending_HOD',
  `current_step_id` int DEFAULT NULL,
  `hod_remarks` text COLLATE utf8mb4_unicode_ci,
  `hod_action_by` int DEFAULT NULL,
  `hod_action_at` timestamp NULL DEFAULT NULL,
  `coo_remarks` text COLLATE utf8mb4_unicode_ci,
  `coo_action_by` int DEFAULT NULL,
  `coo_action_at` timestamp NULL DEFAULT NULL,
  `assigned_vehicle_id` int DEFAULT NULL,
  `assigned_driver_id` int DEFAULT NULL,
  `assigned_driver` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_time` timestamp NULL DEFAULT NULL,
  `dropoff_time` timestamp NULL DEFAULT NULL,
  `garage_remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `gmhr_remarks` text COLLATE utf8mb4_unicode_ci,
  `gmhr_action_by` int DEFAULT NULL,
  `gmhr_action_at` datetime DEFAULT NULL,
  `work_type` enum('Personal','Company') NOT NULL DEFAULT 'Company',
  PRIMARY KEY (`id`),
  KEY `fk_request_hod_actor` (`hod_action_by`),
  KEY `fk_request_coo_actor` (`coo_action_by`),
  KEY `fk_request_vehicle` (`assigned_vehicle_id`),
  KEY `idx_requests_employee` (`employee_id`),
  KEY `idx_requests_department` (`department_id`),
  KEY `idx_requests_status` (`status`),
  KEY `idx_requests_travel_date` (`travel_date`),
  KEY `idx_requests_travel_type` (`travel_type`),
  KEY `fk_requests_driver` (`assigned_driver_id`),
  KEY `fk_request_workflow` (`workflow_id`),
  KEY `fk_request_step` (`current_step_id`),
  KEY `fk_gmhr_action` (`gmhr_action_by`),
  CONSTRAINT `fk_gmhr_action` FOREIGN KEY (`gmhr_action_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_request_coo_actor` FOREIGN KEY (`coo_action_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_request_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_request_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_request_hod_actor` FOREIGN KEY (`hod_action_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_request_step` FOREIGN KEY (`current_step_id`) REFERENCES `workflow_steps` (`id`),
  CONSTRAINT `fk_request_vehicle` FOREIGN KEY (`assigned_vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_request_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`),
  CONSTRAINT `fk_requests_driver` FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_requests`
--

LOCK TABLES `vehicle_requests` WRITE;
/*!40000 ALTER TABLE `vehicle_requests` DISABLE KEYS */;
INSERT INTO `vehicle_requests` VALUES (1,5,1,'TRAIN AT KATNI',NULL,NULL,'KATNI','Beyond Anuppur/Shahdol',4,'2026-06-14','10:00:00',NULL,NULL,'Rejected_COO',NULL,NULL,3,'2026-06-13 04:29:23',NULL,2,'2026-06-13 04:30:07',NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-13 04:28:31','2026-06-13 04:30:07',NULL,NULL,NULL),(2,5,1,'sxsw',NULL,NULL,'KATNI MURWARA','Beyond Anuppur/Shahdol',2,'2026-06-14','13:09:00',NULL,NULL,'Rejected_HOD',NULL,NULL,3,'2026-06-13 07:37:32',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-13 07:36:26','2026-06-13 07:37:32',NULL,NULL,NULL),(3,5,1,'hv',NULL,NULL,'KATNI MURWARA','Within Anuppur/Shahdol',1,'2026-06-25','09:55:00',NULL,NULL,'Completed',NULL,'ALALALAL LALALALABEC NWSDUOHWDB QWHBUODHEQI',3,'2026-06-15 04:25:31',NULL,NULL,NULL,1,NULL,'Ramesh','2026-06-15 04:27:28','2026-06-15 04:27:37',NULL,'2026-06-15 04:24:48','2026-06-15 04:27:37',NULL,NULL,NULL),(4,5,1,'Family ',NULL,'G-18 OPM ','Katni Junction','Within Anuppur/Shahdol',1,'2026-06-16','11:23:00',NULL,NULL,'Completed',NULL,'approved No worries',3,'2026-06-15 04:53:34',NULL,NULL,NULL,1,1,'Rajesh Kumar','2026-06-15 04:57:16','2026-06-15 04:57:17','nothing\n','2026-06-15 04:52:03','2026-06-15 09:55:34',NULL,NULL,NULL),(5,5,1,'qahsb',NULL,'G -10','CHINA','Beyond Anuppur/Shahdol',4,'2026-06-25','02:39:00','2026-06-30','15:36:00','Completed',NULL,NULL,3,'2026-06-15 07:09:56',NULL,2,'2026-06-15 07:22:31',2,3,'Amit Patel','2026-06-15 09:42:31','2026-06-15 09:56:11',NULL,'2026-06-15 07:06:54','2026-06-15 09:56:11',NULL,NULL,NULL),(6,5,1,'MEETING',NULL,'G -11','KOLKATA','Beyond Anuppur/Shahdol',1,'2026-06-24','15:13:00',NULL,NULL,'Completed',NULL,NULL,3,'2026-06-15 09:40:30',NULL,2,'2026-06-15 09:41:06',1,1,'Rajesh Kumar','2026-06-15 09:56:07','2026-06-15 09:56:08',NULL,'2026-06-15 09:39:51','2026-06-15 09:56:08',NULL,NULL,NULL),(7,5,1,'SHAHDOL DROP OFF',NULL,'D 19','Shahdol Railway Station','Within Anuppur/Shahdol',2,'2026-06-14','15:15:00',NULL,NULL,'Completed',NULL,'nOTHING',3,'2026-06-15 09:46:14',NULL,NULL,NULL,4,2,'Suresh Singh','2026-06-15 09:56:07','2026-06-15 09:56:16',NULL,'2026-06-15 09:45:08','2026-06-15 09:56:16',NULL,NULL,NULL),(8,3,1,'sfc',NULL,'H 1','ANNUPUR STATION','Within Anuppur/Shahdol',1,'2026-06-16','19:00:00','2026-06-16',NULL,'Completed',NULL,NULL,NULL,NULL,'OK ',2,'2026-06-15 10:31:01',3,5,'Manoj Yadav','2026-06-16 06:32:16','2026-06-16 06:32:17',NULL,'2026-06-15 10:30:32','2026-06-16 06:32:17',NULL,NULL,NULL),(9,2,5,'hukb',NULL,'E 3','BURHAR RAILWAY','Within Anuppur/Shahdol',1,'2026-07-03','04:14:00',NULL,NULL,'Completed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'Rajesh Kumar','2026-06-16 06:12:25','2026-06-16 06:12:25','gy','2026-06-15 10:40:57','2026-06-16 06:12:25',NULL,NULL,NULL),(10,2,5,'wd',NULL,'wd','wd','Within Anuppur/Shahdol',1,'2026-06-19','16:16:00',NULL,NULL,'Completed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,1,'Rajesh Kumar','2026-06-16 06:32:31','2026-06-16 06:32:32',NULL,'2026-06-15 10:46:40','2026-06-16 06:32:32',NULL,NULL,NULL),(11,5,1,'efed',NULL,'D 19','katni junction','Beyond Anuppur/Shahdol',2,'2026-06-17','16:25:00','2026-06-17',NULL,'Completed',NULL,'Very bad',3,'2026-06-15 11:02:32','ok',2,'2026-06-15 12:13:48',2,4,'Vikram Sharma','2026-06-15 12:16:20','2026-06-15 12:16:21','ok','2026-06-15 10:53:21','2026-06-15 12:16:21',NULL,NULL,NULL),(12,5,1,'Parcel pick ',NULL,'D 17','Shahdol Post Office','Within Anuppur/Shahdol',1,'2026-06-16','18:30:00',NULL,NULL,'Completed',NULL,'Bad',3,'2026-06-15 11:02:27',NULL,NULL,NULL,1,2,'Suresh Singh','2026-06-15 12:16:19','2026-06-15 12:17:22','done','2026-06-15 11:01:04','2026-06-15 12:17:22',NULL,NULL,NULL),(13,5,1,'Hwha',NULL,'D 17','Shahdol Post Office','Within Anuppur/Shahdol',1,'2026-06-17','08:00:00',NULL,NULL,'Completed',NULL,'Naah bro',3,'2026-06-15 11:04:31',NULL,NULL,NULL,1,5,'Manoj Yadav','2026-06-16 06:32:31','2026-06-16 06:32:32',NULL,'2026-06-15 11:03:21','2026-06-16 06:32:32',NULL,NULL,NULL),(14,5,1,'Baawt',NULL,'D 26','Jabalpur railway','Beyond Anuppur/Shahdol',1,'2026-06-19','18:49:00',NULL,NULL,'Rejected_COO',NULL,'joke',3,'2026-06-15 12:10:21','nope',2,'2026-06-15 12:13:43',NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-15 11:07:00','2026-06-15 12:13:43',NULL,NULL,NULL),(15,5,1,'aadfg',NULL,'d 26','shahdol railway','Within Anuppur/Shahdol',1,'2026-06-18','17:38:00',NULL,NULL,'Rejected_HOD',NULL,'not',3,'2026-06-15 12:10:34',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-15 12:08:30','2026-06-15 12:10:34',NULL,NULL,NULL),(16,5,1,'wfes',NULL,'d 27','gwesgrdsx','Beyond Anuppur/Shahdol',4,'2026-06-26','20:39:00',NULL,NULL,'Deleted',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-15 12:09:14','2026-06-16 06:09:51',NULL,NULL,NULL),(17,5,1,'GONE bro',NULL,'OPM GUEST HOUSE','Katni Junction','Beyond Anuppur/Shahdol',1,'2026-06-20','12:31:00',NULL,NULL,'Rejected_HOD',NULL,'TESTING',3,'2026-06-16 06:11:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-16 05:01:08','2026-06-16 06:11:02',NULL,NULL,NULL),(18,1,5,'Test Delete',NULL,'Office','Station','Within Anuppur/Shahdol',1,'2026-06-20','10:00:00',NULL,NULL,'Deleted',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-16 05:30:13','2026-06-16 05:30:13',NULL,NULL,NULL);
/*!40000 ALTER TABLE `vehicle_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registration_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `make` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type` enum('Sedan','SUV','Bus','Van','Truck') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sedan',
  `capacity` int NOT NULL DEFAULT '4',
  `fuel_type` enum('Petrol','Diesel','Electric','CNG') COLLATE utf8mb4_unicode_ci DEFAULT 'Diesel',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `current_odometer` int DEFAULT '0',
  `insurance_expiry` date DEFAULT NULL,
  `fitness_expiry` date DEFAULT NULL,
  `pollution_expiry` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_no` (`registration_no`),
  KEY `idx_vehicles_available` (`is_available`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,'MP-15-AB-1234','Maruti Suzuki','Dzire','Sedan',4,'Petrol',1,'2026-06-10 12:58:52','2026-06-16 06:32:32',0,NULL,NULL,NULL),(2,'MP-15-CD-5678','Toyota','Innova','SUV',7,'Diesel',1,'2026-06-10 12:58:52','2026-06-16 06:32:32',0,NULL,NULL,NULL),(3,'MP-15-EF-9012','Mahindra','Bolero','SUV',7,'Diesel',1,'2026-06-10 12:58:52','2026-06-16 06:32:17',0,NULL,NULL,NULL),(4,'MP-15-GH-3456','Tata','Winger','Van',12,'Diesel',1,'2026-06-10 12:58:52','2026-06-15 09:56:16',0,NULL,NULL,NULL),(5,'MP-15-IJ-7890','Ashok Leyland','Bus 32S','Bus',32,'Diesel',1,'2026-06-10 12:58:52','2026-06-10 12:58:52',0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_actions`
--

DROP TABLE IF EXISTS `workflow_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `step_id` int DEFAULT NULL,
  `actor_id` int NOT NULL,
  `action` enum('Approved','Rejected','Forwarded','Returned') COLLATE utf8mb4_unicode_ci NOT NULL,
  `comments` text COLLATE utf8mb4_unicode_ci,
  `action_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `step_id` (`step_id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `workflow_actions_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `vehicle_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_actions_ibfk_2` FOREIGN KEY (`step_id`) REFERENCES `workflow_steps` (`id`) ON DELETE SET NULL,
  CONSTRAINT `workflow_actions_ibfk_3` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_actions`
--

LOCK TABLES `workflow_actions` WRITE;
/*!40000 ALTER TABLE `workflow_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_steps`
--

DROP TABLE IF EXISTS `workflow_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workflow_id` int NOT NULL,
  `step_order` int NOT NULL,
  `role_id` int NOT NULL,
  `is_final_approval` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `workflow_id` (`workflow_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `workflow_steps_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_steps_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_steps`
--

LOCK TABLES `workflow_steps` WRITE;
/*!40000 ALTER TABLE `workflow_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_steps` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
SET FOREIGN_KEY_CHECKS=1;
SET UNIQUE_CHECKS=1;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-16 17:43:38
