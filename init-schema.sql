
-- CREATE TABLES - Le Wun Sandi Kyaw's
CREATE TABLE Users ( 
	UserID INT PRIMARY KEY IDENTITY(1,1), 
	first_name VARCHAR(100), 
	last_name VARCHAR(100), 
	phone_number VARCHAR(20), 
	email VARCHAR(255) UNIQUE NOT NULL, 
	password VARCHAR(255) NOT NULL,
	role VARCHAR(20) CHECK (role IN ('admin', 'user')) DEFAULT 'user'
); 

CREATE TABLE HelpRequests ( 
    RequestID INT PRIMARY KEY IDENTITY(1,1),  
    user_id INT NOT NULL,                    
    category VARCHAR(100),
    description TEXT,
    request_date DATE,
    request_time NVARCHAR(10),
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(UserID)
);

CREATE TABLE EmergencyContact (
    ContactID INT PRIMARY KEY IDENTITY(1,1),
    user_id INT, 
    Name NVARCHAR(100) NOT NULL,
    Relationship NVARCHAR(100),
    PhoneNumber NVARCHAR(20) NOT NULL,
    Note NVARCHAR(255),
    IsStarred BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(UserID)
);

CREATE TABLE EmergencyHotlines (
  HotlineID INT PRIMARY KEY IDENTITY(1,1),
  ServiceName NVARCHAR(255),
  Number NVARCHAR(20),
  Description NVARCHAR(255)
);
-- CREATE TABLES - Pook Xuan Tong's
CREATE TABLE Appointments ( 
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY, 
    AppointmentDate DATE NOT NULL, 
    AppointmentTime TIME(7) NOT NULL, 
    Title NVARCHAR(255) NOT NULL, 
    Location NVARCHAR(255) NOT NULL, 
    DoctorName NVARCHAR(255) NOT NULL, 
    Notes NVARCHAR(MAX), 
    GoogleEventID NVARCHAR(255), 
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
    LastResetDate DATE NULL, -- Date when this schedule was last reset
    FOREIGN KEY (MedicationID) REFERENCES Medications(MedicationID)
);

-- CREATE TABLES - Ong Jing Yin's

CREATE TABLE HobbyGroups ( 
	OwnerID INT,
    GroupID INT PRIMARY KEY IDENTITY, 
    GroupName NVARCHAR(100) NOT NULL, 
    GroupDescription NVARCHAR(255),
    FOREIGN KEY (OwnerID) REFERENCES Users(UserID)  
);

CREATE TABLE Channels (
    ChannelID INT PRIMARY KEY IDENTITY(1,1),
    GroupID INT NOT NULL,
    ChannelName NVARCHAR(20) NOT NULL,
    FOREIGN KEY (GroupID) REFERENCES HobbyGroups(GroupID),
    UNIQUE(GroupID, ChannelName)  -- Prevent duplicate channel names in same group
);

CREATE TABLE Members(
    MemberID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    GroupID INT NOT NULL,
    Name NVARCHAR(500),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (GroupID) REFERENCES HobbyGroups(GroupID),
    UNIQUE(UserID, GroupID)  -- Prevent duplicate memberships
);

