# ERP Inventory Service

This is the Inventory module for the ERP system, built with Spring Boot.

## Technologies Used
- Java 17
- Spring Boot (Web, Data JPA, Validation)
- PostgreSQL
- MapStruct (for Object Mapping)
- Lombok
- Springdoc OpenAPI (Swagger UI)

## Prerequisites
- Java 17
- Maven
- PostgreSQL running locally (or configured in `application.yml` / `.env`)

## Getting Started

### Database Configuration
Ensure your PostgreSQL database is running. You can configure the database credentials in the `src/main/resources/application.yml` file or by creating a `.env` file in the root directory.

Example `.env`:
```env
DB_URL=jdbc:postgresql://localhost:5432/inventory
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
```

### Build the Application
To build the application without running tests:
```bash
./mvnw clean package -DskipTests
```
For Windows use:
```cmd
mvnw.cmd clean package -DskipTests
```

### Run the Application
You can run the application directly using Maven:
```bash
./mvnw spring-boot:run
```

Or run the compiled jar:
```bash
java -jar target/inventory-0.0.1-SNAPSHOT.jar
```

## API Documentation
Once the application is running, you can access the Swagger UI for API documentation at:
`http://localhost:8082/swagger-ui/index.html` (assuming the default port 8082 is used).
