-- CREATE TABLES
CREATE TABLE Appointments ( 
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY, 
    AppointmentDate DATE NOT NULL, 
    AppointmentTime TIME(7) NOT NULL, 
    Title NVARCHAR(255) NOT NULL, 
    Location NVARCHAR(255) NOT NULL, 
    DoctorName NVARCHAR(255) NOT NULL, 
    Notes NVARCHAR(MAX), 
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) 
); 

CREATE TABLE Medications ( 
    MedicationID INT IDENTITY(1,1) PRIMARY KEY, 
    Name NVARCHAR(100) NOT NULL, 
    Dosage INT NOT NULL,                 
    Frequency INT NOT NULL,               
    Notes NVARCHAR(255), 
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) 
);

CREATE TABLE MedicationSchedule (
    ScheduleID INT PRIMARY KEY IDENTITY(1,1),
    MedicationID INT NOT NULL,
    ScheduleTime NVARCHAR(50) NOT NULL,
    IsChecked BIT NOT NULL,
    FOREIGN KEY (MedicationID) REFERENCES Medications(MedicationID)
);

-- INSERT SAMPLE DATA
INSERT INTO Appointments (AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, Longitude, Latitude, UserID) 
VALUES 
('2025-07-11', '16:00:00.0000000', 'Dental Checkup', 'Tan Tock Seng Hospital', 'Dr Lim Xiao Ming', 'Bring identification card', NULL, NULL, 1), 
('2025-07-12', '15:30:00.0000000', 'General Checkup', 'KK Hospital', 'Dr. Sarah Tan', 'Bring previous health reports.', NULL, NULL, 1), 
('2025-07-08', '15:45:00.0000000', 'test', 'test', 'test', 'No special instructions', NULL, NULL, 1); 

INSERT INTO Medications (Name, Dosage, Frequency, Notes, UserID) 
VALUES 
('Panadol', 2, 3, 'After meals', 1), 
('Vitamin C', 1, 2, 'Take with water', 1); 

INSERT INTO MedicationSchedule (MedicationID, ScheduleTime, IsChecked)
VALUES
(1, 'Morning', 0),
(1, 'Afternoon', 1),
(1, 'Night', 0),
(2, 'Morning', 1), 
(2, 'Afternoon', 0);
