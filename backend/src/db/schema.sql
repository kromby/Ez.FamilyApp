CREATE TABLE families (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(100) NOT NULL,
  code NVARCHAR(8) NOT NULL UNIQUE,
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL UNIQUE,
  display_name NVARCHAR(100) NOT NULL,
  family_id UNIQUEIDENTIFIER REFERENCES families(id),
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE otp_requests (
  email NVARCHAR(255) NOT NULL PRIMARY KEY,
  otp NVARCHAR(6) NOT NULL,
  expires_at DATETIME2 NOT NULL,
  attempts INT NOT NULL DEFAULT 0
);

CREATE TABLE channels (
  id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  family_id     UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  name          NVARCHAR(50) NOT NULL,
  created_by    UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  created_at    DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  last_message_at DATETIME2 NULL,
  last_message_text NVARCHAR(200) NULL,
  CONSTRAINT uq_channel_name_per_family UNIQUE (family_id, name)
);

CREATE TABLE messages (
  id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  channel_id  UNIQUEIDENTIFIER NOT NULL REFERENCES channels(id),
  sender_id   UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  text        NVARCHAR(MAX) NOT NULL,
  created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_messages_channel_created (channel_id, created_at DESC)
);

CREATE TABLE message_reactions (
  id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  message_id  UNIQUEIDENTIFIER NOT NULL REFERENCES messages(id),
  user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  emoji       NVARCHAR(10) NOT NULL,
  created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  CONSTRAINT uq_reaction_per_user_message UNIQUE (message_id, user_id, emoji)
);

-- Phase 4: Tasks
CREATE TABLE tasks (
  id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  family_id       UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  name            NVARCHAR(200) NOT NULL,
  added_by_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
  added_by_name   NVARCHAR(100) NOT NULL,
  completed_at    DATETIME2 NULL,
  completed_by_id UNIQUEIDENTIFIER NULL REFERENCES users(id),
  completed_by_name NVARCHAR(100) NULL,
  created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_tasks_family_created (family_id, created_at DESC)
);

-- Phase 3: Location
-- Run these ALTER statements manually against existing databases
ALTER TABLE messages ADD latitude FLOAT NULL;
ALTER TABLE messages ADD longitude FLOAT NULL;

ALTER TABLE users ADD share_location BIT NOT NULL DEFAULT 1;

CREATE TABLE member_locations (
  user_id      UNIQUEIDENTIFIER PRIMARY KEY REFERENCES users(id),
  family_id    UNIQUEIDENTIFIER NOT NULL REFERENCES families(id),
  latitude     FLOAT NOT NULL,
  longitude    FLOAT NOT NULL,
  message_id   UNIQUEIDENTIFIER NOT NULL REFERENCES messages(id),
  address      NVARCHAR(300) NULL,
  updated_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  INDEX ix_member_locations_family (family_id)
);
