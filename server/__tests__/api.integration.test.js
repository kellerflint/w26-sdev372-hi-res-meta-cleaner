import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../src/utils/hashPassword.js";
import sequelize from "../src/db/sequelize.js";
import { audioFile, metadata, user } from "../src/models/index.js";

vi.mock("music-metadata", () => ({ parseFile: vi.fn() }));
vi.mock("../src/services/downloadService.js", () => ({
  prepareFilesForDownload: vi.fn(),
  streamFilesAsZip: vi.fn(),
}));

import { parseFile } from "music-metadata";
import {
  prepareFilesForDownload,
  streamFilesAsZip,
} from "../src/services/downloadService.js";
import apiRouter from "../src/routes/routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { generateAccessToken } from "../src/utils/jwt.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.NODE_ENV = "test";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/", apiRouter);
app.use(errorHandler);

function authCookie(userId = 1) {
  return `accessToken=${generateAccessToken(userId)}`;
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await sequelize.query("TRUNCATE TABLE metadata");
  await sequelize.query("TRUNCATE TABLE audio_files");
  await sequelize.query("TRUNCATE TABLE users");
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
});

describe("API routes", () => {
  it("creates a user", async () => {
    // Act
    const response = await request(app).post("/api/user").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret123",
    });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
    });
  });

  it("logs in and sets auth cookies", async () => {
    // Arrange
    const password_hash = await hashPassword("secret123");
    await user.create({
      email: "jane@example.com",
      password_hash,
      first_name: "Jane",
      last_name: "Doe",
    });

    // Act
    const response = await request(app).post("/api/login").send({
      email: "jane@example.com",
      password: "secret123",
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken="),
        expect.stringContaining("refreshToken="),
      ])
    );
    expect(response.body).toMatchObject({
      user_id: 1,
      email: "jane@example.com",
    });
  });

  it("blocks upload without auth", async () => {
    // Act
    const response = await request(app)
      .post("/api/upload")
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
  });

  it("rejects non-audio uploads", async () => {
    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid file type(s): notes.txt. Only audio files are allowed.",
    });
  });

  it("uploads a file and stores extracted metadata", async () => {
    // Arrange
    await user.create({
      email: "test@example.com",
      password_hash: "hash",
      first_name: "Test",
      last_name: "User",
    });
    parseFile.mockResolvedValue({
      common: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
      format: {
        container: "MPEG",
      },
    });

    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      original_filename: "track.mp3",
      metadata: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    });
  });

  it("returns 409 for a duplicate upload", async () => {
    // Arrange
    await user.create({
      email: "test@example.com",
      password_hash: "hash",
      first_name: "Test",
      last_name: "User",
    });
    await audioFile.create({
      user_id: 1,
      filename: "existing.mp3",
      original_filename: "track.mp3",
    });

    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'File "track.mp3" already exists.',
    });
  });

  it("returns the saved collection for the signed-in user", async () => {
    // Arrange
    await user.create({
      email: "test@example.com",
      password_hash: "hash",
      first_name: "Test",
      last_name: "User",
    });
    const af = await audioFile.create({
      user_id: 1,
      filename: "track.mp3",
      original_filename: "track.mp3",
    });
    await metadata.create({ file_id: af.file_id, title: "Track One", artist: "Test Artist" });

    // Act
    const response = await request(app)
      .get("/api/metadata")
      .set("Cookie", authCookie(1));

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].metadata.title).toBe("Track One");
  });

  it("updates a filename and metadata fields", async () => {
    // Arrange
    await user.create({
      email: "test@example.com",
      password_hash: "hash",
      first_name: "Test",
      last_name: "User",
    });
    const af = await audioFile.create({
      user_id: 1,
      filename: "files-1234567890-123.mp3",
      original_filename: "track.mp3",
    });

    // Act
    const response = await request(app)
      .post("/api/update")
      .set("Cookie", authCookie())
      .send({
        file_id: af.file_id,
        filename: "cleaned-track.mp3",
        title: "Cleaned Title",
        artist: "Cleaned Artist",
      });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Metadata updated successfully",
    });
  });

  it("blocks metadata updates without auth", async () => {
    // Act
    const response = await request(app).post("/api/update").send({
      file_id: 1,
      title: "Updated Title",
    });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
  });

  it("returns 404 when download has no matching files", async () => {
    // Arrange
    prepareFilesForDownload.mockResolvedValue([]);

    // Act
    const response = await request(app)
      .post("/api/download")
      .set("Cookie", authCookie())
      .send({ fileIds: [1] });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "No audio files found" });
    expect(prepareFilesForDownload).toHaveBeenCalledWith(1, [1]);
    expect(streamFilesAsZip).not.toHaveBeenCalled();
  });
});
