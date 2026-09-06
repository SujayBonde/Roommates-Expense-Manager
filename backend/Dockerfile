# Multi-stage Dockerfile for RoomMate Expense Manager Backend
# Stage 1: Build JAR using Maven & JDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal JRE 21 runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy jar from builder
COPY --from=builder /app/target/app.jar app.jar

# Render assigns PORT dynamically; default to 8080 if not set
ENV PORT=8080
EXPOSE ${PORT}

# Memory optimization for Render Free Tier (512 MB RAM limit)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
