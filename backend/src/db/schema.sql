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