CREATE TABLE Events (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    GroupID INT NOT NULL,
    ChannelName NVARCHAR(50) NOT NULL DEFAULT 'events',
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    EventDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Location NVARCHAR(255),
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (GroupID) REFERENCES HobbyGroups(GroupID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

SET IDENTITY_INSERT Users ON;

-- CREATE TABLES - Nur Asyira Fitri Binte Razali's
CREATE TABLE SavedPlaces ( 
PlaceID INT PRIMARY KEY IDENTITY,
UserID INT, --User who created the note
PlaceName NVARCHAR(100),
Address NVARCHAR(255),
Latitude FLOAT,
Longitude FLOAT,
 FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE PlaceNotes (
  NoteID INT PRIMARY KEY IDENTITY(1,1),
  PlaceID INT,  -- Foreign Key linked to SavedPlaces
  UserID INT,   -- User who created the note
  NoteText NVARCHAR(MAX),
  Address NVARCHAR(255),
  FOREIGN KEY (PlaceID) REFERENCES SavedPlaces(PlaceID),
  FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- CREATE TABLES - Wang Yiru's
CREATE TABLE Friends (
  FriendID INT PRIMARY KEY IDENTITY,
  UserID INT,
  FriendUserID INT,
  Status NVARCHAR(10),
  CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Messages (
  MessageID INT PRIMARY KEY IDENTITY,
  SenderID INT,
  ReceiverID INT,
  MessageText NVARCHAR(500),
  Timestamp DATETIME DEFAULT GETDATE()
);

-- INSERT SAMPLE DATA - Le Wun Sandi Kyaw's
INSERT INTO Users (UserID, first_name, last_name, phone_number, email, password, role)
VALUES  
(1, 'Sarah', 'Tan', '98097102', 'sarah20@gmail.com', 'password123', 'admin'), 
(2, 'Rachel', 'Chuu', '89764291', 'rachel2018@gmail.com', 'rachel1976!', 'admin'), 
(3, 'Emily', 'Tan', '91234567', 'emily.tan@gmail.com', 'emilypass18', 'admin'), 
(4, 'Daniel', 'Lim', '98765432', 'daniel.lim@gmail.com', 'SecurePass456', 'admin'), 
(5, 'Siti', 'Rahman', '87654321', 'siti.rahman@gmail.com', 'MyPassword789', 'admin'), 
(6, 'Marcus', 'Lee', '96543210', 'marcus.lee@gmail.com', 'Qwerty2024', 'user'), 
(7, 'Chloe', 'Ng', '92345678', 'chloe.ng@gmail.com', 'HelloWorld1', 'user'),
(8, 'David', 'Goh', '90123456', 'david.goh@gmail.com', 'davidpass2024', 'user'),
(9, 'Anna', 'Wong', '90234567', 'anna.wong@gmail.com', 'annawong99', 'user'),
(10, 'Liam', 'Teo', '90345678', 'liam.teo@gmail.com', 'liamteo88', 'user');

--Help Request
INSERT INTO HelpRequests (user_id, category, description, request_date, request_time, status) VALUES
(1, 'Medical', 'Need assistance with medication', '2025-08-01', '14:30', 'Pending'),
(2, 'Transport', 'Requesting transport to hospital', '2025-08-02', '09:00', 'Completed'),
(1, 'Safety', 'Help needed for home safety check', '2025-08-03', '16:15', 'Cancelled');

--Emergency Contacts
INSERT INTO EmergencyContact (user_id, Name, Relationship, PhoneNumber, Note, IsStarred) VALUES
(1, N'Jane Doe', N'Sister', '91234567', N'Lives nearby', 1),
(2, N'John Smith', N'Friend', '98765432', N'Available after 6pm', 0),
(1, N'Mary Johnson', N'Mother', '91239876', N'Primary emergency contact', 1);

--Emergency Hotlines
INSERT INTO EmergencyHotlines (ServiceName, Number, Description) VALUES
('Police Emergencies', '999', 'Police'),
('SCDF Ambulance & Fire Service', '995', 'Ambulance & Fire'),
('Non Emergency Ambulance', '1777', 'Non-Emergency Medical'),
('Police Hotline', '1800 255 0000', 'Police'),
('Senior Helpline', '1800 555 5555', 'SAGE Counselling'),
('EVERYDAY CARE Helpline', '8697 4230', 'In-house Support');

-- INSERT SAMPLE DATA - Pook Xuan Tong 's
INSERT INTO Appointments (AppointmentDate, AppointmentTime, Title, Location, DoctorName, Notes, UserID, GoogleEventID) 
VALUES 
('2025-08-01', '15:27:00.0000000', 'Dental Checkup', 'Tan Tock Seng Hospital', 'Dr Lim Xiao Ming', 'Bring identification card', 1, NULL), 
('2025-08-02', '15:30:00.0000000', 'General Checkup', 'KK Hospital', 'Dr. Sarah Tan', 'Bring previous health reports.', 1, NULL), 

INSERT INTO Medications (Name, Dosage, Frequency, Notes, UserID) 
VALUES 
('Panadol', 2, 3, 'After meals', 1), 
('Vitamin C', 1, 2, 'Take with water', 1); 

INSERT INTO MedicationSchedule (MedicationID, ScheduleTime, IsChecked, LastResetDate)
VALUES
(1, 'Morning', 0, NULL),
(1, 'Afternoon', 1, NULL),
(1, 'Night', 0, NULL),
(2, 'Morning', 1, NULL), 
(2, 'Afternoon', 0, NULL);

-- INSERT SAMPLE DATA - Ong Jing Yin's

INSERT INTO HobbyGroups (GroupName, GroupDescription, OwnerID)
VALUES 
(N'🧶 Knitting & Crochet Circle', 
 N'Join fellow yarn lovers to share patterns, techniques, and handmade projects. Whether you''re a beginner or an experienced crafter, everyone is welcome to stitch and socialize.',
 2), 

(N'🧘 Wellness & Meditation Group', 
 N'Promoting mental and physical well-being through mindfulness practices. Participate in guided meditations, light exercises, and share wellness tips.',
 1), 

(N'🎵 Music Appreciation Group', 
 N'For those who love music of all genres and eras. Share favorite songs, learn about composers, or discuss the history behind classical, jazz, rock, and more.',
 1), 

(N'📖 Book Club', 
 N'A community for book lovers to read and discuss a new book each month. Enjoy lively discussions and discover new genres and authors.',
 4), 

(N'🪴 Plant & Pottery Corner', 
 N'For those who love greenery and handmade ceramics. Share plant care tips, potting inspiration, and your latest leafy obsessions.',
 3), 

(N'🍞 Cozy Kitchen', 
 N'A group for home cooks and bakers who find joy in comforting meals, seasonal treats, and slow food. Recipes, photos, and kitchen wins welcome!',
 5);

-- 🧶 Knitting & Crochet Circle
INSERT INTO Channels (GroupID, ChannelName) VALUES
(1, 'announcements'),
(1, 'events'),
(1, 'general'),
(1, 'ask-a-knitter');

-- 🧘 Wellness & Meditation Group
INSERT INTO Channels (GroupID, ChannelName) VALUES
(2, 'announcements'),
(2, 'events'),
(2, 'general'),
(2, 'guided-meditations'),
(2, 'daily-check-in');

-- 🎵 Music Appreciation Group
INSERT INTO Channels (GroupID, ChannelName) VALUES
(3, 'announcements'),
(3, 'events'),
(3, 'general'),
(3, 'now-playing'),
(3, 'recommendations');

-- 📖 Book Club
INSERT INTO Channels (GroupID, ChannelName) VALUES
(4, 'announcements'),
(4, 'events'),
(4, 'general'),
(4, 'current-read'),
(4, 'daily-quotes');

-- 🪴 Plant & Pottery Corner
INSERT INTO Channels (GroupID, ChannelName) VALUES
(5, 'announcements'),
(5, 'events'),
(5, 'general'),
(5, 'plant-care'),
(5, 'plant-showcase');

-- 🍞 Cozy Kitchen
INSERT INTO Channels (GroupID, ChannelName) VALUES
(6, 'announcements'),
(6, 'events'),
(6, 'general'),
(6, 'recipes');

-- 🧶 Knitting & Crochet Circle (GroupID 1) 
INSERT INTO Members (UserID, GroupID, Name) VALUES
(6, 1, 'Marcus Lee'), 
(7, 1, 'Chloe Ng');

-- 🧘 Wellness & Meditation Group (GroupID 2) 
INSERT INTO Members (UserID, GroupID, Name) VALUES
(8, 2, 'David Goh'), 
(9, 2, 'Anna Wong');

-- 🎵 Music Appreciation Group (GroupID 3)
INSERT INTO Members (UserID, GroupID, Name) VALUES
(6, 3, 'Marcus Lee'), 
(8, 3, 'David Goh'), 
(10, 3, 'Liam Teo');

-- 📖 Book Club (GroupID 4) 
INSERT INTO Members (UserID, GroupID, Name) VALUES
(7, 4, 'Chloe Ng'), 
(9, 4, 'Anna Wong');

-- 🪴 Plant & Pottery Corner (GroupID 5) 
INSERT INTO Members (UserID, GroupID, Name) VALUES
(6, 5, 'Marcus Lee'), 
(7, 5, 'Chloe Ng'), 
(10, 5, 'Liam Teo');

-- 🍞 Cozy Kitchen (GroupID 6) 
INSERT INTO Members (UserID, GroupID, Name) VALUES
(6, 6, 'Marcus Lee'), 
(9, 6, 'Anna Wong'), 
(10, 6, 'Liam Teo');

-- 🧶 Knitting & Crochet Circle (GroupID 1)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(1, 'events', N'Weekend Stitch & Sip', 
 N'Bring your latest knitting or crochet project and enjoy tea while you stitch together with fellow yarn lovers!', 
 '2025-08-10', '14:00', '16:00', N'The Craft Room, 123 Main St', 3),

(1, 'events', N'Beginner Crochet Workshop', 
 N'Learn the basics of crochet from experienced members. Materials provided!', 
 '2025-09-01', '18:30', '20:00', N'Community Hall, Room 2B', 5);


-- 🧘 Wellness & Meditation Group (GroupID 2)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(2, 'events', N'Sunset Meditation at the Park', 
 N'Join us for a calming sunset meditation session. Bring your own mat.', 
 '2025-08-12', '18:30', '19:30', N'Botanic Gardens – Meditation Lawn', 2),

(2, 'events', N'Wellness Talk: Mindfulness in Daily Life', 
 N'A short talk followed by a group discussion and breathing practice.', 
 '2025-08-26', '19:00', '20:15', N'Online (Zoom link in announcements)', 5);


-- 🎵 Music Appreciation Group (GroupID 3)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(3, 'events', N'Jazz Listening Night', 
 N'Dive into jazz history and enjoy curated tracks with commentary from members.', 
 '2025-08-16', '20:00', '22:00', N'Café Harmony, Music Lounge Room', 3),

(3, 'events', N'Music Theory 101', 
 N'A beginner-friendly workshop covering the basics of scales, rhythm, and harmony.', 
 '2025-09-05', '17:00', '18:30', N'Library Auditorium', 1);


-- 📖 Book Club (GroupID 4)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(4, 'events', N'Monthly Book Discussion: “The Midnight Library”', 
 N'Join us to discuss Matt Haig’s “The Midnight Library”. Coffee and snacks provided.', 
 '2025-08-20', '19:00', '21:00', N'Book Nook Café – Meeting Room A', 4),

(4, 'events', N'Reading Retreat: Silent Saturday', 
 N'A peaceful afternoon dedicated to silent reading together. Bring any book you like.', 
 '2025-09-07', '13:00', '16:00', N'City Library Rooftop Garden', 2);


-- 🪴 Plant & Pottery Corner (GroupID 5)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(5, 'events', N'Terrarium Building Workshop', 
 N'Create your own mini ecosystem with guidance from local plant experts.', 
 '2025-08-18', '14:00', '16:30', N'Urban Jungle Studio, 2nd Floor', 1),

(5, 'events', N'Plant Swap & Chat', 
 N'Bring your cuttings or potted plants to swap with others, and stay for a chat.', 
 '2025-08-30', '10:00', '12:00', N'Community Garden Pavilion', 5);


-- 🍞 Cozy Kitchen (GroupID 6)
INSERT INTO Events (GroupID, ChannelName, Title, Description, EventDate, StartTime, EndTime, Location, CreatedBy)
VALUES 
(6, 'events', N'Baking Basics: Sourdough 101', 
 N'Learn how to make and care for your sourdough starter, and bake your first loaf!', 
 '2025-08-14', '18:00', '20:00', N'Kitchen Collective – Studio 3', 4),

(6, 'events', N'Seasonal Cooking: Autumn Comforts', 
 N'Cook along with us as we prepare a warm, cozy fall-inspired menu.', 
 '2025-09-10', '17:30', '19:30', N'Online (Zoom link to be shared)', 2);

SET IDENTITY_INSERT Users OFF;


-- INSERT SAMPLE DATA - Asyira Fitri's
/*Sample Data for SavedPlaces*/
INSERT INTO SavedPlaces (UserID, PlaceName, Address, Latitude, Longitude)
VALUES
(6, 'Home', '376 Clementi Ave 4, Singapore 120376', 1.3180670246609878, 103.76661999646038), 
(6, 'Hospital', '11 Jln Tan Tock Seng, Singapore 308433', 1.3215712403603288, 103.84582256762411),  
(6, 'Lion Befrienders Clementi Centre', '344 Clementi Ave 5, Singapore 120344', 1.318212757564295, 103.76907339178568), 
(6, 'David’s Home', '322 Clementi Ave 5, Singapore 120322', 1.3161899744681027, 103.76643760624384),

(7, 'Home', '374 Clementi Ave 4, Singapore 120374', 1.318944204271345, 103.76723789429518), 
(7, 'Hospital', '5 Lower Kent Ridge Rd, Singapore 119074', 1.2940113151138533, 103.78311168255927),  
(7, 'Lion Befrienders Clementi Centre', '344 Clementi Ave 5, Singapore 120344', 1.318212757564295, 103.76907339178568), 
(7, 'Anna’s Home', '339 Clementi Ave 5, Singapore 120339', 1.3194322369178264, 103.7693139241126), 

(8, 'Home', '322 Clementi Ave 5, Singapore 120322', 1.3161899744681027, 103.76643760624384), 
(8, 'Hospital', '11 Jln Tan Tock Seng, Singapore 308433', 1.3215712403603288, 103.84582256762411),  
(8, 'Lion Befrienders Clementi Centre', '344 Clementi Ave 5, Singapore 120344', 1.318212757564295, 103.76907339178568), 
(8, 'Marcus’s Home', '376 Clementi Ave 4, Singapore 120376', 1.3180670246609878, 103.76661999646038),

(9, 'Home', '339 Clementi Ave 5, Singapore 120339', 1.3194322369178264, 103.7693139241126), 
(9, 'Hospital', '5 Lower Kent Ridge Rd, Singapore 119074', 1.2940113151138533, 103.78311168255927),  
(9, 'Lion Befrienders Clementi Centre', '344 Clementi Ave 5, Singapore 120344', 1.318212757564295, 103.76907339178568), 
(9, 'Chloe’s Home', '374 Clementi Ave 4, Singapore 120374', 1.318944204271345, 103.76723789429518);

/*Sample Data for PlaceNotes*/
---UserID=6
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 6, 'lift B level 5. Call 98765432 if assistance is needed.', '376 Clementi Ave 4, Singapore 120376'
FROM SavedPlaces
WHERE Address = '376 Clementi Ave 4, Singapore 120376'
  AND UserID = 6;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 6, 'nearest bus stop code(blk 376): 17219', '376 Clementi Ave 4, Singapore 120376'
FROM SavedPlaces
WHERE Address = '376 Clementi Ave 4, Singapore 120376'
  AND UserID = 6;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 6, 'For heart check up go to tower B - room 03-01', '11 Jln Tan Tock Seng, Singapore 308433'
FROM SavedPlaces
WHERE Address = '11 Jln Tan Tock Seng, Singapore 308433'
  AND UserID = 6;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 6, 'From the busstop walk straight then turn left', '344 Clementi Ave 5, Singapore 120344'
FROM SavedPlaces
WHERE Address = '344 Clementi Ave 5, Singapore 120344'
  AND UserID = 6;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 6, 'lift C - #07-432 | hp: 87654378.', '322 Clementi Ave 5, Singapore 120322 '
FROM SavedPlaces
WHERE Address = '322 Clementi Ave 5, Singapore 120322 '
  AND UserID = 6;

---UserID=7
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 7, 'lift A level 3. Call 85647452 if assistance is needed.', '374 Clementi Ave 4, Singapore 120374'
FROM SavedPlaces
WHERE Address = '374 Clementi Ave 4, Singapore 120374'
  AND UserID = 7;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 7, 'nearest bus stop code(blk 376): 17219.', '374 Clementi Ave 4, Singapore 120374'
FROM SavedPlaces
WHERE Address = '374 Clementi Ave 4, Singapore 120374'
  AND UserID = 7;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 7, 'For heart check up go to tower A - room 03-03', '5 Lower Kent Ridge Rd, Singapore 119074'
FROM SavedPlaces
WHERE Address = '5 Lower Kent Ridge Rd, Singapore 119074'
  AND UserID = 7;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 7, 'From the busstop walk straight then turn left', '344 Clementi Ave 5, Singapore 120344'
FROM SavedPlaces
WHERE Address = '344 Clementi Ave 5, Singapore 120344'
  AND UserID = 7;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 7, 'lift A - #07-442 | hp: 87165778.', '339 Clementi Ave 5, Singapore 120339'
FROM SavedPlaces
WHERE Address = '339 Clementi Ave 5, Singapore 120339'
  AND UserID = 7;

---UserID=8
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 8, 'lift B level 5. Call 98765432 if assistance is needed.', '322 Clementi Ave 5, Singapore 120322'
FROM SavedPlaces
WHERE Address = '322 Clementi Ave 5, Singapore 120322'
  AND UserID = 8;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 8, 'nearest bus stop code(Clementi Stn Exit B): 17179.', '322 Clementi Ave 5, Singapore 120322'
FROM SavedPlaces
WHERE Address = '322 Clementi Ave 5, Singapore 120322'
  AND UserID = 8;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 8, 'For check up go to tower A - room 05-07', '11 Jln Tan Tock Seng, Singapore 308433'
FROM SavedPlaces
WHERE Address = '11 Jln Tan Tock Seng, Singapore 308433'
  AND UserID = 8;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 8, 'From the busstop walk straight then turn left', '344 Clementi Ave 5, Singapore 120344'
FROM SavedPlaces
WHERE Address = '344 Clementi Ave 5, Singapore 120344'
  AND UserID = 8;
INSERT INTO PlaceNotes (PlaceID, UserID, NoteText, Address)
SELECT PlaceID, 8, 'lift E - #05-662 | hp: 87165778.', '376 Clementi Ave 4, Singapore 120376'
FROM SavedPlaces
WHERE Address = '376 Clementi Ave 4, Singapore 120376'
  AND UserID = 8;

-- INSERT SAMPLE DATA - Wang Yiru's
INSERT INTO [T2_EverdayCare].[dbo].[Friends] 
    ([FriendID], [UserID], [FriendUserID], [Status], [CreatedAt])
VALUES
    (2, 7, 10, 'accepted', '2025-08-01 04:48:33.743'),
    (7, 9, 8, 'rejected', '2025-08-01 20:25:21.610'),
    (8, 10, 8, 'rejected', '2025-08-01 21:20:29.683'),
    (9, 7, 8, 'pending', '2025-08-02 21:08:55.773'),
    (11, 9, 10, 'accepted', '2025-08-02 23:40:13.753'),
    (12, 9, 8, 'rejected', '2025-08-02 23:41:15.387');

SET IDENTITY_INSERT [T2_EverdayCare].[dbo].[Messages] ON;
INSERT INTO [T2_EverdayCare].[dbo].[Messages] 
    ([MessageID], [SenderID], [ReceiverID], [MessageText], [Timestamp])
VALUES
    (1, 7, 9, 'Hi Anna, I am Chloe', '2025-08-01 13:18:38.530'),
    (2, 9, 7, 'Hii', '2025-08-01 14:21:23.907'),
    (5, 9, 7, 'Hello', '2025-08-02 22:11:07.163'),
    (7, 10, 9, 'Hiiii', '2025-08-02 23:48:57.203'),
    (8, 9, 10, 'Hello', '2025-08-02 23:50:41.577');
SET IDENTITY_INSERT [T2_EverdayCare].[dbo].[Messages] OFF;