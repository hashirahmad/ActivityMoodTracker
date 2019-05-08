CREATE TABLE IF NOT EXISTS "Activity" (
	"activityId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT UNIQUE,
	"activityName"	VARCHAR(35) NOT NULL UNIQUE,
	"groupId"	INTEGER,
	"goalLength"	INTEGER NOT NULL,
	"goalType"	VARCHAR(10) NOT NULL,
	"archive"	Int(1) DEFAULT 0,
	"habitType"	varchar(20),
	"habitIncDecByMins"	INTEGER DEFAULT 0,
	"habitWarningLastTime"	datetime,
	"habitAverageLength"	INTEGER,
	"habitAverageLookBackMonths"	INTEGER DEFAULT 3,
	FOREIGN KEY("groupId") REFERENCES "Group"("groupId")
);

CREATE TABLE IF NOT EXISTS "Log" (
	"logId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT UNIQUE,
	"logStartTime"	DATETIME NOT NULL,
	"logEndTime"	DATETIME,
	"logNote"	TEXT,
	"moodId"	INTEGER,
	"activityId"	INTEGER NOT NULL,
	"duration"	INTEGER,
	"activityName"	TEXT,
	FOREIGN KEY("activityId") REFERENCES "Activity"("activityId"),
	FOREIGN KEY("moodId") REFERENCES "Mood"("moodId")
);

CREATE TABLE IF NOT EXISTS "config" (
	"key"	varchar(50),
	"value"	varchar(170),
	"description"	varchar(500),
	PRIMARY KEY("key")
);

CREATE TABLE IF NOT EXISTS "Tag" (
	"tagId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	"tagName"	VARCHAR(35) NOT NULL UNIQUE,
	"archive"	Int(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Mood" (
	"moodId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT UNIQUE,
	"moodName"	VARCHAR(20) NOT NULL UNIQUE,
	"moodType"	VARCHAR(20),
	"moodEmoji"	VARCHAR(25) UNIQUE,
	"archive"	Int(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Group" (
	"groupId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT UNIQUE,
	"groupName"	VARCHAR(35) NOT NULL UNIQUE,
	"archive"	Int(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ActivityTag" (
	"activityTagId"	INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT UNIQUE,
	"activityId"	INTEGER NOT NULL,
	"tagId"	INTEGER NOT NULL,
	FOREIGN KEY("tagId") REFERENCES "Tag"("tagId"),
	FOREIGN KEY("activityId") REFERENCES "Activity"("activityId")
);